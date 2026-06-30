import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const CALENDAR_URL = `${SITE_URL}/get-started`

const H = 60 * 60 * 1000
const DAY = 24 * H

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
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
            <a href="${esc(SITE_URL)}" style="color:#94a3b8;text-decoration:none;">Quote.Box</a> — Turn clicks into customers, automatically.
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">
            You're receiving this because you created a QuoteBox account for <strong>${esc(businessName)}</strong>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${esc(url)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">${label}</a>
  </div>`
}

function emailBody(heading: string, body: string, outro: string, cta?: string): string {
  return `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0e0020;">${heading}</h2>
    <div style="font-size:15px;color:#334155;line-height:1.6;margin-bottom:20px;">${body}</div>
    ${cta ?? ''}
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${outro}</p>
  `
}

// ---------------------------------------------------------------------------
// Step schedule
// ---------------------------------------------------------------------------

export const ONBOARDING_STEPS: { step: string; delay_ms: number }[] = [
  { step: 'welcome',             delay_ms: 0 },
  { step: 'day1_sms_2h',        delay_ms: 2 * H },
  { step: 'day2_email',         delay_ms: 2 * DAY },
  { step: 'day3_sms',           delay_ms: 3 * DAY },
  { step: 'day4_email',         delay_ms: 4 * DAY },
  { step: 'day5_morning_email', delay_ms: 5 * DAY },
  { step: 'day5_afternoon_sms', delay_ms: 5 * DAY + 6 * H },
  { step: 'day7_email',         delay_ms: 7 * DAY },
  { step: 'day9_sms',           delay_ms: 9 * DAY },
  { step: 'day10_email',        delay_ms: 10 * DAY },
  { step: 'day12_email',        delay_ms: 12 * DAY },
  { step: 'day13_sms',          delay_ms: 13 * DAY },
  { step: 'day14_email',        delay_ms: 14 * DAY },
  { step: 'day14_sms',          delay_ms: 14 * DAY + 2 * H },
  { step: 'day15_email',        delay_ms: 15 * DAY },
  { step: 'day17_email',        delay_ms: 17 * DAY },
  { step: 'day19_sms',          delay_ms: 19 * DAY },
  { step: 'day21_email',        delay_ms: 21 * DAY },
  { step: 'day23_sms',          delay_ms: 23 * DAY },
  { step: 'day25_email',        delay_ms: 25 * DAY },
  { step: 'day28_email',        delay_ms: 28 * DAY },
  { step: 'day30_sms',          delay_ms: 30 * DAY },
]

const SMS_STEPS = new Set([
  'day1_sms_2h', 'day3_sms', 'day5_afternoon_sms', 'day9_sms',
  'day13_sms', 'day14_sms', 'day19_sms', 'day23_sms', 'day30_sms',
])

// ---------------------------------------------------------------------------
// Email builders — keyed by step name
// ---------------------------------------------------------------------------

export function buildEmailForStep(
  step: string,
  businessName: string,
  firstName: string,
  custom: EmailCopy | null,
): { subject: string; html: string } | null {
  const hi = `Hi ${esc(firstName)},`
  const biz = esc(businessName)
  const cta = ctaButton('Book Your Free Strategy Call →', CALENDAR_URL)

  const configs: Record<string, { subject: string; html: string }> = {
    welcome: buildWelcomeEmail(businessName, custom),

    day2_email: {
      subject: `The #1 mistake junk removal owners make with their leads`,
      html: emailShell(businessName, emailBody(
        'Most owners lose leads by responding too slowly.',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">When a potential customer submits a quote request, they're often shopping around. The business that responds first — wins. Studies show responding within 5 minutes increases conversions by 8x.</p>
         <p style="margin:0 0 12px;">The good news: your <strong>${biz}</strong> QuoteBox CRM already handles this automatically. The moment a lead submits your quote form, they get an instant email and (if opted in) an SMS — before your competitors even see the notification.</p>
         <p style="margin:0;">Your CRM is already set up to fix this. Log in and check your automation settings.</p>`,
        `Questions? Just reply to this email.`,
        ctaButton('Log In to Your CRM →', `${SITE_URL}/dashboard`),
      )),
    },

    day4_email: {
      subject: `How Mike's junk removal company booked 12 jobs in his first week`,
      html: emailShell(businessName, emailBody(
        "From scrambling for leads → consistent bookings",
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">Mike runs a junk removal company in the midwest. Before QuoteBox, he was juggling Facebook messages, missed calls, and a spreadsheet he updated maybe twice a week. Leads were slipping through the cracks daily.</p>
         <p style="margin:0 0 12px;">In his first week with QuoteBox, he set up his quote form, linked it to his Meta ad, and let the automation run. 12 booked jobs. His close rate went from around 20% to over 55% — just from following up faster and more consistently.</p>
         <p style="margin:0;">"I didn't change my prices or my ads. I just stopped losing leads I was already paying for."</p>`,
        `Want results like this? Book a free strategy call and we'll walk through your setup together.`,
        cta,
      )),
    },

    day5_morning_email: {
      subject: `Your CRM setup checklist (takes 10 minutes)`,
      html: emailShell(businessName, emailBody(
        'Get your CRM fully set up in 10 minutes',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">Here's a quick checklist to make sure your <strong>${biz}</strong> account is dialed in:</p>
         <ol style="margin:0 0 16px;padding-left:20px;line-height:2;">
           <li>Add your profile photo to your account</li>
           <li>Set your service area</li>
           <li>Add your pricing (even just a starting range)</li>
           <li>Customize your quote form headline</li>
           <li>Copy your booking link and add it to your bio or Google listing</li>
         </ol>
         <p style="margin:0;">Most owners who finish this checklist get their first lead within 48 hours.</p>`,
        `Need help finishing setup? Grab a free call and we'll do it together.`,
        cta,
      )),
    },

    day7_email: {
      subject: `3 ways moving companies are doubling their bookings right now`,
      html: emailShell(businessName, emailBody(
        '3 things the busiest moving companies are doing differently',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">Here are three things that are working right now for junk removal and moving businesses:</p>
         <p style="margin:0 0 8px;"><strong>1. Google My Business optimization</strong><br>Adding real job photos and responding to every review (even the bad ones) is moving companies up 3–5 spots in local search — for free.</p>
         <p style="margin:0 0 8px;"><strong>2. Referral automation</strong><br>Sending a simple "know anyone who needs a move?" text 3 days after every completed job. Earns 1–2 referral jobs per 10 completed jobs on average.</p>
         <p style="margin:0 0 12px;"><strong>3. Instant quote follow-up</strong><br>The businesses doing this right are using automated follow-up within the first hour. QuoteBox handles this for you automatically.</p>
         <p style="margin:0;">We can help you implement all three. Let's talk.</p>`,
        `Book a free strategy call and we'll build this out for your business.`,
        cta,
      )),
    },

    day10_email: {
      subject: `What your competitors are doing to stay fully booked`,
      html: emailShell(businessName, emailBody(
        "Here's what the fully-booked guys in your market are doing",
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">Businesses using a CRM to track and follow up on leads close significantly more jobs than those who don't. That's not a sales pitch — it's just what the data shows across thousands of service businesses.</p>
         <p style="margin:0 0 12px;">The ones staying fully booked aren't necessarily spending more on ads. They're just not losing the leads they're already generating. Every missed follow-up, every slow response, every un-answered inquiry — that's revenue walking to a competitor.</p>
         <p style="margin:0;">Your QuoteBox is already set up to prevent this. Want to see how your lead flow compares to top performers in your area?</p>`,
        `Book a free call to see how you stack up — and what to fix first.`,
        cta,
      )),
    },

    day12_email: {
      subject: `Behind the scenes: how we helped a moving company go from 4 to 20 jobs/month`,
      html: emailShell(businessName, emailBody(
        'From 4 to 20 jobs/month — here\'s exactly how',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">A moving company came to us doing about 4 jobs a month. Good reviews, decent ad budget, but leads were going cold before they could follow up.</p>
         <p style="margin:0 0 12px;">Here's what we built for them in one strategy call:</p>
         <ul style="margin:0 0 16px;padding-left:20px;line-height:1.9;">
           <li>A quote form with a clear, specific headline (conversion went up 40%)</li>
           <li>Automated email + SMS follow-up within 60 seconds of a new inquiry</li>
           <li>A 3-touch re-engagement sequence for leads who didn't book</li>
           <li>A simple referral ask sent 2 days after job completion</li>
         </ul>
         <p style="margin:0 0 12px;"><em>"Within 6 weeks we hit 20 jobs. I didn't change my prices, didn't increase my ad spend. We just stopped hemorrhaging leads."</em></p>
         <p style="margin:0;">We can build the same system for <strong>${biz}</strong>. Book a free call this week.</p>`,
        `It's a 20-minute call. No pitch, no pressure. Just your setup, reviewed.`,
        cta,
      )),
    },

    day14_email: {
      subject: `Quick question for you, ${firstName}`,
      html: emailShell(businessName, emailBody(
        `Quick question, ${esc(firstName)}`,
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">What's the biggest challenge you're facing with your business right now?</p>
         <p style="margin:0 0 8px;"><strong>A)</strong> Getting more leads in the door</p>
         <p style="margin:0 0 8px;"><strong>B)</strong> Following up fast enough before they go cold</p>
         <p style="margin:0 0 12px;"><strong>C)</strong> Closing quotes once leads come in</p>
         <p style="margin:0;">Just hit reply and let me know — it helps me point you toward the right resources, and I personally read every response.</p>`,
        `Either way, your QuoteBox CRM is ready to help with all three. Let's make it work harder for you.`,
        cta,
      )),
    },

    day15_email: {
      subject: `We set aside 5 spots this month for new Quotebox clients`,
      html: emailShell(businessName, emailBody(
        '5 free strategy call spots — this month only',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">We set aside a limited number of free strategy calls each month for new QuoteBox users. These aren't sales calls — here's exactly what we cover:</p>
         <ul style="margin:0 0 16px;padding-left:20px;line-height:1.9;">
           <li>A custom lead gen audit for <strong>${biz}</strong></li>
           <li>A review of your current CRM and form setup</li>
           <li>A 90-day growth plan tailored to your market</li>
         </ul>
         <p style="margin:0;">We only take on as many clients as we can actually help well. A few spots are still open this month.</p>`,
        `Claim your spot before they fill up.`,
        cta,
      )),
    },

    day17_email: {
      subject: `What happens on your free strategy call (exactly)`,
      html: emailShell(businessName, emailBody(
        "Here's exactly what happens on the call",
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">We know "free strategy call" can mean anything — so here's the actual agenda:</p>
         <p style="margin:0 0 8px;"><strong>First 5 min:</strong> You tell us about <strong>${biz}</strong> — market, volume, current setup.</p>
         <p style="margin:0 0 8px;"><strong>Next 10 min:</strong> We audit your current lead flow and find where you're losing jobs.</p>
         <p style="margin:0 0 12px;"><strong>Last 15 min:</strong> We build a custom action plan. What to fix, in what order, with what tools.</p>
         <p style="margin:0;">No pitch. No pressure. If QuoteBox isn't the right fit, we'll tell you — and point you somewhere that is. Total time: 30 minutes.</p>`,
        `Book your spot now. Calendar fills up mid-month.`,
        cta,
      )),
    },

    day21_email: {
      subject: `"I almost didn't book a call" — here's what happened`,
      html: emailShell(businessName, emailBody(
        '"I almost didn\'t book. Glad I did."',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">We hear this a lot. Here's what Sarah, who runs a moving company in Texas, told us after her call:</p>
         <blockquote style="margin:0 0 16px;padding:16px 20px;background:#f8fafc;border-left:3px solid #ffe500;border-radius:0 8px 8px 0;">
           <em>"I kept putting it off because I thought I didn't have time. The call was 25 minutes. By the end we had a plan. Within two weeks I was booking more jobs than the whole previous month."</em>
         </blockquote>
         <p style="margin:0;">The most common hesitation we hear: <em>"I don't have time right now."</em> That's exactly why the call is worth it — it saves time by cutting out what's not working and doubling down on what is.</p>`,
        `25 minutes. Real plan. Book your spot.`,
        cta,
      )),
    },

    day25_email: {
      subject: `Still thinking about it? Here's an honest breakdown`,
      html: emailShell(businessName, emailBody(
        "Still on the fence? Here's the honest version.",
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">I want to address the three things we hear most often at this point:</p>
         <p style="margin:0 0 8px;"><strong>"Too busy right now."</strong><br>We get it. The call is 20 minutes and the plan we give you will save you more time than it costs. But if now genuinely isn't the moment, that's okay.</p>
         <p style="margin:0 0 8px;"><strong>"Not sure it's worth it."</strong><br>Fair. The call is free. If it's not useful, you've lost 20 minutes. If it is, you could have a better system in place within a week.</p>
         <p style="margin:0 0 12px;"><strong>"Already tried ads and it didn't work."</strong><br>Ads alone rarely work. The follow-up and conversion system behind them is where most businesses fail. That's what we fix.</p>
         <p style="margin:0;">Your <strong>${biz}</strong> CRM is already live and working. The door is open whenever you're ready.</p>`,
        `No pressure. Book when you're ready — or just reply and let me know where you're at.`,
        cta,
      )),
    },

    day28_email: {
      subject: `The 3 things we'd do with your Quotebox account this month`,
      html: emailShell(businessName, emailBody(
        '3 things to do with your CRM this month (free tips)',
        `<p style="margin:0 0 12px;">${hi}</p>
         <p style="margin:0 0 12px;">Here are three high-impact moves you can make with your QuoteBox account right now — no call needed:</p>
         <p style="margin:0 0 8px;"><strong>1. Optimize your quote form headline</strong><br>Change it from generic ("Get a free quote") to specific ("See your moving cost in 60 seconds"). Typically lifts form starts by 20–40%.</p>
         <p style="margin:0 0 8px;"><strong>2. Set up a 3-step follow-up sequence</strong><br>Instant email → 24h follow-up → 48h offer. Your CRM can run this automatically for every new lead.</p>
         <p style="margin:0 0 12px;"><strong>3. Add a referral ask after each completed job</strong><br>A simple automated text 2 days after job completion: "Know anyone who needs a move?" Earns 1–2 referrals per 10 jobs on average.</p>
         <p style="margin:0;">These are free to implement on your own — or we can set them all up together on a call in under 20 minutes.</p>`,
        `Either way, your CRM is ready. Let's make it earn its keep.`,
        cta,
      )),
    },

    // Backward-compatible steps
    no_leads_followup: buildNoLeadsEmail(businessName, null),
  }

  const result = configs[step]
  if (!result) return null

  if (custom) {
    // Allow custom overrides for subject/html (admin config)
    return { ...result }
  }
  return result
}

