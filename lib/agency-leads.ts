import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'

export interface EmailCopy {
  subject?: string
  heading?: string
  body?: string
  outro?: string
}

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function interpolate(str: string, name: string) {
  return str.replace(/\{\{name\}\}/g, esc(name))
}

function interpolatePlain(str: string, name: string) {
  return str.replace(/\{\{name\}\}/g, name)
}

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

export function buildAgencyLeadsEmail(firstName: string, copy: EmailCopy): { subject: string; html: string } {
  const subject = interpolate(copy.subject ?? '', firstName)
  const html = emailShell(`
    ${copy.heading ? `<h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${interpolate(copy.heading, firstName)}</h2>` : ''}
    ${copy.body ? `<p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">${interpolate(copy.body, firstName)}</p>` : ''}
    ${copy.outro ? `<p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${interpolate(copy.outro, firstName)}</p>` : ''}
  `)
  return { subject, html }
}

export function buildAgencyLeadsSms(firstName: string, sms: string): string {
  return interpolatePlain(sms, firstName)
}

function normalizeEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase()
  return e || null
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits
}

// Fires the "Agency Leads" automation for a new Meta ad lead or /demo booking.
// De-dupes across sources (Super-Lead style: same email OR phone) so a contact who
// comes in via both a Meta form and the /demo booking flow only gets messaged once.
// Nothing is sent (and no dedup record written) until copy is configured, so leads
// that arrive before you paste in a script remain eligible once you do.
export async function triggerAgencyLeadsAutomation(input: {
  name: string
  email: string | null
  phone: string | null
  source: 'meta' | 'demo'
}) {
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)
  if (!email && !phone) return

  const admin = createAdminClient()
  const { data: cfg } = await admin
    .from('owner_automation_config')
    .select('agency_leads_email, agency_leads_sms')
    .eq('id', 1)
    .single()

  const emailCopy = cfg?.agency_leads_email as EmailCopy | null
  const smsCopy = cfg?.agency_leads_sms as string | null
  const hasEmailCopy = !!(emailCopy?.subject && emailCopy?.body)
  const hasSmsCopy = !!smsCopy
  if (!hasEmailCopy && !hasSmsCopy) return

  const orParts: string[] = []
  if (email) orParts.push(`email.eq.${email}`)
  if (phone) orParts.push(`phone.eq.${phone}`)
  const { data: existing } = await admin
    .from('agency_lead_contacts')
    .select('id')
    .or(orParts.join(','))
    .limit(1)
  if (existing && existing.length > 0) return

  const firstName = input.name.trim().split(/\s+/)[0] || 'there'

  if (hasEmailCopy && email) {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
        const { subject, html } = buildAgencyLeadsEmail(firstName, emailCopy!)
        await resend.emails.send({ from, to: email, subject, html })
      } catch (err) {
        console.error('Agency Leads email error:', err)
      }
    }
  }

  if (hasSmsCopy && input.phone) {
    try {
      await sendSms(input.phone, buildAgencyLeadsSms(firstName, smsCopy!))
    } catch (err) {
      console.error('Agency Leads SMS error:', err)
    }
  }

  await admin.from('agency_lead_contacts').insert({
    name: input.name,
    email,
    phone,
    source: input.source,
  })
}
