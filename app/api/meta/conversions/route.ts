import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/act_${creds.adAccountId}/customconversions` +
      `?fields=id,name,custom_event_type,rule,pixel_id,creation_time` +
      `&access_token=${creds.token}`,
      { cache: 'no-store' }
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Failed to fetch conversions', conversions: [] }, { status: 400 })
    }
    return NextResponse.json({ conversions: data.data || [] })
  } catch {
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

  // Build the rule — event match, optionally filtered to URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andClauses: any[] = [{ event: { eq: eventType } }]
  if (body.url_contains) {
    andClauses.push({ url: { i_contains: body.url_contains } })
  }
  const rule = JSON.stringify({ and: andClauses })

  const params = new URLSearchParams({
    name: body.name,
    pixel_id: body.pixel_id,
    custom_event_type: eventType,
    rule,
    access_token: creds.token,
  })

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/act_${creds.adAccountId}/customconversions`,
      { method: 'POST', body: params }
    )
    const data = await res.json()
    if (!res.ok || !data.id) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create conversion' },
        { status: 400 }
      )
    }
    return NextResponse.json({ id: data.id, name: body.name, custom_event_type: eventType })
  } catch {
    return NextResponse.json({ error: 'Failed to create conversion' }, { status: 500 })
  }
}
