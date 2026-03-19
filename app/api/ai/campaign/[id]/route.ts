/**
 * GET /api/ai/campaign/:id
 *
 * Returns campaign status, current processing step, and final video URL.
 * Requires valid Supabase JWT. Users can only access their own campaigns.
 *
 * Response:
 * {
 *   id: string,
 *   status: "processing" | "complete" | "failed",
 *   current_step: string | null,
 *   steps: Array<{ step, status, updated_at }>,
 *   processed_video_url: string | null,
 *   error_message: string | null,
 *   created_at: string
 * }
 *
 * POST /api/ai/campaign/:id   { action: "retry" }
 *   Re-queues a failed campaign for reprocessing.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// ── GET ─────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: campaign, error } = await admin
    .from('campaigns')
    .select('id, status, processed_video_url, error_message, created_at, user_id')
    .eq('id', params.id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Enforce ownership — users can only read their own campaigns
  if (campaign.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: steps } = await admin
    .from('campaign_steps')
    .select('step, status, error, updated_at')
    .eq('campaign_id', params.id)
    .order('updated_at', { ascending: true })

  // Determine the current active step
  const stepOrder = ['transcribing', 'editing', 'captioning', 'rendering']
  const currentStep =
    steps?.find((s) => s.status === 'processing')?.step ??
    steps?.find((s) => s.status === 'failed')?.step ??
    (campaign.status === 'complete'
      ? stepOrder[stepOrder.length - 1]
      : stepOrder.find(
          (name) => steps?.find((s) => s.step === name)?.status === 'pending',
        ) ?? null)

  return NextResponse.json({
    id: campaign.id,
    status: campaign.status,
    current_step: currentStep ?? null,
    steps: steps ?? [],
    processed_video_url: campaign.processed_video_url ?? null,
    error_message: campaign.error_message ?? null,
    created_at: campaign.created_at,
  })
}

// ── POST (retry) ────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.action !== 'retry') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify ownership and failed status
  const { data: campaign, error } = await admin
    .from('campaigns')
    .select('id, status, user_id, retry_count')
    .eq('id', params.id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (campaign.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (campaign.status !== 'failed') {
    return NextResponse.json(
      { error: 'Only failed campaigns can be retried' },
      { status: 400 },
    )
  }

  const MAX_RETRIES = 3
  if ((campaign.retry_count ?? 0) >= MAX_RETRIES) {
    return NextResponse.json(
      { error: `Max retries (${MAX_RETRIES}) reached` },
      { status: 400 },
    )
  }

  // Fire off the retry worker (non-blocking)
  const workerUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ai/process-video/worker`

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
    },
    body: JSON.stringify({ campaign_id: params.id, user_id: user.id, retry: true }),
  }).catch((err) =>
    console.error(`[campaign:${params.id}] retry worker trigger failed:`, err),
  )

  return NextResponse.json({ campaign_id: params.id, status: 'processing' }, { status: 202 })
}
