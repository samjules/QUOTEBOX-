import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { enrollLead } from '@/lib/enroll-lead'
import { processDueSteps } from '@/lib/process-automations'
import { enrollAgencyLead } from '@/lib/agency-leads'
import { notifyLeadWebhooks } from '@/lib/agent-webhooks'

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// GET — Meta webhook verification challenge
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — Receive leadgen events from Meta
export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  // Read raw body for signature verification
  const rawBody = await request.text()

  // Verify X-Hub-Signature-256
  const signature = request.headers.get('x-hub-signature-256')
  if (signature) {
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  let body: {
    object: string
    entry?: Array<{
      id: string
      changes?: Array<{
        field: string
        value: { leadgen_id: string; page_id: string; form_id: string; created_time: number }
      }>
    }>
  }

  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.object !== 'page') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const admin = supabaseAdmin()

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue

      const { leadgen_id, page_id, form_id } = change.value

      try {
        // Look up account by meta_page_id
        const { data: account } = await admin
          .from('accounts')
          .select('id, meta_access_token, meta_allowed_form_ids')
          .eq('meta_page_id', page_id)
          .single()

        if (!account || !account.meta_access_token) {
          // Not a tenant page — check if this is the admin's own connected Meta page
          const { data: adminCfg } = await admin
            .from('admin_meta_config')
            .select('meta_access_token, meta_page_id, meta_allowed_form_ids')
            .eq('id', 1)
            .single()

          if (adminCfg?.meta_page_id === page_id && adminCfg.meta_access_token) {
            const allowedIds: string[] = adminCfg.meta_allowed_form_ids || []
            if (allowedIds.length === 0 || allowedIds.includes(form_id)) {
              await handleAdminMetaLead(admin, adminCfg.meta_access_token, page_id, leadgen_id)
            }
          }
          continue
        }

        // If allowed form IDs are configured, skip forms not in the list
        const allowedIds: string[] = account.meta_allowed_form_ids || []
        if (allowedIds.length > 0 && !allowedIds.includes(form_id)) continue

        // Get page access token
        const pagesRes = await fetch(
          `https://graph.facebook.com/v18.0/${page_id}?fields=access_token&access_token=${account.meta_access_token}`
        )
        const pageData = await pagesRes.json()
        const pageAccessToken = pageData.access_token
        if (!pageAccessToken) continue

        // Fetch lead data from Meta
        const leadRes = await fetch(
          `https://graph.facebook.com/v18.0/${leadgen_id}?fields=field_data,created_time&access_token=${pageAccessToken}`
        )
        const leadData = await leadRes.json()
        if (!leadData.field_data) continue

        // Map field_data array to key-value pairs
        const fields: Record<string, string> = {}
        for (const f of leadData.field_data as Array<{ name: string; values: string[] }>) {
          fields[f.name] = f.values?.[0] ?? ''
        }

        // Extract standard contact fields
        const name = fields.full_name || fields.name || null
        const email = fields.email || null
        const phone = fields.phone_number || fields.phone || null

        // Remaining fields go into form_data
        const contactKeys = ['full_name', 'name', 'email', 'phone_number', 'phone']
        const formData: Record<string, string> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (!contactKeys.includes(key) && value) {
            formData[key] = value
          }
        }

        // Insert lead
        const { data: insertedLead } = await admin.from('leads').insert({
          account_id: account.id,
          hosted_form_id: null,
          name,
          email,
          phone,
          form_type: 'meta_lead_form',
          form_data: formData,
          status: 'new',
        }).select('id, created_at').single()

        if (insertedLead) {
          await notifyLeadWebhooks(account.id, {
            id: insertedLead.id,
            account_id: account.id,
            hosted_form_id: null,
            name,
            email,
            phone,
            form_type: 'meta_lead_form',
            form_data: formData,
            status: 'new',
            created_at: insertedLead.created_at,
          })
        }

        // Enroll lead and immediately fire initial_contact
        if (insertedLead?.id && email) {
          try {
            const enrolled = await enrollLead(insertedLead.id, account.id)
            if (enrolled) {
              await processDueSteps(account.id)
            }
          } catch (err) {
            console.error('Automation error (meta lead):', err)
          }
        }

        // Credit deduction (same logic as leads/submit)
        const COST_PER_LEAD = 15
        try {
          const { data: billing } = await admin
            .from('billing')
            .select('credit_balance, plan, blessed')
            .eq('account_id', account.id)
            .single()

          if (billing && billing.blessed) {
            // Blessed accounts skip credit deduction
          } else if (billing && (billing.plan === 'fully_managed' || billing.plan === 'pay_per_lead')) {
            if (billing.credit_balance >= COST_PER_LEAD) {
              const { data: updated } = await admin
                .from('billing')
                .update({ credit_balance: billing.credit_balance - COST_PER_LEAD })
                .eq('account_id', account.id)
                .gte('credit_balance', COST_PER_LEAD)
                .select('credit_balance')
                .single()

              if (updated) {
                await admin.from('billing_transactions').insert({
                  account_id: account.id,
                  type: 'lead_charge',
                  amount: -COST_PER_LEAD,
                  balance_after: updated.credit_balance,
                  description: `Meta lead from ${name || 'Unknown'}`,
                })
              }
            } else {
              console.warn(`Low credit balance for account ${account.id}: $${billing.credit_balance}`)
            }
          }
        } catch (err) {
          console.error('Credit deduction error (meta leadgen):', err)
        }
      } catch (err) {
        console.error(`Error processing leadgen event ${leadgen_id}:`, err)
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// Handles a leadgen event for the admin's own connected Meta page — lands in sales_leads
async function handleAdminMetaLead(
  admin: ReturnType<typeof supabaseAdmin>,
  metaAccessToken: string,
  pageId: string,
  leadgenId: string,
) {
  try {
    const pageRes = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${metaAccessToken}`
    )
    const pageData = await pageRes.json()
    const pageAccessToken = pageData.access_token
    if (!pageAccessToken) return

    const leadRes = await fetch(
      `https://graph.facebook.com/v18.0/${leadgenId}?fields=field_data,created_time&access_token=${pageAccessToken}`
    )
    const leadData = await leadRes.json()
    if (!leadData.field_data) return

    const fields: Record<string, string> = {}
    for (const f of leadData.field_data as Array<{ name: string; values: string[] }>) {
      fields[f.name] = f.values?.[0] ?? ''
    }

    const name = fields.full_name || fields.name || 'Unknown'
    const email = fields.email || ''
    const phone = fields.phone_number || fields.phone || null

    const { error } = await admin.from('sales_leads').insert({
      name,
      email,
      phone,
      status: 'new',
      meta_lead_id: leadgenId,
      source: 'meta',
    })
    if (error && error.code !== '23505') {
      console.error('Admin Meta lead insert error:', error)
    }
    if (!error) {
      try {
        await enrollAgencyLead({ name, email, phone, source: 'meta' })
      } catch (err) {
        console.error('Agency Leads trigger error (meta webhook):', err)
      }
    }
  } catch (err) {
    console.error('Admin Meta lead processing error:', err)
  }
}
