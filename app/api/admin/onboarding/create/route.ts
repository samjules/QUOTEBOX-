import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOnboardingInviteNotifications } from '@/lib/onboarding-invite'
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

  const { leadName, leadEmail, leadPhone } = await request.json() as { leadName: string; leadEmail: string; leadPhone?: string }
  if (!leadName?.trim() || !leadEmail?.trim()) {
    return NextResponse.json({ error: 'leadName and leadEmail are required' }, { status: 400 })
  }

  const email = leadEmail.trim().toLowerCase()
  const phone = leadPhone?.trim() || null
  const admin = createAdminClient()

  // Reuse an existing active invite for this email — calling this again for the
  // same lead is how "Send Link" / resend works, so always (re)send below.
  const { data: existing } = await admin
    .from('onboarding_sessions')
    .select('id, token, status')
    .eq('lead_email', email)
    .neq('status', 'form_built')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let token: string
  let sessionId: string
  let isExisting = false

  if (existing) {
    token = existing.token
    sessionId = existing.id
    isExisting = true
    // Keep phone in sync if it was added/changed on a resend
    if (phone) await admin.from('onboarding_sessions').update({ lead_phone: phone }).eq('id', existing.id)
  } else {
    token = crypto.randomBytes(24).toString('base64url')
    const { data: session, error } = await admin
      .from('onboarding_sessions')
      .insert({
        account_id: null,
        lead_name: leadName.trim(),
        lead_email: email,
        lead_phone: phone,
        token,
        status: 'pending',
        step_data: {},
        current_step: 1,
        created_by: user.id,
      })
      .select('id, token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    sessionId = session.id
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/onboarding/ppl/${token}`
  const { emailSent, smsSent } = await sendOnboardingInviteNotifications({
    leadName: leadName.trim(),
    leadEmail: email,
    leadPhone: phone,
    url,
  })

  return NextResponse.json({ url, token, sessionId, existing: isExisting, emailSent, smsSent })
}
