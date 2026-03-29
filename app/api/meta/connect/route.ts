import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID?.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!appId || !siteUrl) {
    return NextResponse.json({ error: 'Meta app not configured' }, { status: 500 })
  }

  const token = request.nextUrl.searchParams.get('token')

  let statePayload: Record<string, string>

  if (token) {
    // Token-based path for PPL onboarding (no user session required)
    const admin = createAdminClient()
    const { data: session } = await admin
      .from('onboarding_sessions')
      .select('account_id')
      .eq('token', token)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Invalid onboarding token' }, { status: 401 })
    }

    statePayload = { accountId: session.account_id, from: 'ppl-onboarding', token }
  } else {
    // Standard session-based auth
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const from = request.nextUrl.searchParams.get('from') ?? ''
    statePayload = { userId: user.id, from }
  }

  const redirectUri = `${siteUrl}/api/meta/callback`
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64')
  const scopes = 'ads_management,ads_read,pages_read_engagement,pages_show_list'

  const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  oauthUrl.searchParams.set('client_id', appId)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', scopes)
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(oauthUrl.toString())
}
