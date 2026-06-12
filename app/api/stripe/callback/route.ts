import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const code = searchParams.get('code')
  const state = searchParams.get('state') // accountId
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings?stripe=error&reason=missing_params`)
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.redirect(`${origin}/settings?stripe=error&reason=no_secret_key`)
  }

  let stripeUserId: string
  try {
    const tokenRes = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_secret: stripeSecretKey,
        code,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.stripe_user_id) {
      const reason = encodeURIComponent(tokenData.error_description || tokenData.error || 'no_user_id')
      return NextResponse.redirect(`${origin}/settings?stripe=error&reason=${reason}`)
    }
    stripeUserId = tokenData.stripe_user_id
  } catch (e) {
    const reason = encodeURIComponent(e instanceof Error ? e.message : 'token_fetch_failed')
    return NextResponse.redirect(`${origin}/settings?stripe=error&reason=${reason}`)
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/settings?stripe=error&reason=not_authenticated`)
  }

  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      stripe_connect_account_id: stripeUserId,
      stripe_connect_completed_at: new Date().toISOString(),
    })
    .eq('id', state)
    .eq('owner_id', user.id)

  if (updateError) {
    const reason = encodeURIComponent(updateError.message)
    return NextResponse.redirect(`${origin}/settings?stripe=error&reason=${reason}`)
  }

  return NextResponse.redirect(`${origin}/settings?stripe=connected`)
}
