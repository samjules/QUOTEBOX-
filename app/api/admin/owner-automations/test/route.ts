import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildEmailForStep,
  buildSmsForStep,
  buildWelcomeSms,
  SMS_STEPS,
  ONBOARDING_STEPS,
} from '@/lib/owner-automations'
import {
  buildBookingConfirmationEmail,
  buildBookingConfirmationSms,
  buildReminderEmail,
  buildReminderSms,
  buildCancelledEmail,
} from '@/lib/free-trial'
import { buildAgencyEmailForStep, buildAgencySmsForStep } from '@/lib/agency-leads'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

const FT_STEPS = ['ft_confirmation', 'ft_reminder', 'ft_cancelled']
const FT_PREVIEW_DATE = 'Monday, January 12'
const FT_PREVIEW_TIME = '11:00 AM'
const FT_PREVIEW_ZOOM = 'https://zoom.us/j/PREVIEW'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

export async function POST(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const testPhone: string | null = body.phone ?? null
  const testEmail: string = body.email?.trim() || user.email!
  const stepFilter: string = body.step ?? 'all'

  const admin = createAdminClient()
  const { data: cfg } = await admin.from('owner_automation_config').select('*').eq('id', 1).single()

  const results: { step: string; channel: string; ok: boolean; error?: string }[] = []
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
  const testBiz = 'Test Business'
  const testFirstName = 'Test'

  if (FT_STEPS.includes(stepFilter)) {
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        let result: { subject: string; html: string } | null = null
        if (stepFilter === 'ft_confirmation') {
          result = buildBookingConfirmationEmail(testFirstName, FT_PREVIEW_DATE, FT_PREVIEW_TIME, FT_PREVIEW_ZOOM, cfg?.ft_confirmation_email ?? null)
        } else if (stepFilter === 'ft_reminder') {
          result = buildReminderEmail(testFirstName, FT_PREVIEW_DATE, FT_PREVIEW_TIME, FT_PREVIEW_ZOOM, cfg?.ft_reminder_email ?? null)
        } else if (stepFilter === 'ft_cancelled') {
          result = buildCancelledEmail(testFirstName, cfg?.ft_cancelled_email ?? null)
        }
        if (result) {
          const { error } = await resend.emails.send({ from, to: testEmail, subject: `[TEST] ${result.subject}`, html: result.html })
          results.push({ step: stepFilter, channel: 'email', ok: !error, error: error?.message })
        }
      } catch (err) {
        results.push({ step: stepFilter, channel: 'email', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }

    if (testPhone && stepFilter !== 'ft_cancelled') {
      try {
        const msg = stepFilter === 'ft_confirmation'
          ? buildBookingConfirmationSms(testFirstName, FT_PREVIEW_DATE, FT_PREVIEW_TIME, cfg?.ft_confirmation_sms ?? null)
          : buildReminderSms(testFirstName, FT_PREVIEW_TIME, cfg?.ft_reminder_sms ?? null)
        const ok = await sendSms(testPhone, `[TEST] ${msg}`)
        results.push({ step: stepFilter, channel: 'sms', ok })
      } catch (err) {
        results.push({ step: stepFilter, channel: 'sms', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ results })
  }

  if (stepFilter.startsWith('agency_')) {
    const result = buildAgencyEmailForStep(stepFilter, testFirstName)
    const sms = buildAgencySmsForStep(stepFilter, testFirstName)

    if (result && apiKey) {
      try {
        const resend = new Resend(apiKey)
        const { error } = await resend.emails.send({ from, to: testEmail, subject: `[TEST] ${result.subject}`, html: result.html })
        results.push({ step: stepFilter, channel: 'email', ok: !error, error: error?.message })
      } catch (err) {
        results.push({ step: stepFilter, channel: 'email', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }

    if (sms && testPhone) {
      try {
        const ok = await sendSms(testPhone, `[TEST] ${sms}`)
        results.push({ step: stepFilter, channel: 'sms', ok })
      } catch (err) {
        results.push({ step: stepFilter, channel: 'sms', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ results })
  }

  const allStepNames = ONBOARDING_STEPS.map((s) => s.step)
  const stepsToTest = stepFilter === 'all' ? allStepNames : [stepFilter]

  for (const step of stepsToTest) {
    const isSmsOnly = SMS_STEPS.has(step)
    const isWelcome = step === 'welcome'

    // Email (for email steps and the welcome step which is both)
    if (!isSmsOnly && apiKey) {
      try {
        const resend = new Resend(apiKey)
        const customCopy = step === 'welcome' ? (cfg?.welcome_email ?? null) : null
        const result = buildEmailForStep(step, testBiz, testFirstName, customCopy)
        if (result) {
          const { error } = await resend.emails.send({
            from,
            to: testEmail,
            subject: `[TEST] ${result.subject}`,
            html: result.html,
          })
          results.push({ step, channel: 'email', ok: !error, error: error?.message })
        }
      } catch (err) {
        results.push({ step, channel: 'email', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }

    // SMS (for SMS-only steps and welcome which is both)
    if ((isSmsOnly || isWelcome) && testPhone) {
      try {
        const msg = isWelcome
          ? buildWelcomeSms(cfg?.welcome_sms ?? null)
          : buildSmsForStep(step, testFirstName, testBiz)
        if (msg) {
          const ok = await sendSms(testPhone, `[TEST] ${msg}`)
          results.push({ step, channel: 'sms', ok })
        }
      } catch (err) {
        results.push({ step, channel: 'sms', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  return NextResponse.json({ results })
}
