import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveIp } from '@/lib/services/ip-resolution'

const VALID_EVENTS = [
  'page_view', 'scroll_depth', 'field_focus',
  'form_submit_detected', 'time_on_page', 'session_end',
] as const

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') ?? undefined),
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined

  try {
    const body = await request.json()
    const {
      api_key,
      session_id,
      event_type,
      url,
      referrer,
      consent,
      payload = {},
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = body

    // Validate required fields
    if (!api_key || !session_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders(origin) },
      )
    }

    if (!VALID_EVENTS.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400, headers: corsHeaders(origin) },
      )
    }

    const supabase = createAdminClient()

    // Validate API key → get account
    // For now, api_key is the account_id (simple). Later: proper API key table.
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', api_key)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders(origin) },
      )
    }

    const accountId = account.id

    // Resolve IP → geo (extract IP, resolve, discard raw IP immediately)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1'
    const geo = await resolveIp(ip)

    // Try to find hosted_form_id from URL
    let hostedFormId: string | null = null
    if (url) {
      try {
        const parsedUrl = new URL(url)
        const slug = parsedUrl.pathname.split('/').filter(Boolean)[0]
        if (slug) {
          const { data: form } = await supabase
            .from('hosted_forms')
            .select('id')
            .eq('account_id', accountId)
            .eq('form_config->>slug', slug)
            .single()
          hostedFormId = form?.id ?? null
        }
      } catch {}
    }

    // Determine device type from payload or user agent
    const deviceType = payload.device_type || 'desktop'

    // Upsert session
    const { data: existingSession } = await supabase
      .from('pixel_sessions')
      .select('id')
      .eq('session_token', session_id)
      .single()

    let sessionDbId: string

    if (existingSession) {
      sessionDbId = existingSession.id
      // Update session with latest data
      await supabase
        .from('pixel_sessions')
        .update({
          consent_given: consent ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionDbId)
    } else {
      // Insert new session
      const { data: newSession } = await supabase
        .from('pixel_sessions')
        .insert({
          account_id: accountId,
          hosted_form_id: hostedFormId,
          session_token: session_id,
          city: geo.city,
          region: geo.region,
          postal_code: geo.postalCode,
          country: geo.country,
          latitude: geo.latitude,
          longitude: geo.longitude,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_term: utm_term || null,
          utm_content: utm_content || null,
          user_agent: payload.user_agent || null,
          device_type: deviceType,
          consent_given: consent ?? false,
        })
        .select('id')
        .single()

      if (!newSession) {
        return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
      }
      sessionDbId = newSession.id
    }

    // Insert event
    await supabase
      .from('pixel_events')
      .insert({
        session_id: sessionDbId,
        event_type,
        payload: payload ?? {},
      })

    // Create intelligence lead on form_submit_detected
    if (event_type === 'form_submit_detected') {
      // Check if a lead already exists for this session
      const { data: existingLead } = await supabase
        .from('intelligence_leads')
        .select('id')
        .eq('session_id', sessionDbId)
        .single()

      if (!existingLead) {
        await supabase
          .from('intelligence_leads')
          .insert({
            account_id: accountId,
            session_id: sessionDbId,
            hosted_form_id: hostedFormId,
            postal_code: geo.postalCode,
            city: geo.city,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude,
          })
      }
    }

    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
  } catch (err) {
    console.error('[pixel/event] Error:', err)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: corsHeaders(origin) },
    )
  }
}
