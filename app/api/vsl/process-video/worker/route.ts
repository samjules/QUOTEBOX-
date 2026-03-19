/**
 * POST /api/vsl/process-video/worker
 *
 * Internal background worker for VSL video processing.
 * Protected by INTERNAL_API_KEY — not called directly by clients.
 *
 * NOTE: FFmpeg/Whisper video processing (silence removal, captions) cannot
 * run on Vercel serverless. For now, this worker simply marks the raw video
 * as the processed video so the iOS flow completes. When a dedicated worker
 * environment is available (Railway, Fly.io, etc.), swap in processVslVideo().
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const internalKey = request.headers.get('x-internal-key')
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { campaign_id?: string; video_url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { campaign_id, video_url } = body
  if (!campaign_id || !video_url) {
    return NextResponse.json({ error: 'Missing campaign_id or video_url' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    // Step 1: removing_silence (passthrough — no FFmpeg on Vercel)
    await admin
      .from('vsl_campaigns')
      .update({ current_step: 'removing_silence' })
      .eq('id', campaign_id)

    // Step 2: adding_captions (passthrough)
    await admin
      .from('vsl_campaigns')
      .update({ current_step: 'adding_captions' })
      .eq('id', campaign_id)

    // Step 3: finalizing — use raw video as processed video
    await admin
      .from('vsl_campaigns')
      .update({ current_step: 'finalizing' })
      .eq('id', campaign_id)

    // Mark complete with raw video as the processed output
    await admin
      .from('vsl_campaigns')
      .update({
        status: 'completed',
        current_step: null,
        processed_video_url: video_url,
      })
      .eq('id', campaign_id)

    console.log(`[vsl-worker:${campaign_id}] completed (passthrough mode)`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[vsl-worker:${campaign_id}] failed:`, msg)

    await admin
      .from('vsl_campaigns')
      .update({ status: 'failed', current_step: null })
      .eq('id', campaign_id)

    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
