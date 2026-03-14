import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getMetaCreds() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: account } = await supabase
    .from('accounts')
    .select('meta_access_token, meta_ad_account_id')
    .eq('owner_id', user.id)
    .single()
  if (!account?.meta_access_token || !account?.meta_ad_account_id) return null
  return { token: account.meta_access_token, adAccountId: account.meta_ad_account_id }
}

// GET — list custom conversions for this ad account
export async function GET() {
  const creds = await getMetaCreds()
  if (!creds) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adAccountId = creds.adAccountId.startsWith('act_')
    ? creds.adAccountId
    : `act_${creds.adAccountId}`

  console.log('[conversions GET] raw stored adAccountId:', creds.adAccountId)
  console.log('[conversions GET] normalized adAccountId:', adAccountId)

  try {
    const url = `https://graph.facebook.com/v18.0/${adAccountId}/customconversions?fields=id,name,custom_event_type,rule,pixel_id,creation_time&limit=100&access_token=${creds.token}`
    console.log('[conversions GET] fetching URL (token redacted):', url.replace(creds.token, 'REDACTED'))

    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()

    console.log('[conversions GET] HTTP status:', res.status)
    console.log('[conversions GET] raw Meta response:', JSON.stringify(data))

    if (!res.ok) {
      console.error('[conversions GET] Meta error:', data.error)
      return NextResponse.json({ error: data.error?.message || 'Failed to fetch conversions', conversions: [] }, { status: 400 })
    }
    console.log('[conversions GET] returning', (data.data || []).length, 'conversions')
    return NextResponse.json({ conversions: data.data || [] })
  } catch (e) {
    console.error('[conversions GET] exception:', e)
    return NextResponse.json({ error: 'Failed to fetch conversions', conversions: [] }, { status: 500 })
  }
}

// POST — create a new custom conversion
export async function POST(request: NextRequest) {
  const creds = await getMetaCreds()
  if (!creds) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    name: string
    pixel_id: string
    custom_event_type?: string   // default LEAD
    url_contains?: string        // optional URL filter
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.name || !body.pixel_id) {
    return NextResponse.json({ error: 'name and pixel_id are required' }, { status: 400 })
  }

  const eventType = body.custom_event_type || 'LEAD'

  // rule is required by Meta. Use URL-only filter — do NOT include an event clause
  // here since custom_event_type already specifies the event (that combo = "Invalid parameter").
  const urlFilter = body.url_contains || 'quote-box.com'
  const rule = JSON.stringify({ and: [{ url: { i_contains: urlFilter } }] })

  const params = new URLSearchParams({
    name: body.name,
    event_source_id: body.pixel_id,
    custom_event_type: eventType,
    rule,
    access_token: creds.token,
  })

  const adAccountId = creds.adAccountId.startsWith('act_')
    ? creds.adAccountId
    : `act_${creds.adAccountId}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/customconversions`,
      { method: 'POST', body: params }
    )
    const data = await res.json()
    if (!res.ok || !data.id) {
      console.error('[conversions] Meta error:', JSON.stringify(data.error))
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create conversion', meta_error: data.error },
        { status: 400 }
      )
    }
    return NextResponse.json({ id: data.id, name: body.name, custom_event_type: eventType })
  } catch {
    return NextResponse.json({ error: 'Failed to create conversion' }, { status: 500 })
  }
}
