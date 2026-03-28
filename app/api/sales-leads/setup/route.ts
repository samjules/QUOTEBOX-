import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Look up sales lead by setup_token
    const { data: lead, error: leadErr } = await admin
      .from('sales_leads')
      .select('*')
      .eq('setup_token', token)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Invalid or expired setup link' }, { status: 404 })
    }

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === lead.email.toLowerCase()
    )

    if (existingUser) {
      // User already has an account — update their password and let them in
      await admin.auth.admin.updateUserById(existingUser.id, { password })

      // Clear the setup token
      await admin.from('sales_leads').update({
        setup_token: null,
        status: 'closed',
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id)

      return NextResponse.json({ success: true, email: lead.email })
    }

    // Create auth user with password
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: lead.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: lead.name },
    })

    if (authErr || !authData?.user) {
      return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 500 })
    }

    // Create account
    const { data: newAccount, error: accErr } = await admin
      .from('accounts')
      .insert({ business_name: lead.name, owner_id: authData.user.id })
      .select('id')
      .single()

    if (accErr || !newAccount) {
      return NextResponse.json({ error: accErr?.message ?? 'Failed to create account' }, { status: 500 })
    }

    // Create billing with pay_per_lead plan
    await admin.from('billing').insert({
      account_id: newAccount.id,
      plan: 'pay_per_lead',
      credit_balance: 0,
      total_spent: 0,
    })

    // Clear setup token and mark as closed
    await admin.from('sales_leads').update({
      setup_token: null,
      status: 'closed',
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id)

    return NextResponse.json({ success: true, email: lead.email })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
