import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
const BOOKING_LINK = `${SITE_URL}/demo`
const STOP = `\n\nReply STOP to opt out.`

const H = 60 * 60 * 1000
const DAY = 24 * H

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function ctaButton(label: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${esc(url)}" style="display:inline-block;background:#0e0020;color:#ffe500;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">${label}</a>
  </div>`
}

// ---------------------------------------------------------------------------
// 30-day / 16-touch nurture sequence — see quotebox-demo-nurture-30day.md
// Audience: Meta ad leads + /demo bookings. One story, one voice (Sam), only
// {{first_name}} is personalized. Booking link always points to /demo.
// ---------------------------------------------------------------------------

export const AGENCY_LEAD_STEPS: { step: string; delayMs: number; channel: 'email' | 'sms'; label: string }[] = [
  { step: 'agency_day0_email', delayMs: 0, channel: 'email', label: 'Day 0 · Instant Email' },
  { step: 'agency_day0_sms', delayMs: 10 * 60 * 1000, channel: 'sms', label: 'Day 0 · +10min SMS' },
  { step: 'agency_day1_sms', delayMs: 1 * DAY, channel: 'sms', label: 'Day 1 · SMS' },
  { step: 'agency_day2_email', delayMs: 2 * DAY, channel: 'email', label: 'Day 2 · Founder Note' },
  { step: 'agency_day4_email', delayMs: 4 * DAY, channel: 'email', label: 'Day 4 · Customer Story' },
  { step: 'agency_day5_sms', delayMs: 5 * DAY, channel: 'sms', label: 'Day 5 · SMS' },
  { step: 'agency_day7_email', delayMs: 7 * DAY, channel: 'email', label: 'Day 7 · Feature Spotlight' },
  { step: 'agency_day9_sms', delayMs: 9 * DAY, channel: 'sms', label: 'Day 9 · Social Proof' },
  { step: 'agency_day11_email', delayMs: 11 * DAY, channel: 'email', label: 'Day 11 · ROI Framing' },
  { step: 'agency_day13_sms', delayMs: 13 * DAY, channel: 'sms', label: 'Day 13 · SMS' },
  { step: 'agency_day16_email', delayMs: 16 * DAY, channel: 'email', label: 'Day 16 · Objection Handling' },
  { step: 'agency_day19_email', delayMs: 19 * DAY, channel: 'email', label: 'Day 19 · Testimonial' },
  { step: 'agency_day22_sms', delayMs: 22 * DAY, channel: 'sms', label: 'Day 22 · Low-Pressure Check-in' },
  { step: 'agency_day25_email', delayMs: 25 * DAY, channel: 'email', label: 'Day 25 · Urgency' },
  { step: 'agency_day28_sms', delayMs: 28 * DAY, channel: 'sms', label: 'Day 28 · Last Nudge' },
  { step: 'agency_day30_email', delayMs: 30 * DAY, channel: 'email', label: 'Day 30 · Breakup' },
]

export function buildAgencyEmailForStep(step: string, firstName: string): { subject: string; html: string } | null {
  const name = esc(firstName)
  const link = BOOKING_LINK

  switch (step) {
    case 'agency_day0_email':
      return {
        subject: `Got your request — here's your link, ${firstName}`,
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Hey ${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Thanks for checking out Quotebox. I saw your demo request come in — appreciate you taking the time.</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Here's the fastest way to see it: grab a Zoom slot and I'll walk you through exactly how moving and junk removal companies are moving past door hangers and word-of-mouth into a steady, predictable flow of leads — delivered straight to your phone through the Quotebox app, with an instant quote form that hands customers an estimate on the spot so they can book with you before they even think about calling around.</p>
          ${ctaButton('Book your 20-minute Zoom demo →', link)}
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Heads up — I only run demos over Zoom, 11:00 AM–1:00 PM Alaska time, so those slots go quick.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">No pitch deck, no fluff — just a screen share of the actual product and answers to whatever's on your mind.</p>
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Talk soon,<br/>Sam<br/>Quotebox</p>
        `),
      }
    case 'agency_day2_email':
      return {
        subject: 'Why I built Quotebox',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Quick one from me, no booking link this time (well — one at the bottom, but that's not the point).</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">I built Quotebox because I kept hearing the same thing from moving and junk removal companies: they were stuck relying on door hangers, word of mouth, and the occasional Facebook post to keep work coming in — no predictability, no real pipeline. And when a lead did come in, there was nothing stopping them from getting three other quotes before they even saw the message.</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Quotebox exists to fix both problems. A steady flow of leads to your phone through the app, an instant quote form that gets customers a real estimate — and the chance to book with you — right away, and a dashboard that tells you what's working instead of you guessing.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">If that resonates, I'd rather show you than tell you.</p>
          ${ctaButton('Grab 20 minutes on Zoom →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day4_email':
      return {
        subject: 'How Titan Tuff Moving stopped relying on door hangers',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">For a while, Titan Tuff Moving — a moving company out of Clearwater, Florida — was doing it the way a lot of movers start out: door hangers, word of mouth, the occasional Facebook post when things were slow. It worked, but it wasn't predictable. Some weeks the phone rang, some weeks it didn't.</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">After switching to Quotebox, that changed. Instead of chasing leads one post at a time, Titan Tuff started getting a steady stream of jobs coming in through an instant quote form — customers fill it out, get a real estimate right away, and can book on the spot instead of shopping around to three other movers first. With the Quotebox iOS app, every new lead lands straight on their phone, so nobody's sitting at a desk waiting to check email.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">The short version: they went from hustling for the next job to having a real pipeline.</p>
          ${ctaButton('See how it’d work for your business →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day7_email':
      return {
        subject: 'The 5-minute version of what Quotebox does',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Since a demo is a bigger ask than 5 minutes of reading, here's the short version of what you'd actually see on the call:</p>
          <ul style="margin:0 0 12px;padding-left:20px;font-size:15px;color:#334155;line-height:1.7;">
            <li><strong>Steady lead flow</strong> — stop relying on door hangers and Facebook posts; leads come in consistently</li>
            <li><strong>Instant quote form</strong> — customers get a real estimate on the spot and can book before they think to call around</li>
            <li><strong>Leads to your phone</strong> — the Quotebox iOS app puts every new lead in your pocket, no desk required</li>
            <li><strong>One dashboard</strong> — see every lead, quote, and booking status without digging through texts, calls, and spreadsheets</li>
          </ul>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">None of this is theoretical — it's the actual product, running live, for moving and junk removal companies doing this work every day.</p>
          ${ctaButton('See it live on Zoom →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day11_email':
      return {
        subject: 'What one extra booked job a week is worth',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Rough math, but it holds up: if a steady lead flow and an instant quote form gets your business even one extra booked job a week — one that would've otherwise gone to whichever competitor got there first — what's that worth over a year?</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">For most moving and junk removal companies, that number makes the decision pretty easy — and it's the exact thing Quotebox is built to deliver.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">Happy to run the numbers with you directly on a quick call.</p>
          ${ctaButton('Book 20 minutes on Zoom →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day16_email':
      return {
        subject: '"I don’t have time for another tool right now"',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">I hear this a lot, so let me address it directly: Quotebox isn't another thing to manage — it replaces the manual back-and-forth you're already doing across texts, calls, and spreadsheets.</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Most owners are fully set up within a day, and the demo itself is 20 minutes on Zoom — not a sales pitch, just a look at whether it actually fits how your business operates.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">If it's not a fit, you'll know by the end of the call. No hard sell.</p>
          ${ctaButton('Grab a time →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day19_email':
      return {
        subject: 'In their words',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Rather than tell you more about Quotebox myself, here's the team at Titan Tuff Moving in Clearwater on what changed after they started using it.</p>
          ${ctaButton('Watch the 90-second clip →', link)}
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">If what they describe sounds familiar, let's get you on the calendar.</p>
          ${ctaButton('Book 20 minutes on Zoom →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day25_email':
      return {
        subject: 'Zoom slots this week are almost gone',
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Just a heads up — I only run demos over Zoom, 11:00 AM–1:00 PM Alaska time, and that window fills up fast every week.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">If you've been meaning to take a look at Quotebox, this is a good week to grab one of the remaining spots before they're gone.</p>
          ${ctaButton('Book a Zoom slot →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Sam</p>
        `),
      }
    case 'agency_day30_email':
      return {
        subject: `Should I close your file, ${firstName}?`,
        html: emailShell(`
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${name},</p>
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">I've reached out a handful of times about getting you set up with Quotebox and haven't heard back — totally fine, timing isn't always right.</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">I'll stop reaching out for now. If things change and you want to take a look, the link below is always open — same Zoom window, 11:00 AM–1:00 PM Alaska time:</p>
          ${ctaButton('Book a demo →', link)}
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Either way, appreciate you checking us out.<br/>Sam<br/>Quotebox</p>
        `),
      }
    default:
      return null
  }
}

