import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { password } = await request.json() as { password: string }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: session, error: sessionErr } = await admin
    .from('onboarding_sessions')
    .select('id, account_id, lead_name, lead_email, status')
    .eq('token', params.token)
    .single()

  if (sessionErr || !session) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }
  if (session.status === 'form_built') {
    return NextResponse.json({ error: 'This onboarding has already been completed' }, { status: 403 })
  }
  if (session.account_id) {
    return NextResponse.json({ error: 'Account already created for this invite' }, { status: 400 })
  }
  if (!session.lead_email) {
    return NextResponse.json({ error: 'Invite is missing an email' }, { status: 400 })
  }

  // Reuse an existing auth user for this email if one already exists (e.g. a repeat invite)
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === session.lead_email!.toLowerCase()
  )

  let ownerId: string
  if (existingUser) {
    // This email already has a login — make sure it doesn't already own a
    // different account before reusing it, so onboarding never creates a
    // second account glued onto an existing one.
    const { data: existingAccount } = await admin
      .from('accounts')
      .select('id, business_name')
      .eq('owner_id', existingUser.id)
      .maybeSingle()
    if (existingAccount) {
      return NextResponse.json({
        error: `An account already exists for this email (${existingAccount.business_name}). Contact support to proceed.`,
      }, { status: 409 })
    }

    await admin.auth.admin.updateUserById(existingUser.id, { password })
    ownerId = existingUser.id
  } else {
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: session.lead_email,
      password,
      email_confirm: true,
      user_metadata: { full_name: session.lead_name },
    })
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 500 })
    }
    ownerId = authData.user.id
  }

  const { data: newAccount, error: accErr } = await admin
    .from('accounts')
    .insert({ business_name: session.lead_name, owner_id: ownerId })
    .select('id')
    .single()

  if (accErr || !newAccount) {
    return NextResponse.json({ error: accErr?.message ?? 'Failed to create account' }, { status: 500 })
  }

  // Plan stays null until the $750/mo subscription payment succeeds
  await admin.from('billing').insert({ account_id: newAccount.id, plan: null, credit_balance: 0, total_spent: 0 })

  await admin.from('onboarding_sessions').update({
    account_id: newAccount.id,
    password_set_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', session.id)

  return NextResponse.json({ ok: true, email: session.lead_email })
}
