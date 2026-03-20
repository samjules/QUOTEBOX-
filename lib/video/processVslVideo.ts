/**
 * lib/video/processVslVideo.ts
 *
 * VSL-specific video processing pipeline.
 * Uses the same FFmpeg + Whisper approach as the teleprompter pipeline,
 * but writes progress to the vsl_campaigns table (single current_step column).
 *
 * Steps:
 *   1. removing_silence — download, transcribe, detect + trim silence
 *   2. adding_captions  — generate SRT, burn captions into video
 *   3. finalizing       — upload to Supabase Storage, mark complete
 */

import ffmpeg from 'fluent-ffmpeg'
// @ts-ignore — ffmpeg-static ships as a CommonJS default export
import ffmpegStatic from 'ffmpeg-static'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createWriteStream,
  createReadStream,
  unlinkSync,
  existsSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { pipeline } from 'stream/promises'

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string)
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface WordTimestamp {
  word: string
  start: number
  end: number
}

interface Segment {
  start: number
  end: number
}

export interface CaptionStyle {
  font?: 'bold' | 'serif' | 'handwritten' | 'mono'
  color?: 'white' | 'yellow' | 'green' | 'cyan'
  size?: 'small' | 'medium' | 'large'
  position?: 'bottom' | 'center' | 'top'
}

export interface ProcessVslOptions {
  campaignId: string
  videoUrl: string
  maxSilenceGap?: number
  wordsPerCaption?: number
  captionStyle?: CaptionStyle
}

type VslStep = 'removing_silence' | 'adding_captions' | 'finalizing'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

