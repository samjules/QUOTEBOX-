import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { buildWelcomeEmail, buildNoLeadsEmail, buildWelcomeSms, buildNoLeadsSms } from '@/lib/owner-automations'
import { Resend } from 'resend'
import { sendSms } from '@/lib/sms'

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

  const admin = createAdminClient()
  const { data: cfg } = await admin.from('owner_automation_config').select('*').eq('id', 1).single()

  const results: { step: string; channel: string; ok: boolean; error?: string }[] = []
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
  const testBiz = 'Test Business'

  for (const step of ['welcome', 'no_leads_followup'] as const) {
    // Email
    if (apiKey && user.email) {
      try {
        const resend = new Resend(apiKey)
        const { subject, html } =
          step === 'welcome'
            ? buildWelcomeEmail(testBiz, cfg?.welcome_email ?? null)
            : buildNoLeadsEmail(testBiz, cfg?.no_leads_email ?? null)
        const { error } = await resend.emails.send({ from, to: user.email, subject: `[TEST] ${subject}`, html })
        results.push({ step, channel: 'email', ok: !error, error: error?.message })
      } catch (err) {
        results.push({ step, channel: 'email', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }

    // SMS
    if (testPhone) {
      try {
        const msg = step === 'welcome'
          ? buildWelcomeSms(cfg?.welcome_sms ?? null)
          : buildNoLeadsSms(cfg?.no_leads_sms ?? null)
        const ok = await sendSms(testPhone, `[TEST] ${msg}`)
        results.push({ step, channel: 'sms', ok })
      } catch (err) {
        results.push({ step, channel: 'sms', ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  return NextResponse.json({ results })
}
