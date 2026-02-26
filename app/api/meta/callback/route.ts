import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = request.nextUrl

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=missing_params`)
  }

  // Decode state — supports both new JSON format and legacy plain base64 userId
  let userId: string
  let from: string = ''

  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    userId = decoded.userId
    from = decoded.from ?? ''
  } catch {
    // Legacy format: state was plain base64-encoded userId string
    try {
      userId = Buffer.from(state, 'base64').toString('utf-8')
    } catch {
      return NextResponse.redirect(`${siteUrl}/meta-ads?error=invalid_state`)
    }
  }

  if (!userId) {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=invalid_state`)
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${siteUrl}/api/meta/callback`

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=config_error`)
  }

  // Exchange code for short-lived token
  const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('code', code)

  let shortLivedToken: string
  try {
    const tokenRes = await fetch(tokenUrl.toString())
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${siteUrl}/meta-ads?error=token_exchange_failed`)
    }
    shortLivedToken = tokenData.access_token
  } catch {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=token_exchange_failed`)
  }

  // Exchange short-lived token for long-lived token
  const longTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
  longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
  longTokenUrl.searchParams.set('client_id', appId)
  longTokenUrl.searchParams.set('client_secret', appSecret)
  longTokenUrl.searchParams.set('fb_exchange_token', shortLivedToken)

  let longLivedToken: string
  try {
    const longTokenRes = await fetch(longTokenUrl.toString())
    const longTokenData = await longTokenRes.json()
    if (!longTokenData.access_token) {
      return NextResponse.redirect(`${siteUrl}/meta-ads?error=long_token_failed`)
    }
    longLivedToken = longTokenData.access_token
  } catch {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=long_token_failed`)
  }

  // Fetch Meta user ID
  let metaUserId: string
  try {
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${longLivedToken}`)
    const meData = await meRes.json()
    metaUserId = meData.id
  } catch {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=user_fetch_failed`)
  }

  // Fetch ad accounts
  let adAccounts: Array<{ id: string; name: string; account_id: string }> = []
  try {
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${longLivedToken}`
    )
    const adAccountsData = await adAccountsRes.json()
    adAccounts = adAccountsData.data || []
  } catch {
    // Non-fatal: continue without ad accounts
  }

  // Get the account row for this user
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (!account) {
    return NextResponse.redirect(`${siteUrl}/meta-ads?error=account_not_found`)
  }

  // Build update payload
  const updatePayload: Record<string, string> = {
    meta_access_token: longLivedToken,
    meta_user_id: metaUserId,
    meta_connected_at: new Date().toISOString(),
  }

  // Auto-select ad account if only one
  if (adAccounts.length === 1) {
    updatePayload.meta_ad_account_id = adAccounts[0].account_id
  }

  await supabase
    .from('accounts')
    .update(updatePayload)
    .eq('id', account.id)

  // Return to signup wizard if that's where the OAuth flow originated
  if (from === 'signup') {
    return NextResponse.redirect(`${siteUrl}/signup?step=2&meta=connected`)
  }

  return NextResponse.redirect(`${siteUrl}/meta-ads?connected=true`)
}