async function updateVslStep(campaignId: string, step: VslStep) {
  const admin = createAdminClient()
  await admin
    .from('vsl_campaigns')
    .update({ current_step: step })
    .eq('id', campaignId)
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status}`)
  }
  const fileStream = createWriteStream(destPath)
  await pipeline(res.body as unknown as NodeJS.ReadableStream, fileStream)
}

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
      reject(new Error('trimAndConcat: no segments'))
      return
    }

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

const FONT_MAP: Record<string, string> = {
  bold: 'Impact',
  serif: 'Georgia',
  handwritten: 'Comic Neue',
  mono: 'Courier',
}

// ASS colors are in &H00BBGGRR format (reversed from RGB hex)
const COLOR_MAP: Record<string, string> = {
  white: '&H00FFFFFF',
  yellow: '&H0000FFFF',
  green: '&H0000FF00',
  cyan: '&H00FFFF00',
}

const SIZE_MAP: Record<string, number> = {
  small: 32,
  medium: 48,
  large: 64,
}

// MarginV for ASS subtitles — higher value = further from bottom
const POSITION_MAP: Record<string, { alignment: number; marginV: number }> = {
  bottom: { alignment: 2, marginV: 30 },
  center: { alignment: 5, marginV: 0 },
  top: { alignment: 8, marginV: 30 },
}

function burnCaptions(
  inputPath: string,
  srtPath: string,
  outputPath: string,
  style?: CaptionStyle,
): Promise<void> {
  const font = FONT_MAP[style?.font ?? 'bold'] ?? 'Impact'
  const color = COLOR_MAP[style?.color ?? 'white'] ?? '&H00FFFFFF'
  const fontSize = SIZE_MAP[style?.size ?? 'medium'] ?? 48
  const pos = POSITION_MAP[style?.position ?? 'bottom'] ?? POSITION_MAP.bottom
  const bold = style?.font === 'bold' || !style?.font ? 1 : 0

  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')
  const forceStyle = [
    `FontName=${font}`,
    `FontSize=${fontSize}`,
    `PrimaryColour=${color}`,
    `Bold=${bold}`,
    `Outline=2`,
    `OutlineColour=&H00000000`,
    `Alignment=${pos.alignment}`,
    `MarginV=${pos.marginV}`,
  ].join(',')

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        `-vf subtitles='${escapedSrt}':force_style='${forceStyle}'`,
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`burnCaptions: ${err.message}`)))
      .run()
  })
}

async function transcribeAudio(
  audioPath: string,
): Promise<{ text: string; words: WordTimestamp[] }> {
  const response = await openai.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  })

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

function detectSpeechSegments(words: WordTimestamp[], maxGap: number): Segment[] {
  if (words.length === 0) return []

  const TAIL = 0.25
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

function retimeWords(words: WordTimestamp[], segments: Segment[]): WordTimestamp[] {
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

export async function processVslVideo(opts: ProcessVslOptions): Promise<void> {
  const {
    campaignId,
    videoUrl,
    maxSilenceGap = 1.0,
    wordsPerCaption = 4,
    captionStyle,
  } = opts

  const admin = createAdminClient()
  const tmp = tmpdir()

  const inputPath = join(tmp, `vsl_${campaignId}_input.mp4`)
  const audioPath = join(tmp, `vsl_${campaignId}_audio.wav`)
  const trimmedPath = join(tmp, `vsl_${campaignId}_trimmed.mp4`)
  const srtPath = join(tmp, `vsl_${campaignId}_captions.srt`)
  const outputPath = join(tmp, `vsl_${campaignId}_output.mp4`)

  const cleanup = () => {
    for (const p of [inputPath, audioPath, trimmedPath, srtPath, outputPath]) {
      try { if (existsSync(p)) unlinkSync(p) } catch { /* best-effort */ }
    }
  }

  const log = (msg: string) =>
    console.log(`[vsl:${campaignId}] ${new Date().toISOString()} — ${msg}`)

  try {
    // Step 1: Removing silence
    log('Step 1: removing silence')
    await updateVslStep(campaignId, 'removing_silence')

    await downloadFile(videoUrl, inputPath)
    log('  downloaded video')

    await extractAudio(inputPath, audioPath)
    log('  extracted audio')

    const { words: rawWords } = await transcribeAudio(audioPath)
    log(`  transcribed ${rawWords.length} words`)

    const speechSegments = detectSpeechSegments(rawWords, maxSilenceGap)
    log(`  found ${speechSegments.length} speech segment(s)`)

    let wordsForCaptions: WordTimestamp[]

    if (speechSegments.length > 1) {
      await trimAndConcat(inputPath, speechSegments, trimmedPath)
      wordsForCaptions = retimeWords(rawWords, speechSegments)
      log('  trimmed + concatenated')
    } else {
      copyFileSync(inputPath, trimmedPath)
      wordsForCaptions = rawWords
      log('  no significant silences; passed through')
    }

    // Step 2: Adding captions
    log('Step 2: adding captions')
    await updateVslStep(campaignId, 'adding_captions')

    const srtContent = buildSRT(wordsForCaptions, wordsPerCaption)
    writeFileSync(srtPath, srtContent, 'utf8')
    log(`  wrote ${srtContent.split('\n\n').length} caption blocks`)

    await burnCaptions(trimmedPath, srtPath, outputPath, captionStyle)
    log('  captions burned into video')

    // Step 3: Finalizing
    log('Step 3: finalizing')
    await updateVslStep(campaignId, 'finalizing')

    const storagePath = `${campaignId}/processed.mp4`
    const outputBuffer = readFileSync(outputPath)

    const { error: uploadError } = await admin.storage
      .from('vsls')
      .upload(storagePath, outputBuffer, { contentType: 'video/mp4', upsert: true })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = admin.storage
      .from('vsls')
      .getPublicUrl(storagePath)

    log(`  uploaded: ${publicUrl}`)

    // Mark complete
    await admin
      .from('vsl_campaigns')
      .update({
        status: 'completed',
        current_step: null,
        processed_video_url: publicUrl,
      })
      .eq('id', campaignId)

    log('Pipeline complete')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[vsl:${campaignId}] FAILED:`, err)

    await admin
      .from('vsl_campaigns')
      .update({
        status: 'failed',
        current_step: null,
      })
      .eq('id', campaignId)
  } finally {
    cleanup()
  }
}
