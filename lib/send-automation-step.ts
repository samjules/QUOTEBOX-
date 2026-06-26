import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface StepCopy {
  subject?: string
  heading?: string
  body?: string
  outro?: string
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
  accentColor?: string | null
  customCopy?: StepCopy | null
  hideCta?: boolean
}): { subject: string; html: string } {
  const { name, businessName, formUrl, step, discountPercent, heroImageUrl, trackingPixelUrl, trackedFormUrl } = params
  const accentColor = params.accentColor || '#5b50d6'
  const btnStyle = `display:inline-block;background:${accentColor};color:#fff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;`

  const ctaUrl = trackedFormUrl ?? formUrl
  const ctaBlock = params.hideCta
    ? ''
    : ctaUrl
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${esc(ctaUrl)}" style="${btnStyle}">Get My Free Estimate →</a>
       </div>`
    : `<p style="color:#475569;font-size:14px;">Get in touch with ${esc(businessName)} directly to get sorted out right away.</p>`

  const heroBlock = heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${esc(heroImageUrl)}" alt="" width="520" style="width:100%;max-width:520px;display:block;border-radius:0;" /></td></tr>`
    : ''

  const pixelBlock = trackingPixelUrl
    ? `<img src="${esc(trackingPixelUrl)}" width="1" height="1" style="display:none;" alt="" />`
    : ''

  const configs = {
    initial_contact: params.hideCta
      ? {
          subject: `Thanks for booking with ${businessName}!`,
          heading: `You're all set!`,
          body: `We've received your details at <strong>${esc(businessName)}</strong> and will be in touch with you shortly.`,
          outro: `Looking forward to working with you!`,
        }
      : {
          subject: `Hi ${name}, get your free estimate from ${businessName}`,
          heading: `We'd love to give you a free quote!`,
          body: `Thanks for reaching out to <strong>${esc(businessName)}</strong>! We saw your inquiry and want to make it easy for you to get an instant estimate — no phone calls needed, just answer a few quick questions.`,
          outro: `We'll follow up once you submit. Takes less than 2 minutes!`,
        },
    day1_followup: {
      subject: `Still need a quote? We're here, ${name}`,
      heading: `Just checking in!`,
      body: `We noticed you haven't had a chance to get your estimate from <strong>${esc(businessName)}</strong> yet — no worries, life gets busy! Whenever you're ready, your free estimate is just a click away.`,
      outro: `Questions? Contact ${businessName} directly — we're happy to help.`,
    },
    discount_offer: {
      subject: `${discountPercent}% off just for you, ${name}`,
      heading: `Here's an exclusive offer just for you`,
      body: `We really want to earn your business at <strong>${esc(businessName)}</strong>. As a thank-you for your interest, we're offering you <strong style="color:${accentColor};">${discountPercent}% off</strong> your first booking. Just mention this email when you reach out and we'll apply it automatically.`,
      outro: `This offer is just for you — grab it before it expires!`,
    },
  }

  const custom = params.customCopy ?? {}
  const c = {
    ...configs[step],
    ...(custom.subject  ? { subject:  custom.subject  } : {}),
    ...(custom.heading  ? { heading:  custom.heading  } : {}),
    ...(custom.body     ? { body:     custom.body     } : {}),
    ...(custom.outro    ? { outro:    custom.outro    } : {}),
  }

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
            <td style="background:${accentColor};border-radius:14px 14px 0 0;padding:24px 28px;">
              <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.01em;">
                ${esc(businessName)}
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:5px;letter-spacing:0.02em;">
                via <span style="font-family:Georgia,serif;font-weight:700;">Quote<span style="color:#FFE500;">.</span>Box</span>
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
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                Sent by <strong style="color:#94a3b8;">${esc(businessName)}</strong> via
                <a href="https://quote-box.com" style="color:#94a3b8;text-decoration:none;">Quote.Box</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated message — please do not reply to this email.</p>
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
  isFormLead?: boolean
}): string {
  const { name, businessName, formUrl, step, discountPercent } = params
  const link = formUrl ? ` ${formUrl}` : ''
  if (step === 'initial_contact') {
    if (params.isFormLead)
      return `Hi ${name}! Thanks for booking with ${businessName}. We'll be in touch with you shortly.`
    return `Hi ${name}! ${businessName} would love to give you a free instant estimate. Get yours here:${link}`
  }
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
  accentColor?: string | null
  customCopy?: StepCopy | null
  smsOptIn?: boolean
  formType?: string | null
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
  const trackBase = `${siteUrl}/api/automations/track`

  const trackingPixelUrl = params.leadId && params.accountId
    ? `${trackBase}?e=o&a=${params.accountId}&l=${params.leadId}&s=${params.step}`
    : null

  const destinationUrl = params.formUrl && params.leadId && params.accountId
    ? params.step === 'discount_offer'
      ? `${params.formUrl}?automation_step=discount_offer&discount=${params.discountPercent}&a=${params.accountId}&l=${params.leadId}`
      : `${params.formUrl}?automation_step=${params.step}&a=${params.accountId}&l=${params.leadId}`
    : params.formUrl

  const trackedFormUrl = params.leadId && params.accountId && destinationUrl
    ? `${trackBase}?e=c&a=${params.accountId}&l=${params.leadId}&s=${params.step}&r=${encodeURIComponent(destinationUrl)}`
    : null

  const isFormLead = params.formType !== 'meta_lead_form' && params.formType != null
  const hideCta = isFormLead && params.step === 'initial_contact'

  const emailParams = {
    name: params.name,
    businessName: params.businessName,
    formUrl: params.formUrl,
    step: params.step,
    discountPercent: params.discountPercent,
    heroImageUrl: params.heroImageUrl ?? null,
    accentColor: params.accentColor ?? null,
    customCopy: params.customCopy ?? null,
    trackingPixelUrl,
    trackedFormUrl,
    hideCta,
  }

  if (params.email) {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      const { subject, html } = buildAutomationEmail(emailParams)
      const from = process.env.RESEND_FROM_EMAIL || 'Quote.Box <noreply@quotebox-forms.com>'
      try {
        const { error } = await resend.emails.send({ from, to: params.email, subject, html })
        if (error) console.error('Resend error:', error)
      } catch (err) {
        console.error('Automation email error:', err)
      }
    } else {
      console.error('RESEND_API_KEY not set — email not sent')
    }
  }

  if (params.phone && params.smsOptIn) {
    const smsText = buildSmsText({ ...emailParams, isFormLead })
    await sendSms(params.phone, smsText)
  }
}
