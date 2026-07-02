import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'
import { createZoomMeeting, deleteZoomMeeting } from '@/lib/zoom'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const FALLBACK_ZOOM_URL = process.env.ZOOM_MEETING_URL || 'https://zoom.us/j/PLACEHOLDER'

const H = 60 * 60 * 1000
export const REMINDER_LEAD_MS = 24 * H
export const CANCEL_CUTOFF_MS = 12 * H

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Alaska wall-clock time -> UTC instant
// ---------------------------------------------------------------------------

function parseTime12h(time: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim())
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return { h, m }
}

function timeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const hour = map.hour === '24' ? '0' : map.hour
  const asUTC = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(hour), Number(map.minute), Number(map.second))
  return (asUTC - date.getTime()) / 60000
}

export function alaskaWallTimeToUTC(dateISO: string, time12h: string): Date | null {
  const t = parseTime12h(time12h)
  if (!t) return null
  const hh = String(t.h).padStart(2, '0')
  const mm = String(t.m).padStart(2, '0')
  const naiveUTC = new Date(`${dateISO}T${hh}:${mm}:00Z`)
  const offset = timeZoneOffsetMinutes('America/Anchorage', naiveUTC)
  return new Date(naiveUTC.getTime() - offset * 60000)
}

// ---------------------------------------------------------------------------
// Qualification
// ---------------------------------------------------------------------------

export interface QualificationAnswers {
  hasJunkOrMovingCompany: boolean
  canSpend50PerDay: boolean
  willingIosApp: boolean
}

export function isQualified(a: QualificationAnswers): boolean {
  return a.hasJunkOrMovingCompany && a.canSpend50PerDay && a.willingIosApp
}

// ---------------------------------------------------------------------------
// Email / SMS copy
// ---------------------------------------------------------------------------

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="background:#0e0020;border-radius:14px 14px 0 0;padding:20px 28px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${esc(SITE_URL)}/quotebox-icon.png" alt="QuoteBox" width="44" height="44" style="border-radius:10px;display:block;" />
            <div>
              <div style="font-size:18px;font-weight:800;color:#ffe500;letter-spacing:-0.01em;">QuoteBox</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Your leads. On autopilot.</div>
            </div>
          </div>
        </td></tr>
        <tr><td style="background:white;padding:32px 32px 28px;border-radius:0 0 14px 14px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 0 8px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="${esc(SITE_URL)}" style="color:#94a3b8;text-decoration:none;">Quote.Box</a> — Turn clicks into customers, automatically.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface EmailCopy {
  subject?: string
  heading?: string
  body?: string
  outro?: string
}

function interpolate(str: string, name: string, date: string, time: string) {
  return str
    .replace(/\{\{name\}\}/g, esc(name))
    .replace(/\{\{date\}\}/g, esc(date))
    .replace(/\{\{time\}\}/g, esc(time))
}

function interpolatePlain(str: string, name: string, date: string, time: string) {
  return str.replace(/\{\{name\}\}/g, name).replace(/\{\{date\}\}/g, date).replace(/\{\{time\}\}/g, time)
}

function mergeCopy<T extends EmailCopy>(defaults: T, custom: EmailCopy | null): T {
  return { ...defaults, ...Object.fromEntries(Object.entries(custom ?? {}).filter(([, v]) => v)) }
}

export const FT_REMINDER_EMAIL_DEFAULTS: EmailCopy = {
  subject: `Reminder: your QuoteBox Zoom call is tomorrow at {{time}}`,
  heading: `See you tomorrow, {{name}}!`,
  body: `Quick reminder — your free strategy call is scheduled for <strong>{{date}} at {{time}} (Alaska Time)</strong>.`,
  outro: `We just texted you too — reply <strong>Y</strong> to confirm you'll be there, or <strong>N</strong> if you need to reschedule. If we don't hear back, the spot will be released to another business.`,
}

export const FT_REMINDER_SMS_DEFAULT = `Hey {{name}} — reminder: your free QuoteBox strategy call is tomorrow at {{time}} (Alaska Time). Reply Y to confirm or N to cancel. If we don't hear back your spot will be released.`

export const FT_CONFIRMATION_EMAIL_DEFAULTS: EmailCopy = {
  subject: `You're booked — {{date}} at {{time}} (QuoteBox free trial)`,
  heading: `You're in, {{name}}!`,
  body: `Your free strategy call is booked for <strong>{{date}} at {{time}} (Alaska Time)</strong>. We'll send a reminder the day before.`,
  outro: `The day before your call, we'll text you to confirm — reply <strong>Y</strong> to keep your spot or <strong>N</strong> to cancel.`,
}

