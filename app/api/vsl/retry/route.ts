/**
 * POST /api/vsl/retry
 *
 * Retries video processing for a failed VSL campaign.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireVslAuth } from '@/lib/vsl/auth'

export async function POST(request: NextRequest) {
  const { account, response } = await requireVslAuth(request)
  if (response) return response

  let body: { campaign_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { campaign_id } = body
  if (!campaign_id) {
    return NextResponse.json({ error: 'Missing required field: campaign_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify campaign exists, belongs to account, and has a raw video URL
  const { data: campaign } = await admin
    .from('vsl_campaigns')
    .select('id, account_id, raw_video_url')
    .eq('id', campaign_id)
    .single()

  if (!campaign || campaign.account_id !== account.id) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (!campaign.raw_video_url) {
    return NextResponse.json({ error: 'No video to process' }, { status: 400 })
  }

  // Reset campaign status
  const { error: updateError } = await admin
    .from('vsl_campaigns')
    .update({
      status: 'processing',
      current_step: 'removing_silence',
      processed_video_url: null,
    })
    .eq('id', campaign_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to reset campaign' }, { status: 500 })
  }

  // Fire-and-forget background worker
  const workerUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/vsl/process-video/worker`

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
    },
    body: JSON.stringify({ campaign_id, video_url: campaign.raw_video_url }),
  }).catch((err) => {
    console.error(`[vsl:${campaign_id}] retry worker trigger failed:`, err)
  })

  return NextResponse.json({ success: true, message: 'Processing started' })
}
