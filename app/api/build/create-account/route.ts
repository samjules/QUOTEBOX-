import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : ''

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  if (!businessName) return NextResponse.json({ error: 'Business name is required' }, { status: 400 })

  const admin = createAdminClient()

  // Reuse an existing auth user for this email if one already exists — e.g. their
  // previous account was deleted but the Supabase Auth user itself was left behind.
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  let ownerId: string
  if (existingUser) {
    const { data: existingAccount } = await admin
      .from('accounts')
      .select('id, business_name')
      .eq('owner_id', existingUser.id)
      .maybeSingle()
    if (existingAccount) {
      return NextResponse.json({
        error: `An account already exists for this email (${existingAccount.business_name}). Log in instead.`,
      }, { status: 409 })
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(existingUser.id, { password })
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
    ownerId = existingUser.id
  } else {
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 500 })
    }
    ownerId = authData.user.id
  }

  const { data: newAccount, error: accountError } = await admin
    .from('accounts')
    .insert({ business_name: businessName, owner_id: ownerId })
    .select('id')
    .single()
  if (accountError || !newAccount) {
    return NextResponse.json({ error: accountError?.message ?? 'Failed to create account' }, { status: 500 })
  }

  await admin.from('billing').insert({ account_id: newAccount.id, plan: null, credit_balance: 0, total_spent: 0 })

  return NextResponse.json({ ok: true, accountId: newAccount.id })
}
