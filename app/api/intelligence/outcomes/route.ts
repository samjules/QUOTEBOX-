import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'

/**
 * POST /api/intelligence/outcomes
 * Create or update an outcome for an intelligence lead.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No account found' }, { status: 404 })
  }

  const body = await request.json()
  const { intelligence_lead_id, status, actual_value, notes } = body

  if (!intelligence_lead_id || !status || !['won', 'lost'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Verify the lead belongs to this account
  const { data: lead } = await supabase
    .from('intelligence_leads')
    .select('id')
    .eq('id', intelligence_lead_id)
    .eq('account_id', ctx.accountId)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Upsert outcome
  const { data: existing } = await supabase
    .from('outcomes')
    .select('id')
    .eq('intelligence_lead_id', intelligence_lead_id)
    .single()

  if (existing) {
    await supabase
      .from('outcomes')
      .update({
        status,
        actual_value: actual_value ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('outcomes')
      .insert({
        intelligence_lead_id,
        status,
        actual_value: actual_value ?? null,
        notes: notes ?? null,
      })
  }

  return NextResponse.json({ ok: true })
}
