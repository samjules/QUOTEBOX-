/**
 * POST /api/vsl/process-video/worker
 *
 * Internal background worker for VSL video processing.
 * Protected by INTERNAL_API_KEY — not called directly by clients.
 *
 * Pipeline: remove silence → add captions → finalize
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processVslVideo } from '@/lib/video/processVslVideo'

export const maxDuration = 300 // 5 minutes (Vercel Pro)

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
    await processVslVideo({ campaignId: campaign_id, videoUrl: video_url })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[vsl-worker:${campaign_id}] failed:`, err)
    // Campaign status is already set to "failed" by processVslVideo
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
