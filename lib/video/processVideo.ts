/**
 * lib/video/processVideo.ts
 * Server-side video processing pipeline.
 *
 * Steps:
 *   1. transcribing — download video, extract audio, Whisper transcription
 *   2. editing      — detect + remove silence gaps, trim & concat segments
 *   3. captioning   — build word-accurate SRT, re-timed to trimmed video
 *   4. rendering    — burn captions with FFmpeg, upload to Supabase Storage
 *
 * External dependencies (add to package.json):
 *   fluent-ffmpeg, ffmpeg-static, @types/fluent-ffmpeg, openai
 *
 * Production note:
 *   Set `export const maxDuration = 300` on the calling Next.js route (Vercel Pro).
 *   For even longer videos, move this to a dedicated worker (Railway, Fly.io,
 *   AWS Lambda with FFmpeg layer) and enqueue via a job queue (Upstash QStash,
 *   Inngest, etc.).
 */

import ffmpeg from 'fluent-ffmpeg'
// @ts-ignore — ffmpeg-static ships as a CommonJS default export
import ffmpegStatic from 'ffmpeg-static'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { createWriteStream, createReadStream, unlinkSync, existsSync, writeFileSync, copyFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { pipeline } from 'stream/promises'

// Wire up the bundled FFmpeg binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string)
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface WordTimestamp {
  word: string
  start: number // seconds
  end: number
}

interface Segment {
  start: number
  end: number
}

export interface ProcessVideoOptions {
  campaignId: string
  videoUrl: string
  userId: string
  /** Max pause gap (seconds) before a cut is made. Default: 1.0 */
  maxSilenceGap?: number
  /** Words per caption chunk. Default: 4 */
  wordsPerCaption?: number
}

// ----------------------------------------------------------------
// Helpers — step tracker
// ----------------------------------------------------------------

type StepName = 'transcribing' | 'editing' | 'captioning' | 'rendering'
type StepStatus = 'processing' | 'complete' | 'failed'

async function updateStep(
  campaignId: string,
  step: StepName,
  status: StepStatus,
  error?: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error: dbError } = await admin.from('campaign_steps').upsert(
    {
      campaign_id: campaignId,
      step,
      status,
      error: error ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'campaign_id,step' },
  )
  if (dbError) {
    console.error(`[campaign:${campaignId}] DB step update failed (${step}):`, dbError)
  }
}

// ----------------------------------------------------------------
// Helpers — file I/O
// ----------------------------------------------------------------

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
  }
  const fileStream = createWriteStream(destPath)
  await pipeline(res.body as unknown as NodeJS.ReadableStream, fileStream)
}

// ----------------------------------------------------------------
// Helpers — FFmpeg wrappers
// ----------------------------------------------------------------

function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`extractAudio: ${err.message}`)))
      .run()
  })
}

function trimAndConcat(
  inputPath: string,
  segments: Segment[],
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (segments.length === 0) {
      reject(new Error('trimAndConcat: no segments provided'))
      return
    }

    // Build filter_complex for multi-segment trim + concat
    const parts: string[] = []
    const concatInputs: string[] = []

    segments.forEach((seg, i) => {
      parts.push(
        `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]`,
        `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`,
      )
      concatInputs.push(`[v${i}][a${i}]`)
    })

    parts.push(
      `${concatInputs.join('')}concat=n=${segments.length}:v=1:a=1[vout][aout]`,
    )

    ffmpeg(inputPath)
      .complexFilter(parts.join(';'))
      .outputOptions(['-map [vout]', '-map [aout]'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`trimAndConcat: ${err.message}`)))
      .run()
  })
}

function burnCaptions(
  inputPath: string,
  srtPath: string,
  outputPath: string,
): Promise<void> {
  // Escape path for FFmpeg subtitles filter (handle special chars on Linux/macOS)
  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        `-vf subtitles='${escapedSrt}':force_style='FontName=Arial,FontSize=14,PrimaryColour=&H00FFFFFF,Bold=1,Outline=2,OutlineColour=&H00000000,MarginV=25'`,
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`burnCaptions: ${err.message}`)))
      .run()
  })
}

// ----------------------------------------------------------------
// Helpers — transcription
// ----------------------------------------------------------------

