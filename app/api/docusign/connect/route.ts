import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY?.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin
  const authServer = process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com'

  if (!integrationKey) {
    return NextResponse.json({ error: 'DocuSign not configured' }, { status: 500 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!account) {
    return NextResponse.redirect(`${siteUrl}/settings?docusign=error&reason=no_account`)
  }

  const redirectUri = `${siteUrl}/api/docusign/callback`
  const state = account.id

  const oauthUrl = new URL(`https://${authServer}/oauth/auth`)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('scope', 'signature')
  oauthUrl.searchParams.set('client_id', integrationKey)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('state', state)

  return NextResponse.redirect(oauthUrl.toString())
}
