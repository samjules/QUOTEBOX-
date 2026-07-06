import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: session, error: sessionErr } = await admin
    .from('onboarding_sessions')
    .select('id, account_id, paid_at')
    .eq('token', params.token)
    .single()

  if (sessionErr || !session || !session.account_id) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  }

  const { data: account } = await admin
    .from('accounts')
    .select('owner_id')
    .eq('id', session.account_id)
    .single()

  if (!account || account.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.paid_at) {
    return NextResponse.json({ alreadyPaid: true })
  }

  const origin = request.nextUrl.origin
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      plan: 'ppl_onboarding',
      accountId: session.account_id,
      userId: user.id,
      successUrl: `${origin}/onboarding/ppl/${params.token}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/onboarding/ppl/${params.token}`,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? 'Failed to start checkout' }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
