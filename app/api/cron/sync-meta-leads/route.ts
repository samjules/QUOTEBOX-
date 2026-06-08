import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scheduleLeadAutomation } from '@/lib/schedule-automation'
import { sendAutomationStep } from '@/lib/send-automation-step'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Called daily by Vercel Cron (configured in vercel.json)
// Also accepts a CRON_SECRET header to prevent unauthorized calls
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch all accounts with Meta connected
  const { data: accounts } = await admin
    .from('accounts')
    .select('id, meta_access_token, meta_page_id, meta_allowed_form_ids')
    .not('meta_access_token', 'is', null)
    .not('meta_page_id', 'is', null)

  if (!accounts?.length) {
    return NextResponse.json({ message: 'No Meta-connected accounts', synced: 0 })
  }

  const results: Array<{ account_id: string; imported: number; skipped: number; error?: string }> = []

  for (const account of accounts) {
    try {
      const { imported, skipped } = await syncAccountLeads(admin, account)
      results.push({ account_id: account.id, imported, skipped })
    } catch (err) {
      results.push({
        account_id: account.id,
        imported: 0,
        skipped: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const totalImported = results.reduce((s, r) => s + r.imported, 0)
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0)

  return NextResponse.json({ accounts: results.length, totalImported, totalSkipped, results })
}

async function syncAccountLeads(
  admin: ReturnType<typeof createAdminClient>,
  account: { id: string; meta_access_token: string; meta_page_id: string; meta_allowed_form_ids: string[] | null }
) {
  // Get page access token
  const pageRes = await fetch(
    `https://graph.facebook.com/v18.0/${account.meta_page_id}?fields=access_token&access_token=${account.meta_access_token}`
  )
  const pageData = await pageRes.json()
  if (!pageData.access_token) throw new Error('Failed to get page token')
  const pageToken = pageData.access_token

  // Resolve form IDs to sync
  let formIds: string[] = account.meta_allowed_form_ids || []
  if (formIds.length === 0) {
    const formsRes = await fetch(
      `https://graph.facebook.com/v18.0/${account.meta_page_id}/leadgen_forms?fields=id&limit=100&access_token=${pageToken}`
    )
    const formsData = await formsRes.json()
    formIds = (formsData.data || []).map((f: { id: string }) => f.id)
  }

  if (formIds.length === 0) return { imported: 0, skipped: 0 }

  let imported = 0
  let skipped = 0

  for (const formId of formIds) {
    let nextUrl: string | null =
      `https://graph.facebook.com/v18.0/${formId}/leads?fields=id,field_data,created_time&sort=created_time_descending&limit=100&access_token=${pageToken}`

    while (nextUrl) {
      const pageLeadsRes: Response = await fetch(nextUrl)
      const leadsData: { error?: unknown; data?: Array<{ id: string; field_data: Array<{ name: string; values: string[] }>; created_time: string }>; paging?: { next?: string } } = await pageLeadsRes.json()
      if (leadsData.error || !leadsData.data) break

      for (const lead of leadsData.data) {
        const { count } = await admin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', account.id)
          .eq('form_type', 'meta_lead_form')
          .filter('form_data->>_meta_lead_id', 'eq', lead.id)

        if ((count ?? 0) > 0) { skipped++; continue }

        const fields: Record<string, string> = {}
        for (const f of lead.field_data) fields[f.name] = f.values?.[0] ?? ''

        const name = fields.full_name || fields.name || null
        const email = fields.email || null
        const phone = fields.phone_number || fields.phone || null

        const contactKeys = ['full_name', 'name', 'email', 'phone_number', 'phone']
        const formData: Record<string, string> = { _meta_lead_id: lead.id }
        for (const [key, value] of Object.entries(fields)) {
          if (!contactKeys.includes(key) && value) formData[key] = value
        }

        const { data: insertedLead } = await admin.from('leads').insert({
          account_id: account.id,
          hosted_form_id: null,
          name,
          email,
          phone,
          form_type: 'meta_lead_form',
          form_data: formData,
          status: 'new',
          created_at: lead.created_time,
        }).select('id').single()

        // Fire automation for leads created within the last 48 hours
        const isRecent = (Date.now() - new Date(lead.created_time).getTime()) < 48 * 60 * 60 * 1000
        if (insertedLead?.id && isRecent) {
          try {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quote-box.com'
            await admin
              .from('lead_automations')
              .upsert({ account_id: account.id }, { onConflict: 'account_id', ignoreDuplicates: true })
            const { data: automationConfig } = await admin
              .from('lead_automations')
              .select('is_enabled, discount_percent, hero_image_url')
              .eq('account_id', account.id)
              .single()
            if (automationConfig?.is_enabled) {
              const [{ data: accountDetails }, { data: form }] = await Promise.all([
                admin.from('accounts').select('business_name').eq('id', account.id).single(),
                admin.from('hosted_forms').select('form_config').eq('account_id', account.id).eq('is_active', true).order('created_at', { ascending: true }).limit(1).single(),
              ])
              const slug = (form?.form_config as { slug?: string } | null)?.slug
              const formUrl = slug ? `${siteUrl}/${slug}` : null
              const heroImageUrl = automationConfig.hero_image_url ? `${siteUrl}${automationConfig.hero_image_url}` : null

              await sendAutomationStep({
                email,
                phone,
                name: name || 'there',
                businessName: accountDetails?.business_name || 'Your service provider',
                formUrl,
                step: 'initial_contact',
                discountPercent: automationConfig.discount_percent ?? 10,
                leadId: insertedLead.id,
                accountId: account.id,
                heroImageUrl,
              })
              await scheduleLeadAutomation(insertedLead.id, account.id)
            }
          } catch (err) {
            console.error('Automation error (cron sync-meta-leads):', err)
          }
        }

        imported++
      }

      nextUrl = leadsData.paging?.next ?? null
    }
  }

  return { imported, skipped }
}
