'use client'

import type { ReactNode } from 'react'
import { DEMO_STATS, DEMO_LEADS, STATUS_COLORS } from '@/lib/demo-data'

const CARD = 'overflow-hidden rounded-2xl border'
const CARD_STYLE = { background: '#fff', borderColor: '#e8e8ec', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className={CARD} style={CARD_STYLE}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>{label}</p>
          <div className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 ml-2 text-gray-400" style={{ background: '#f3f4f6' }}>
            {icon}
          </div>
        </div>
        <p className="tabular-nums font-bold text-gray-900 leading-none" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, letterSpacing: '0.04em' }}>{sub}</p>}
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className={CARD} style={CARD_STYLE}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 rounded-xl p-2.5 text-gray-400" style={{ background: '#f3f4f6' }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>{label}</p>
            <p className="tabular-nums font-bold text-gray-900" style={{ fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 2 }}>{value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border transition-colors" style={{ borderColor: '#e8e8ec' }}>
      <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-gray-500" style={{ background: '#f3f4f6' }}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13.5 }}>{title}</p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{desc}</p>
      </div>
    </div>
  )
}

export default function DemoOverview() {
  const s = DEMO_STATS
  return (
    <div className="min-h-full" style={{ background: '#f5f5f7' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-extrabold tracking-tight" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 28, letterSpacing: '-0.03em', color: '#111' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{s.periodLabel}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {['Today', 'Week', 'Month', 'Year', 'All'].map((l) => (
              <span
                key={l}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8,
                  background: l === 'Month' ? '#13122b' : '#fff',
                  color: l === 'Month' ? '#fff' : '#6b7280',
                  border: '1px solid #e8e8ec',
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className={CARD} style={{ ...CARD_STYLE, padding: '24px 28px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>
              Pipeline Value · {s.periodLabel}
            </p>
            <p className="tabular-nums" style={{ fontSize: 48, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>
              ${s.pipelineValue.toLocaleString('en-US')}
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>{s.totalLeads} total leads</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-10 space-y-5" style={{ marginTop: 8 }}>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${CARD} lg:col-span-1`} style={CARD_STYLE}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>Total Leads</p>
                <div className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400" style={{ background: '#f3f4f6' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                </div>
              </div>
              <p className="tabular-nums" style={{ fontSize: 42, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.totalLeads}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, letterSpacing: '0.04em' }}>{s.periodLabel}</p>
            </div>
          </div>

          <StatCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
            label="New Leads" value={s.newLeads} sub={s.periodLabel}
          />
          <StatCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Booked" value={s.bookedLeads} sub={s.periodLabel}
          />
          <StatCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
            label="Conversion" value={`${s.conversionRate}%`} sub={s.periodLabel}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MiniStat
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5" style={{ color: '#5b5bd6' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>}
            label="Contacted" value={s.contactedLeads}
          />
          <MiniStat
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
            label="Lost" value={s.lostLeads}
          />
          <MiniStat
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5" style={{ color: '#5b5bd6' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
            label="Conversion Rate" value={`${s.conversionRate}%`}
          />
        </div>

        {/* Recent leads */}
        <div className={CARD} style={CARD_STYLE}>
          <div className="p-5 pb-3">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 15 }}>Recent Activity</h3>
          </div>
          {DEMO_LEADS.slice(0, 4).map((lead) => (
            <div key={lead.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
              <div>
                <p className="font-semibold text-gray-900" style={{ fontSize: 13.5 }}>{lead.name}</p>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>{lead.service}</p>
              </div>
              <div className="text-right">
                <p className="tabular-nums font-bold text-gray-900" style={{ fontSize: 14 }}>${lead.quote}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[lead.status], textTransform: 'capitalize' }}>{lead.status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className={`${CARD} p-6`} style={CARD_STYLE}>
          <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 15 }}>Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} title="View All Leads" desc="Manage your leads" />
            <QuickAction icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} title="Hosted Forms" desc="Manage your forms" />
            <QuickAction icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>} title="Billing" desc="Manage credits" />
            <QuickAction icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>} title="Rewards" desc="View your pipeline tier" />
          </div>
        </div>

      </div>
    </div>
  )
}
