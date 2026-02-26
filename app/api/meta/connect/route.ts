import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!appId || !siteUrl) {
    return NextResponse.json({ error: 'Meta app not configured' }, { status: 500 })
  }

  const redirectUri = `${siteUrl}/api/meta/callback`
  const state = Buffer.from(user.id).toString('base64')
  const scopes = 'ads_management,ads_read,pages_read_engagement'

  const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  oauthUrl.searchParams.set('client_id', appId)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', scopes)
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(oauthUrl.toString())
}
