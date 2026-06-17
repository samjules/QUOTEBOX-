import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { enrollLead } from '@/lib/enroll-lead'
import { processDueSteps } from '@/lib/process-automations'

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

  let insertedLead: { id: string } | null = null
  try {
    const { data, error: insertError } = await supabaseAdmin.from('leads').insert({
      account_id: body.account_id,
      hosted_form_id: body.hosted_form_id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      form_type: body.form_type,
      status: body.status,
      form_data: body.form_data,
    }).select('id').single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 })
    }
    insertedLead = data
  } catch {
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
    console.error('Credit deduction error:', err)
  }

  // Record form_submit event if this email was in an automation sequence
  if (body.email) {
    Promise.resolve().then(async () => {
      try {
        const { data: automatedLeads } = await supabaseAdmin
          .from('automation_steps')
          .select('lead_id, account_id, step, sent_at, status')
          .eq('account_id', body.account_id)
          .in('status', ['sent', 'pending'])
          .order('created_at', { ascending: false })
          .limit(50)

        if (!automatedLeads?.length) return

        const leadIds = Array.from(new Set(automatedLeads.map((s) => s.lead_id)))
        const { data: matchedLeads } = await supabaseAdmin
          .from('leads')
          .select('id')
          .in('id', leadIds)
          .eq('email', body.email)
          .neq('id', insertedLead!.id)
          .order('created_at', { ascending: true })
          .limit(1)

        if (!matchedLeads?.length) return

        const matchedLeadId = matchedLeads[0].id
        const lastStep = automatedLeads.find((s) => s.lead_id === matchedLeadId)
        if (!lastStep) return

        await Promise.all([
          supabaseAdmin.from('automation_events').insert({
            account_id: body.account_id,
            lead_id: matchedLeadId,
            step: lastStep.step,
            event_type: 'form_submit',
          }),
          supabaseAdmin
            .from('automation_steps')
            .update({ status: 'skipped', sent_at: new Date().toISOString() })
            .eq('lead_id', matchedLeadId)
            .eq('status', 'pending'),
        ])
      } catch (err) {
        console.error('form_submit event error:', err)
      }
    })
  }

  // Enroll lead in automation sequence and immediately send initial_contact
  if (insertedLead?.id && body.email) {
    try {
      const enrolled = await enrollLead(insertedLead.id, body.account_id)
      if (enrolled) {
        await processDueSteps(body.account_id)
      }
    } catch (err) {
      console.error('Automation error (form lead):', err)
    }
  }

  return NextResponse.json({ success: true })
}
