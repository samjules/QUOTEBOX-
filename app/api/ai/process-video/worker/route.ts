/**
 * POST /api/ai/process-video/worker
 *
 * Internal background worker — NOT meant to be called by clients directly.
 * Protected by INTERNAL_API_KEY header (set in Vercel env vars).
 *
 * This is the long-running endpoint that executes the full FFmpeg pipeline.
 * Set INTERNAL_API_KEY in your environment variables.
 *
 * Vercel Pro: set maxDuration = 300 (5 min) in this file.
 * For longer videos, move processing to Railway / Fly.io / AWS Lambda.
 */

// Increase function timeout to 5 minutes (requires Vercel Pro / Team plan)
export const maxDuration = 300

import { createAdminClient } from '@/lib/supabase/admin'
import { processVideoJob, retryVideoJob } from '@/lib/video/processVideo'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ── Internal key guard ─────────────────────────────────────────
  const internalKey = request.headers.get('x-internal-key')
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ─────────────────────────────────────────────────
  let body: { campaign_id?: string; user_id?: string; retry?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { campaign_id, user_id, retry = false } = body
  if (!campaign_id || !user_id) {
    return NextResponse.json(
      { error: 'Missing campaign_id or user_id' },
      { status: 400 },
    )
  }

  // ── Fetch campaign to get original video URL ───────────────────
  const admin = createAdminClient()
  const { data: campaign, error } = await admin
    .from('campaigns')
    .select('id, original_video_url, retry_count')
    .eq('id', campaign_id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // ── Run pipeline (awaited — this is the long-running part) ─────
  const opts = {
    campaignId: campaign_id,
    videoUrl: campaign.original_video_url,
    userId: user_id,
  }

  if (retry) {
    await retryVideoJob(opts)
  } else {
    await processVideoJob(opts)
  }

  return NextResponse.json({ ok: true })
}