export const FT_CONFIRMATION_SMS_DEFAULT = `You're booked, {{name}}! Free QuoteBox strategy call on {{date}} at {{time}} (Alaska Time). We'll text you a reminder the day before to confirm.`

export const FT_CANCELLED_EMAIL_DEFAULTS: EmailCopy = {
  subject: `Your QuoteBox call has been released`,
  heading: `We released your spot, {{name}}`,
  body: `We didn't hear back to confirm your call, so we opened the spot up to another business. If you still want in on the free 14-day trial, grab a new time whenever works for you.`,
  outro: '',
}

export function buildReminderEmail(firstName: string, dateLabel: string, timeLabel: string, zoomUrl: string = FALLBACK_ZOOM_URL, custom: EmailCopy | null = null): { subject: string; html: string } {
  const c = mergeCopy(FT_REMINDER_EMAIL_DEFAULTS, custom)
  const subject = interpolate(c.subject!, firstName, dateLabel, timeLabel)
  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${interpolate(c.heading!, firstName, dateLabel, timeLabel)}</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">
      ${interpolate(c.body!, firstName, dateLabel, timeLabel)}
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${esc(zoomUrl)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">Join Zoom Call →</a>
    </div>
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
      ${interpolate(c.outro!, firstName, dateLabel, timeLabel)}
    </p>
  `)
  return { subject, html }
}

export function buildReminderSms(firstName: string, timeLabel: string, custom: string | null = null): string {
  return interpolatePlain(custom || FT_REMINDER_SMS_DEFAULT, firstName, '', timeLabel)
}

export function buildBookingConfirmationEmail(firstName: string, dateLabel: string, timeLabel: string, zoomUrl: string = FALLBACK_ZOOM_URL, custom: EmailCopy | null = null): { subject: string; html: string } {
  const c = mergeCopy(FT_CONFIRMATION_EMAIL_DEFAULTS, custom)
  const subject = interpolate(c.subject!, firstName, dateLabel, timeLabel)
  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${interpolate(c.heading!, firstName, dateLabel, timeLabel)}</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">
      ${interpolate(c.body!, firstName, dateLabel, timeLabel)}
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${esc(zoomUrl)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">Save Your Zoom Link →</a>
    </div>
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
      ${interpolate(c.outro!, firstName, dateLabel, timeLabel)}
    </p>
  `)
  return { subject, html }
}

export function buildBookingConfirmationSms(firstName: string, dateLabel: string, timeLabel: string, custom: string | null = null): string {
  return interpolatePlain(custom || FT_CONFIRMATION_SMS_DEFAULT, firstName, dateLabel, timeLabel)
}

export function buildOwnerNotificationSms(leadName: string, leadPhone: string, dateLabel: string, timeLabel: string): string {
  return `New booking: ${leadName} (${leadPhone}) — ${dateLabel} at ${timeLabel} (Alaska Time).`
}

