import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ObjectiveConfig {
  objective: string
  optimization_goal: string
  billing_event: string
}

const OBJECTIVE_MAP: Record<string, ObjectiveConfig> = {
  OUTCOME_LEADS: {
    objective: 'OUTCOME_LEADS',
    optimization_goal: 'LEAD_GENERATION',
    billing_event: 'IMPRESSIONS',
  },
  OUTCOME_TRAFFIC: {
    objective: 'OUTCOME_TRAFFIC',
    optimization_goal: 'LINK_CLICKS',
    billing_event: 'LINK_CLICKS',
  },
  OUTCOME_AWARENESS: {
    objective: 'OUTCOME_AWARENESS',
    optimization_goal: 'REACH',
    billing_event: 'IMPRESSIONS',
  },
  OUTCOME_SALES: {
    objective: 'OUTCOME_SALES',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    billing_event: 'IMPRESSIONS',
  },
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get account with Meta credentials
  const { data: account } = await supabase
    .from('accounts')
    .select('meta_access_token, meta_ad_account_id')
    .eq('owner_id', user.id)
    .single()

  if (!account?.meta_access_token || !account?.meta_ad_account_id) {
    return NextResponse.json(
      { error: 'Meta account not connected or no ad account selected' },
      { status: 400 }
    )
  }

  const { meta_access_token: token, meta_ad_account_id: adAccountId } = account

  let body: {
    campaignName: string
    adSetName: string
    objective: string
    dailyBudget: number
    duration: number | 'ongoing'
    targetAge?: { min: number; max: number }
    targetGender?: string
    targetLocation?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const objConfig = OBJECTIVE_MAP[body.objective] || OBJECTIVE_MAP.OUTCOME_TRAFFIC

  // Create Campaign
  const campaignParams = new URLSearchParams({
    name: body.campaignName,
    objective: objConfig.objective,
    status: 'PAUSED',
    special_ad_categories: '[]',
    access_token: token,
  })

  let campaignId: string
  try {
    const campaignRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
      {
        method: 'POST',
        body: campaignParams,
      }
    )
    const campaignData = await campaignRes.json()

    if (!campaignRes.ok || !campaignData.id) {
      return NextResponse.json(
        { error: campaignData.error?.message || 'Campaign creation failed' },
        { status: 400 }
      )
    }
    campaignId = campaignData.id
  } catch {
    return NextResponse.json({ error: 'Campaign creation failed' }, { status: 500 })
  }

  // Build targeting spec
  const targeting: Record<string, unknown> = {
    age_min: body.targetAge?.min || 18,
    age_max: body.targetAge?.max || 65,
  }

  if (body.targetGender === 'male') {
    targeting.genders = [1]
  } else if (body.targetGender === 'female') {
    targeting.genders = [2]
  }

  if (body.targetLocation) {
    targeting.geo_locations = {
      countries: [body.targetLocation.toUpperCase().slice(0, 2)],
    }
  } else {
    targeting.geo_locations = { countries: ['US'] }
  }

  // Build ad set params
  const startTime = new Date()
  const adSetParams = new URLSearchParams({
    campaign_id: campaignId,
    name: body.adSetName,
    daily_budget: String(Math.round(body.dailyBudget * 100)),
    billing_event: objConfig.billing_event,
    optimization_goal: objConfig.optimization_goal,
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    targeting: JSON.stringify(targeting),
    start_time: startTime.toISOString(),
    status: 'PAUSED',
    access_token: token,
  })

  if (body.duration !== 'ongoing' && body.duration) {
    const endTime = new Date(startTime)
    endTime.setDate(endTime.getDate() + body.duration)
    adSetParams.set('end_time', endTime.toISOString())
  }

  let adSetId: string
  try {
    const adSetRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`,
      {
        method: 'POST',
        body: adSetParams,
      }
    )
    const adSetData = await adSetRes.json()

    if (!adSetRes.ok || !adSetData.id) {
      return NextResponse.json(
        { error: adSetData.error?.message || 'Ad set creation failed' },
        { status: 400 }
      )
    }
    adSetId = adSetData.id
  } catch {
    return NextResponse.json({ error: 'Ad set creation failed' }, { status: 500 })
  }

  const adsManagerUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`

  return NextResponse.json({
    campaignId,
    adSetId,
    campaignName: body.campaignName,
    adSetName: body.adSetName,
    adsManagerUrl,
    status: 'PAUSED',
  })
}
