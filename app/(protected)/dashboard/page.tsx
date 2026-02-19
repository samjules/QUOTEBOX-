import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const COST_PER_LEAD = 0.25

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

  // Fetch billing — create record if missing
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
  const creditBalance = billing?.credit_balance ?? 0
  const remainingLeads = Math.floor(creditBalance / COST_PER_LEAD)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your lead generation performance
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">
          {/* Primary Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="📊"
              iconBg="bg-indigo-600"
              label="Total Leads"
              value={totalLeads}
            />
            <StatCard
              icon="🆕"
              iconBg="bg-yellow-500"
              label="New Leads"
              value={newLeads}
            />
            <StatCard
              icon="✅"
              iconBg="bg-green-500"
              label="Booked Leads"
              value={bookedLeads}
            />
            <StatCard
              icon="💰"
              iconBg="bg-purple-600"
              label="Monthly Spending"
              value={`$${monthlySpending.toFixed(2)}`}
            />
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <MiniStat
              icon="📞"
              iconBg="bg-blue-100"
              label="Contacted"
              value={contactedLeads}
            />
            <MiniStat
              icon="❌"
              iconBg="bg-red-100"
              label="Lost"
              value={lostLeads}
            />
            <MiniStat
              icon="📈"
              iconBg="bg-green-100"
              label="Conversion Rate"
              value={`${conversionRate}%`}
            />
          </div>

          {/* Credit Balance Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Available Credits
                </p>
                <p className="text-4xl font-bold mt-2">
                  ${creditBalance.toFixed(2)}
                </p>
                <p className="text-indigo-100 text-sm mt-2">
                  {remainingLeads} leads remaining
                </p>
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
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction
                href="/leads"
                icon="👥"
                title="View All Leads"
                desc="Manage your leads"
              />
              <QuickAction
                href="/hosted-forms"
                icon="📝"
                title="Hosted Forms"
                desc="Manage your forms"
              />
              <QuickAction
                href="/billing"
                icon="💳"
                title="Billing"
                desc="Manage credits"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: string
  iconBg: string
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`flex items-center justify-center h-12 w-12 rounded-md ${iconBg} text-white text-2xl`}
            >
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {label}
              </dt>
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
  icon: string
  iconBg: string
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-lg p-3`}>
            <span className="text-2xl">{icon}</span>
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
  icon: string
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
    >
      <span className="text-2xl mr-3">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  )
}
