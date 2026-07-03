import { createAdminClient } from '@/lib/supabase/admin'
import OwnerAutomationsManager from './OwnerAutomationsManager'

export const dynamic = 'force-dynamic'

export interface OwnerStep {
  id: string
  account_id: string
  step: string
  status: string
  scheduled_at: string
  sent_at: string | null
  created_at: string
  business_name: string
  owner_email: string
  phone: string | null
}

export interface FreeTrialAutomationStats {
  confirmationSent: number
  reminderSent: number
  cancelled: number
}

export interface AgencyLeadsStats {
  sent: number
  fromMeta: number
  fromDemo: number
}

export default async function OwnerAutomationsPage() {
  const admin = createAdminClient()

  const [stepsResult, accountsResult, usersResult, freeTrialLeadsResult, agencyLeadContactsResult] = await Promise.all([
    admin
      .from('owner_onboarding_steps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('accounts').select('id, business_name, owner_id, phone'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('free_trial_leads').select('status, reminder_sent_at'),
    admin.from('agency_lead_contacts').select('source'),
  ])

  const steps = stepsResult.data ?? []
  const accounts = accountsResult.data ?? []
  const users = usersResult.data?.users ?? []
  const freeTrialLeads = freeTrialLeadsResult.data ?? []
  const agencyLeadContacts = agencyLeadContactsResult.data ?? []

  const freeTrialStats: FreeTrialAutomationStats = {
    confirmationSent: freeTrialLeads.length,
    reminderSent: freeTrialLeads.filter((l) => l.reminder_sent_at).length,
    cancelled: freeTrialLeads.filter((l) => l.status === 'cancelled').length,
  }

  const agencyLeadsStats: AgencyLeadsStats = {
    sent: agencyLeadContacts.length,
    fromMeta: agencyLeadContacts.filter((c) => c.source === 'meta').length,
    fromDemo: agencyLeadContacts.filter((c) => c.source === 'demo').length,
  }

  const accountMap = new Map(accounts.map((a) => [a.id, a]))
  const userEmailMap = new Map(users.map((u) => [u.id, u.email ?? '']))

  const enriched: OwnerStep[] = steps.map((s) => {
    const account = accountMap.get(s.account_id)
    const ownerEmail = account ? (userEmailMap.get(account.owner_id) ?? '') : ''
    return {
      ...s,
      business_name: account?.business_name ?? '—',
      owner_email: ownerEmail,
      phone: account?.phone ?? null,
    }
  })

  return <OwnerAutomationsManager steps={enriched} freeTrialStats={freeTrialStats} agencyLeadsStats={agencyLeadsStats} />
}
