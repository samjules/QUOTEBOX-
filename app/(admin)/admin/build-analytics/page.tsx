import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

const LANDING_CTA_LABELS: Record<string, string> = {
  landing_nav: 'Nav bar CTA',
  landing_hero: 'Hero CTA',
  landing_offer: 'Receipt/offer CTA',
  landing_final: 'Final CTA',
  landing_sticky: 'Sticky bar CTA',
}

const FUNNEL_STEPS: { event: string | string[]; label: string }[] = [
  { event: '__views__', label: 'Landing page view' },
  { event: Object.keys(LANDING_CTA_LABELS), label: 'Clicked a "Start" CTA' },
  { event: 'step_build_continue', label: 'Step 1 — Business info' },
  { event: 'step_rate_continue', label: 'Step 2 — Hourly rate' },
  { event: 'step_drive_continue', label: 'Step 3 — Drive time' },
  { event: 'step_goal_continue', label: 'Step 4 — Booking pledge' },
  { event: ['step_upsell_yes', 'step_upsell_no'], label: 'Step 5 — Upsell decision' },
  { event: 'step_account_submit', label: 'Step 6 — Submitted account form' },
  { event: '__accounts__', label: 'Account actually created' },
]

export default async function BuildAnalyticsPage() {
  const admin = createAdminClient()

  const [{ data: views }, { data: accounts }, { data: clicks }] = await Promise.all([
    admin.from('build_page_views').select('created_at'),
    admin.from('accounts').select('created_at').eq('signup_source', 'build'),
    admin.from('build_funnel_events').select('event, created_at'),
  ])

  const viewRows = views ?? []
  const accountRows = accounts ?? []
  const clickRows = clicks ?? []
  const totalViews = viewRows.length
  const totalAccounts = accountRows.length
  const rate = totalViews > 0 ? (totalAccounts / totalViews) * 100 : 0

  const clicksByEvent = new Map<string, number>()
  for (const c of clickRows) clicksByEvent.set(c.event, (clicksByEvent.get(c.event) ?? 0) + 1)

  function countFor(event: string | string[]): number {
    if (event === '__views__') return totalViews
    if (event === '__accounts__') return totalAccounts
    const events = Array.isArray(event) ? event : [event]
    return events.reduce((sum, e) => sum + (clicksByEvent.get(e) ?? 0), 0)
  }

  const funnelCounts = FUNNEL_STEPS.map((s) => ({ ...s, count: countFor(s.event) }))

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
        Page views, button presses through the wizard, and accounts actually created — so you can see exactly where people leave.
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

      {/* ── Funnel — where people drop off ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="text-sm font-semibold mb-4" style={{ color: '#0e0020' }}>Funnel — step by step</div>
        <div className="flex flex-col gap-2">
          {funnelCounts.map((s, i) => {
            const prev = i > 0 ? funnelCounts[i - 1].count : s.count
            const dropOffPct = prev > 0 ? 100 - (s.count / prev) * 100 : 0
            const widthPct = totalViews > 0 ? Math.max(2, (s.count / totalViews) * 100) : 0
            return (
              <div key={s.label} className="flex items-center gap-4">
                <div className="w-56 shrink-0 text-xs text-gray-600">{s.label}</div>
                <div className="flex-1 bg-gray-100 rounded-md h-7 relative overflow-hidden">
                  <div
                    className="h-full rounded-md flex items-center justify-end pr-2"
                    style={{ width: `${widthPct}%`, background: 'linear-gradient(90deg, #5b50d6, #453bc2)', minWidth: 32 }}
                  >
                    <span className="text-xs font-bold text-white">{s.count}</span>
                  </div>
                </div>
                <div className="w-20 shrink-0 text-xs text-right" style={{ color: i > 0 && dropOffPct > 0 ? '#dc2626' : '#9ca3af' }}>
                  {i > 0 ? `-${dropOffPct.toFixed(0)}%` : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Which "Start" CTA people actually click ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="text-sm font-semibold mb-4" style={{ color: '#0e0020' }}>Which &quot;Start&quot; button gets clicked</div>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(LANDING_CTA_LABELS).map(([event, label]) => (
            <div key={event}>
              <div className="text-xl font-bold" style={{ color: '#0e0020' }}>{clicksByEvent.get(event) ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
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
        Views are tracked client-side on landing-page mount. Button presses are tracked per-click (not deduped per visitor).
        Accounts are counted from accounts.signup_source = &apos;build&apos;.
      </p>
    </div>
  )
}