async function transcribeAudio(
  audioPath: string,
): Promise<{ text: string; words: WordTimestamp[] }> {
  const response = await openai.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  })

  // The SDK types don't expose `words` directly on verbose_json yet
  const raw = response as unknown as {
    text: string
    words?: Array<{ word: string; start: number; end: number }>
  }

  return {
    text: raw.text ?? '',
    words: (raw.words ?? []).map((w) => ({
      word: w.word.trim(),
      start: w.start,
      end: w.end,
    })),
  }
}

// ----------------------------------------------------------------
// Helpers — transcript processing
// ----------------------------------------------------------------

const FILLER_WORDS = new Set([
  'um', 'uh', 'ah', 'er', 'hmm', 'mhm',
  'like', 'basically', 'literally',
  'you know', "i mean",
])

function removeFilllerWords(words: WordTimestamp[]): WordTimestamp[] {
  return words.filter((w) => !FILLER_WORDS.has(w.word.toLowerCase()))
}

/**
 * Returns the "keep" segments (speech regions) by detecting gaps larger than
 * maxGap seconds between consecutive words.
 */
function detectSpeechSegments(words: WordTimestamp[], maxGap: number): Segment[] {
  if (words.length === 0) return []

  const TAIL = 0.25 // seconds of audio tail to keep after each word
  const segments: Segment[] = []
  let segStart = words[0].start
  let prevEnd = words[0].end

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - prevEnd
    if (gap > maxGap) {
      segments.push({ start: segStart, end: prevEnd + TAIL })
      segStart = words[i].start
    }
    prevEnd = words[i].end
  }

  segments.push({ start: segStart, end: prevEnd + TAIL })
  return segments
}

/**
 * Re-map word timestamps to match the trimmed timeline.
 * Each word is assigned to the segment it falls within, then its start/end
 * are recalculated relative to the new concatenated timeline.
 */
function retimeWords(
  words: WordTimestamp[],
  segments: Segment[],
): WordTimestamp[] {
  // Pre-compute cumulative time offsets for each segment
  const offsets: number[] = []
  let cumulative = 0
  for (const seg of segments) {
    offsets.push(cumulative)
    cumulative += seg.end - seg.start
  }

  const retimed: WordTimestamp[] = []

  for (const word of words) {
    const wordMid = (word.start + word.end) / 2
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (wordMid >= seg.start && wordMid <= seg.end) {
        retimed.push({
          word: word.word,
          start: parseFloat((offsets[i] + (word.start - seg.start)).toFixed(3)),
          end: parseFloat((offsets[i] + (word.end - seg.start)).toFixed(3)),
        })
        break
      }
    }
  }

  return retimed
}

