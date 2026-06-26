import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const CALENDAR_URL = `${SITE_URL}/get-started`

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildWelcomeEmail(businessName: string): { subject: string; html: string } {
  const subject = `Welcome to QuoteBox, ${businessName}!`
  const html = `<!DOCTYPE html>
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
          <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">You're officially in. 🎉</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
            Welcome to QuoteBox, <strong>${esc(businessName)}</strong>! Your account is live and ready to start capturing leads.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
            To get you set up with ads and pulling in leads as fast as possible, let's book a quick call. I'll personally walk you through the setup and make sure your first campaign is dialed in.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${esc(CALENDAR_URL)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
              Book Your Free Ad Setup Call →
            </a>
          </div>
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
            Takes 20 minutes. No fluff — just getting your ads live and generating leads.
          </p>
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
  return { subject, html }
}

function buildNoLeadsEmail(businessName: string): { subject: string; html: string } {
  const subject = `${businessName} — still no leads yet?`
  const html = `<!DOCTYPE html>
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
          <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">I noticed you haven't gotten any leads yet</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
            Hey <strong>${esc(businessName)}</strong> — it's been a couple days and I don't see any leads coming in yet. That's totally normal at the start, but let's fix that.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
            Book a free 20-minute consulting call and I'll help you figure out exactly what's holding things back — whether it's the ad setup, form copy, targeting, or something else entirely.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${esc(CALENDAR_URL)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
              Book a Free Consulting Call →
            </a>
          </div>
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
            No obligation — I just want to make sure QuoteBox is working for you.
          </p>
        </td></tr>
        <tr><td style="padding:20px 0 8px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="${esc(SITE_URL)}" style="color:#94a3b8;text-decoration:none;">Quote.Box</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  return { subject, html }
}

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

  const { data: dueSteps } = await admin
    .from('owner_onboarding_steps')
    .select('id, account_id, step')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50)

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
      .select('business_name, phone')
      .eq('id', step.account_id)
      .single()

    if (!account) { processed++; continue }

    const { data: ownerUser } = await admin.auth.admin.getUserById(
      (await admin.from('accounts').select('owner_id').eq('id', step.account_id).single()).data?.owner_id ?? ''
    )
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
          ? buildWelcomeEmail(account.business_name)
          : buildNoLeadsEmail(account.business_name)
      try {
        await resend.emails.send({ from, to: ownerEmail, subject, html })
      } catch (err) {
        console.error('Owner automation email error:', err)
      }
    }

    if (account.phone) {
      const msg =
        step.step === 'welcome'
          ? `Welcome to QuoteBox! 🎉 Your account is live. Book your free ad setup call and let's get leads coming in: ${CALENDAR_URL}`
          : `Hey! I noticed you haven't gotten any leads yet on QuoteBox. Need help? Book a free consulting call here: ${CALENDAR_URL}`
      await sendSms(account.phone, msg)
    }

    processed++
  }

  return processed
}
