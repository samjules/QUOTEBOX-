import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const CALENDAR_URL = `${SITE_URL}/setup`
const LOGIN_URL = `${SITE_URL}/dashboard`

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
// Step schedule — "The Pledge Path": every new /build account pledges a
// booked-jobs number before the account even exists (accounts.monthly_booking_goal).
// This 30-day, 22-touch sequence keeps that number in front of them and puts the
// $297 Consultation & Ad Setup right where the gap between pledged and booked opens up.
// ---------------------------------------------------------------------------

export const ONBOARDING_STEPS: { step: string; delay_ms: number }[] = [
  { step: 'pledge_day0_email',  delay_ms: 0 },
  { step: 'pledge_day0_sms',    delay_ms: 0 },
  { step: 'pledge_day1_email',  delay_ms: 1 * DAY },
  { step: 'pledge_day2_sms',    delay_ms: 2 * DAY },
  { step: 'pledge_day3_email',  delay_ms: 3 * DAY },
  { step: 'pledge_day4_sms',    delay_ms: 4 * DAY },
  { step: 'pledge_day5_email',  delay_ms: 5 * DAY },
  { step: 'pledge_day6_sms',    delay_ms: 6 * DAY },
  { step: 'pledge_day7_email',  delay_ms: 7 * DAY },
  { step: 'pledge_day9_sms',    delay_ms: 9 * DAY },
  { step: 'pledge_day10_email', delay_ms: 10 * DAY },
  { step: 'pledge_day12_sms',   delay_ms: 12 * DAY },
  { step: 'pledge_day14_email', delay_ms: 14 * DAY },
  { step: 'pledge_day16_sms',   delay_ms: 16 * DAY },
  { step: 'pledge_day18_email', delay_ms: 18 * DAY },
  { step: 'pledge_day20_sms',   delay_ms: 20 * DAY },
  { step: 'pledge_day21_email', delay_ms: 21 * DAY },
  { step: 'pledge_day24_sms',   delay_ms: 24 * DAY },
  { step: 'pledge_day25_email', delay_ms: 25 * DAY },
  { step: 'pledge_day27_sms',   delay_ms: 27 * DAY },
  { step: 'pledge_day28_email', delay_ms: 28 * DAY },
  { step: 'pledge_day30_email', delay_ms: 30 * DAY },
]

export const SMS_STEPS = new Set([
  'pledge_day0_sms', 'pledge_day2_sms', 'pledge_day4_sms', 'pledge_day6_sms',
  'pledge_day9_sms', 'pledge_day12_sms', 'pledge_day16_sms', 'pledge_day20_sms',
  'pledge_day24_sms', 'pledge_day27_sms',
])

const DEFAULT_PLEDGE = 10
const STOP = `\n\nReply STOP to opt out.`

function pcopy(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.65;">${p}</p>`).join('')
}

