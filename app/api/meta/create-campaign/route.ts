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
    billing_event: 'IMPRESSIONS',
  },
  OUTCOME_AWARENESS: {
    objective: 'OUTCOME_AWARENESS',
    optimization_goal: 'REACH',
    billing_event: 'IMPRESSIONS',
  },
  OUTCOME_SALES: {
    objective: 'OUTCOME_SALES',
    optimization_goal: 'LINK_CLICKS',
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
    targetLocation?: string        // 2-letter country code
    targetPostalCodes?: string[]   // e.g. ["US:90210", "US:10001"]
    destinationUrl?: string
    pageId?: string
    headline?: string
    bodyText?: string
    cta?: string
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
    is_adset_budget_sharing_enabled: 'false',
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
        { error: campaignData.error?.message || 'Campaign creation failed', meta_error: campaignData.error },
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
    targeting_automation: { advantage_audience: 0 },
  }

  if (body.targetGender === 'male') {
    targeting.genders = [1]
  } else if (body.targetGender === 'female') {
    targeting.genders = [2]
  }

  if (body.targetPostalCodes && body.targetPostalCodes.length > 0) {
    // Postal code targeting — format: [{ key: "US:90210" }, ...]
    targeting.geo_locations = {
      zips: body.targetPostalCodes.map((z) => ({ key: z })),
    }
  } else if (body.targetLocation) {
    // Country targeting — must be a valid ISO 3166-1 alpha-2 code
    const countryCode = body.targetLocation.toUpperCase().trim()
    targeting.geo_locations = {
      countries: [/^[A-Z]{2}$/.test(countryCode) ? countryCode : 'US'],
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

  // OUTCOME_LEADS requires a promoted_object with page_id
  if (body.objective === 'OUTCOME_LEADS' && body.pageId) {
    adSetParams.set('promoted_object', JSON.stringify({ page_id: body.pageId }))
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
        { error: adSetData.error?.message || 'Ad set creation failed', meta_error: adSetData.error },
        { status: 400 }
      )
    }
    adSetId = adSetData.id
  } catch {
    return NextResponse.json({ error: 'Ad set creation failed' }, { status: 500 })
  }

  // Create Ad Creative (only if we have a page + destination + copy)
  let adId: string | null = null
  let creativeError: unknown = null
  let adError: unknown = null

  if (body.pageId && body.destinationUrl && body.headline && body.bodyText) {
    const objectStorySpec = {
      page_id: body.pageId,
      link_data: {
        link: body.destinationUrl,
        message: body.bodyText,
        name: body.headline,
        call_to_action: { type: body.cta || 'LEARN_MORE' },
      },
    }

    const creativeParams = new URLSearchParams({
      name: `${body.campaignName} - Creative`,
      object_story_spec: JSON.stringify(objectStorySpec),
      access_token: token,
    })

    let creativeId: string | null = null
    const creativeRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`,
      { method: 'POST', body: creativeParams }
    )
    const creativeData = await creativeRes.json()
    if (creativeRes.ok && creativeData.id) {
      creativeId = creativeData.id
    } else {
      creativeError = creativeData.error
    }

    // Create Ad
    if (creativeId) {
      const adParams = new URLSearchParams({
        name: `${body.campaignName} - Ad`,
        adset_id: adSetId,
        creative: JSON.stringify({ creative_id: creativeId }),
        status: 'PAUSED',
        access_token: token,
      })

      const adRes = await fetch(
        `https://graph.facebook.com/v18.0/act_${adAccountId}/ads`,
        { method: 'POST', body: adParams }
      )
      const adData = await adRes.json()
      if (adRes.ok && adData.id) {
        adId = adData.id
      } else {
        adError = adData.error
      }
    }
  }

  const adsManagerUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`

  return NextResponse.json({
    campaignId,
    adSetId,
    adId,
    creativeError,
    adError,
    campaignName: body.campaignName,
    adSetName: body.adSetName,
    adsManagerUrl,
    status: 'PAUSED',
  })
}
