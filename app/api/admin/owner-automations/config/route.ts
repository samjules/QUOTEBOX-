import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('owner_automation_config').select('*').eq('id', 1).single()
  return NextResponse.json(data ?? {})
}

export async function PUT(request: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const admin = createAdminClient()

  const patch: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() }
  if ('welcome_email' in body) patch.welcome_email = body.welcome_email ?? null
  if ('welcome_sms' in body) patch.welcome_sms = body.welcome_sms ?? null
  if ('no_leads_email' in body) patch.no_leads_email = body.no_leads_email ?? null
  if ('no_leads_sms' in body) patch.no_leads_sms = body.no_leads_sms ?? null
  if ('ft_confirmation_email' in body) patch.ft_confirmation_email = body.ft_confirmation_email ?? null
  if ('ft_confirmation_sms' in body) patch.ft_confirmation_sms = body.ft_confirmation_sms ?? null
  if ('ft_reminder_email' in body) patch.ft_reminder_email = body.ft_reminder_email ?? null
  if ('ft_reminder_sms' in body) patch.ft_reminder_sms = body.ft_reminder_sms ?? null
  if ('ft_cancelled_email' in body) patch.ft_cancelled_email = body.ft_cancelled_email ?? null

  const { data } = await admin
    .from('owner_automation_config')
    .upsert(patch, { onConflict: 'id' })
    .select()
    .single()

  return NextResponse.json(data)
}