// ---------------------------------------------------------------------------
// SMS builders — keyed by step name
// ---------------------------------------------------------------------------

export function buildSmsForStep(step: string, firstName: string, businessName: string): string | null {
  const link = CALENDAR_URL
  const greet = `Hey ${firstName}`

  const msgs: Record<string, string> = {
    day1_sms_2h: `${greet} — your Quotebox CRM is live 🎉 Got 5 min? Log in and grab your free lead capture link: ${SITE_URL}/dashboard`,
    day3_sms: `Quick tip: businesses that follow up within 5 min book 8x more jobs. Your Quotebox does that automatically. Want us to show you how? ${link}`,
    day5_afternoon_sms: `${greet} — did you get a chance to finish your CRM setup? Takes 10 min and your first lead could come in today: ${SITE_URL}/dashboard`,
    day9_sms: `Most junk removal owners don't know this: automated follow-up can recover 30–40% of leads who didn't book the first time. Want to see how your CRM handles it? ${link}`,
    day13_sms: `${greet} — we helped a moving company go from 4 to 20 jobs/month with their Quotebox setup. Want to see how? 15-min call, no pressure: ${link}`,
    day14_sms: `Hey — sent you a quick question by email. Would love your answer, it helps us help you better. Takes 30 seconds: ${link}`,
    day19_sms: `${greet}, only a few spots left for our free strategy calls this month. We go through your lead setup and build a 90-day plan together. Grab yours: ${link}`,
    day23_sms: `Last chance for this month's free strategy sessions, ${firstName}. Spots fill up fast — book here: ${link}. Takes 30 sec.`,
    day30_sms: `${greet} — wrapping up our onboarding series. Your CRM is still ready to generate leads. If you ever want to talk strategy, we're here: ${link}. No rush at all.`,
    // Backward-compatible
    no_leads_followup: buildNoLeadsSms(null),
  }

  return msgs[step] ?? null
}

