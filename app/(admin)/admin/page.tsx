import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboard from './AdminDashboard'

export interface AdminAccount {
  id: string
  business_name: string
  owner_id: string
  owner_email: string
  phone: string | null
  created_at: string
  plan: string | null
  credit_balance: number
  total_spent: number
  stripe_customer_id: string | null
  trial_ends_at: string | null
  blessed: boolean
  leads_total: number
  leads_this_month: number
  forms_count: number
  onboarding_status: 'none' | 'pending' | 'in_progress' | 'completed' | 'form_built'
  onboarding_token: string | null
}

export default async function AdminPage() {
  const admin = createAdminClient()

  const [accountsResult, billingResult, leadsResult, formsResult, usersResult, onboardingResult] = await Promise.all([
    admin.from('accounts').select('*').order('created_at', { ascending: false }),
    admin.from('billing').select('*'),
    admin.from('leads').select('account_id, created_at'),
    admin.from('hosted_forms').select('account_id'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('onboarding_sessions').select('account_id, status, token').order('created_at', { ascending: false }),
  ])

  const accounts = accountsResult.data ?? []
  const billing = billingResult.data ?? []
  const leads = leadsResult.data ?? []
  const forms = formsResult.data ?? []
  const users = usersResult.data?.users ?? []

  const userEmailMap = new Map(users.map((u) => [u.id, u.email ?? '']))

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const leadsPerAccount = new Map<string, { total: number; thisMonth: number }>()
  for (const lead of leads) {
    const prev = leadsPerAccount.get(lead.account_id) ?? { total: 0, thisMonth: 0 }
    prev.total += 1
    if (new Date(lead.created_at) >= startOfMonth) prev.thisMonth += 1
    leadsPerAccount.set(lead.account_id, prev)
  }

  const formsPerAccount = new Map<string, number>()
  for (const form of forms) {
    formsPerAccount.set(form.account_id, (formsPerAccount.get(form.account_id) ?? 0) + 1)
  }

  const billingMap = new Map(billing.map((b) => [b.account_id, b]))

  // Use the most recent onboarding session per account
  const onboardingSessions = onboardingResult.data ?? []
  const onboardingMap = new Map<string, { status: string; token: string }>()
  for (const s of onboardingSessions) {
    if (!onboardingMap.has(s.account_id)) {
      onboardingMap.set(s.account_id, { status: s.status, token: s.token })
    }
  }

  const combined: AdminAccount[] = accounts.map((acc) => {
    const b = billingMap.get(acc.id)
    const l = leadsPerAccount.get(acc.id) ?? { total: 0, thisMonth: 0 }
    const ob = onboardingMap.get(acc.id)
    return {
      id: acc.id,
      business_name: acc.business_name ?? 'Unnamed',
      owner_id: acc.owner_id,
      owner_email: userEmailMap.get(acc.owner_id) ?? '—',
      phone: acc.phone ?? null,
      created_at: acc.created_at,
      plan: b?.plan ?? null,
      credit_balance: b?.credit_balance ?? 0,
      total_spent: b?.total_spent ?? 0,
      stripe_customer_id: b?.stripe_customer_id ?? null,
      trial_ends_at: b?.trial_ends_at ?? null,
      blessed: b?.blessed ?? false,
      leads_total: l.total,
      leads_this_month: l.thisMonth,
      forms_count: formsPerAccount.get(acc.id) ?? 0,
      onboarding_status: (ob?.status as AdminAccount['onboarding_status']) ?? 'none',
      onboarding_token: ob?.token ?? null,
    }
  })

  return <AdminDashboard accounts={combined} />
}
