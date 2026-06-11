import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrollLead } from '@/lib/enroll-lead'
import { processDueSteps } from '@/lib/process-automations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('accounts')
    .select('id, meta_access_token, meta_page_id, meta_allowed_form_ids')
    .eq('owner_id', user.id)
    .single()

  if (!account?.meta_access_token || !account?.meta_page_id) {
    return NextResponse.json({ error: 'Meta not connected' }, { status: 400 })
  }

  // Get page access token
  const pageRes = await fetch(
    `https://graph.facebook.com/v18.0/${account.meta_page_id}?fields=access_token&access_token=${account.meta_access_token}`
  )
  const pageData = await pageRes.json()
  if (!pageData.access_token) {
    return NextResponse.json({ error: 'Failed to get page token' }, { status: 502 })
  }
  const pageToken = pageData.access_token

  // Fetch forms to sync — use allowed list if set, otherwise fetch all
  let formIds: string[] = account.meta_allowed_form_ids || []
  if (formIds.length === 0) {
    const formsRes = await fetch(
      `https://graph.facebook.com/v18.0/${account.meta_page_id}/leadgen_forms?fields=id&limit=100&access_token=${pageToken}`
    )
    const formsData = await formsRes.json()
    formIds = (formsData.data || []).map((f: { id: string }) => f.id)
  }

  if (formIds.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0 })
  }

  let imported = 0
  let skipped = 0

  for (const formId of formIds) {
    let nextUrl: string | null =
      `https://graph.facebook.com/v18.0/${formId}/leads?fields=id,field_data,created_time&sort=created_time_descending&limit=100&access_token=${pageToken}`

    while (nextUrl) {
      const fetchUrl: string = nextUrl
      const leadsRes = await fetch(fetchUrl)
      const leadsData = await leadsRes.json()

      if (leadsData.error || !leadsData.data) break

      for (const lead of leadsData.data as Array<{ id: string; field_data: Array<{ name: string; values: string[] }>; created_time: string }>) {
        // Dedup: check if this meta lead ID was already imported (stored in form_data._meta_lead_id)
        const { count } = await admin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', account.id)
          .eq('form_type', 'meta_lead_form')
          .filter('form_data->>_meta_lead_id', 'eq', lead.id)

        if ((count ?? 0) > 0) {
          skipped++
          continue
        }

        // Map field_data to key-value pairs
        const fields: Record<string, string> = {}
        for (const f of lead.field_data) {
          fields[f.name] = f.values?.[0] ?? ''
        }

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

        // Enroll and immediately fire automation for leads created within the last 48 hours
        const isRecent = (Date.now() - new Date(lead.created_time).getTime()) < 48 * 60 * 60 * 1000
        if (insertedLead?.id && email && isRecent) {
          try {
            const enrolled = await enrollLead(insertedLead.id, account.id)
            if (enrolled) {
              await processDueSteps(account.id)
            }
          } catch (err) {
            console.error('Automation error (sync-leads):', err)
          }
        }

        imported++
      }

      // Follow pagination cursor (newest → oldest)
      nextUrl = leadsData.paging?.next ?? null
    }
  }

  return NextResponse.json({ imported, skipped })
}
