import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('accounts')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .single()

  if (!account) return <div className="p-8 text-red-600">No account found.</div>

  const admin = createAdminClient()

  // Fetch all active forms
  const { data: forms } = await supabase
    .from('hosted_forms')
    .select('id, form_name, form_config')
    .eq('account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch visits for last 30 days
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: visits } = await admin
    .from('form_visits')
    .select('hosted_form_id, visited_at')
    .eq('account_id', account.id)
    .gte('visited_at', since.toISOString())
    .order('visited_at', { ascending: true })

  // Fetch leads for last 30 days (for conversion rate)
  const { data: leads } = await supabase
    .from('leads')
    .select('hosted_form_id, created_at')
    .eq('account_id', account.id)
    .gte('created_at', since.toISOString())

  const allVisits = visits ?? []
  const allLeads = leads ?? []
  const allForms = forms ?? []

  // Per-form stats
  const formStats = allForms.map((f) => {
    const fVisits = allVisits.filter((v) => v.hosted_form_id === f.id)
    const fLeads = allLeads.filter((l) => l.hosted_form_id === f.id)
    const slug = (f.form_config as { slug?: string })?.slug ?? ''
    return {
      id: f.id,
      name: f.form_name,
      slug,
      visits: fVisits.length,
      leads: fLeads.length,
      convRate: fVisits.length > 0 ? ((fLeads.length / fVisits.length) * 100).toFixed(1) : '—',
    }
  })

  // Total stats
  const totalVisits = allVisits.length
  const totalLeads = allLeads.length
  const totalConvRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(1) : '—'

  // Daily visits for the last 30 days (all forms combined)
  const dailyMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const v of allVisits) {
    const day = v.visited_at.slice(0, 10)
    if (day in dailyMap) dailyMap[day]++
  }
  const dailyData = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))
  const maxCount = Math.max(...dailyData.map((d) => d.count), 1)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">QuoteBox page visits — last 30 days</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <SummaryCard label="Total Visits" value={totalVisits} sub="last 30 days" color="bg-indigo-600" />
          <SummaryCard label="Total Leads" value={totalLeads} sub="from visits" color="bg-green-500" />
          <SummaryCard label="Conversion Rate" value={`${totalConvRate}%`} sub="visits → leads" color="bg-purple-600" />
        </div>

        {/* Sparkline chart */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Daily Visits (last 30 days)</h2>
          <div className="flex items-end gap-[3px] h-24">
            {dailyData.map(({ date, count }) => {
              const pct = Math.round((count / maxCount) * 100)
              const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
              return (
                <div
                  key={date}
                  className="flex-1 group relative flex flex-col items-center justify-end"
                  style={{ height: '100%' }}
                  title={`${label}: ${count} visit${count !== 1 ? 's' : ''}`}
                >
                  <div
                    className="w-full rounded-sm bg-indigo-500 group-hover:bg-indigo-400 transition-colors"
                    style={{ height: count === 0 ? '2px' : `${Math.max(pct, 4)}%`, opacity: count === 0 ? 0.2 : 1 }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{dailyData[0]?.date ? new Date(dailyData[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}</span>
            <span>Today</span>
          </div>
        </div>

        {/* Per-form table */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">By Form</h2>
          </div>
          {formStats.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No active forms found. Create a QuoteBox to start tracking visits.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Form</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Visits</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Conv. Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {formStats.map((fs) => (
                  <tr key={fs.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{fs.name}</p>
                      {fs.slug && <p className="text-xs text-gray-400 mt-0.5">/{fs.slug}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{fs.visits}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{fs.leads}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        fs.convRate === '—' ? 'bg-gray-100 text-gray-500' :
                        parseFloat(fs.convRate) >= 10 ? 'bg-green-100 text-green-700' :
                        parseFloat(fs.convRate) >= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {fs.convRate}{fs.convRate !== '—' ? '%' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fs.slug && (
                        <a
                          href={`/${fs.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md ${color} text-white`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
