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
    // OFFSITE_CONVERSIONS = website pixel tracking (correct for QuoteBox hosted forms)
    // LEAD_GENERATION would be for Meta's native instant forms only
    optimization_goal: 'OFFSITE_CONVERSIONS',
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
    targetLocation?: string        // 2-letter country code
    targetPostalCodes?: string[]   // e.g. ["US:90210", "US:10001"]
    destinationUrl?: string
    pageId?: string
    headline?: string
    bodyText?: string
    cta?: string
    customConversionId?: string
    pixelId?: string
    splitTest?: boolean
    headlines?: string[]
    bodyTexts?: string[]
    imageUrl?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const objConfig = OBJECTIVE_MAP[body.objective] || OBJECTIVE_MAP.OUTCOME_TRAFFIC

  // Validate required fields before touching Meta (avoids orphaned campaigns with no ads)
  if (!body.pageId) {
    return NextResponse.json(
      { error: 'A Facebook Page is required to create ads. Select a page in the ad creative step.' },
      { status: 400 }
    )
  }
  if (!body.destinationUrl) {
    return NextResponse.json(
      { error: 'A destination URL is required.' },
      { status: 400 }
    )
  }

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

  // Build promoted_object per Meta API rules:
  // - custom_conversion_id alone (pixel already baked in — do NOT also send pixel_id)
  // - pixel_id + custom_event_type (when no custom conversion)
  // - page_id for non-conversion objectives
  const promotedObject: Record<string, string> = {}
  if (objConfig.optimization_goal === 'OFFSITE_CONVERSIONS') {
    if (body.customConversionId) {
      promotedObject.custom_conversion_id = body.customConversionId
    } else if (body.pixelId) {
      promotedObject.pixel_id = body.pixelId
      promotedObject.custom_event_type = body.objective === 'OUTCOME_SALES' ? 'PURCHASE' : 'LEAD'
    }
  } else {
    if (body.pageId) promotedObject.page_id = body.pageId
    if (body.pixelId) promotedObject.pixel_id = body.pixelId
  }
  if (Object.keys(promotedObject).length > 0) {
    adSetParams.set('promoted_object', JSON.stringify(promotedObject))
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

  // Create Ad Creative(s) and Ad(s)
  const adIds: string[] = []
  const adsManagerUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`

  // Build variant list — split test uses all headlines/bodyTexts, otherwise single
  const variants: Array<{ headline: string; bodyText: string; label: string }> = []
  if (body.splitTest && body.headlines && body.bodyTexts && body.headlines.length > 0) {
    body.headlines.forEach((h, i) => {
      variants.push({
        headline: h,
        bodyText: body.bodyTexts?.[i] || body.bodyTexts?.[0] || '',
        label: String.fromCharCode(65 + i),
      })
    })
  } else if (body.headline && body.bodyText) {
    variants.push({ headline: body.headline, bodyText: body.bodyText, label: '' })
  }

  if (variants.length === 0) {
    return NextResponse.json(
      { error: 'No ad copy generated. Please generate ad copy before launching.' },
      { status: 400 }
    )
  }

  for (const variant of variants) {
    const objectStorySpec = {
      page_id: body.pageId,
      link_data: {
        link: body.destinationUrl,
        message: variant.bodyText,
        name: variant.headline,
        call_to_action: { type: body.cta || 'LEARN_MORE' },
        ...(body.imageUrl ? { picture: body.imageUrl } : {}),
      },
    }

    const creativeName = variant.label
      ? `${body.campaignName} - Creative ${variant.label}`
      : `${body.campaignName} - Creative`

    const creativeParams = new URLSearchParams({
      name: creativeName,
      object_story_spec: JSON.stringify(objectStorySpec),
      access_token: token,
    })

    const creativeRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`,
      { method: 'POST', body: creativeParams }
    )
    const creativeData = await creativeRes.json()

    if (!creativeRes.ok || !creativeData.id) {
      console.error('[create-campaign] Creative error:', JSON.stringify(creativeData.error))
      return NextResponse.json(
        { error: creativeData.error?.message || 'Ad creative creation failed', meta_error: creativeData.error, campaignId, adSetId },
        { status: 400 }
      )
    }

    const adName = variant.label
      ? `${body.campaignName} - Ad ${variant.label}`
      : `${body.campaignName} - Ad`

    const adParams = new URLSearchParams({
      name: adName,
      adset_id: adSetId,
      creative: JSON.stringify({ creative_id: creativeData.id }),
      status: 'PAUSED',
      access_token: token,
    })

    const adRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/ads`,
      { method: 'POST', body: adParams }
    )
    const adData = await adRes.json()

    if (!adRes.ok || !adData.id) {
      console.error('[create-campaign] Ad error:', JSON.stringify(adData.error))
      return NextResponse.json(
        { error: adData.error?.message || 'Ad creation failed', meta_error: adData.error, campaignId, adSetId },
        { status: 400 }
      )
    }

    adIds.push(adData.id)
  }

  return NextResponse.json({
    campaignId,
    adSetId,
    adIds,
    adId: adIds[0] || null,
    campaignName: body.campaignName,
    adSetName: body.adSetName,
    adsManagerUrl,
    status: 'PAUSED',
  })
}
