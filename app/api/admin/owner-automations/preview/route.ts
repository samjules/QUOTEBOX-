import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildEmailForStep,
  buildSmsForStep,
  SMS_STEPS,
} from '@/lib/owner-automations'
import {
  buildBookingConfirmationEmail,
  buildBookingConfirmationSms,
  buildReminderEmail,
  buildReminderSms,
  buildCancelledEmail,
} from '@/lib/free-trial'
import { buildAgencyEmailForStep, buildAgencySmsForStep } from '@/lib/agency-leads'

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

  if (step.startsWith('agency_')) {
    const result = buildAgencyEmailForStep(step, 'Mike')
    const sms = buildAgencySmsForStep(step, 'Mike')
    return NextResponse.json({
      subject: result?.subject ?? null,
      html: result?.html ?? null,
      sms,
    })
  }

  const isSmsOnly = SMS_STEPS.has(step)

  let subject: string | null = null
  let html: string | null = null
  let sms: string | null = null

  if (!isSmsOnly) {
    const result = buildEmailForStep(step, 'Acme Junk Removal', 'Mike', null)
    if (result) { subject = result.subject; html = result.html }
  }

  if (isSmsOnly) {
    sms = buildSmsForStep(step, 'Mike', 'Acme Junk Removal')
  }

  return NextResponse.json({ subject, html, sms })
}
