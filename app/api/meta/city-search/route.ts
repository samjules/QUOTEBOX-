import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Meta access token
  const { data: account } = await supabase
    .from('accounts')
    .select('meta_access_token')
    .eq('owner_id', user.id)
    .single()

  if (!account?.meta_access_token) {
    return NextResponse.json({ error: 'Meta account not connected' }, { status: 400 })
  }

  const q = request.nextUrl.searchParams.get('q')
  const country = request.nextUrl.searchParams.get('country') || 'US'

  if (!q || q.length < 2) {
    return NextResponse.json({ cities: [] })
  }

  try {
    const params = new URLSearchParams({
      type: 'adgeolocation',
      location_types: '["city"]',
      q,
      country_code: country,
      access_token: account.meta_access_token,
    })

    const res = await fetch(
      `https://graph.facebook.com/v20.0/search?${params.toString()}`
    )
    const data = await res.json()

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message || 'City search failed' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cities = (data.data || []).map((c: any) => ({
      key: c.key,
      name: c.name,
      region: c.region || '',
      country_code: c.country_code || country,
    }))

    return NextResponse.json({ cities })
  } catch {
    return NextResponse.json({ error: 'City search failed' }, { status: 500 })
  }
}
