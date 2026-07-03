import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildEmailForStep,
  buildSmsForStep,
  buildWelcomeSms,
  SMS_STEPS,
} from '@/lib/owner-automations'
import {
  buildBookingConfirmationEmail,
  buildBookingConfirmationSms,
  buildReminderEmail,
  buildReminderSms,
  buildCancelledEmail,
} from '@/lib/free-trial'
import { buildAgencyLeadsEmail, buildAgencyLeadsSms } from '@/lib/agency-leads'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

const FT_PREVIEW_DATE = 'Monday, January 12'
const FT_PREVIEW_TIME = '11:00 AM'
const FT_PREVIEW_ZOOM = 'https://zoom.us/j/PREVIEW'

export async function GET(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const step = request.nextUrl.searchParams.get('step')
  if (!step) return NextResponse.json({ error: 'step required' }, { status: 400 })

  if (step.startsWith('ft_')) {
    let subject: string | null = null
    let html: string | null = null
    let sms: string | null = null

    if (step === 'ft_confirmation') {
      const r = buildBookingConfirmationEmail('Mike', FT_PREVIEW_DATE, FT_PREVIEW_TIME, FT_PREVIEW_ZOOM, null)
      subject = r.subject; html = r.html
      sms = buildBookingConfirmationSms('Mike', FT_PREVIEW_DATE, FT_PREVIEW_TIME, null)
    } else if (step === 'ft_reminder') {
      const r = buildReminderEmail('Mike', FT_PREVIEW_DATE, FT_PREVIEW_TIME, FT_PREVIEW_ZOOM, null)
      subject = r.subject; html = r.html
      sms = buildReminderSms('Mike', FT_PREVIEW_TIME, null)
    } else if (step === 'ft_cancelled') {
      const r = buildCancelledEmail('Mike', null)
      subject = r.subject; html = r.html
    }

    return NextResponse.json({ subject, html, sms })
  }

  if (step === 'agency_leads') {
    const admin = createAdminClient()
    const { data: cfg } = await admin.from('owner_automation_config').select('agency_leads_email, agency_leads_sms').eq('id', 1).single()
    const emailCopy = cfg?.agency_leads_email as { subject?: string; heading?: string; body?: string; outro?: string } | null
    const smsCopy = cfg?.agency_leads_sms as string | null
    const hasEmail = !!(emailCopy?.subject && emailCopy?.body)

    return NextResponse.json({
      subject: hasEmail ? buildAgencyLeadsEmail('Mike', emailCopy!).subject : null,
      html: hasEmail ? buildAgencyLeadsEmail('Mike', emailCopy!).html : '<p style="padding:24px;color:#94a3b8;font-family:sans-serif;">No email copy configured yet.</p>',
      sms: smsCopy ? buildAgencyLeadsSms('Mike', smsCopy) : null,
    })
  }

  const isSmsOnly = SMS_STEPS.has(step)
  const isWelcome = step === 'welcome'

  let subject: string | null = null
  let html: string | null = null
  let sms: string | null = null

  if (!isSmsOnly) {
    const result = buildEmailForStep(step, 'Acme Junk Removal', 'Mike', null)
    if (result) { subject = result.subject; html = result.html }
  }

  if (isSmsOnly || isWelcome) {
    sms = isWelcome
      ? buildWelcomeSms(null)
      : buildSmsForStep(step, 'Mike', 'Acme Junk Removal')
  }

  return NextResponse.json({ subject, html, sms })
}
