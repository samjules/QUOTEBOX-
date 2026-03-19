/**
 * POST /api/vsl/process-video
 *
 * Kicks off server-side video processing for a VSL campaign.
 * Updates campaign status and fires off the background worker.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireVslAuth } from '@/lib/vsl/auth'

export async function POST(request: NextRequest) {
  const { account, response } = await requireVslAuth(request)
  if (response) return response

  let body: { campaign_id?: string; video_url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { campaign_id, video_url } = body
  if (!campaign_id || !video_url) {
    return NextResponse.json(
      { error: 'Missing required fields: campaign_id, video_url' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  // Verify campaign exists and belongs to this account
  const { data: campaign } = await admin
    .from('vsl_campaigns')
    .select('id, account_id')
    .eq('id', campaign_id)
    .single()

  if (!campaign || campaign.account_id !== account.id) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Update campaign status
  const { error: updateError } = await admin
    .from('vsl_campaigns')
    .update({
      status: 'processing',
      current_step: 'removing_silence',
      raw_video_url: video_url,
    })
    .eq('id', campaign_id)

  if (updateError) {
    console.error('[/api/vsl/process-video] update failed:', updateError)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }

  // Fire-and-forget background worker
  const workerUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/vsl/process-video/worker`

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
    },
    body: JSON.stringify({ campaign_id, video_url }),
  }).catch((err) => {
    console.error(`[vsl:${campaign_id}] worker trigger failed:`, err)
  })

  return NextResponse.json({ success: true, message: 'Processing started' })
}