// ----------------------------------------------------------------
// Helpers — SRT generation
// ----------------------------------------------------------------

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`
}

function buildSRT(words: WordTimestamp[], wordsPerCaption: number): string {
  if (words.length === 0) return ''

  const chunks: { start: number; end: number; text: string }[] = []

  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const slice = words.slice(i, i + wordsPerCaption)
    chunks.push({
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      text: slice.map((w) => w.word).join(' '),
    })
  }

  return chunks
    .map(
      (c, idx) =>
        `${idx + 1}\n${toSRTTime(c.start)} --> ${toSRTTime(c.end)}\n${c.text}`,
    )
    .join('\n\n')
}

// ----------------------------------------------------------------
// Main pipeline
// ----------------------------------------------------------------

export async function processVideoJob(opts: ProcessVideoOptions): Promise<void> {
  const {
    campaignId,
    videoUrl,
    userId,
    maxSilenceGap = 1.0,
    wordsPerCaption = 4,
  } = opts

  const admin = createAdminClient()
  const tmp = tmpdir()

  // Temp file paths
  const inputPath  = join(tmp, `${campaignId}_input.mp4`)
  const audioPath  = join(tmp, `${campaignId}_audio.wav`)
  const trimmedPath = join(tmp, `${campaignId}_trimmed.mp4`)
  const srtPath    = join(tmp, `${campaignId}_captions.srt`)
  const outputPath = join(tmp, `${campaignId}_output.mp4`)

  const cleanup = () => {
    for (const p of [inputPath, audioPath, trimmedPath, srtPath, outputPath]) {
      try { if (existsSync(p)) unlinkSync(p) } catch { /* best-effort */ }
    }
  }

  const log = (msg: string) =>
    console.log(`[campaign:${campaignId}] ${new Date().toISOString()} — ${msg}`)

  try {
    // ── Step 1: Transcribing ────────────────────────────────────
    log('Step 1: downloading + extracting audio + transcribing')
    await updateStep(campaignId, 'transcribing', 'processing')

    await downloadFile(videoUrl, inputPath)
    log('  video downloaded')

    await extractAudio(inputPath, audioPath)
    log('  audio extracted')

    const { words: rawWords } = await transcribeAudio(audioPath)
    log(`  transcribed ${rawWords.length} words`)

    const cleanWords = removeFilllerWords(rawWords)
    log(`  cleaned to ${cleanWords.length} words after filler removal`)

    await updateStep(campaignId, 'transcribing', 'complete')

    // ── Step 2: Editing (silence removal) ──────────────────────
    log('Step 2: detecting silence + trimming')
    await updateStep(campaignId, 'editing', 'processing')

    const speechSegments = detectSpeechSegments(cleanWords, maxSilenceGap)
    log(`  found ${speechSegments.length} speech segment(s)`)

    let wordsForCaptions: WordTimestamp[]

    if (speechSegments.length > 1) {
      await trimAndConcat(inputPath, speechSegments, trimmedPath)
      wordsForCaptions = retimeWords(cleanWords, speechSegments)
      log('  trimmed + concatenated segments')
    } else {
      // No meaningful silences — pass through unchanged
      copyFileSync(inputPath, trimmedPath)
      wordsForCaptions = cleanWords
      log('  no significant silences; passed through')
    }

    await updateStep(campaignId, 'editing', 'complete')

    // ── Step 3: Captioning ──────────────────────────────────────
    log('Step 3: generating SRT captions')
    await updateStep(campaignId, 'captioning', 'processing')

    const srtContent = buildSRT(wordsForCaptions, wordsPerCaption)
    writeFileSync(srtPath, srtContent, 'utf8')
    log(`  wrote ${srtContent.split('\n\n').length} caption blocks`)

    await updateStep(campaignId, 'captioning', 'complete')

    // ── Step 4: Rendering (burn captions) ───────────────────────
    log('Step 4: burning captions + uploading')
    await updateStep(campaignId, 'rendering', 'processing')

    await burnCaptions(trimmedPath, srtPath, outputPath)
    log('  captions burned into video')

    // Upload final video to Supabase Storage
    const storagePath = `campaigns/${userId}/${campaignId}/output.mp4`
    const outputBuffer = readFileSync(outputPath)

    const { error: uploadError } = await admin.storage
      .from('video-campaigns')
      .upload(storagePath, outputBuffer, { contentType: 'video/mp4', upsert: true })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = admin.storage
      .from('video-campaigns')
      .getPublicUrl(storagePath)

    log(`  uploaded to storage: ${publicUrl}`)

    await updateStep(campaignId, 'rendering', 'complete')

    // ── Mark campaign complete ──────────────────────────────────
    await admin
      .from('campaigns')
      .update({
        status: 'complete',
        processed_video_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    log('Pipeline complete ✓')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[campaign:${campaignId}] FAILED:`, err)

    await admin
      .from('campaigns')
      .update({
        status: 'failed',
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
  } finally {
    cleanup()
  }
}

/**
 * Retry a failed campaign from scratch.
 * Resets campaign + step statuses, then re-triggers the pipeline.
 */
export async function retryVideoJob(opts: ProcessVideoOptions): Promise<void> {
  const admin = createAdminClient()
  const { campaignId } = opts

  const { data: campaign } = await admin
    .from('campaigns')
    .select('retry_count')
    .eq('id', campaignId)
    .single()

  const retryCount = (campaign?.retry_count ?? 0) + 1

  // Reset campaign status
  await admin
    .from('campaigns')
    .update({
      status: 'processing',
      processed_video_url: null,
      error_message: null,
      retry_count: retryCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  // Reset all steps
  await admin
    .from('campaign_steps')
    .update({ status: 'pending', error: null, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)

  await processVideoJob(opts)
}
