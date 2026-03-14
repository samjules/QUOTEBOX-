import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await supabase
    .from('accounts')
    .select('meta_access_token, meta_ad_account_id')
    .eq('owner_id', user.id)
    .single()

  if (!account?.meta_access_token || !account?.meta_ad_account_id) {
    return NextResponse.json({ pixels: [], connected: false })
  }

  const adAccountId = account.meta_ad_account_id.startsWith('act_')
    ? account.meta_ad_account_id
    : `act_${account.meta_ad_account_id}`

  try {
    const url = new URL(`https://graph.facebook.com/v18.0/${adAccountId}/adspixels`)
    url.searchParams.set('fields', 'id,name')
    url.searchParams.set('access_token', account.meta_access_token)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ pixels: [], connected: true, error: data.error.message })
    }

    return NextResponse.json({ pixels: data.data ?? [], connected: true })
  } catch {
    return NextResponse.json({ pixels: [], connected: true, error: 'Failed to fetch pixels' })
  }
}
