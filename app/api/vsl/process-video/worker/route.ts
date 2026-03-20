/**
 * POST /api/vsl/process-video/worker
 *
 * Internal background worker for VSL video processing.
 * Protected by INTERNAL_API_KEY — not called directly by clients.
 *
 * Runs the full pipeline: silence removal, Whisper transcription,
 * caption burning, and upload to Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processVslVideo } from '@/lib/video/processVslVideo'

export const runtime = 'nodejs'
export const maxDuration = 300

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

  try {
    await processVslVideo({
      campaignId: campaign_id,
      videoUrl: video_url,
    })

    console.log(`[vsl-worker:${campaign_id}] completed`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[vsl-worker:${campaign_id}] failed:`, msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
