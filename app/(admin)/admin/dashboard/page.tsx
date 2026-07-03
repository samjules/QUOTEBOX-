import { createAdminClient } from '@/lib/supabase/admin'
import { alaskaWallTimeToUTC } from '@/lib/free-trial'

export const dynamic = 'force-dynamic'

const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }
const LABEL: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
const SECTION_TITLE: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={CARD}>
      <div style={LABEL}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0e0020', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

interface Scheduled {
  source: 'Sales Lead' | 'Free Trial / Demo'
  name: string
  email: string
  scheduled_date: string
  scheduled_time: string
  at: Date
  href: string
}

interface Activity {
  source: 'Sales Lead' | 'Free Trial / Demo'
  name: string
  email: string | null
  status: string
  created_at: string
}

export default async function AdminDashboardOverviewPage() {
  const admin = createAdminClient()

  const [accountsResult, salesLeadsResult, freeTrialLeadsResult] = await Promise.all([
    admin.from('accounts').select('id, created_at'),
    admin.from('sales_leads').select('id, name, email, status, scheduled_date, scheduled_time, created_at').order('created_at', { ascending: false }).limit(200),
    admin.from('free_trial_leads').select('id, name, email, status, scheduled_date, scheduled_time, created_at').order('created_at', { ascending: false }).limit(200),
  ])

  const accounts = accountsResult.data ?? []
  const salesLeads = salesLeadsResult.data ?? []
  const freeTrialLeads = freeTrialLeadsResult.data ?? []

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const salesStats = {
    total: salesLeads.length,
    new: salesLeads.filter((l) => l.status === 'new').length,
    contacted: salesLeads.filter((l) => l.status === 'contacted').length,
    closed: salesLeads.filter((l) => l.status === 'closed').length,
    lost: salesLeads.filter((l) => l.status === 'lost').length,
  }

  const freeTrialStats = {
    total: freeTrialLeads.length,
    pending: freeTrialLeads.filter((l) => l.status === 'pending_confirmation').length,
    confirmed: freeTrialLeads.filter((l) => l.status === 'confirmed').length,
    cancelled: freeTrialLeads.filter((l) => l.status === 'cancelled').length,
  }

  const upcoming: Scheduled[] = []
  for (const l of salesLeads) {
    if (!l.scheduled_date || !l.scheduled_time || l.status === 'lost') continue
    const at = alaskaWallTimeToUTC(l.scheduled_date, l.scheduled_time)
    if (!at || at.getTime() < now.getTime()) continue
    upcoming.push({ source: 'Sales Lead', name: l.name, email: l.email, scheduled_date: l.scheduled_date, scheduled_time: l.scheduled_time, at, href: '/admin/leads' })
  }
  for (const l of freeTrialLeads) {
    if (!l.scheduled_date || !l.scheduled_time || l.status === 'cancelled') continue
    const at = alaskaWallTimeToUTC(l.scheduled_date, l.scheduled_time)
    if (!at || at.getTime() < now.getTime()) continue
    upcoming.push({ source: 'Free Trial / Demo', name: l.name, email: l.email, scheduled_date: l.scheduled_date, scheduled_time: l.scheduled_time, at, href: '/admin/leads' })
  }
  upcoming.sort((a, b) => a.at.getTime() - b.at.getTime())

  const activity: Activity[] = [
    ...salesLeads.slice(0, 50).map((l): Activity => ({ source: 'Sales Lead', name: l.name, email: l.email, status: l.status, created_at: l.created_at })),
    ...freeTrialLeads.slice(0, 50).map((l): Activity => ({ source: 'Free Trial / Demo', name: l.name, email: l.email, status: l.status, created_at: l.created_at })),
  ]
  activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const sourceColor: Record<Activity['source'], { bg: string; text: string }> = {
    'Sales Lead': { bg: '#ede9fe', text: '#6d28d9' },
    'Free Trial / Demo': { bg: '#dcfce7', text: '#15803d' },
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e0020', margin: '0 0 4px' }}>Dashboard</h1>
      <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px' }}>
        Your leads — sales pipeline and free trial / demo bookings.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard label="Accounts" value={accounts.length} sub={`${accounts.filter((a) => new Date(a.created_at) >= startOfMonth).length} new this month`} />
        <StatCard label="Sales Pipeline" value={salesStats.total} sub={`${salesStats.new} new · ${salesStats.contacted} contacted · ${salesStats.closed} closed`} />
        <StatCard label="Free Trial / Demo" value={freeTrialStats.total} sub={`${freeTrialStats.pending} pending · ${freeTrialStats.confirmed} confirmed`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming calls */}
        <div>
          <p style={SECTION_TITLE}>Upcoming scheduled calls</p>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {upcoming.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No upcoming calls scheduled.</div>
            ) : (
              upcoming.slice(0, 12).map((u, i) => {
                const c = sourceColor[u.source]
                return (
                  <a key={i} href={u.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', textDecoration: 'none', borderBottom: i < Math.min(upcoming.length, 12) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0e0020' }}>{u.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                        {new Date(u.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {u.scheduled_time}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, background: c.bg, color: c.text, padding: '1px 7px', borderRadius: 99 }}>{u.source}</span>
                    </div>
                  </a>
                )
              })
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <p style={SECTION_TITLE}>Recent activity</p>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {activity.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No activity yet.</div>
            ) : (
              activity.slice(0, 12).map((a, i) => {
                const c = sourceColor[a.source]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < Math.min(activity.length, 12) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0e0020' }}>{a.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{a.email ?? '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, background: c.bg, color: c.text, padding: '1px 7px', borderRadius: 99 }}>{a.source}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
