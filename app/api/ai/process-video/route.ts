/**
 * POST /api/ai/process-video
 *
 * Creates a campaign record, sets status = "processing", then fires off
 * the background worker (non-blocking).
 *
 * Body:
 *   { video_url: string, script?: object, user_id?: string }
 *
 * Response (immediate):
 *   { campaign_id: string, status: "processing" }
 *
 * The caller should poll GET /api/ai/campaign/:id for progress.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────────
  let body: { video_url?: string; script?: object }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { video_url, script } = body
  if (!video_url?.trim()) {
    return NextResponse.json(
      { error: 'Missing required field: video_url' },
      { status: 400 },
    )
  }

  // ── Create campaign record ─────────────────────────────────────
  const admin = createAdminClient()

  const { data: campaign, error: insertError } = await admin
    .from('campaigns')
    .insert({
      user_id: user.id,
      status: 'processing',
      original_video_url: video_url,
      script: script ?? null,
    })
    .select('id')
    .single()

  if (insertError || !campaign) {
    console.error('[/api/ai/process-video] insert failed:', insertError)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }

  const campaignId = campaign.id

  // ── Seed step rows as "pending" ────────────────────────────────
  const steps = ['transcribing', 'editing', 'captioning', 'rendering']
  await admin.from('campaign_steps').insert(
    steps.map((step) => ({
      campaign_id: campaignId,
      step,
      status: 'pending',
    })),
  )

  // ── Fire-and-forget background worker ─────────────────────────
  // We intentionally do NOT await this fetch so the response returns immediately.
  // The worker route handles its own auth via INTERNAL_API_KEY.
  const workerUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ai/process-video/worker`

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
    },
    body: JSON.stringify({ campaign_id: campaignId, user_id: user.id }),
  }).catch((err) => {
    // Log but don't surface — the campaign is created; worker failure is tracked in DB
    console.error(`[campaign:${campaignId}] worker trigger failed:`, err)
  })

  return NextResponse.json({ campaign_id: campaignId, status: 'processing' }, { status: 202 })
}
