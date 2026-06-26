import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { sendAutomationStep } from '@/lib/send-automation-step'

const EMAIL_STEPS = ['initial_contact', 'day1_followup', 'discount_offer'] as const

async function getAccountId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('accounts').select('id').eq('owner_id', user.id).single()
  return data?.id ?? null
}

// GET — return recent leads for the selector
export async function GET() {
  const accountId = await getAccountId()
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('leads')
    .select('id, name, email, phone, form_type')
    .eq('account_id', accountId)
    .not('email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}

// POST — send all automation email steps immediately for a given lead
export async function POST(request: NextRequest) {
  const accountId = await getAccountId()
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id } = await request.json()
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch lead — verify it belongs to this account
  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email, phone, hosted_form_id, form_type, form_data')
    .eq('id', lead_id)
    .eq('account_id', accountId)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })

  const [{ data: account }, { data: automationConfig }] = await Promise.all([
    admin.from('accounts').select('business_name').eq('id', accountId).single(),
    admin.from('lead_automations').select('discount_percent, hero_image_url, accent_color').eq('account_id', accountId).single(),
  ])

  // Get form URL — prefer the lead's own form, fall back to the account's first active form
  let formUrl: string | null = null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
  const formQuery = lead.hosted_form_id
    ? admin.from('hosted_forms').select('form_config').eq('id', lead.hosted_form_id).single()
    : admin.from('hosted_forms').select('form_config').eq('account_id', accountId).eq('is_active', true).order('created_at', { ascending: true }).limit(1).single()
  const { data: formData } = await formQuery
  const slug = (formData?.form_config as { slug?: string } | null)?.slug
  if (slug) formUrl = `${siteUrl}/${slug}`

  const heroImageUrl = automationConfig?.hero_image_url ?? null

  const commonParams = {
    email: lead.email,
    phone: lead.phone ?? null,
    name: lead.name || 'there',
    businessName: account?.business_name || 'Your service provider',
    formUrl,
    discountPercent: automationConfig?.discount_percent ?? 10,
    heroImageUrl,
    accentColor: automationConfig?.accent_color ?? null,
    leadId: lead_id,
    accountId,
    formType: lead.form_type ?? null,
    smsOptIn: (lead.form_data as Record<string, unknown> | null)?._sms_opt_in === true,
  }

  const results: { step: string; ok: boolean; error?: string }[] = []

  for (const step of EMAIL_STEPS) {
    try {
      await sendAutomationStep({ ...commonParams, step })
      results.push({ step, ok: true })
    } catch (err) {
      results.push({ step, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ results })
}
