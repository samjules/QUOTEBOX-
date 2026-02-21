import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ReactNode } from 'react'

const COST_PER_LEAD = 15

// ── SVG Icons ──────────────────────────────────────────────────
function IconBars() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconSparkles() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconCurrencyDollar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
    </svg>
  )
}

function IconXMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconTrendingUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function IconFunnel() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!account) {
    return <div className="p-8 text-red-600">No account found. Please contact support.</div>
  }

  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads = allLeads ?? []

  let { data: billing } = await supabase
    .from('billing')
    .select('*')
    .eq('account_id', account.id)
    .single()

  if (!billing) {
    const { data: newBilling } = await supabase
      .from('billing')
      .insert([{ account_id: account.id, credit_balance: 0, total_spent: 0 }])
      .select()
      .single()
    billing = newBilling
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyTxns } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('account_id', account.id)
    .eq('type', 'lead_charge')
    .gte('created_at', startOfMonth.toISOString())

  // Stats
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const bookedLeads = leads.filter((l) => l.status === 'booked').length
  const contactedLeads = leads.filter((l) => l.status === 'contacted').length
  const lostLeads = leads.filter((l) => l.status === 'lost').length
  const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0'
  const monthlySpending = monthlyTxns
    ? Math.abs(monthlyTxns.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0))
    : 0
  const creditBalance = billing?.credit_balance ?? 0
  const remainingLeads = Math.floor(creditBalance / COST_PER_LEAD)

  // Monthly pipeline: sum of _quote_total from leads created this month
  const monthlyPipeline = leads
    .filter((l) => new Date(l.created_at) >= startOfMonth)
    .reduce((sum, l) => {
      const qt = (l.form_data as Record<string, unknown> | null)?._quote_total
      return sum + (typeof qt === 'number' ? qt : 0)
    }, 0)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Overview of your lead generation performance</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">

          {/* Low balance banner */}
          {creditBalance < COST_PER_LEAD && (
            <div className={`rounded-lg p-4 flex items-center justify-between ${creditBalance <= 0 ? 'bg-red-50 border border-red-300' : 'bg-yellow-50 border border-yellow-300'}`}>
              <div className="flex items-center gap-3">
                <span className={creditBalance <= 0 ? 'text-red-500' : 'text-yellow-500'}>
                  <IconAlert />
                </span>
                <div>
                  <p className={`font-semibold text-sm ${creditBalance <= 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                    {creditBalance <= 0 ? 'No credits remaining' : 'Low credit balance'}
                  </p>
                  <p className={`text-sm ${creditBalance <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {creditBalance <= 0
                      ? 'New leads are paused. Add credits to continue receiving leads.'
                      : `Your balance ($${creditBalance.toFixed(2)}) is below $${COST_PER_LEAD.toFixed(2)}. Top up to keep receiving leads.`}
                  </p>
                </div>
              </div>
              <Link
                href="/billing"
                className={`ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition ${creditBalance <= 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
              >
                Add Credits
              </Link>
            </div>
          )}

          {/* Primary Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<IconBars />} iconBg="bg-indigo-600" label="Total Leads" value={totalLeads} />
            <StatCard icon={<IconSparkles />} iconBg="bg-yellow-500" label="New Leads" value={newLeads} />
            <StatCard icon={<IconCheckCircle />} iconBg="bg-green-500" label="Booked Leads" value={bookedLeads} />
            <StatCard icon={<IconCurrencyDollar />} iconBg="bg-purple-600" label="Monthly Spending" value={`$${monthlySpending.toFixed(2)}`} />
          </div>

          {/* Monthly Pipeline */}
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white flex-shrink-0">
                  <IconFunnel />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Pipeline Value</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    ${monthlyPipeline.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">This month</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {leads.filter((l) => new Date(l.created_at) >= startOfMonth).length} leads
                </p>
              </div>
            </div>
            <div className="h-1 bg-gray-100">
              <div
                className="h-1 bg-emerald-500 rounded-full transition-all"
                style={{ width: monthlyPipeline > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <MiniStat icon={<IconPhone />} iconBg="bg-blue-100" iconColor="text-blue-600" label="Contacted" value={contactedLeads} />
            <MiniStat icon={<IconXMark />} iconBg="bg-red-100" iconColor="text-red-600" label="Lost" value={lostLeads} />
            <MiniStat icon={<IconTrendingUp />} iconBg="bg-green-100" iconColor="text-green-600" label="Conversion Rate" value={`${conversionRate}%`} />
          </div>

          {/* Credit Balance Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Available Credits</p>
                <p className="text-4xl font-bold mt-2">${creditBalance.toFixed(2)}</p>
                <p className="text-indigo-100 text-sm mt-2">{remainingLeads} leads remaining</p>
              </div>
              <div className="text-right">
                <Link
                  href="/billing"
                  className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-md inline-block"
                >
                  Add Credits
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction href="/leads" icon={<IconUsers />} title="View All Leads" desc="Manage your leads" />
              <QuickAction href="/hosted-forms" icon={<IconDocument />} title="Hosted Forms" desc="Manage your forms" />
              <QuickAction href="/billing" icon={<IconCreditCard />} title="Billing" desc="Manage credits" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value }: { icon: ReactNode; iconBg: string; label: string; value: string | number }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex items-center justify-center h-12 w-12 rounded-md ${iconBg} text-white flex-shrink-0`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
            <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, iconBg, iconColor, label, value }: { icon: ReactNode; iconBg: string; iconColor: string; label: string; value: string | number }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-lg p-3 ${iconColor}`}>
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

function QuickAction({ href, icon, title, desc }: { href: string; icon: ReactNode; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
    >
      <span className="text-gray-600 mr-3">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  )
}
