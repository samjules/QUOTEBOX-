import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerAgencyLeadsAutomation } from '@/lib/agency-leads'

export const dynamic = 'force-dynamic'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

export async function POST() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: cfg } = await admin
    .from('admin_meta_config')
    .select('meta_access_token, meta_page_id, meta_allowed_form_ids')
    .eq('id', 1)
    .single()

  if (!cfg?.meta_access_token || !cfg?.meta_page_id) {
    return NextResponse.json({ error: 'Meta not connected' }, { status: 400 })
  }

  const pageRes = await fetch(
    `https://graph.facebook.com/v18.0/${cfg.meta_page_id}?fields=access_token&access_token=${cfg.meta_access_token}`
  )
  const pageData = await pageRes.json()
  if (!pageData.access_token) {
    return NextResponse.json({ error: 'Failed to get page token' }, { status: 502 })
  }
  const pageToken = pageData.access_token

  let formIds: string[] = cfg.meta_allowed_form_ids || []
  if (formIds.length === 0) {
    const formsRes = await fetch(
      `https://graph.facebook.com/v18.0/${cfg.meta_page_id}/leadgen_forms?fields=id&limit=100&access_token=${pageToken}`
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
        const { count } = await admin
          .from('sales_leads')
          .select('id', { count: 'exact', head: true })
          .eq('meta_lead_id', lead.id)

        if ((count ?? 0) > 0) { skipped++; continue }

        const fields: Record<string, string> = {}
        for (const f of lead.field_data) fields[f.name] = f.values?.[0] ?? ''

        const name = fields.full_name || fields.name || 'Unknown'
        const email = fields.email || ''
        const phone = fields.phone_number || fields.phone || null

        const { error } = await admin.from('sales_leads').insert({
          name,
          email,
          phone,
          status: 'new',
          meta_lead_id: lead.id,
          source: 'meta',
          created_at: lead.created_time,
        })
        if (!error) {
          imported++
          const isRecent = (Date.now() - new Date(lead.created_time).getTime()) < 48 * 60 * 60 * 1000
          if (isRecent) {
            try {
              await triggerAgencyLeadsAutomation({ name, email, phone, source: 'meta' })
            } catch (err) {
              console.error('Agency Leads trigger error (manual sync):', err)
            }
          }
        }
        else if (error.code !== '23505') console.error('Admin Meta manual sync insert error:', error)
      }

      nextUrl = leadsData.paging?.next ?? null
    }
  }

  return NextResponse.json({ imported, skipped })
}
