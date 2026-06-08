import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSms } from '@/lib/sms'
import nodemailer from 'nodemailer'

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildAutomationEmail(params: {
  name: string
  businessName: string
  formUrl: string | null
  step: 'initial_contact' | 'day1_followup' | 'discount_offer'
  discountPercent: number
}): { subject: string; html: string } {
  const { name, businessName, formUrl, step, discountPercent } = params
  const accentColor = '#4f46e5'
  const btnStyle = `display:inline-block;background:${accentColor};color:#fff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;`

  const ctaBlock = formUrl
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${esc(formUrl)}" style="${btnStyle}">Get My Free Estimate →</a>
       </div>`
    : `<p style="color:#475569;font-size:14px;">Reply to this email and we'll get you sorted out right away.</p>`

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
      subject: `${discountPercent}% off just for you, ${name} 🎉`,
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
            <td style="background:${accentColor};border-radius:14px 14px 0 0;padding:24px 28px;">
              <span style="font-family:Georgia,serif;font-size:18px;font-weight:900;color:#fff;letter-spacing:0.02em;">
                Quote<span style="color:#FFE500;">.</span>Box
              </span>
              <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;">
                on behalf of <strong style="color:#fff;">${esc(businessName)}</strong>
              </div>
            </td>
          </tr>

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
</body>
</html>`

  return { subject: c.subject, html }
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) return false

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  try {
    await transporter.sendMail({ from: `"Quote.Box" <${gmailUser}>`, to, subject, html })
    return true
  } catch (err) {
    console.error('Automation email error:', err)
    return false
  }
}

function buildSmsText(params: {
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

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'

  // Fetch all due pending steps
  const { data: dueSteps } = await admin
    .from('automation_steps')
    .select('id, lead_id, account_id, step')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (!dueSteps?.length) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const step of dueSteps) {
    // Atomically claim the step — prevents double-processing if cron overlaps
    const { data: claimed } = await admin
      .from('automation_steps')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', step.id)
      .eq('status', 'pending')
      .select('id')
      .single()

    if (!claimed) continue // already claimed by another run

    // Fetch lead
    const { data: lead } = await admin
      .from('leads')
      .select('name, email, phone, status')
      .eq('id', step.lead_id)
      .single()

    if (!lead) continue

    // Check if lead was already converted or lost — if so, skip all remaining steps
    const isConverted =
      lead.status === 'booked' ||
      lead.status === 'lost' ||
      (await checkFormCompletion(admin, step.account_id, step.lead_id, lead.email, lead.phone))

    if (isConverted) {
      // Mark all remaining pending steps for this lead as skipped
      await admin
        .from('automation_steps')
        .update({ status: 'skipped', sent_at: new Date().toISOString() })
        .eq('lead_id', step.lead_id)
        .eq('status', 'pending')
      processed++
      continue
    }

    // mark_lost: just update lead status
    if (step.step === 'mark_lost') {
      await admin
        .from('leads')
        .update({ status: 'lost' })
        .eq('id', step.lead_id)
      processed++
      continue
    }

    // Fetch account + automation config
    const { data: account } = await admin
      .from('accounts')
      .select('business_name')
      .eq('id', step.account_id)
      .single()

    const { data: automationConfig } = await admin
      .from('lead_automations')
      .select('discount_percent')
      .eq('account_id', step.account_id)
      .single()

    const discountPercent = automationConfig?.discount_percent ?? 10
    const businessName = account?.business_name || 'Your service provider'

    // Find the account's first active hosted form for the CTA link
    const { data: form } = await admin
      .from('hosted_forms')
      .select('form_config')
      .eq('account_id', step.account_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    const slug = (form?.form_config as { slug?: string } | null)?.slug
    const formUrl = slug ? `${siteUrl}/${slug}` : null

    const name = lead.name || 'there'
    const emailParams = {
      name,
      businessName,
      formUrl,
      step: step.step as 'initial_contact' | 'day1_followup' | 'discount_offer',
      discountPercent,
    }

    // Send email
    if (lead.email) {
      const { subject, html } = buildAutomationEmail(emailParams)
      await sendEmail(lead.email, subject, html)
    }

    // Send SMS
    if (lead.phone) {
      const smsText = buildSmsText(emailParams)
      await sendSms(lead.phone, smsText)
    }

    processed++
  }

  return NextResponse.json({ processed })
}

async function checkFormCompletion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  accountId: string,
  leadId: string,
  email: string | null,
  phone: string | null
): Promise<boolean> {
  if (!email && !phone) return false

  const orFilters: string[] = []
  if (email) orFilters.push(`email.eq.${email}`)
  if (phone) orFilters.push(`phone.eq.${phone}`)

  const { data: matchingLeads } = await admin
    .from('leads')
    .select('id')
    .eq('account_id', accountId)
    .neq('id', leadId)
    .neq('form_type', 'meta_lead_form')
    .or(orFilters.join(','))
    .limit(1)

  return (matchingLeads?.length ?? 0) > 0
}
