/**
 * GET /api/vsl/campaign/:campaignId
 *
 * Returns the current status of a VSL campaign.
 * iOS app polls this every 4 seconds during processing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireVslAuth } from '@/lib/vsl/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } },
) {
  const { account, response } = await requireVslAuth(request)
  if (response) return response

  const admin = createAdminClient()
  const { data: campaign, error } = await admin
    .from('vsl_campaigns')
    .select('id, account_id, title, status, current_step, raw_video_url, processed_video_url, created_at')
    .eq('id', params.campaignId)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Verify ownership
  if (campaign.account_id !== account.id) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: campaign.id,
    account_id: campaign.account_id,
    title: campaign.title,
    status: campaign.status,
    current_step: campaign.current_step,
    raw_video_url: campaign.raw_video_url,
    processed_video_url: campaign.processed_video_url,
    created_at: campaign.created_at,
  })
}
