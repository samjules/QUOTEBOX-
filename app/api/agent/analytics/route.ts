import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAgentApiKey } from '@/lib/agent-auth'

const STEP_KEYS = ['initial_contact', 'day1_followup', 'discount_offer', 'mark_lost'] as const

export async function GET(request: NextRequest) {
  const auth = await verifyAgentApiKey(request, 'analytics:read')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [leadsRes, visitsRes, formsRes, stepsRes] = await Promise.all([
    admin.from('leads').select('id, status, form_type, created_at').eq('account_id', auth.accountId),
    admin.from('form_visits').select('id', { count: 'exact', head: true }).eq('account_id', auth.accountId),
    admin.from('hosted_forms').select('id, form_name, is_active').eq('account_id', auth.accountId),
    admin.from('automation_steps').select('step, status').eq('account_id', auth.accountId),
  ])

  const leads = leadsRes.data ?? []
  const leadsByStatus: Record<string, number> = {}
  for (const lead of leads) {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] ?? 0) + 1
  }

  const visitCount = visitsRes.count ?? 0
  const conversionRate = visitCount > 0 ? leads.length / visitCount : null

  const automationSteps = stepsRes.data ?? []
  const automationStats = Object.fromEntries(
    STEP_KEYS.map((key) => [
      key,
      automationSteps.filter((s) => s.step === key && s.status === 'sent').length,
    ])
  )

  return NextResponse.json({
    leads: {
      total: leads.length,
      by_status: leadsByStatus,
    },
    form_visits: visitCount,
    conversion_rate: conversionRate,
    forms: (formsRes.data ?? []).map((f) => ({ id: f.id, form_name: f.form_name, is_active: f.is_active })),
    automation_steps_sent: automationStats,
  })
}
