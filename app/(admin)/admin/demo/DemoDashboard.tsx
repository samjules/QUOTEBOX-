'use client'

import { useState } from 'react'
import { DEMO_BUSINESS_NAME, DEMO_STATS, DEMO_LEADS, DEMO_FORMS, STATUS_COLORS } from '@/lib/demo-data'
import DemoInstantForm from './DemoInstantForm'

type Tab = 'overview' | 'leads' | 'forms'

export default function DemoDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [showInstantForm, setShowInstantForm] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f4f6', fontFamily: "'Nautic', sans-serif" }}>

      {/* Demo mode banner */}
      <div style={{ background: '#0e0020', color: '#FFE500', fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', padding: '6px 12px', letterSpacing: '0.04em' }}>
        🎬 SALES DEMO MODE — fake data, nothing here is saved
        <a href="/admin" style={{ color: 'white', marginLeft: 16, textDecoration: 'underline', opacity: 0.8 }}>Exit Demo</a>
      </div>

      {/* Top bar */}
      <div style={{ height: 60, background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#0e0020' }}>
          {DEMO_BUSINESS_NAME}
        </span>
        <span style={{ flex: 1 }} />
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#5b5bd6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
          S
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '14px 24px 0', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        {([['overview', 'Overview'], ['leads', 'Leads'], ['forms', 'Hosted Forms']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            style={{
              padding: '10px 18px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              border: 'none', borderBottom: tab === val ? '2.5px solid #5b5bd6' : '2.5px solid transparent',
              background: 'transparent', color: tab === val ? '#5b5bd6' : '#94a3b8',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Leads This Month', value: DEMO_STATS.leadsThisMonth },
                  { label: 'Revenue This Month', value: `$${DEMO_STATS.revenueThisMonth.toLocaleString()}` },
                  { label: 'Conversion Rate', value: `${DEMO_STATS.conversionRate}%` },
                  { label: 'Credit Balance', value: `$${DEMO_STATS.creditBalance.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                    Recent Activity
                  </h3>
                </div>
                {DEMO_LEADS.slice(0, 4).map((lead) => (
                  <div key={lead.id} style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{lead.service}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>${lead.quote}</div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_COLORS[lead.status] }}>{lead.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'leads' && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Name', 'Contact', 'Service', 'Quote', 'Status', 'Date'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_LEADS.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>{lead.name}</td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>{lead.email}<br /><span style={{ color: '#94a3b8' }}>{lead.phone}</span></td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>{lead.service}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b' }}>${lead.quote}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: STATUS_COLORS[lead.status] + '20', color: STATUS_COLORS[lead.status] }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'forms' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {DEMO_FORMS.map((form) => (
                <div key={form.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: '#ffe500', padding: '16px 18px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.42)', marginBottom: 6 }}>
                      {form.instant ? 'Instant Quote' : `${form.steps} steps`}
                    </div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#5b5bd6' }}>
                      {form.form_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{form.leads}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Leads</div>
                    </div>
                    <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: form.is_active ? '#dcfce7' : '#f1f5f9', color: form.is_active ? '#15803d' : '#64748b' }}>
                        {form.is_active ? 'Live' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: 14, marginTop: 'auto' }}>
                    {form.instant ? (
                      <button
                        onClick={() => setShowInstantForm(true)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', background: '#5b5bd6', color: 'white', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        ▶ Try Instant Form
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', color: '#94a3b8', fontWeight: 600, fontSize: '0.82rem', cursor: 'not-allowed' }}
                      >
                        Preview (demo only)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {showInstantForm && <DemoInstantForm onClose={() => setShowInstantForm(false)} />}
    </div>
  )
}
