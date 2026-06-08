import nodemailer from 'nodemailer'
import { sendSms } from '@/lib/sms'

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildAutomationEmail(params: {
  name: string
  businessName: string
  formUrl: string | null
  step: 'initial_contact' | 'day1_followup' | 'discount_offer'
  discountPercent: number
  heroImageUrl?: string | null
  trackingPixelUrl?: string | null
  trackedFormUrl?: string | null
}): { subject: string; html: string } {
  const { name, businessName, formUrl, step, discountPercent, heroImageUrl, trackingPixelUrl, trackedFormUrl } = params
  const accentColor = '#4f46e5'
  const btnStyle = `display:inline-block;background:${accentColor};color:#fff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;`

  const ctaUrl = trackedFormUrl ?? formUrl
  const ctaBlock = ctaUrl
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${esc(ctaUrl)}" style="${btnStyle}">Get My Free Estimate →</a>
       </div>`
    : `<p style="color:#475569;font-size:14px;">Reply to this email and we'll get you sorted out right away.</p>`

  const heroBlock = heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${esc(heroImageUrl)}" alt="" width="520" style="width:100%;max-width:520px;display:block;border-radius:0;" /></td></tr>`
    : ''

  const pixelBlock = trackingPixelUrl
    ? `<img src="${esc(trackingPixelUrl)}" width="1" height="1" style="display:none;" alt="" />`
    : ''

  const configs = {
    initial_contact: {
      subject: `Hi ${name}, get your free estimate from ${businessName}`,
      heading: `We'd love to give you a free quote!`,
      body: `Thanks for reaching out to <strong>${esc(businessName)}</strong>! We saw your inquiry and want to make it easy for you to get an instant estimate — no phone calls needed, just answer a few quick questions.`,
      outro: `We'll follow up once you submit. Takes less than 2 minutes!`,
    },
    day1_followup: {
      subject: `Still need a quote? We're here, ${name}`,
      heading: `Just checking in!`,
      body: `We noticed you haven't had a chance to get your estimate from <strong>${esc(businessName)}</strong> yet — no worries, life gets busy! Whenever you're ready, your free estimate is just a click away.`,
      outro: `Questions? Just reply to this email — we're happy to help.`,
    },
    discount_offer: {
      subject: `${discountPercent}% off just for you, ${name}`,
      heading: `Here's an exclusive offer just for you`,
      body: `We really want to earn your business at <strong>${esc(businessName)}</strong>. As a thank-you for your interest, we're offering you <strong style="color:${accentColor};">${discountPercent}% off</strong> your first booking. Just mention this email when you reach out and we'll apply it automatically.`,
      outro: `This offer is just for you — grab it before it expires!`,
    },
  }

  const c = configs[step]

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="background:${accentColor};border-radius:${heroBlock ? '14px 14px 0 0' : '14px 14px 0 0'};padding:24px 28px;">
              <span style="font-family:Georgia,serif;font-size:18px;font-weight:900;color:#fff;letter-spacing:0.02em;">
                Quote<span style="color:#FFE500;">.</span>Box
              </span>
              <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;">
                on behalf of <strong style="color:#fff;">${esc(businessName)}</strong>
              </div>
            </td>
          </tr>
          ${heroBlock}
          <tr>
            <td style="background:white;padding:32px 32px 28px;border-radius:0 0 14px 14px;">
              <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Hi ${esc(name)},</p>
              <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">${esc(c.heading)}</h2>
              <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">${c.body}</p>
              ${ctaBlock}
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${esc(c.outro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Sent by <strong style="color:#94a3b8;">${esc(businessName)}</strong> via
                <a href="https://quote-box.com" style="color:#94a3b8;text-decoration:none;">Quote.Box</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  ${pixelBlock}
</body>
</html>`

  return { subject: c.subject, html }
}

export function buildSmsText(params: {
  name: string
  businessName: string
  formUrl: string | null
  step: 'initial_contact' | 'day1_followup' | 'discount_offer'
  discountPercent: number
}): string {
  const { name, businessName, formUrl, step, discountPercent } = params
  const link = formUrl ? ` ${formUrl}` : ''
  if (step === 'initial_contact')
    return `Hi ${name}! ${businessName} would love to give you a free instant estimate. Get yours here:${link}`
  if (step === 'day1_followup')
    return `Hey ${name}, still need a quote from ${businessName}? We're here whenever you're ready.${link}`
  return `Hi ${name}! ${businessName} is offering you ${discountPercent}% off your first booking. Mention this text when you reach out.${link}`
}

export async function sendAutomationStep(params: {
  email: string | null
  phone: string | null
  name: string
  businessName: string
  formUrl: string | null
  step: 'initial_contact' | 'day1_followup' | 'discount_offer'
  discountPercent: number
  leadId?: string | null
  accountId?: string | null
  heroImageUrl?: string | null
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
  const trackBase = `${siteUrl}/api/automations/track`

  const trackingPixelUrl = params.leadId && params.accountId
    ? `${trackBase}?e=o&a=${params.accountId}&l=${params.leadId}&s=${params.step}`
    : null

  const destinationUrl = params.formUrl
    ? params.step === 'discount_offer'
      ? `${params.formUrl}?automation_step=discount_offer&discount=${params.discountPercent}`
      : `${params.formUrl}?automation_step=${params.step}`
    : null

  const trackedFormUrl = params.leadId && params.accountId && destinationUrl
    ? `${trackBase}?e=c&a=${params.accountId}&l=${params.leadId}&s=${params.step}&r=${encodeURIComponent(destinationUrl)}`
    : null

  const emailParams = {
    name: params.name,
    businessName: params.businessName,
    formUrl: params.formUrl,
    step: params.step,
    discountPercent: params.discountPercent,
    heroImageUrl: params.heroImageUrl ?? null,
    trackingPixelUrl,
    trackedFormUrl,
  }

  if (params.email) {
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    if (gmailUser && gmailPass) {
      const { subject, html } = buildAutomationEmail(emailParams)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })
      try {
        await transporter.sendMail({ from: `"Quote.Box" <${gmailUser}>`, to: params.email, subject, html })
      } catch (err) {
        console.error('Automation email error:', err)
      }
    }
  }

  if (params.phone) {
    const smsText = buildSmsText(emailParams)
    await sendSms(params.phone, smsText)
  }
}
