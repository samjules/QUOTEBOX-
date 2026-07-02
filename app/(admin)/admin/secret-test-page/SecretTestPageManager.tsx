'use client'

import { useState, useMemo } from 'react'
import type { FreeTrialLead } from './page'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_confirmation: { bg: '#d9770620', text: '#f59e0b' },
  confirmed: { bg: '#16a34a20', text: '#22c55e' },
  cancelled: { bg: '#dc262620', text: '#ef4444' },
  completed: { bg: '#1e40af20', text: '#3b82f6' },
}

const STATUS_ORDER = ['pending_confirmation', 'confirmed', 'cancelled', 'completed'] as const

type FilterTab = 'all' | typeof STATUS_ORDER[number]

function YesNo({ v }: { v: boolean }) {
  return <span style={{ color: v ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{v ? 'Y' : 'N'}</span>
}

type ViewTab = 'list' | 'calendar'

export default function SecretTestPageManager({ leads: initialLeads }: { leads: FreeTrialLead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [view, setView] = useState<ViewTab>('list')
  const [monthOffset, setMonthOffset] = useState(0)
  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<{ steps: { name: string; ok: boolean; error?: string }[] } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function runTestFlow() {
    setTestRunning(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/free-trial-leads/test-flow', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        showToast(d.error ?? 'Test flow failed', false)
        return
      }
      setTestResult(d)
      const listRes = await fetch('/api/admin/free-trial-leads')
      if (listRes.ok) {
        const updated = await listRes.json()
        setLeads(updated)
      }
      showToast('Test booking created — check your email/phone')
    } catch {
      showToast('Test flow failed', false)
    } finally {
      setTestRunning(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter((l) => {
      const matchFilter = filter === 'all' || l.status === filter
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [leads, filter, search])

  const stats = useMemo(() => ({
    total: leads.length,
    pending: leads.filter((l) => l.status === 'pending_confirmation').length,
    confirmed: leads.filter((l) => l.status === 'confirmed').length,
    cancelled: leads.filter((l) => l.status === 'cancelled').length,
  }), [leads])

  async function handleStatusChange(id: string, newStatus: string) {
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/free-trial-leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { showToast('Failed to update status', false); return }
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updated } : l))
      showToast(`Status updated to ${newStatus}`)
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/free-trial-leads/${id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Failed to delete lead', false); return }
      setLeads((prev) => prev.filter((l) => l.id !== id))
      showToast('Lead deleted')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#0d0d1a', fontFamily: "'Nautic', sans-serif", color: 'white' }}>

      <div style={{ height: 56, background: '#0e0020', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'white', letterSpacing: '0.02em' }}>
          Quote<span style={{ color: '#FFE500' }}>.</span>Box
        </span>
        <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFE500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Secret Test Page — Free Trial Funnel
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={runTestFlow}
          disabled={testRunning}
          style={{
            fontSize: '0.82rem', fontWeight: 700, color: '#0d0d1a', background: '#FFE500',
            border: 'none', padding: '7px 16px', borderRadius: 6, cursor: testRunning ? 'default' : 'pointer',
            opacity: testRunning ? 0.6 : 1, fontFamily: "'Nautic', sans-serif",
          }}
        >
          {testRunning ? 'Running test…' : 'Run Test Booking'}
        </button>
        <a href="/free-trial" target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
          View Landing Page ↗
        </a>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Applicants', value: stats.total },
              { label: 'Awaiting Confirmation', value: stats.pending },
              { label: 'Confirmed', value: stats.confirmed },
              { label: 'Cancelled', value: stats.cancelled },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#0e0020', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFE500', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['list', 'calendar'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                style={{
                  padding: '6px 16px', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6,
                  border: 'none', cursor: 'pointer',
                  background: view === tab ? '#FFE500' : 'rgba(255,255,255,0.06)',
                  color: view === tab ? '#0d0d1a' : 'rgba(255,255,255,0.5)',
                  textTransform: 'capitalize',
                  fontFamily: "'Nautic', sans-serif",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '10px 16px', fontSize: '0.85rem', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)', background: '#0e0020', color: 'white',
                outline: 'none', width: 260, fontFamily: "'Nautic', sans-serif",
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', ...STATUS_ORDER] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, borderRadius: 99,
                    border: 'none', cursor: 'pointer',
                    background: filter === tab ? '#FFE500' : 'rgba(255,255,255,0.06)',
                    color: filter === tab ? '#0d0d1a' : 'rgba(255,255,255,0.5)',
                    textTransform: 'capitalize',
                    fontFamily: "'Nautic', sans-serif",
                  }}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {view === 'calendar' && (
            <BookingCalendar leads={leads} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />
          )}

          {view === 'list' && (
          <div style={{ background: '#0e0020', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                No applicants yet
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Name', 'Email', 'Phone', 'Company', 'Ad $', 'App', 'Scheduled Call', 'Status', 'Created', ''].map((h) => (
                      <th key={h} style={{
                        padding: '12px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const sc = STATUS_COLORS[lead.status] ?? STATUS_COLORS.pending_confirmation
                    return (
                      <tr key={lead.id}>
                        <td style={{ padding: '12px 14px', color: 'white', fontWeight: 500 }}>{lead.name}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{lead.email}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{lead.phone}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}><YesNo v={lead.has_junk_or_moving_company} /></td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}><YesNo v={lead.can_spend_50_per_day} /></td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}><YesNo v={lead.willing_ios_app} /></td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                          {lead.scheduled_date ? (
                            <>
                              {new Date(lead.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {lead.scheduled_time && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>{lead.scheduled_time}</span>}
                            </>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <select
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              disabled={saving === lead.id}
                              style={{
                                appearance: 'none',
                                padding: '4px 24px 4px 10px',
                                borderRadius: 99,
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: sc.bg,
                                color: sc.text,
                                textTransform: 'capitalize',
                                fontFamily: "'Nautic', sans-serif",
                                outline: 'none',
                              }}
                            >
                              {STATUS_ORDER.map((s) => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: sc.text, pointerEvents: 'none' }}>&#9660;</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={saving === lead.id}
                            style={{
                              padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, borderRadius: 6,
                              border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', whiteSpace: 'nowrap',
                              background: 'transparent', color: '#ef4444',
                              opacity: saving === lead.id ? 0.5 : 1,
                              fontFamily: "'Nautic', sans-serif",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          )}
        </div>
      </div>

      {testResult && (
        <div
          onClick={() => setTestResult(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0e0020', borderRadius: 12, padding: 24, width: 420,
              border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflow: 'auto',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFE500', marginBottom: 14 }}>Test Booking Flow Results</div>
            {testResult.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < testResult.steps.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ color: s.ok ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>{s.ok ? '✓' : '✗'}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'white' }}>{s.name}</div>
                  {s.error && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.error}</div>}
                </div>
              </div>
            ))}
            <button
              onClick={() => setTestResult(null)}
              style={{
                marginTop: 16, width: '100%', padding: '8px 0', fontSize: '0.82rem', fontWeight: 700,
                borderRadius: 6, border: 'none', background: '#FFE500', color: '#0d0d1a', cursor: 'pointer',
                fontFamily: "'Nautic', sans-serif",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10,
          background: toast.ok ? '#16a34a' : '#dc2626', color: 'white', fontSize: '0.85rem',
          fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function BookingCalendar({ leads, monthOffset, setMonthOffset }: { leads: FreeTrialLead[]; monthOffset: number; setMonthOffset: (fn: (n: number) => number) => void }) {
  const now = new Date()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const leadsByDate = useMemo(() => {
    const map: Record<string, FreeTrialLead[]> = {}
    for (const l of leads) {
      if (!l.scheduled_date) continue
      if (!map[l.scheduled_date]) map[l.scheduled_date] = []
      map[l.scheduled_date].push(l)
    }
    return map
  }, [leads])

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ background: '#0e0020', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => setMonthOffset((n) => n - 1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Nautic', sans-serif" }}>←</button>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFE500' }}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => setMonthOffset((n) => n + 1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Nautic', sans-serif" }}>→</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayLeads = (leadsByDate[iso] ?? []).filter((l) => l.status !== 'cancelled')
          return (
            <div key={i} style={{ minHeight: 78, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 6 }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{day}</div>
              {dayLeads.slice(0, 3).map((l) => {
                const sc = STATUS_COLORS[l.status] ?? STATUS_COLORS.pending_confirmation
                return (
                  <div key={l.id} title={`${l.name} — ${l.scheduled_time}`} style={{
                    fontSize: '0.62rem', fontWeight: 600, color: sc.text, background: sc.bg,
                    borderRadius: 4, padding: '2px 4px', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {l.scheduled_time} {l.name}
                  </div>
                )
              })}
              {dayLeads.length > 3 && (
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>+{dayLeads.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