// ---------------------------------------------------------------------------
// Legacy builders (kept for backward compatibility — used by admin test route)
// ---------------------------------------------------------------------------

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
    ${ctaButton('Book Your Free Ad Setup Call →', CALENDAR_URL)}
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
    ${ctaButton('Book a Free Consulting Call →', CALENDAR_URL)}
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

// ---------------------------------------------------------------------------
// Schedule the full 30-day sequence for a new account
// ---------------------------------------------------------------------------

export async function scheduleOwnerOnboarding(accountId: string) {
  const admin = createAdminClient()
  const now = new Date()

  const rows = ONBOARDING_STEPS.map(({ step, delay_ms }) => ({
    account_id: accountId,
    step,
    status: 'pending',
    scheduled_at: new Date(now.getTime() + delay_ms).toISOString(),
  }))

  await admin.from('owner_onboarding_steps').upsert(rows, {
    onConflict: 'account_id,step',
    ignoreDuplicates: true,
  })
}

// ---------------------------------------------------------------------------
// Cancel all pending steps for an account (call when owner books a strategy call)
// ---------------------------------------------------------------------------

export async function cancelOwnerSequence(accountId: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('owner_onboarding_steps')
    .update({ status: 'cancelled', sent_at: new Date().toISOString() })
    .eq('account_id', accountId)
    .eq('status', 'pending')
}

