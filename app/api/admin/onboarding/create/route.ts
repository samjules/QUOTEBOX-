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

  const { leadName, leadEmail } = await request.json() as { leadName: string; leadEmail: string }
  if (!leadName?.trim() || !leadEmail?.trim()) {
    return NextResponse.json({ error: 'leadName and leadEmail are required' }, { status: 400 })
  }

  const email = leadEmail.trim().toLowerCase()
  const admin = createAdminClient()

  // Check for an existing active invite for this email (don't spam duplicates)
  const { data: existing } = await admin
    .from('onboarding_sessions')
    .select('id, token, status')
    .eq('lead_email', email)
    .neq('status', 'form_built')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/onboarding/ppl/${existing.token}`
    return NextResponse.json({ url, token: existing.token, sessionId: existing.id, existing: true })
  }

  const token = crypto.randomBytes(24).toString('base64url')

  const { data: session, error } = await admin
    .from('onboarding_sessions')
    .insert({
      account_id: null,
      lead_name: leadName.trim(),
      lead_email: email,
      token,
      status: 'pending',
      step_data: {},
      current_step: 1,
      created_by: user.id,
    })
    .select('id, token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/onboarding/ppl/${session.token}`
  return NextResponse.json({ url, token: session.token, sessionId: session.id })
}
