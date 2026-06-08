import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAutomationStep } from '@/lib/send-automation-step'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'

  const { data: dueSteps } = await admin
    .from('automation_steps')
    .select('id, lead_id, account_id, step')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (!dueSteps?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const step of dueSteps) {
    // Atomically claim to prevent double-processing
    const { data: claimed } = await admin
      .from('automation_steps')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', step.id)
      .eq('status', 'pending')
      .select('id')
      .single()

    if (!claimed) continue

    const { data: lead } = await admin
      .from('leads')
      .select('name, email, phone, status, form_data')
      .eq('id', step.lead_id)
      .single()

    if (!lead) continue

    const isConverted =
      lead.status === 'booked' ||
      lead.status === 'lost' ||
      (await checkFormCompletion(admin, step.account_id, step.lead_id, lead.email, lead.phone))

    if (isConverted) {
      await admin
        .from('automation_steps')
        .update({ status: 'skipped', sent_at: new Date().toISOString() })
        .eq('lead_id', step.lead_id)
        .eq('status', 'pending')
      processed++
      continue
    }

    if (step.step === 'mark_lost') {
      await admin.from('leads').update({ status: 'lost' }).eq('id', step.lead_id)
      processed++
      continue
    }

    const { data: account } = await admin
      .from('accounts')
      .select('business_name')
      .eq('id', step.account_id)
      .single()

    const { data: automationConfig } = await admin
      .from('lead_automations')
      .select('discount_percent, hero_image_url')
      .eq('account_id', step.account_id)
      .single()

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

    const heroImageUrl = automationConfig?.hero_image_url
      ? `${siteUrl}${automationConfig.hero_image_url}`
      : null

    await sendAutomationStep({
      email: lead.email,
      phone: lead.phone,
      name: lead.name || 'there',
      businessName: account?.business_name || 'Your service provider',
      formUrl,
      step: step.step as 'initial_contact' | 'day1_followup' | 'discount_offer',
      discountPercent: automationConfig?.discount_percent ?? 10,
      leadId: step.lead_id,
      accountId: step.account_id,
      heroImageUrl,
      smsOptIn: (lead.form_data as Record<string, unknown> | null)?._sms_opt_in === true,
    })

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

  const { data } = await admin
    .from('leads')
    .select('id')
    .eq('account_id', accountId)
    .neq('id', leadId)
    .neq('form_type', 'meta_lead_form')
    .or(orFilters.join(','))
    .limit(1)

  return (data?.length ?? 0) > 0
}
