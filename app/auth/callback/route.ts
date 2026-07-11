import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'

// Landing target for Supabase OAuth (Google, etc.) — exchanges the auth code
// for a session, then sends the user somewhere useful depending on whether
// they already have a Quotebox account.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const account = await getAccountForUser(supabase, data.user.id)
      // No existing account (brand-new Google sign-in) — send them to build
      // one instead of a dashboard with nothing behind it.
      return NextResponse.redirect(`${origin}${account ? '/dashboard' : '/build'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