export function buildCancelledEmail(firstName: string, custom: EmailCopy | null = null): { subject: string; html: string } {
  const c = mergeCopy(FT_CANCELLED_EMAIL_DEFAULTS, custom)
  const subject = interpolate(c.subject!, firstName, '', '')
  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${interpolate(c.heading!, firstName, '', '')}</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">
      ${interpolate(c.body!, firstName, '', '')}
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${esc(SITE_URL)}/free-trial" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">Book a New Time →</a>
    </div>
    ${c.outro ? `<p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${interpolate(c.outro, firstName, '', '')}</p>` : ''}
  `)
  return { subject, html }
}

// ---------------------------------------------------------------------------
// Cron: send 24h-before reminders, auto-cancel unconfirmed at 12h-before cutoff
// ---------------------------------------------------------------------------

export async function processFreeTrialReminders(): Promise<{ reminded: number; cancelled: number }> {
  const admin = createAdminClient()
  const now = Date.now()
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
  const { data: cfg } = await admin.from('owner_automation_config').select('*').eq('id', 1).single()

  let reminded = 0
  let cancelled = 0

  // 1. Send reminders for calls happening in <= 24h that haven't been reminded yet
  const reminderCutoff = new Date(now + REMINDER_LEAD_MS).toISOString()
  const { data: dueForReminder } = await admin
    .from('free_trial_leads')
    .select('*')
    .eq('status', 'pending_confirmation')
    .is('reminder_sent_at', null)
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', reminderCutoff)
    .limit(50)

  for (const lead of dueForReminder ?? []) {
    const { data: claimed } = await admin
      .from('free_trial_leads')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', lead.id)
      .is('reminder_sent_at', null)
      .select('id')
      .single()
    if (!claimed) continue

    const firstName = lead.name.trim().split(/\s+/)[0] || 'there'
    const dateLabel = lead.scheduled_date
      ? new Date(lead.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : ''
    const timeLabel = lead.scheduled_time ?? ''

    if (apiKey) {
      const resend = new Resend(apiKey)
      const { subject, html } = buildReminderEmail(firstName, dateLabel, timeLabel, lead.zoom_join_url || FALLBACK_ZOOM_URL, cfg?.ft_reminder_email ?? null)
      try {
        await resend.emails.send({ from, to: lead.email, subject, html })
      } catch (err) {
        console.error('Free trial reminder email error:', err)
      }
    }
    if (lead.phone) {
      await sendSms(lead.phone, buildReminderSms(firstName, timeLabel, cfg?.ft_reminder_sms ?? null))
    }
    reminded++
  }

  // 2. Auto-cancel leads that never confirmed and are inside the cancel cutoff window
  const cancelCutoff = new Date(now + CANCEL_CUTOFF_MS).toISOString()
  const { data: dueForCancel } = await admin
    .from('free_trial_leads')
    .select('*')
    .eq('status', 'pending_confirmation')
    .not('reminder_sent_at', 'is', null)
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', cancelCutoff)
    .limit(50)

  for (const lead of dueForCancel ?? []) {
    const { data: claimed } = await admin
      .from('free_trial_leads')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', lead.id)
      .eq('status', 'pending_confirmation')
      .select('id')
      .single()
    if (!claimed) continue

    if (lead.zoom_meeting_id) {
      try {
        await deleteZoomMeeting(lead.zoom_meeting_id)
      } catch (err) {
        console.error('Free trial auto-cancel Zoom delete error:', err)
      }
    }

    const firstName = lead.name.trim().split(/\s+/)[0] || 'there'
    if (apiKey) {
      const resend = new Resend(apiKey)
      const { subject, html } = buildCancelledEmail(firstName, cfg?.ft_cancelled_email ?? null)
      try {
        await resend.emails.send({ from, to: lead.email, subject, html })
      } catch (err) {
        console.error('Free trial cancel email error:', err)
      }
    }
    cancelled++
  }

  return { reminded, cancelled }
}

// ---------------------------------------------------------------------------
// Inbound SMS reply handling (Y/N)
// ---------------------------------------------------------------------------

export async function handleInboundConfirmation(fromPhone: string, body: string): Promise<boolean> {
  const digits = fromPhone.replace(/\D/g, '')
  const normalized = digits.startsWith('1') ? digits.slice(1) : digits
  const reply = body.trim().toUpperCase()
  if (reply !== 'Y' && reply !== 'N') return false

  const admin = createAdminClient()
  const { data: candidates } = await admin
    .from('free_trial_leads')
    .select('id, phone, zoom_meeting_id, zoom_join_url')
    .eq('status', 'pending_confirmation')
    .not('reminder_sent_at', 'is', null)

  const match = (candidates ?? []).find((c) => {
    const cDigits = (c.phone ?? '').replace(/\D/g, '')
    const cNormalized = cDigits.startsWith('1') ? cDigits.slice(1) : cDigits
    return cNormalized === normalized
  })
  if (!match) return false

  if (reply === 'Y') {
    await admin
      .from('free_trial_leads')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', match.id)
      .eq('status', 'pending_confirmation')
    await sendSms(fromPhone, `You're confirmed! See you on the Zoom call. Here's the link: ${match.zoom_join_url || FALLBACK_ZOOM_URL}`)
  } else {
    await admin
      .from('free_trial_leads')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', match.id)
      .eq('status', 'pending_confirmation')
    if (match.zoom_meeting_id) {
      try {
        await deleteZoomMeeting(match.zoom_meeting_id)
      } catch (err) {
        console.error('Free trial inbound-cancel Zoom delete error:', err)
      }
    }
    await sendSms(fromPhone, `No problem — your call has been cancelled. Book a new time anytime: ${SITE_URL}/free-trial`)
  }
  return true
}
