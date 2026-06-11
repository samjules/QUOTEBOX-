import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Enroll a lead in the automation sequence.
 * Creates all 4 steps (initial_contact due immediately, then day1/day2/mark_lost).
 * Safe to call multiple times — skips if lead already has steps.
 * Returns true if enrolled, false if skipped.
 */
export async function enrollLead(leadId: string, accountId: string): Promise<boolean> {
  const admin = createAdminClient()

  // Skip if already enrolled
  const { data: existing } = await admin
    .from('automation_steps')
    .select('id')
    .eq('lead_id', leadId)
    .limit(1)
  if (existing?.length) return false

  // Ensure automation config row exists
  await admin
    .from('lead_automations')
    .upsert({ account_id: accountId }, { onConflict: 'account_id', ignoreDuplicates: true })

  const { data: config } = await admin
    .from('lead_automations')
    .select('is_enabled')
    .eq('account_id', accountId)
    .single()

  if (!config?.is_enabled) return false

  const now = new Date()
  const { error } = await admin.from('automation_steps').insert([
    {
      account_id: accountId,
      lead_id: leadId,
      step: 'initial_contact',
      status: 'pending',
      scheduled_at: now.toISOString(),
    },
    {
      account_id: accountId,
      lead_id: leadId,
      step: 'day1_followup',
      status: 'pending',
      scheduled_at: new Date(now.getTime() + 24 * 3600_000).toISOString(),
    },
    {
      account_id: accountId,
      lead_id: leadId,
      step: 'discount_offer',
      status: 'pending',
      scheduled_at: new Date(now.getTime() + 48 * 3600_000).toISOString(),
    },
    {
      account_id: accountId,
      lead_id: leadId,
      step: 'mark_lost',
      status: 'pending',
      scheduled_at: new Date(now.getTime() + 72 * 3600_000).toISOString(),
    },
  ])

  if (error) {
    console.error('enrollLead insert error:', error)
    return false
  }

  return true
}

/**
 * Enroll all leads for an account that have an email but no automation steps yet.
 * Skips leads that are already booked/lost or have no email.
 * Only looks back 30 days to avoid spamming old leads.
 */
export async function enrollPendingLeads(accountId: string): Promise<number> {
  const admin = createAdminClient()

  const cutoff = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()

  // Get all leads for this account with emails, created in last 30 days, not terminal
  const { data: leads } = await admin
    .from('leads')
    .select('id, email')
    .eq('account_id', accountId)
    .not('email', 'is', null)
    .not('email', 'eq', '')
    .not('status', 'in', '("booked","lost")')
    .gte('created_at', cutoff)

  if (!leads?.length) return 0

  // Find which leads already have automation steps
  const leadIds = leads.map((l) => l.id)
  const { data: enrolled } = await admin
    .from('automation_steps')
    .select('lead_id')
    .in('lead_id', leadIds)

  const enrolledSet = new Set((enrolled ?? []).map((s) => s.lead_id))
  const toEnroll = leads.filter((l) => !enrolledSet.has(l.id))

  if (!toEnroll.length) return 0

  // Ensure automation config exists
  await admin
    .from('lead_automations')
    .upsert({ account_id: accountId }, { onConflict: 'account_id', ignoreDuplicates: true })

  const { data: config } = await admin
    .from('lead_automations')
    .select('is_enabled')
    .eq('account_id', accountId)
    .single()

  if (!config?.is_enabled) return 0

  const now = new Date()
  const rows = toEnroll.flatMap((l) => [
    { account_id: accountId, lead_id: l.id, step: 'initial_contact', status: 'pending', scheduled_at: now.toISOString() },
    { account_id: accountId, lead_id: l.id, step: 'day1_followup', status: 'pending', scheduled_at: new Date(now.getTime() + 24 * 3600_000).toISOString() },
    { account_id: accountId, lead_id: l.id, step: 'discount_offer', status: 'pending', scheduled_at: new Date(now.getTime() + 48 * 3600_000).toISOString() },
    { account_id: accountId, lead_id: l.id, step: 'mark_lost', status: 'pending', scheduled_at: new Date(now.getTime() + 72 * 3600_000).toISOString() },
  ])

  const { error } = await admin.from('automation_steps').insert(rows)
  if (error) {
    console.error('enrollPendingLeads insert error:', error)
    return 0
  }

  return toEnroll.length
}