// ---------------------------------------------------------------------------
// Helper — extract a usable first name from account data
// ---------------------------------------------------------------------------

function resolveFirstName(userMetadata: Record<string, unknown> | null, businessName: string): string {
  const fullName = userMetadata?.full_name ?? userMetadata?.name
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0]
  }
  // Fall back to first word of business name
  const first = businessName.trim().split(/\s+/)[0]
  return first || 'there'
}

// ---------------------------------------------------------------------------
// Process due steps (called by cron)
// ---------------------------------------------------------------------------

export async function processDueOwnerSteps(): Promise<number> {
  const admin = createAdminClient()

  const [{ data: dueSteps }, { data: cfg }] = await Promise.all([
    admin
      .from('owner_onboarding_steps')
      .select('id, account_id, step')
      .in('status', ['pending'])
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
    // Atomically claim the step
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

    // Skip the no_leads_followup if the account already has leads (backward compat)
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

    const { data: ownerUser } = await admin.auth.admin.getUserById(account.owner_id)
    const ownerEmail = ownerUser?.user?.email ?? null
    const firstName = resolveFirstName(
      (ownerUser?.user?.user_metadata as Record<string, unknown> | null) ?? null,
      account.business_name,
    )

    const isSmsStep = SMS_STEPS.has(step.step)

    if (isSmsStep) {
      // SMS-only step
      if (account.phone) {
        const msg = buildSmsForStep(step.step, firstName, account.business_name)
        if (msg) await sendSms(account.phone, msg)
      }
    } else {
      // Email step (and optionally SMS for welcome)
      if (ownerEmail && apiKey) {
        const resend = new Resend(apiKey)
        const customCopy = step.step === 'welcome' ? (cfg?.welcome_email ?? null) : null
        const result = buildEmailForStep(step.step, account.business_name, firstName, customCopy)
        if (result) {
          try {
            await resend.emails.send({ from, to: ownerEmail, subject: result.subject, html: result.html })
          } catch (err) {
            console.error('Owner automation email error:', err)
          }
        }
      }

      // Welcome step also sends an SMS
      if (step.step === 'welcome' && account.phone) {
        const msg = buildWelcomeSms(cfg?.welcome_sms ?? null)
        await sendSms(account.phone, msg)
      }
    }

    processed++
  }

  return processed
}
