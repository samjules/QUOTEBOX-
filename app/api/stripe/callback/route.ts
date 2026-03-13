import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const code = searchParams.get('code')
  const state = searchParams.get('state') // accountId
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings?stripe=error`)
  }

  // Exchange authorization code for connected account ID
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.redirect(`${origin}/settings?stripe=error`)
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
      return NextResponse.redirect(`${origin}/settings?stripe=error`)
    }
    stripeUserId = tokenData.stripe_user_id
  } catch {
    return NextResponse.redirect(`${origin}/settings?stripe=error`)
  }

  // Save the connected account ID — verify the account belongs to the logged-in user
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/settings?stripe=error`)
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
    return NextResponse.redirect(`${origin}/settings?stripe=error`)
  }

  return NextResponse.redirect(`${origin}/settings?stripe=connected`)
}