function statStrip(stats: { v: string; l: string }[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr>${stats.map((s) => (
    `<td align="center" style="padding:10px 6px;"><div style="font-size:20px;font-weight:800;color:#0e0020;">${esc(s.v)}</div><div style="font-size:10.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-top:2px;">${esc(s.l)}</div></td>`
  )).join('')}</tr></table>`
}

function pledgeEmail(opts: { greet: string; paragraphs: string[]; stats?: { v: string; l: string }[]; cta?: { label: string; url: string } }): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:#0e0020;font-weight:700;">${opts.greet}</p>${pcopy(opts.paragraphs)}${opts.stats ? statStrip(opts.stats) : ''}${opts.cta ? ctaButton(opts.cta.label, opts.cta.url) : ''}`
}

// ---------------------------------------------------------------------------
// Email builders — keyed by step name. pledgeCount/jobsBookedSoFar are live
// values pulled at send time (accounts.monthly_booking_goal, and a count of
// this account's 'booked' leads since signup) — default here only for the
// admin preview/test tools, which don't have a real account to read from.
// ---------------------------------------------------------------------------

export function buildEmailForStep(
  step: string,
  businessName: string,
  firstName: string,
  custom: EmailCopy | null,
  pledgeCount: number | null = DEFAULT_PLEDGE,
  jobsBookedSoFar: number = 3,
): { subject: string; html: string } | null {
  const fn = esc(firstName)
  const biz = esc(businessName)
  const pc = pledgeCount ?? DEFAULT_PLEDGE
  const jb = jobsBookedSoFar

  const configs: Record<string, { subject: string; html: string }> = {
    pledge_day0_email: {
      subject: `You just pledged ${pc} jobs. Let's make it real.`,
      html: emailShell(businessName, pledgeEmail({
        greet: `Hey ${fn},`,
        paragraphs: [
          `Before you even finished setting up <strong>${biz}</strong>, you told us something: you're booking ${pc} jobs this month.`,
          `We wrote it down. It's on your dashboard right now, sitting at the top where you'll see it every time you log in.`,
          `That's on purpose. A pledge that's easy to forget is just a guess. This one isn't going anywhere.`,
          `Your Quotebox account is live. Here's what to do in the next 10 minutes to start closing the gap between "pledged" and "booked."`,
        ],
        cta: { label: 'Set up my account →', url: LOGIN_URL },
      })),
    },

    pledge_day1_email: {
      subject: `3 things to turn on before your first lead comes in`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Every ${pc}-job month starts with your quote form actually catching leads instead of losing them to a callback.`,
          `Today, do these three things:<br>1. Finish your branded instant quote form — most owners are live in under 10 minutes<br>2. Confirm instant SMS + email follow-up is turned on for new leads<br>3. Connect your Meta ad account so every lead ties back to real spend`,
          `Businesses that finish this checklist in week one are the ones who hit their pledge. The ones who don't usually spend the whole month playing catch-up.`,
        ],
        cta: { label: 'Finish setup →', url: LOGIN_URL },
      })),
    },

    pledge_day3_email: {
      subject: `How Titan Tuff went from scattered leads to a full board`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Titan Tuff Moving in Clearwater started right where you are — a pledge, a fresh account, and a month to prove it out.`,
          `Their account now shows 685 leads captured, $111,811 in tracked pipeline, and a 2.88x return on ad spend. What changed things wasn't just the CRM — it was pairing it with a properly built ad account and a consultation that mapped their funnel to an actual pledge number, instead of guessing at targeting.`,
          `We do that exact setup for a small group of owners each month. More on that soon — for now, just know it's an option if week one feels slower than you'd like.`,
        ],
      })),
    },

    pledge_day5_email: {
      subject: `Your pledge tracker: ${jb} of ${pc} jobs booked`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Five days in, here's where things actually stand:`,
          `&rarr; Pledged: ${pc} jobs<br>&rarr; Booked so far: ${jb}<br>&rarr; Days left in the month: 25`,
          `At this pace, that gap doesn't close itself. It closes with more qualified leads reaching you, faster.`,
          `That's exactly what our $297 Consultation &amp; Ad Setup is for. One session, our team builds and launches your ad account around your actual pledge number, and configures Quotebox to catch and convert every lead it sends you. It's the fastest lever available to you this month.`,
        ],
        cta: { label: `See what's included →`, url: CALENDAR_URL },
      })),
    },

    pledge_day7_email: {
      subject: `One week in: the fastest way to hit ${pc} jobs this month`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `A week down. Here's the honest math: most owners who hit their pledge without help do it because they already had ad accounts running and lead flow figured out before day one.`,
          `If that's not you yet, the $297 Consultation &amp; Ad Setup gets you there in one sitting:<br>&rarr; A live strategy call mapped to your ${pc}-job goal<br>&rarr; Your ad account built and launched, not just audited<br>&rarr; Quotebox automations configured to convert what the ads send you`,
          `We only take a limited number of these each month so the builds stay hands-on. If you want this month to actually hit your number, now's the time.`,
        ],
        cta: { label: 'Book my $297 setup →', url: CALENDAR_URL },
      })),
    },

    pledge_day10_email: {
      subject: `"What actually happens in the $297 setup?"`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Fair question — here's exactly what you get:`,
          `1. A 30-minute call where we map your ${pc}-job pledge to a real ad budget and timeline<br>2. Your Meta ad account built and launched around your service area and pricing<br>3. Your Quotebox lead routing and follow-up sequences configured to match`,
          `The math most owners miss: one missed job usually costs more than $297. This pays for itself the first time it prevents a lead from slipping through.`,
        ],
        cta: { label: 'Book my setup call →', url: CALENDAR_URL },
      })),
    },

    pledge_day14_email: {
      subject: `Halfway through the month: ${jb} of ${pc}`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Fifteen days left. Here's the honest read on where you stand against your pledge:`,
          `If ${jb} is tracking close to half of ${pc}, you're on pace — keep doing exactly what you're doing.`,
          `If it's not, the math for the rest of the month gets tighter every day you wait. Owners who bring in the $297 Ad Setup &amp; Consultation at this point usually see it show up in bookings within the final two weeks, not months later.`,
          `This is the last natural checkpoint before "hitting your pledge" starts requiring a rush.`,
        ],
        cta: { label: 'Close the gap now →', url: CALENDAR_URL },
      })),
    },

    pledge_day18_email: {
      subject: `What changed for Titan Tuff after one call`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Titan Tuff Moving pledged a number that felt like a stretch. Two weeks in, they weren't close.`,
          `Before the setup call, their leads were sitting in a Facebook inbox for a day or two at a time. The call was simple: we rebuilt their ad targeting around the actual jobs they wanted (not just "moving leads"), got every quote request an instant reply, and gave them a clear line of sight from ad dollar to booked job.`,
        ],
        stats: [
          { v: '$111,811', l: 'pipeline value' },
          { v: '685', l: 'leads captured' },
          { v: '2.88x', l: 'return on ad spend' },
        ],
        cta: { label: 'See if it fits my pledge →', url: CALENDAR_URL },
      })),
    },

    pledge_day21_email: {
      subject: `9 days left to hit ${pc} jobs`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Nine days left in the month. You're at ${jb} of ${pc}.`,
          `At this point, the ad setup call stops being a "nice to have" and starts being the only lever with enough runway left to actually move the number before the month closes. Calls booked this week can usually get an ad account live within 48 hours.`,
          `We'd rather you hit this pledge than watch the calendar run out on it.`,
        ],
        cta: { label: 'Book before the month closes →', url: CALENDAR_URL },
      })),
    },

    pledge_day25_email: {
      subject: `Last call on this month's $297 setup slots`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `Five days left. We're closing this month's $297 Consultation &amp; Ad Setup slots on the 28th so every build we start still has time to actually run before the month ends.`,
          `If ${biz} is short of ${pc}, this is the last version of this offer that can still affect this month's number. After the 28th, it rolls into next month's pledge instead.`,
        ],
        cta: { label: 'Grab one of the last slots →', url: CALENDAR_URL },
      })),
    },

    pledge_day28_email: {
      subject: `Final reminder — setup slots close tonight`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `This is the last note before this month's $297 Consultation &amp; Ad Setup slots close.`,
          `If you've been meaning to book one, this is the moment. One click gets you on the calendar — we'll handle the rest.`,
        ],
        cta: { label: 'Book now →', url: CALENDAR_URL },
      })),
    },

    pledge_day30_email: {
      subject: `You pledged ${pc}. You booked ${jb}.`,
      html: emailShell(businessName, pledgeEmail({
        greet: `${fn},`,
        paragraphs: [
          `The month's closed. Here's the final tally against what you pledged on day one.`,
          `Whatever that number is, it's real data now — not a guess. Owners who came in short almost always point to the same thing afterward: lead flow, not effort.`,
          `Time to set next month's pledge. If you want this next one to run differently, the $297 Consultation &amp; Ad Setup carries forward — and this time, there's a full month ahead of it instead of behind it.`,
        ],
        cta: { label: `Set next month's pledge →`, url: LOGIN_URL },
      })),
    },

  }

  const result = configs[step]
  if (!result) return null
  return custom ? { ...result } : result
}

