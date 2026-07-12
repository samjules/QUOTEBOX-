import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getMetaAdSpend } from '@/lib/meta-ads'

export const dynamic = 'force-dynamic'

const CASESTUDY_FUNNEL_STEPS: { event: string; label: string }[] = [
  { event: 'casestudy_view', label: 'Page view' },
  { event: 'casestudy_gate_submit', label: 'Unlocked video (Lead)' },
  { event: 'casestudy_booking_submit', label: 'Booked a call (Schedule)' },
]

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function CaseStudyAnalyticsPage() {
  const admin = createAdminClient()

  // Reuse the same Meta connection every customer already has — whichever
  // account you (the logged-in admin) connected Meta ads to from Settings,
  // same as any customer would.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myAccount } = user
    ? await admin.from('accounts').select('meta_access_token, meta_ad_account_id').eq('owner_id', user.id).single()
    : { data: null }

  const [{ data: clicks }, { data: caseStudyLeads }, adSpend] = await Promise.all([
    admin.from('build_funnel_events').select('event, created_at'),
    admin.from('sales_leads').select('id, scheduled_date, created_at').eq('source', 'case_study'),
    myAccount?.meta_access_token && myAccount?.meta_ad_account_id
      ? getMetaAdSpend(myAccount.meta_access_token, myAccount.meta_ad_account_id)
      : Promise.resolve(null),
  ])

  const clickRows = clicks ?? []
  const clicksByEvent = new Map<string, number>()
  for (const c of clickRows) clicksByEvent.set(c.event, (clicksByEvent.get(c.event) ?? 0) + 1)

  const csLeads = caseStudyLeads ?? []
  const csBooked = csLeads.filter((l) => l.scheduled_date).length
  const funnelCounts = CASESTUDY_FUNNEL_STEPS.map((s) => ({ ...s, count: clicksByEvent.get(s.event) ?? 0 }))
  const firstCount = funnelCounts[0]?.count ?? 0

  const costPerLead = adSpend && csLeads.length > 0 ? adSpend.totalSpend / csLeads.length : null
  const costPerBooking = adSpend && csBooked > 0 ? adSpend.totalSpend / csBooked : null

  return (
    <div className="p-8" style={{ background: '#f4f4f6', minHeight: '100%' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#0e0020' }}>/casestudy analytics</h1>
      <p className="text-sm text-gray-500 mb-6">
        Case study lead magnet — page view, email gate, and $297 walkthrough bookings, plus Meta ad spend feeding it.
      </p>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{csLeads.length}</div>
          <div className="text-xs text-gray-500 mt-1">leads captured</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{csBooked}</div>
          <div className="text-xs text-gray-500 mt-1">calls booked</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>
            {firstCount > 0 ? `${((csLeads.length / firstCount) * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">view → lead conversion</div>
        </div>
      </div>

      {/* ── Funnel ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="text-sm font-semibold mb-4" style={{ color: '#0e0020' }}>Funnel — step by step</div>
        <div className="flex flex-col gap-2">
          {funnelCounts.map((s, i) => {
            const prev = i > 0 ? funnelCounts[i - 1].count : s.count
            const dropOffPct = prev > 0 ? 100 - (s.count / prev) * 100 : 0
            const widthPct = firstCount > 0 ? Math.max(2, (s.count / firstCount) * 100) : 0
            return (
              <div key={s.label} className="flex items-center gap-4">
                <div className="w-56 shrink-0 text-xs text-gray-600">{s.label}</div>
                <div className="flex-1 bg-gray-100 rounded-md h-7 relative overflow-hidden">
                  <div
                    className="h-full rounded-md flex items-center justify-end pr-2"
                    style={{ width: `${widthPct}%`, background: 'linear-gradient(90deg, #f4a93c, #e8922a)', minWidth: 32 }}
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

      {/* ── Meta ad spend ── */}
      <div className="mb-2">
        <h2 className="text-base font-semibold mb-1" style={{ color: '#0e0020' }}>Meta ad spend</h2>
        <p className="text-sm text-gray-500 mb-4">Last 30 days, from the ad account driving traffic to /casestudy.</p>
      </div>

      {!adSpend ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 text-sm text-gray-500">
          Meta ads isn&apos;t connected on your account yet. Connect it the same way any customer would —{' '}
          <a href="/settings" className="font-semibold" style={{ color: '#5b50d6' }}>Settings → Connect Meta Ads</a> — and spend will show up here automatically.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{money(adSpend.totalSpend)}</div>
              <div className="text-xs text-gray-500 mt-1">total spend (30d)</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{costPerLead !== null ? money(costPerLead) : '—'}</div>
              <div className="text-xs text-gray-500 mt-1">cost per lead (CRM)</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{costPerBooking !== null ? money(costPerBooking) : '—'}</div>
              <div className="text-xs text-gray-500 mt-1">cost per booked call</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Campaign</th>
                  <th className="px-5 py-3 font-semibold">Spend</th>
                  <th className="px-5 py-3 font-semibold">Impressions</th>
                  <th className="px-5 py-3 font-semibold">Clicks</th>
                  <th className="px-5 py-3 font-semibold">Meta Leads</th>
                  <th className="px-5 py-3 font-semibold">CPL</th>
                </tr>
              </thead>
              <tbody>
                {adSpend.campaigns.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-gray-400">No campaign activity in the last 30 days.</td></tr>
                ) : adSpend.campaigns.map((c) => (
                  <tr key={c.campaignName} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-2.5" style={{ color: '#0e0020' }}>{c.campaignName}</td>
                    <td className="px-5 py-2.5" style={{ color: '#0e0020' }}>{money(c.spend)}</td>
                    <td className="px-5 py-2.5 text-gray-600">{c.impressions.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-gray-600">{c.clicks.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-gray-600">{c.leads.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-gray-600">{c.cpl > 0 ? money(c.cpl) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400">
        Leads/bookings come from sales_leads where source = &apos;case_study&apos;. Cost-per-lead and cost-per-booking are approximate — they divide total ad account spend by lead counts, not spend isolated to a single campaign or landing page.
      </p>
    </div>
  )
}
