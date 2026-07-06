import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { sessionId } = await request.json() as { sessionId: string }
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
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
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-subscription-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sessionId, accountId: session.account_id }),
  })

  const data = await res.json()
  if (!res.ok || !data.success) {
    return NextResponse.json({ error: data.error ?? 'Payment not confirmed' }, { status: 400 })
  }

  await admin.from('onboarding_sessions').update({
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', session.id)

  return NextResponse.json({ ok: true })
}