// ---------------------------------------------------------------------------
// SMS builders — keyed by step name
// ---------------------------------------------------------------------------

export function buildSmsForStep(
  step: string,
  firstName: string,
  businessName: string,
  pledgeCount: number | null = DEFAULT_PLEDGE,
  jobsBookedSoFar: number = 3,
): string | null {
  const pc = pledgeCount ?? DEFAULT_PLEDGE
  const jb = jobsBookedSoFar

  const msgs: Record<string, string> = {
    pledge_day0_sms: `Quotebox: Welcome, ${firstName} 🎉 Your pledge of ${pc} jobs this month is locked in on your dashboard. Log in here to get your first leads flowing: ${LOGIN_URL}${STOP}`,
    pledge_day2_sms: `Quotebox: Quick check — is your quote form live yet? Takes about 10 min and it's the difference between leads reaching you or not: ${LOGIN_URL}. Reply HELP if you're stuck.${STOP}`,
    pledge_day4_sms: `Quotebox: Pro tip — accounts that respond to leads in under 5 min book 3x more jobs. Your automations handle that for you if they're turned on. Check yours: ${LOGIN_URL}${STOP}`,
    pledge_day6_sms: `Quotebox: You're at ${jb}/${pc} jobs with 24 days left. Our $297 Ad Setup + Consultation is built to close that exact gap: ${CALENDAR_URL}${STOP}`,
    pledge_day9_sms: `Quotebox: "I figured I'd just run the ads myself" — most owners try that first. The ones who book their pledge usually don't. Worth 15 min to see why: ${CALENDAR_URL}${STOP}`,
    pledge_day12_sms: `Quotebox: A third of the month is gone. Where do you sit against your ${pc}-job pledge? Check your tracker: ${LOGIN_URL}${STOP}`,
    pledge_day16_sms: `Quotebox: Titan Tuff's ad setup call helped turn 685 leads into $111,811 in tracked pipeline at a 2.88x return. Yours is still open this month: ${CALENDAR_URL}${STOP}`,
    pledge_day20_sms: `Quotebox: Heads up — we only take a handful of $297 setup calls each month, and this month's slots are thinning out. If you want yours: ${CALENDAR_URL}${STOP}`,
    pledge_day24_sms: `Quotebox: One week left this month. ${jb}/${pc} booked. Last real window to get an ad setup live before it closes: ${CALENDAR_URL}${STOP}`,
    pledge_day27_sms: `Quotebox: 72 hours left on this month's ad setup slots. After that it rolls to next month's pledge: ${CALENDAR_URL}${STOP}`,
  }

  return msgs[step] ?? null
}

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

  const { data: dueSteps } = await admin
    .from('owner_onboarding_steps')
    .select('id, account_id, step')
    .in('status', ['pending'])
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50)

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
      .select('business_name, phone, owner_id, created_at, monthly_booking_goal')
      .eq('id', step.account_id)
      .single()

    if (!account) { processed++; continue }

    const { data: ownerUser } = await admin.auth.admin.getUserById(account.owner_id)
    const ownerEmail = ownerUser?.user?.email ?? null
    const firstName = resolveFirstName(
      (ownerUser?.user?.user_metadata as Record<string, unknown> | null) ?? null,
      account.business_name,
    )

    // Live pledge-tracker numbers — jobs booked since this account signed up,
    // read fresh at send time so every touch reflects where they actually stand.
    const pledgeCount: number | null = account.monthly_booking_goal ?? null
    const { count: bookedCount } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', step.account_id)
      .eq('status', 'booked')
      .gte('created_at', account.created_at)
    const jobsBookedSoFar = bookedCount ?? 0

    const isSmsStep = SMS_STEPS.has(step.step)

    if (isSmsStep) {
      // SMS-only step
      if (account.phone) {
        const msg = buildSmsForStep(step.step, firstName, account.business_name, pledgeCount, jobsBookedSoFar)
        if (msg) await sendSms(account.phone, msg)
      }
    } else {
      // Email step
      if (ownerEmail && apiKey) {
        const resend = new Resend(apiKey)
        const result = buildEmailForStep(step.step, account.business_name, firstName, null, pledgeCount, jobsBookedSoFar)
        if (result) {
          try {
            await resend.emails.send({ from, to: ownerEmail, subject: result.subject, html: result.html })
          } catch (err) {
            console.error('Owner automation email error:', err)
          }
        }
      }
    }

    processed++
  }

  return processed
}
