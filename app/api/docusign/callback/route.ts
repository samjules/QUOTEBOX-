import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || origin

  const code = searchParams.get('code')
  const state = searchParams.get('state') // accountId
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=oauth_denied`)
  }

  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY?.trim()
  const secretKey = process.env.DOCUSIGN_SECRET_KEY?.trim()
  const authServer = process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com'

  if (!integrationKey || !secretKey) {
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=not_configured`)
  }

  // Exchange authorization code for access token
  let accessToken: string
  let refreshToken: string
  try {
    const basicAuth = Buffer.from(`${integrationKey}:${secretKey}`).toString('base64')
    const tokenRes = await fetch(`https://${authServer}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      const reason = encodeURIComponent(tokenData.error || 'token_exchange_failed')
      return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=${reason}`)
    }
    accessToken = tokenData.access_token
    refreshToken = tokenData.refresh_token
  } catch {
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=token_exchange_failed`)
  }

  // Get user info to find their DocuSign account ID
  let docusignUserId: string
  let docusignAccountId: string
  let basePath: string
  try {
    const userInfoRes = await fetch(`https://${authServer}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const userInfo = await userInfoRes.json()
    docusignUserId = userInfo.sub
    // Use the default account
    const defaultAccount = userInfo.accounts?.find((a: { is_default: boolean }) => a.is_default) || userInfo.accounts?.[0]
    if (!defaultAccount) {
      return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=no_docusign_account`)
    }
    docusignAccountId = defaultAccount.account_id
    basePath = defaultAccount.base_uri + '/restapi'
  } catch {
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=userinfo_failed`)
  }

  // Verify user session and save to account
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=not_authenticated`)
  }

  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      docusign_access_token: accessToken,
      docusign_refresh_token: refreshToken,
      docusign_account_id: docusignAccountId,
      docusign_user_id: docusignUserId,
      docusign_base_path: basePath,
      docusign_connected_at: new Date().toISOString(),
    })
    .eq('id', state)
    .eq('owner_id', user.id)

  if (updateError) {
    const reason = encodeURIComponent(updateError.message)
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=${reason}`)
  }

  return NextResponse.redirect(`${siteUrl}/settings?docusign=connected`)
}
