import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { scheduleLeadAutomation } from '@/lib/schedule-automation'
import { sendAutomationStep } from '@/lib/send-automation-step'

export async function POST(request: NextRequest) {
  // Use service role key to bypass RLS — FK constraint check on hosted_form_id
  // fails for anon users when hosted_forms has RLS enabled.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let body: {
    account_id: string
    hosted_form_id: string
    name: string
    email: string
    phone: string | null
    form_type: string
    form_data: Record<string, unknown>
    status: 'new' | 'held'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate the hosted form actually exists and is active
  const { data: form, error: formError } = await supabaseAdmin
    .from('hosted_forms')
    .select('id, is_active')
    .eq('id', body.hosted_form_id)
    .single()

  if (formError || !form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  if (!form.is_active) {
    return NextResponse.json({ error: 'This form is no longer active' }, { status: 400 })
  }

  const { data: insertedLead, error } = await supabaseAdmin.from('leads').insert({
    account_id: body.account_id,
    hosted_form_id: body.hosted_form_id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    form_type: body.form_type,
    form_data: body.form_data,
    status: body.status,
  }).select('id').single()

  if (error) {
    console.error('Lead insert error:', error)
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 })
  }

  // Server-side credit deduction for credit-based plans
  const COST_PER_LEAD = 15
  try {
    const { data: billing } = await supabaseAdmin
      .from('billing')
      .select('credit_balance, plan, blessed')
      .eq('account_id', body.account_id)
      .single()

    if (billing && billing.blessed) {
      // Blessed accounts skip credit deduction entirely
    } else if (billing && (billing.plan === 'fully_managed' || billing.plan === 'pay_per_lead')) {
      if (billing.credit_balance >= COST_PER_LEAD) {
        // Guarded update to prevent race conditions
        const { data: updated } = await supabaseAdmin
          .from('billing')
          .update({ credit_balance: billing.credit_balance - COST_PER_LEAD })
          .eq('account_id', body.account_id)
          .gte('credit_balance', COST_PER_LEAD)
          .select('credit_balance')
          .single()

        if (updated) {
          await supabaseAdmin.from('billing_transactions').insert({
            account_id: body.account_id,
            type: 'lead_charge',
            amount: -COST_PER_LEAD,
            balance_after: updated.credit_balance,
            description: `Lead from ${body.name || 'Unknown'}`,
          })
        }
      } else {
        console.warn(`Low credit balance for account ${body.account_id}: $${billing.credit_balance}`)
      }
    }
  } catch (err) {
    // Non-fatal: lead is already saved, log billing error
    console.error('Credit deduction error:', err)
  }

  // Fire automation (fire-and-forget — lead is already saved)
  if (insertedLead?.id && body.email) {
    Promise.resolve().then(async () => {
      try {
        await supabaseAdmin
          .from('lead_automations')
          .upsert({ account_id: body.account_id }, { onConflict: 'account_id', ignoreDuplicates: true })

        const { data: automationConfig } = await supabaseAdmin
          .from('lead_automations')
          .select('is_enabled, discount_percent')
          .eq('account_id', body.account_id)
          .single()

        if (!automationConfig?.is_enabled) return

        const [{ data: accountDetails }, { data: formData }] = await Promise.all([
          supabaseAdmin.from('accounts').select('business_name').eq('id', body.account_id).single(),
          supabaseAdmin.from('hosted_forms').select('form_config').eq('id', body.hosted_form_id).single(),
        ])

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
        const slug = (formData?.form_config as { slug?: string } | null)?.slug
        const formUrl = slug ? `${siteUrl}/${slug}` : null

        await sendAutomationStep({
          email: body.email,
          phone: body.phone ?? null,
          name: body.name || 'there',
          businessName: accountDetails?.business_name || 'Your service provider',
          formUrl,
          step: 'initial_contact',
          discountPercent: automationConfig.discount_percent ?? 10,
        })

        await scheduleLeadAutomation(insertedLead.id, body.account_id)
      } catch (err) {
        console.error('Automation error (form lead):', err)
      }
    })
  }

  return NextResponse.json({ success: true })
}
