import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildEmailForStep,
  buildSmsForStep,
  buildWelcomeSms,
  SMS_STEPS,
} from '@/lib/owner-automations'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

export async function GET(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const step = request.nextUrl.searchParams.get('step')
  if (!step) return NextResponse.json({ error: 'step required' }, { status: 400 })

  const isSmsOnly = SMS_STEPS.has(step)
  const isWelcome = step === 'welcome'

  let subject: string | null = null
  let html: string | null = null
  let sms: string | null = null

  if (!isSmsOnly) {
    const result = buildEmailForStep(step, 'Acme Junk Removal', 'Mike', null)
    if (result) { subject = result.subject; html = result.html }
  }

  if (isSmsOnly || isWelcome) {
    sms = isWelcome
      ? buildWelcomeSms(null)
      : buildSmsForStep(step, 'Mike', 'Acme Junk Removal')
  }

  return NextResponse.json({ subject, html, sms })
}
