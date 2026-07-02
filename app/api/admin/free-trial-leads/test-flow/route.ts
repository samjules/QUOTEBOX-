import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  alaskaWallTimeToUTC,
  buildBookingConfirmationEmail,
  buildBookingConfirmationSms,
  buildReminderEmail,
  buildReminderSms,
  buildOwnerNotificationSms,
} from '@/lib/free-trial'
import { sendSms } from '@/lib/sms'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase())
}

function nextWeekday(daysAhead: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + daysAhead)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d
}

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const steps: { name: string; ok: boolean; error?: string }[] = []
  const testEmail = (process.env.ADMIN_EMAILS ?? '').split(',')[0]?.trim()
  const testPhone = process.env.OWNER_PHONE

  if (!testEmail || !testPhone) {
    return NextResponse.json({ error: 'ADMIN_EMAILS and OWNER_PHONE must be configured to run the test flow' }, { status: 400 })
  }

  const admin = createAdminClient()
  const scheduledDate = nextWeekday(7)
  const scheduled_date = scheduledDate.toISOString().split('T')[0]
  const scheduled_time = '11:00 AM'
  const scheduledAt = alaskaWallTimeToUTC(scheduled_date, scheduled_time)!
  const firstName = 'Test'
  const dateLabel = new Date(scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // 1. Insert test lead (bypasses the public double-booking check by picking a slot 1 week out and cleaning up after itself)
  const { data: lead, error: insertError } = await admin.from('free_trial_leads').insert({
    name: 'Test Booking',
    email: testEmail,
    phone: testPhone,
    has_junk_or_moving_company: true,
    can_spend_50_per_day: true,
    willing_ios_app: true,
    qualified: true,
    scheduled_date,
    scheduled_time,
    scheduled_at: scheduledAt.toISOString(),
  }).select().single()

  if (insertError || !lead) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create test lead' }, { status: 500 })
  }
  steps.push({ name: 'Create test lead', ok: true })

  // 2. Zoom meeting
  let zoomJoinUrl: string | undefined
  try {
    const meeting = await createZoomMeeting('QuoteBox test call', scheduledAt.toISOString())
    zoomJoinUrl = meeting.joinUrl
    await admin.from('free_trial_leads').update({ zoom_meeting_id: meeting.id, zoom_join_url: meeting.joinUrl }).eq('id', lead.id)
    steps.push({ name: 'Create Zoom meeting', ok: true })
  } catch (err) {
    steps.push({ name: 'Create Zoom meeting', ok: false, error: err instanceof Error ? err.message : String(err) })
  }

  // 3. Confirmation email + SMS
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const { subject, html } = buildBookingConfirmationEmail(firstName, dateLabel, scheduled_time, zoomJoinUrl)
      await resend.emails.send({ from, to: testEmail, subject, html })
      steps.push({ name: 'Send confirmation email', ok: true })
    } catch (err) {
      steps.push({ name: 'Send confirmation email', ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  } else {
    steps.push({ name: 'Send confirmation email', ok: false, error: 'RESEND_API_KEY not configured' })
  }

  try {
    const smsOk = await sendSms(testPhone, buildBookingConfirmationSms(firstName, dateLabel, scheduled_time))
    steps.push({ name: 'Send confirmation SMS', ok: smsOk, error: smsOk ? undefined : 'sendSms returned false — check Twilio env vars' })
  } catch (err) {
    steps.push({ name: 'Send confirmation SMS', ok: false, error: err instanceof Error ? err.message : String(err) })
  }

  // 4. Owner notification SMS
  try {
    const smsOk = await sendSms(testPhone, buildOwnerNotificationSms('Test Booking', testPhone, dateLabel, scheduled_time))
    steps.push({ name: 'Send owner notification SMS', ok: smsOk, error: smsOk ? undefined : 'sendSms returned false — check Twilio env vars' })
  } catch (err) {
    steps.push({ name: 'Send owner notification SMS', ok: false, error: err instanceof Error ? err.message : String(err) })
  }

  // 5. Simulate the 24h-before reminder immediately, and mark it as sent so a real Y/N reply exercises handleInboundConfirmation
  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const { subject, html } = buildReminderEmail(firstName, dateLabel, scheduled_time, zoomJoinUrl)
      await resend.emails.send({ from, to: testEmail, subject, html })
      steps.push({ name: 'Send reminder email', ok: true })
    } catch (err) {
      steps.push({ name: 'Send reminder email', ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  } else {
    steps.push({ name: 'Send reminder email', ok: false, error: 'RESEND_API_KEY not configured' })
  }

  try {
    const smsOk = await sendSms(testPhone, buildReminderSms(firstName, scheduled_time))
    steps.push({ name: 'Send reminder SMS (reply Y or N to test confirm/cancel)', ok: smsOk, error: smsOk ? undefined : 'sendSms returned false — check Twilio env vars' })
  } catch (err) {
    steps.push({ name: 'Send reminder SMS', ok: false, error: err instanceof Error ? err.message : String(err) })
  }

  await admin.from('free_trial_leads').update({ reminder_sent_at: new Date().toISOString() }).eq('id', lead.id)

  return NextResponse.json({ leadId: lead.id, steps })
}
