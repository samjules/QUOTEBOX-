import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { token, name, password } = await request.json()

  if (!token || !name || !password) {
    return NextResponse.json({ error: 'Token, name, and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Look up invite
  const { data: member, error: lookupErr } = await admin
    .from('account_members')
    .select('id, account_id, email, accepted_at')
    .eq('invite_token', token)
    .single()

  if (lookupErr || !member) {
    return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })
  }

  if (member.accepted_at) {
    return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 409 })
  }

  // Create Supabase auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: member.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (authErr) {
    // If user already exists, try to link them
    if (authErr.message?.includes('already been registered')) {
      const { data: { users } } = await admin.auth.admin.listUsers()
      const existingUser = users.find(u => u.email === member.email)
      if (existingUser) {
        await admin
          .from('account_members')
          .update({
            user_id: existingUser.id,
            name,
            accepted_at: new Date().toISOString(),
            invite_token: null,
          })
          .eq('id', member.id)

        return NextResponse.json({ success: true })
      }
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  // Update account_members with user_id
  await admin
    .from('account_members')
    .update({
      user_id: authData.user.id,
      name,
      accepted_at: new Date().toISOString(),
      invite_token: null,
    })
    .eq('id', member.id)

  return NextResponse.json({ success: true })
}
