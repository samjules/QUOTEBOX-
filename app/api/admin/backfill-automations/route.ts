import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scheduleLeadAutomation } from '@/lib/schedule-automation'
import { sendAutomationStep } from '@/lib/send-automation-step'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  // Default: yesterday 00:00 UTC
  const since = body.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + 'T00:00:00.000Z'

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'

  // Fetch all leads created on or after `since`, not in a terminal state
  const { data: leads, error } = await admin
    .from('leads')
    .select('id, account_id, name, email, phone, status, form_data, hosted_form_id')
    .gte('created_at', since)
    .not('status', 'in', '("booked","lost")')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads?.length) return NextResponse.json({ processed: 0, skipped: 0, message: 'No leads found' })

  let processed = 0
  let skipped = 0

  for (const lead of leads) {
    if (!lead.email) { skipped++; continue }

    // Check automation config for this account
    await admin
      .from('lead_automations')
      .upsert({ account_id: lead.account_id }, { onConflict: 'account_id', ignoreDuplicates: true })

    const { data: automationConfig } = await admin
      .from('lead_automations')
      .select('is_enabled, discount_percent, hero_image_url')
      .eq('account_id', lead.account_id)
      .single()

    if (!automationConfig?.is_enabled) { skipped++; continue }

    // Cancel any existing pending steps for this lead
    await admin
      .from('automation_steps')
      .update({ status: 'skipped', sent_at: new Date().toISOString() })
      .eq('lead_id', lead.id)
      .eq('status', 'pending')

    // Resolve business name and form URL
    const [{ data: accountDetails }, { data: form }] = await Promise.all([
      admin.from('accounts').select('business_name').eq('id', lead.account_id).single(),
      lead.hosted_form_id
        ? admin.from('hosted_forms').select('form_config').eq('id', lead.hosted_form_id).single()
        : admin.from('hosted_forms').select('form_config').eq('account_id', lead.account_id).eq('is_active', true).order('created_at', { ascending: true }).limit(1).single(),
    ])

    const slug = (form?.form_config as { slug?: string } | null)?.slug
    const formUrl = slug ? `${siteUrl}/${slug}` : null
    const heroImageUrl = automationConfig.hero_image_url
      ? `${siteUrl}${automationConfig.hero_image_url}`
      : null
    const smsOptIn = (lead.form_data as Record<string, unknown> | null)?._sms_opt_in === true

    try {
      await sendAutomationStep({
        email: lead.email,
        phone: lead.phone,
        name: lead.name || 'there',
        businessName: accountDetails?.business_name || 'Your service provider',
        formUrl,
        step: 'initial_contact',
        discountPercent: automationConfig.discount_percent ?? 10,
        leadId: lead.id,
        accountId: lead.account_id,
        heroImageUrl,
        smsOptIn,
      })

      await scheduleLeadAutomation(lead.id, lead.account_id)
      processed++
    } catch (err) {
      console.error(`Automation backfill error for lead ${lead.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ processed, skipped, since })
}