export function buildAgencySmsForStep(step: string, firstName: string): string | null {
  const link = BOOKING_LINK
  switch (step) {
    case 'agency_day0_sms':
      return `Hey ${firstName}, it's Sam with Quotebox — got your demo request. Zoom slots are 11am-1pm AK time and go fast: ${link}${STOP}`
    case 'agency_day1_sms':
      return `${firstName}, still time to grab a Zoom spot (11am-1pm AK time) if you want to see how Quotebox turns door hangers and Facebook posts into a steady lead flow: ${link}${STOP}`
    case 'agency_day5_sms':
      return `${firstName}, quick reminder — still holding a few Zoom slots this week (11am-1pm AK time): ${link}${STOP}`
    case 'agency_day9_sms':
      return `${firstName}, most moving and junk removal companies tell us the biggest surprise is how steady their lead flow gets once Quotebox is running — no more relying on door hangers. Worth a look: ${link}${STOP}`
    case 'agency_day13_sms':
      return `${firstName}, still want to grab you 20 min on Zoom (11am-1pm AK time) to walk through Quotebox? Link here: ${link}${STOP}`
    case 'agency_day22_sms':
      return `${firstName}, no pressure — link's still open whenever you're ready to take a look at Quotebox: ${link}${STOP}`
    case 'agency_day28_sms':
      return `${firstName}, last nudge from me — a couple Zoom slots left this week (11am-1pm AK time): ${link}${STOP}`
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Contact matching (Super-Lead style: email OR phone, normalized)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Enrollment — dedupes across Meta + /demo, schedules all 16 steps
// ---------------------------------------------------------------------------

export async function enrollAgencyLead(input: {
  name: string
  email: string | null
  phone: string | null
  source: 'meta' | 'demo'
  enrolledAt?: Date
}): Promise<boolean> {
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)
  if (!email && !phone) return false

  const admin = createAdminClient()

  const orParts: string[] = []
  if (email) orParts.push(`email.eq.${email}`)
  if (phone) orParts.push(`phone.eq.${phone}`)
  const { data: existing } = await admin
    .from('agency_lead_contacts')
    .select('id')
    .or(orParts.join(','))
    .limit(1)
  if (existing && existing.length > 0) return false

  const enrolledAt = input.enrolledAt ?? new Date()

  const { data: contact, error } = await admin
    .from('agency_lead_contacts')
    .insert({
      name: input.name,
      email,
      phone,
      source: input.source,
      status: 'active',
      enrolled_at: enrolledAt.toISOString(),
    })
    .select('id')
    .single()
  if (error || !contact) {
    console.error('Agency Leads enroll error:', error)
    return false
  }

  const stepRows = AGENCY_LEAD_STEPS.map(({ step, delayMs }) => ({
    contact_id: contact.id,
    step,
    status: 'pending',
    scheduled_at: new Date(enrolledAt.getTime() + delayMs).toISOString(),
  }))
  await admin.from('agency_lead_steps').insert(stepRows)

  // Fire anything already due (Day 0 email, since delayMs is 0)
  await processDueAgencyLeadSteps()
  return true
}

// ---------------------------------------------------------------------------
// Cron: process due steps
// ---------------------------------------------------------------------------

export async function processDueAgencyLeadSteps(): Promise<number> {
  const admin = createAdminClient()

  const { data: dueSteps } = await admin
    .from('agency_lead_steps')
    .select('id, contact_id, step')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (!dueSteps?.length) return 0

  let processed = 0
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'

  for (const step of dueSteps) {
    const { data: claimed } = await admin
      .from('agency_lead_steps')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', step.id)
      .eq('status', 'pending')
      .select('id')
      .single()
    if (!claimed) continue

    const { data: contact } = await admin
      .from('agency_lead_contacts')
      .select('name, email, phone, status')
      .eq('id', step.contact_id)
      .single()

    if (!contact || contact.status !== 'active') { processed++; continue }

    const firstName = contact.name?.trim().split(/\s+/)[0] || 'there'
    const isSms = step.step.endsWith('_sms')

    if (isSms) {
      if (contact.phone) {
        const msg = buildAgencySmsForStep(step.step, firstName)
        if (msg) await sendSms(contact.phone, msg)
      }
    } else if (contact.email && apiKey) {
      const result = buildAgencyEmailForStep(step.step, firstName)
      if (result) {
        try {
          const resend = new Resend(apiKey)
          await resend.emails.send({ from, to: contact.email, subject: result.subject, html: result.html })
        } catch (err) {
          console.error('Agency Leads email error:', err)
        }
      }
    }

    processed++
  }

  return processed
}

// ---------------------------------------------------------------------------
// Inbound SMS "STOP" handling — suppresses all future sends for a contact
// ---------------------------------------------------------------------------

export async function handleAgencyLeadsOptOut(fromPhone: string, body: string): Promise<boolean> {
  if (body.trim().toUpperCase() !== 'STOP') return false

  const phone = normalizePhone(fromPhone)
  if (!phone) return false

  const admin = createAdminClient()
  const { data: updated } = await admin
    .from('agency_lead_contacts')
    .update({ status: 'unsubscribed' })
    .eq('phone', phone)
    .eq('status', 'active')
    .select('id')
  return !!(updated && updated.length > 0)
}

// ---------------------------------------------------------------------------
// One-time backfill — enrolls existing Meta + /demo leads, starting today (Day 0)
// ---------------------------------------------------------------------------

export async function backfillExistingAgencyLeads(): Promise<{ enrolled: number; skipped: number }> {
  const admin = createAdminClient()
  let enrolled = 0
  let skipped = 0

  const { data: metaLeads } = await admin
    .from('sales_leads')
    .select('name, email, phone')
    .eq('source', 'meta')
  for (const lead of metaLeads ?? []) {
    const did = await enrollAgencyLead({ name: lead.name, email: lead.email, phone: lead.phone, source: 'meta' })
    if (did) enrolled++
    else skipped++
  }

  const { data: demoLeads } = await admin
    .from('free_trial_leads')
    .select('name, email, phone')
    .eq('funnel', 'demo')
  for (const lead of demoLeads ?? []) {
    const did = await enrollAgencyLead({ name: lead.name, email: lead.email, phone: lead.phone, source: 'demo' })
    if (did) enrolled++
    else skipped++
  }

  return { enrolled, skipped }
}
