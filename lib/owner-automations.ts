import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const CALENDAR_URL = `${SITE_URL}/get-started`

interface EmailCopy {
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

function emailShell(businessName: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="background:#0e0020;border-radius:14px 14px 0 0;padding:24px 28px;">
          <div style="font-size:20px;font-weight:800;color:#ffe500;letter-spacing:-0.01em;">QuoteBox</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:5px;">Your leads. On autopilot.</div>
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

const WELCOME_DEFAULTS: EmailCopy = {
  subject: 'Welcome to QuoteBox, {{business}}!',
  heading: "You're officially in. 🎉",
  body: "Welcome to QuoteBox, <strong>{{business}}</strong>! Your account is live and ready to start capturing leads. To get you set up with ads and pulling in leads as fast as possible, let's book a quick call. I'll personally walk you through the setup and make sure your first campaign is dialed in.",
  outro: 'Takes 20 minutes. No fluff — just getting your ads live and generating leads.',
}

const NO_LEADS_DEFAULTS: EmailCopy = {
  subject: "{{business}} — still no leads yet?",
  heading: "I noticed you haven't gotten any leads yet",
  body: "Hey <strong>{{business}}</strong> — it's been a couple days and I don't see any leads coming in yet. That's totally normal at the start, but let's fix that. Book a free 20-minute consulting call and I'll help you figure out exactly what's holding things back — whether it's the ad setup, form copy, targeting, or something else entirely.",
  outro: 'No obligation — I just want to make sure QuoteBox is working for you.',
}

const WELCOME_SMS_DEFAULT = `Welcome to QuoteBox! 🎉 Your account is live. Book your free ad setup call and let's get leads coming in: ${CALENDAR_URL}`
const NO_LEADS_SMS_DEFAULT = `Hey! I noticed you haven't gotten any leads yet on QuoteBox. Need help? Book a free consulting call here: ${CALENDAR_URL}`

function interpolate(str: string, businessName: string) {
  return str.replace(/\{\{business\}\}/g, esc(businessName))
}

export function buildWelcomeEmail(businessName: string, custom: EmailCopy | null): { subject: string; html: string } {
  const c = { ...WELCOME_DEFAULTS, ...Object.fromEntries(Object.entries(custom ?? {}).filter(([, v]) => v)) }
  const subject = interpolate(c.subject!, businessName)
  const html = emailShell(businessName, `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${interpolate(c.heading!, businessName)}</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">${interpolate(c.body!, businessName)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${esc(CALENDAR_URL)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
        Book Your Free Ad Setup Call →
      </a>
    </div>
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${interpolate(c.outro!, businessName)}</p>
  `)
  return { subject, html }
}

export function buildNoLeadsEmail(businessName: string, custom: EmailCopy | null): { subject: string; html: string } {
  const c = { ...NO_LEADS_DEFAULTS, ...Object.fromEntries(Object.entries(custom ?? {}).filter(([, v]) => v)) }
  const subject = interpolate(c.subject!, businessName)
  const html = emailShell(businessName, `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${interpolate(c.heading!, businessName)}</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">${interpolate(c.body!, businessName)}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${esc(CALENDAR_URL)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
        Book a Free Consulting Call →
      </a>
    </div>
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${interpolate(c.outro!, businessName)}</p>
  `)
  return { subject, html }
}

export function buildWelcomeSms(custom: string | null): string {
  return custom || WELCOME_SMS_DEFAULT
}

export function buildNoLeadsSms(custom: string | null): string {
  return custom || NO_LEADS_SMS_DEFAULT
}

export { WELCOME_DEFAULTS, NO_LEADS_DEFAULTS, WELCOME_SMS_DEFAULT, NO_LEADS_SMS_DEFAULT }

export async function scheduleOwnerOnboarding(accountId: string) {
  const admin = createAdminClient()
  const now = new Date()
  const twoDaysLater = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  await admin.from('owner_onboarding_steps').upsert([
    { account_id: accountId, step: 'welcome', status: 'pending', scheduled_at: now.toISOString() },
    { account_id: accountId, step: 'no_leads_followup', status: 'pending', scheduled_at: twoDaysLater.toISOString() },
  ], { onConflict: 'account_id,step', ignoreDuplicates: true })
}

export async function processDueOwnerSteps(): Promise<number> {
  const admin = createAdminClient()

  const [{ data: dueSteps }, { data: cfg }] = await Promise.all([
    admin
      .from('owner_onboarding_steps')
      .select('id, account_id, step')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50),
    admin.from('owner_automation_config').select('*').eq('id', 1).single(),
  ])

  if (!dueSteps?.length) return 0

  let processed = 0
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'

  for (const step of dueSteps) {
    const { data: claimed } = await admin
      .from('owner_onboarding_steps')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', step.id)
      .eq('status', 'pending')
      .select('id')
      .single()

    if (!claimed) continue

    const { data: account } = await admin
      .from('accounts')
      .select('business_name, phone, owner_id')
      .eq('id', step.account_id)
      .single()

    if (!account) { processed++; continue }

    const { data: ownerUser } = await admin.auth.admin.getUserById(account.owner_id)
    const ownerEmail = ownerUser?.user?.email ?? null

    if (step.step === 'no_leads_followup') {
      const { count } = await admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', step.account_id)

      if ((count ?? 0) > 0) {
        await admin
          .from('owner_onboarding_steps')
          .update({ status: 'skipped', sent_at: new Date().toISOString() })
          .eq('id', step.id)
        processed++
        continue
      }
    }

    if (ownerEmail && apiKey) {
      const resend = new Resend(apiKey)
      const { subject, html } =
        step.step === 'welcome'
          ? buildWelcomeEmail(account.business_name, cfg?.welcome_email ?? null)
          : buildNoLeadsEmail(account.business_name, cfg?.no_leads_email ?? null)
      try {
        await resend.emails.send({ from, to: ownerEmail, subject, html })
      } catch (err) {
        console.error('Owner automation email error:', err)
      }
    }

    if (account.phone) {
      const msg = step.step === 'welcome'
        ? buildWelcomeSms(cfg?.welcome_sms ?? null)
        : buildNoLeadsSms(cfg?.no_leads_sms ?? null)
      await sendSms(account.phone, msg)
    }

    processed++
  }

  return processed
}
