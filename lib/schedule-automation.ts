import { createAdminClient } from '@/lib/supabase/admin'

export async function scheduleLeadAutomation(leadId: string, accountId: string) {
  const admin = createAdminClient()

  // Upsert default config if missing, then check if enabled
  await admin
    .from('lead_automations')
    .upsert({ account_id: accountId }, { onConflict: 'account_id', ignoreDuplicates: true })

  const { data: config } = await admin
    .from('lead_automations')
    .select('is_enabled')
    .eq('account_id', accountId)
    .single()

  if (!config?.is_enabled) return

  const now = new Date()
  const day1 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const day2 = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const day3 = new Date(now.getTime() + 72 * 60 * 60 * 1000)

  await admin.from('automation_steps').insert([
    { account_id: accountId, lead_id: leadId, step: 'initial_contact', scheduled_at: now.toISOString() },
    { account_id: accountId, lead_id: leadId, step: 'day1_followup', scheduled_at: day1.toISOString() },
    { account_id: accountId, lead_id: leadId, step: 'discount_offer', scheduled_at: day2.toISOString() },
    { account_id: accountId, lead_id: leadId, step: 'mark_lost', scheduled_at: day3.toISOString() },
  ])
}
