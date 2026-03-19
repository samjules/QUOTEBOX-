/**
 * GET /api/vsl/campaign/:campaignId
 *
 * Returns the current status of a VSL campaign.
 * iOS app polls this every 4 seconds during processing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAccountFromToken(token: string) {
  const admin = createAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null

  const { data: account } = await admin
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  return account
}

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } },
) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const account = await getAccountFromToken(token)
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
