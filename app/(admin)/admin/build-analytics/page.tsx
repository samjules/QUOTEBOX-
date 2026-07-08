import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export default async function BuildAnalyticsPage() {
  const admin = createAdminClient()

  const [{ data: views }, { data: accounts }] = await Promise.all([
    admin.from('build_page_views').select('created_at'),
    admin.from('accounts').select('created_at').eq('signup_source', 'build'),
  ])

  const viewRows = views ?? []
  const accountRows = accounts ?? []
  const totalViews = viewRows.length
  const totalAccounts = accountRows.length
  const rate = totalViews > 0 ? (totalAccounts / totalViews) * 100 : 0

  // Daily breakdown for the last 30 days, most recent first.
  const viewsByDay = new Map<string, number>()
  for (const r of viewRows) viewsByDay.set(dayKey(r.created_at), (viewsByDay.get(dayKey(r.created_at)) ?? 0) + 1)
  const accountsByDay = new Map<string, number>()
  for (const r of accountRows) accountsByDay.set(dayKey(r.created_at), (accountsByDay.get(dayKey(r.created_at)) ?? 0) + 1)

  const days: string[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  return (
    <div className="p-8" style={{ background: '#f4f4f6', minHeight: '100%' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#0e0020' }}>/build funnel analytics</h1>
      <p className="text-sm text-gray-500 mb-6">
        Page views on the /build landing page vs. accounts actually created through it.
      </p>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{totalViews}</div>
          <div className="text-xs text-gray-500 mt-1">total page views</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{totalAccounts}</div>
          <div className="text-xs text-gray-500 mt-1">accounts created</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{rate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">view → account conversion</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Views</th>
              <th className="px-5 py-3 font-semibold">Accounts</th>
              <th className="px-5 py-3 font-semibold">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const v = viewsByDay.get(day) ?? 0
              const a = accountsByDay.get(day) ?? 0
              const r = v > 0 ? (a / v) * 100 : 0
              return (
                <tr key={day} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-2.5 text-gray-700">{day}</td>
                  <td className="px-5 py-2.5" style={{ color: '#0e0020' }}>{v}</td>
                  <td className="px-5 py-2.5" style={{ color: '#0e0020' }}>{a}</td>
                  <td className="px-5 py-2.5 text-gray-500">{v > 0 ? `${r.toFixed(0)}%` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Views are tracked client-side on landing-page mount. Accounts are counted from accounts.signup_source = &apos;build&apos;.
      </p>
    </div>
  )
}
