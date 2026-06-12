import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  let shortToken: string
  let fbUserId: string
  try {
    const body = await request.json()
    shortToken = body.accessToken
    fbUserId = body.userId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Meta app not configured' }, { status: 500 })
  }

  // Exchange short-lived token for long-lived token
  const longTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
  longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
  longTokenUrl.searchParams.set('client_id', appId)
  longTokenUrl.searchParams.set('client_secret', appSecret)
  longTokenUrl.searchParams.set('fb_exchange_token', shortToken)

  let longLivedToken: string
  try {
    const res = await fetch(longTokenUrl.toString())
    const data = await res.json()
    if (!data.access_token) {
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 })
    }
    longLivedToken = data.access_token
  } catch {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 })
  }

  // Fetch ad accounts
  let adAccounts: Array<{ id: string; name: string; account_id: string }> = []
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${longLivedToken}`
    )
    const data = await res.json()
    adAccounts = data.data || []
  } catch {
    // Non-fatal
  }

  // Get account row
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const updatePayload: Record<string, string> = {
    meta_access_token: longLivedToken,
    meta_user_id: fbUserId,
    meta_connected_at: new Date().toISOString(),
  }

  if (adAccounts.length === 1) {
    updatePayload.meta_ad_account_id = adAccounts[0].account_id
  }

  await supabase.from('accounts').update(updatePayload).eq('id', account.id)

  return NextResponse.json({ success: true, adAccountCount: adAccounts.length })
}
