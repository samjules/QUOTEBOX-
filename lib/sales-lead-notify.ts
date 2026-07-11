import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000

function esc(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="background:#5b50d6;border-radius:14px 14px 0 0;padding:20px 28px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${esc(SITE_URL)}/quotebox_icon.png" alt="Quotebox" width="40" height="40" style="border-radius:9px;display:block;" />
            <div style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Quote<span style="color:#f4a93c;">.</span>Box</div>
          </div>
        </td></tr>
        <tr><td style="background:white;padding:32px 32px 28px;border-radius:0 0 14px 14px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 0 8px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="${esc(SITE_URL)}" style="color:#94a3b8;text-decoration:none;">quote-box.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function zoomButton(zoomJoinUrl: string | null, label: string): string {
  if (!zoomJoinUrl) return ''
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${esc(zoomJoinUrl)}" style="display:inline-block;background:#5b50d6;color:#ffffff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">${esc(label)}</a>
    </div>
  `
}

function buildConfirmationEmail(firstName: string, dateLabel: string, timeLabel: string, zoomJoinUrl: string | null): { subject: string; html: string } {
  const subject = `You're booked — ${dateLabel} at ${timeLabel} (Quotebox)`
  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#201d3d;">You're all set, ${esc(firstName)}!</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">
      Your call is booked for <strong>${esc(dateLabel)} at ${esc(timeLabel)} (Alaska Time)</strong>. We'll walk you through exactly how Quotebox would work for your business.
    </p>
    ${zoomButton(zoomJoinUrl, 'Save Your Zoom Link →')}
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
      We'll text you a reminder the day before. Need to reschedule? Just reply to this email.
    </p>
  `)
  return { subject, html }
}

function buildConfirmationSms(firstName: string, dateLabel: string, timeLabel: string, zoomJoinUrl: string | null): string {
  const zoomPart = zoomJoinUrl ? ` Zoom link: ${zoomJoinUrl}` : ''
  return `You're booked, ${firstName}! Quotebox call on ${dateLabel} at ${timeLabel} (Alaska Time).${zoomPart} We'll text a reminder the day before.`
}

function buildReminderEmail(firstName: string, dateLabel: string, timeLabel: string, zoomJoinUrl: string | null): { subject: string; html: string } {
  const subject = `Reminder: your Quotebox call is tomorrow at ${timeLabel}`
  const html = emailShell(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#201d3d;">See you tomorrow, ${esc(firstName)}!</h2>
    <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">
      Quick reminder — your Quotebox call is scheduled for <strong>${esc(dateLabel)} at ${esc(timeLabel)} (Alaska Time)</strong>.${zoomJoinUrl ? '' : " We'll call the number you booked with."}
    </p>
    ${zoomButton(zoomJoinUrl, 'Join Zoom Call →')}
  `)
  return { subject, html }
}

function buildReminderSms(firstName: string, timeLabel: string, zoomJoinUrl: string | null): string {
  const zoomPart = zoomJoinUrl ? ` Zoom link: ${zoomJoinUrl}` : ''
  return `Hey ${firstName} — reminder: your Quotebox call is tomorrow at ${timeLabel} (Alaska Time).${zoomPart} See you then!`
}

function dateLabelFor(scheduledDate: string): string {
  return new Date(scheduledDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// Fired immediately after a sales_leads row is booked (scheduled_date/time set).
export async function sendBookingConfirmation(lead: { id: string; name: string; email: string; phone: string | null; scheduled_date: string; scheduled_time: string; zoom_join_url?: string | null }) {
  const admin = createAdminClient()
  const firstName = lead.name.trim().split(/\s+/)[0] || 'there'
  const dateLabel = dateLabelFor(lead.scheduled_date)
  const timeLabel = lead.scheduled_time
  const zoomJoinUrl = lead.zoom_join_url ?? null

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Quotebox <hello@quote-box.com>'
  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const { subject, html } = buildConfirmationEmail(firstName, dateLabel, timeLabel, zoomJoinUrl)
      await resend.emails.send({ from, to: lead.email, subject, html })
    } catch (err) {
      console.error('Sales lead booking confirmation email error:', err)
    }
  }
  if (lead.phone) {
    await sendSms(lead.phone, buildConfirmationSms(firstName, dateLabel, timeLabel, zoomJoinUrl))
  }
  await admin.from('sales_leads').update({ confirmation_sent_at: new Date().toISOString() }).eq('id', lead.id)
}

// Cron: send a reminder for any booking inside the next 24h that hasn't been reminded yet.
export async function processSalesLeadReminders(): Promise<{ reminded: number }> {
  const admin = createAdminClient()
  const reminderCutoff = new Date(Date.now() + REMINDER_LEAD_MS).toISOString()

  const { data: due } = await admin
    .from('sales_leads')
    .select('id, name, email, phone, scheduled_date, scheduled_time, scheduled_at, zoom_join_url')
    .is('reminder_sent_at', null)
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', reminderCutoff)
    .gte('scheduled_at', new Date().toISOString())
    .limit(50)

  let reminded = 0
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Quotebox <hello@quote-box.com>'

  for (const lead of due ?? []) {
    const { data: claimed } = await admin
      .from('sales_leads')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', lead.id)
      .is('reminder_sent_at', null)
      .select('id')
      .single()
    if (!claimed) continue

    const firstName = lead.name.trim().split(/\s+/)[0] || 'there'
    const dateLabel = dateLabelFor(lead.scheduled_date)
    const timeLabel = lead.scheduled_time
    const zoomJoinUrl = lead.zoom_join_url ?? null

    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        const { subject, html } = buildReminderEmail(firstName, dateLabel, timeLabel, zoomJoinUrl)
        await resend.emails.send({ from, to: lead.email, subject, html })
      } catch (err) {
        console.error('Sales lead reminder email error:', err)
      }
    }
    if (lead.phone) {
      await sendSms(lead.phone, buildReminderSms(firstName, timeLabel, zoomJoinUrl))
    }
    reminded++
  }

  return { reminded }
}
