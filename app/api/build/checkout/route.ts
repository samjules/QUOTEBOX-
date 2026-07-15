import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const VALID_PLANS = ['software_99', 'ad_setup_350', 'fully_managed_750']

  const body = await request.json().catch(() => ({}))
  const accountId = typeof body.accountId === 'string' ? body.accountId : null
  const plan = VALID_PLANS.includes(body.plan) ? body.plan : 'software_99'

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('accounts')
    .select('owner_id')
    .eq('id', accountId)
    .single()

  if (!account || account.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const origin = request.nextUrl.origin
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      plan,
      accountId,
      userId: user.id,
      successUrl: `${origin}/build/confirm?session_id={CHECKOUT_SESSION_ID}&account_id=${accountId}`,
      cancelUrl: `${origin}/dashboard?checkout=cancelled`,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? 'Failed to start checkout' }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
