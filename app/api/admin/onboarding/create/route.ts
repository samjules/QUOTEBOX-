import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { accountId } = await request.json() as { accountId: string }
  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check for existing active session
  const { data: existing } = await admin
    .from('onboarding_sessions')
    .select('id, token, status')
    .eq('account_id', accountId)
    .in('status', ['pending', 'in_progress'])
    .limit(1)
    .single()

  if (existing) {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/onboarding/ppl/${existing.token}`
    return NextResponse.json({ url, token: existing.token, sessionId: existing.id, existing: true })
  }

  // Fetch business name for pre-fill
  const { data: account } = await admin
    .from('accounts')
    .select('business_name')
    .eq('id', accountId)
    .single()

  const token = crypto.randomBytes(24).toString('base64url')

  const { data: session, error } = await admin
    .from('onboarding_sessions')
    .insert({
      account_id: accountId,
      token,
      status: 'pending',
      step_data: account?.business_name ? { 1: { businessName: account.business_name } } : {},
      current_step: 1,
      created_by: user.id,
    })
    .select('id, token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/onboarding/ppl/${session.token}`
  return NextResponse.json({ url, token: session.token, sessionId: session.id })
}
