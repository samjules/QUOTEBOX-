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

// GET — list custom conversions for this ad account, filtered to QuoteBox ones
export async function GET() {
  const creds = await getMetaCreds()
  if (!creds) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adAccountId = creds.adAccountId.startsWith('act_')
    ? creds.adAccountId
    : `act_${creds.adAccountId}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/customconversions` +
      `?fields=id,name,custom_event_type,rule,creation_time&limit=100` +
      `&access_token=${creds.token}`,
      { cache: 'no-store' }
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Failed to fetch conversions', conversions: [] }, { status: 400 })
    }
    // Only return conversions whose rule references quote-box.com (created via QuoteBox)
    const all: Array<{ id: string; name: string; custom_event_type: string; rule?: string }> = data.data || []
    const quoteboxConversions = all.filter((cv) =>
      typeof cv.rule === 'string' && cv.rule.includes('quote-box.com')
    )
    return NextResponse.json({ conversions: quoteboxConversions })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conversions', conversions: [] }, { status: 500 })
  }
}

// DELETE — remove a custom conversion by id (?id=...)
export async function DELETE(request: NextRequest) {
  const creds = await getMetaCreds()
  if (!creds) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${id}?access_token=${creds.token}`,
      { method: 'DELETE' }
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Failed to delete conversion' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete conversion' }, { status: 500 })
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
