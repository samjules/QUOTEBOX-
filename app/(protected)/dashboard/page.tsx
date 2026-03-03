import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DealNotificationBanner from '@/components/DealNotificationBanner'
import type { ReactNode } from 'react'

const PLAN_LIMITS: Record<string, number> = { starter: 10, growth: 50 }

export default async function DashboardPage() {
  const supabase = createClient()

  // Auth timing fix: session first, then user validation
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch account
  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!account) {
    return (
      <div className="p-8 text-red-600">
        No account found. Please contact support.
      </div>
    )
  }

  // Fetch all leads
  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads = allLeads ?? []

  // Fetch billing — create record if missing (use admin to bypass RLS)
  const admin = createAdminClient()
  let { data: billing } = await admin
    .from('billing')
    .select('*')
    .eq('account_id', account.id)
    .single()

  if (!billing) {
    const { data: newBilling } = await admin
      .from('billing')
      .insert([{ account_id: account.id, credit_balance: 0, total_spent: 0 }])
      .select()
      .single()
    billing = newBilling
  }

  // Monthly transactions
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyTxns } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('account_id', account.id)
    .eq('type', 'lead_charge')
    .gte('created_at', startOfMonth.toISOString())

  // Onboarding checklist data
  const [{ data: vsls }, { data: forms }, { data: campaigns }] = await Promise.all([
    supabase.from('vsls').select('id').eq('account_id', account.id).limit(1),
    supabase.from('hosted_forms').select('id').eq('account_id', account.id).limit(1),
    supabase.from('meta_campaigns').select('id').eq('account_id', account.id).limit(1),
  ])

  const metaConnected = !!account.meta_access_token
  const hasBillingPlan = !!billing?.plan
  const hasCreatives = (vsls?.length ?? 0) > 0
  const hasForm = (forms?.length ?? 0) > 0
  const hasCampaign = (campaigns?.length ?? 0) > 0
  const onboardingComplete = metaConnected && hasBillingPlan && hasCreatives && hasForm

  // Compute stats
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const bookedLeads = leads.filter((l) => l.status === 'booked').length
  const contactedLeads = leads.filter((l) => l.status === 'contacted').length
  const lostLeads = leads.filter((l) => l.status === 'lost').length
  const conversionRate =
    totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0'
  const monthlySpending = monthlyTxns
    ? Math.abs(monthlyTxns.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0))
    : 0
  const plan = billing?.plan ?? null
  const monthlyLeads = leads.filter((l) => new Date(l.created_at) >= startOfMonth).length

  // Monthly pipeline: sum of _quote_total from leads this month
  const monthlyPipeline = leads
    .filter((l) => new Date(l.created_at) >= startOfMonth)
    .reduce((sum, l) => {
      const qt = (l.form_data as Record<string, unknown> | null)?._quote_total
      return sum + (typeof qt === 'number' ? qt : 0)
    }, 0)

  return (
    <div className="py-6">
      <DealNotificationBanner position="top" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your lead generation performance
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">
          {/* Lead usage banner */}
          <LeadUsageBanner plan={plan} monthlyLeads={monthlyLeads} />

          {/* Onboarding checklist */}
          {!onboardingComplete && (
            <OnboardingChecklist
              metaConnected={metaConnected}
              hasBillingPlan={hasBillingPlan}
              hasCreatives={hasCreatives}
              hasForm={hasForm}
              hasCampaign={hasCampaign}
            />
          )}

          {/* Primary Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
              iconBg="bg-indigo-600"
              label="Total Leads"
              value={totalLeads}
            />
            <StatCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
              iconBg="bg-yellow-500"
              label="New Leads"
              value={newLeads}
            />
            <StatCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-green-500"
              label="Booked Leads"
              value={bookedLeads}
            />
            <StatCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-purple-600"
              label="Monthly Spending"
              value={`$${monthlySpending.toFixed(2)}`}
            />
          </div>

          {/* Monthly Pipeline */}
          <div className="bg-white overflow-hidden shadow rounded-xl">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Monthly Pipeline Value</dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        ${monthlyPipeline.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">This month</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {leads.filter((l) => new Date(l.created_at) >= startOfMonth).length} leads
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <MiniStat
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>}
              iconBg="bg-blue-100"
              label="Contacted"
              value={contactedLeads}
            />
            <MiniStat
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
              iconBg="bg-red-100"
              label="Lost"
              value={lostLeads}
            />
            <MiniStat
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
              iconBg="bg-green-100"
              label="Conversion Rate"
              value={`${conversionRate}%`}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction
                href="/leads"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                title="View All Leads"
                desc="Manage your leads"
              />
              <QuickAction
                href="/hosted-forms"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                title="Hosted Forms"
                desc="Manage your forms"
              />
              <QuickAction
                href="/billing"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>}
                title="Billing"
                desc="Manage credits"
              />
              <QuickAction
                href="/rewards"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>}
                title="Rewards"
                desc="View your pipeline tier"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Components ────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`flex items-center justify-center h-12 w-12 rounded-md ${iconBg} text-white`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-lg p-3`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
    >
      <span className="text-gray-500 mr-3">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  )
}

// ── Onboarding Checklist ──────────────────────────────────────

function OnboardingChecklist({
  metaConnected,
  hasBillingPlan,
  hasCreatives,
  hasForm,
  hasCampaign,
}: {
  metaConnected: boolean
  hasBillingPlan: boolean
  hasCreatives: boolean
  hasForm: boolean
  hasCampaign: boolean
}) {
  const steps = [
    {
      label: 'Connect your Meta account',
      desc: 'Link your Facebook/Instagram account to enable ad campaigns',
      href: '/settings',
      done: metaConnected,
    },
    {
      label: 'Select a billing plan',
      desc: 'Choose a plan to start receiving leads',
      href: '/billing',
      done: hasBillingPlan,
    },
    {
      label: 'Upload ad creatives',
      desc: 'Add images or videos to use in your ad campaigns',
      href: '/vsls',
      done: hasCreatives,
    },
    {
      label: 'Create a QuoteBox',
      desc: 'Build a quote form to capture and qualify your leads',
      href: '/form-builder',
      done: hasForm,
    },
    {
      label: 'Launch an ad campaign',
      desc: 'Set up your first Meta ad campaign to drive traffic',
      href: '/meta-ads',
      done: hasCampaign,
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const progressPct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Get started</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {completedCount} of {steps.length} steps completed — close your first job this week!
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-400 w-8 text-right">{progressPct}%</span>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-gray-50">
        {steps.map((step, i) => (
          <ChecklistStep key={step.label} number={i + 1} {...step} />
        ))}
      </ul>
    </div>
  )
}

function ChecklistStep({
  number,
  label,
  desc,
  href,
  done,
}: {
  number: number
  label: string
  desc: string
  href: string
  done: boolean
}) {
  return (
    <li className={`flex items-center gap-4 px-6 py-3.5 ${done ? 'bg-gray-50/50' : ''}`}>
      {/* Step indicator */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          done
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
      </div>
      {/* Action */}
      {done ? (
        <span className="flex-shrink-0 text-xs font-medium text-green-600">Done</span>
      ) : (
        <Link
          href={href}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition whitespace-nowrap"
        >
          Start &rarr;
        </Link>
      )}
    </li>
  )
}

// ── Lead Usage Banner ─────────────────────────────────────────

function LeadUsageBanner({
  plan,
  monthlyLeads,
}: {
  plan: string | null
  monthlyLeads: number
}) {
  // No plan
  if (!plan) {
    return (
      <div className="rounded-lg p-5 flex items-center justify-between bg-yellow-50 border border-yellow-300">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-500 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-semibold text-sm text-yellow-800">No active subscription</p>
            <p className="text-sm text-yellow-700">Subscribe to a plan to start receiving leads.</p>
          </div>
        </div>
        <Link href="/billing" className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition">
          View Plans
        </Link>
      </div>
    )
  }

  // Fully managed — $15/lead, no monthly cap
  if (plan === 'fully_managed') {
    const accrued = monthlyLeads * 15
    return (
      <div className="rounded-lg p-5 flex items-center justify-between bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Fully Managed — {monthlyLeads} lead{monthlyLeads !== 1 ? 's' : ''} this month</p>
            <p className="text-sm text-gray-400">${accrued.toFixed(2)} accrued at $15.00/lead</p>
          </div>
        </div>
        <Link href="/billing" className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition">
          Billing
        </Link>
      </div>
    )
  }

  // Starter / Growth — monthly lead cap
  const limit = PLAN_LIMITS[plan] ?? 10
  const pct = Math.min(100, Math.round((monthlyLeads / limit) * 100))
  const isOver = monthlyLeads >= limit
  const isNearing = !isOver && pct >= 80
  const planLabel = plan === 'growth' ? 'Growth' : 'Starter'

  if (isOver) {
    return (
      <div className="rounded-lg p-5 flex items-center justify-between bg-red-50 border border-red-300">
        <div className="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-semibold text-sm text-red-800">Monthly lead limit reached ({limit}/{limit})</p>
            <p className="text-sm text-red-600">
              {plan === 'starter'
                ? 'Upgrade to Growth for 50 leads/month.'
                : 'New leads are paused until next month or you upgrade to Fully Managed.'}
            </p>
          </div>
        </div>
        <Link href="/billing" className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition">
          Upgrade
        </Link>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-5 border ${isNearing ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 flex-shrink-0 ${isNearing ? 'text-yellow-500' : 'text-indigo-500'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span className={`font-semibold text-sm ${isNearing ? 'text-yellow-800' : 'text-gray-800'}`}>
            {planLabel} plan — {monthlyLeads} / {limit} leads this month
          </span>
        </div>
        <span className={`text-xs font-bold ${isNearing ? 'text-yellow-600' : 'text-indigo-600'}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearing ? 'bg-yellow-400' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isNearing && (
        <p className="text-xs text-yellow-700 mt-2">
          Nearing your monthly limit — <Link href="/billing" className="underline font-medium">upgrade your plan</Link> to avoid interruptions.
        </p>
      )}
    </div>
  )
}
