'use client'

import { useState, useMemo } from 'react'
import type { SalesLead, FreeTrialLead } from './page'

const SALES_STATUS_ORDER = ['new', 'contacted', 'closed', 'lost'] as const
const BOOKING_STATUS_ORDER = ['pending_confirmation', 'confirmed', 'cancelled', 'completed'] as const

const SALES_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: '#1e40af20', text: '#3b82f6' },
  contacted: { bg: '#d9770620', text: '#f59e0b' },
  closed: { bg: '#16a34a20', text: '#22c55e' },
  lost: { bg: '#dc262620', text: '#ef4444' },
}

const BOOKING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_confirmation: { bg: '#d9770620', text: '#f59e0b' },
  confirmed: { bg: '#16a34a20', text: '#22c55e' },
  cancelled: { bg: '#dc262620', text: '#ef4444' },
  completed: { bg: '#1e40af20', text: '#3b82f6' },
}

const SOURCE_BADGE = {
  sales: { bg: '#ede9fe', text: '#6d28d9', label: 'Sales' },
  booking: { bg: '#dcfce7', text: '#15803d', label: 'Booking' },
}

type Source = 'sales' | 'booking'
type SourceFilter = 'all' | Source
type ViewTab = 'list' | 'calendar'

interface UnifiedLead {
  id: string
  source: Source
  name: string
  email: string
  phone: string | null
  status: string
  scheduled_date: string | null
  scheduled_time: string | null
  created_at: string
  isMeta: boolean
  isCaseStudy: boolean
  sales?: SalesLead
  booking?: FreeTrialLead
}

function statusColors(source: Source) {
  return source === 'sales' ? SALES_STATUS_COLORS : BOOKING_STATUS_COLORS
}
function statusOrder(source: Source) {
  return source === 'sales' ? SALES_STATUS_ORDER : BOOKING_STATUS_ORDER
}

export default function LeadsManager({ salesLeads: initialSales, freeTrialLeads: initialBookings }: { salesLeads: SalesLead[]; freeTrialLeads: FreeTrialLead[] }) {
  const [salesLeads, setSalesLeads] = useState(initialSales)
  const [bookingLeads, setBookingLeads] = useState(initialBookings)

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewTab>('list')
  const [monthOffset, setMonthOffset] = useState(0)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [sendingLink, setSendingLink] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<{ steps: { name: string; ok: boolean; error?: string }[] } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const unified: UnifiedLead[] = useMemo(() => {
    const fromSales: UnifiedLead[] = salesLeads.map((l) => ({
      id: l.id, source: 'sales', name: l.name, email: l.email, phone: l.phone,
      status: l.status, scheduled_date: l.scheduled_date, scheduled_time: l.scheduled_time,
      created_at: l.created_at, isMeta: l.source === 'meta', isCaseStudy: l.source === 'case_study', sales: l,
    }))
    const fromBookings: UnifiedLead[] = bookingLeads.map((l) => ({
      id: l.id, source: 'booking', name: l.name, email: l.email, phone: l.phone,
      status: l.status, scheduled_date: l.scheduled_date, scheduled_time: l.scheduled_time,
      created_at: l.created_at, isMeta: false, isCaseStudy: false, booking: l,
    }))
    const all = [...fromSales, ...fromBookings]
    all.sort((a, b) => {
      if (a.scheduled_date && b.scheduled_date) {
        const cmp = a.scheduled_date.localeCompare(b.scheduled_date)
        if (cmp !== 0) return cmp
      } else if (a.scheduled_date && !b.scheduled_date) return -1
      else if (!a.scheduled_date && b.scheduled_date) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return all
  }, [salesLeads, bookingLeads])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return unified.filter((l) => {
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      return matchSearch
    })
  }, [unified, sourceFilter, statusFilter, search])

  const stats = useMemo(() => ({
    total: unified.length,
    sales: salesLeads.length,
    bookings: bookingLeads.length,
    metaLeads: salesLeads.filter((l) => l.source === 'meta').length,
    caseStudyLeads: salesLeads.filter((l) => l.source === 'case_study').length,
  }), [unified, salesLeads, bookingLeads])

  const statusChips = sourceFilter === 'booking' ? BOOKING_STATUS_ORDER : sourceFilter === 'sales' ? SALES_STATUS_ORDER : null

  async function runTestFlow() {
    setTestRunning(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/free-trial-leads/test-flow', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { showToast(d.error ?? 'Test flow failed', false); return }
      setTestResult(d)
      const listRes = await fetch('/api/admin/free-trial-leads')
      if (listRes.ok) setBookingLeads(await listRes.json())
      showToast('Test booking created — check your email/phone')
    } catch {
      showToast('Test flow failed', false)
    } finally {
      setTestRunning(false)
    }
  }

  async function handleStatusChange(lead: UnifiedLead, newStatus: string) {
    setSaving(lead.id)
    try {
      const url = lead.source === 'sales' ? `/api/admin/sales-leads/${lead.id}/status` : `/api/admin/free-trial-leads/${lead.id}`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { showToast('Failed to update status', false); return }
      const updated = await res.json()
      if (lead.source === 'sales') setSalesLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, ...updated } : l))
      else setBookingLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, ...updated } : l))
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`)
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(lead: UnifiedLead) {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setSaving(lead.id)
    try {
      const url = lead.source === 'sales' ? `/api/admin/sales-leads/${lead.id}/status` : `/api/admin/free-trial-leads/${lead.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) { showToast('Failed to delete lead', false); return }
      if (lead.source === 'sales') setSalesLeads((prev) => prev.filter((l) => l.id !== lead.id))
      else setBookingLeads((prev) => prev.filter((l) => l.id !== lead.id))
      setExpandedId(null)
      showToast('Lead deleted')
    } finally {
      setSaving(null)
    }
  }

  async function handleSendLink(lead: UnifiedLead) {
    setSendingLink(lead.id)
    try {
      const res = await fetch(`/api/admin/sales-leads/${lead.id}/send-link`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to send link', false); return }
      setSalesLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: 'contacted' } : l))
      showToast(data.accountCreated ? 'Account created & magic link sent!' : 'Magic link sent (account already existed)')
    } finally {
      setSendingLink(null)
    }
  }

  async function handleSaveNotes(lead: UnifiedLead) {
    const notes = noteInputs[lead.id] ?? ''
    setSaving(lead.id)
    try {
      const res = await fetch(`/api/admin/sales-leads/${lead.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) { showToast('Failed to save notes', false); return }
      const updated = await res.json()
      setSalesLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, ...updated } : l))
      showToast('Notes saved')
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
          Leads — Sales Pipeline & Bookings
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
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Leads', value: stats.total },
              { label: 'Sales Pipeline', value: stats.sales },
              { label: 'Bookings', value: stats.bookings },
              { label: 'From Meta Ads', value: stats.metaLeads },
              { label: 'Case Study', value: stats.caseStudyLeads },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#0e0020', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFE500', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Source tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {(['all', 'sales', 'booking'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setSourceFilter(tab); setStatusFilter('all') }}
                style={{
                  padding: '6px 16px', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6,
                  border: 'none', cursor: 'pointer',
                  background: sourceFilter === tab ? '#FFE500' : 'rgba(255,255,255,0.06)',
                  color: sourceFilter === tab ? '#0d0d1a' : 'rgba(255,255,255,0.5)',
                  fontFamily: "'Nautic', sans-serif",
                }}
              >
                {tab === 'all' ? 'All' : tab === 'sales' ? 'Sales Pipeline' : 'Bookings'}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 4 }}>
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
            {statusChips && (
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', ...statusChips] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    style={{
                      padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, borderRadius: 99,
                      border: 'none', cursor: 'pointer',
                      background: statusFilter === tab ? '#FFE500' : 'rgba(255,255,255,0.06)',
                      color: statusFilter === tab ? '#0d0d1a' : 'rgba(255,255,255,0.5)',
                      textTransform: 'capitalize',
                      fontFamily: "'Nautic', sans-serif",
                    }}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {view === 'calendar' && (
            <LeadsCalendar leads={filtered} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />
          )}

          {view === 'list' && (
            <div style={{ background: '#0e0020', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                  No leads found
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Name', 'Email', 'Phone', 'Source', 'Scheduled Call', 'Status', 'Created', ''].map((h) => (
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
                      const sc = statusColors(lead.source)[lead.status] ?? statusColors(lead.source)[statusOrder(lead.source)[0]]
                      const isExpanded = expandedId === lead.id
                      const badge = SOURCE_BADGE[lead.source]
                      return (
                        <tr key={`${lead.source}-${lead.id}`}>
                          <td style={{ padding: '12px 14px', color: 'white', fontWeight: 500 }}>
                            <span
                              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                              style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}
                            >
                              {lead.name}
                            </span>
                            {isExpanded && (
                              <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
                                {lead.source === 'sales' ? (
                                  <>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Notes</label>
                                    <textarea
                                      value={noteInputs[lead.id] ?? lead.sales?.notes ?? ''}
                                      onChange={(e) => setNoteInputs((p) => ({ ...p, [lead.id]: e.target.value }))}
                                      rows={3}
                                      style={{
                                        width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)', background: '#0d0d1a', color: 'white',
                                        outline: 'none', resize: 'vertical', fontFamily: "'Nautic', sans-serif", boxSizing: 'border-box',
                                      }}
                                    />
                                    {lead.sales?.tier != null && (
                                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: '8px 0' }}>
                                        Tier {lead.sales.tier} · ${Number(lead.sales.monthly_total ?? 0).toLocaleString()}/mo
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                                      <button
                                        onClick={() => handleSaveNotes(lead)}
                                        disabled={saving === lead.id}
                                        style={{
                                          padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
                                          borderRadius: 6, border: 'none', cursor: 'pointer',
                                          background: '#FFE500', color: '#0d0d1a',
                                          opacity: saving === lead.id ? 0.5 : 1,
                                          fontFamily: "'Nautic', sans-serif",
                                        }}
                                      >
                                        {saving === lead.id ? 'Saving...' : 'Save Notes'}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                                      Junk/moving co: <strong style={{ color: lead.booking?.has_junk_or_moving_company ? '#22c55e' : '#ef4444' }}>{lead.booking?.has_junk_or_moving_company ? 'Y' : 'N'}</strong>
                                      {' · '}Ad spend $50+/day: <strong style={{ color: lead.booking?.can_spend_50_per_day ? '#22c55e' : '#ef4444' }}>{lead.booking?.can_spend_50_per_day ? 'Y' : 'N'}</strong>
                                      {' · '}iOS app daily: <strong style={{ color: lead.booking?.willing_ios_app ? '#22c55e' : '#ef4444' }}>{lead.booking?.willing_ios_app ? 'Y' : 'N'}</strong>
                                    </div>
                                    {lead.booking?.zoom_join_url && (
                                      <div style={{ marginTop: 6 }}>
                                        <a href={lead.booking.zoom_join_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#FFE500' }}>Zoom link ↗</a>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{lead.email}</td>
                          <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{lead.phone || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: badge.bg, color: badge.text, padding: '2px 8px', borderRadius: 99 }}>{badge.label}</span>
                            {lead.isMeta && (
                              <span style={{ marginLeft: 4, fontSize: '0.7rem', fontWeight: 700, background: '#0866ff20', color: '#4d94ff', padding: '2px 8px', borderRadius: 99 }}>Meta</span>
                            )}
                            {lead.isCaseStudy && (
                              <span style={{ marginLeft: 4, fontSize: '0.7rem', fontWeight: 700, background: '#f4a93c20', color: '#f4a93c', padding: '2px 8px', borderRadius: 99 }}>Case Study</span>
                            )}
                          </td>
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
                                onChange={(e) => handleStatusChange(lead, e.target.value)}
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
                                {statusOrder(lead.source).map((s) => (
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
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {lead.source === 'sales' && (
                                <button
                                  onClick={() => handleSendLink(lead)}
                                  disabled={sendingLink === lead.id}
                                  style={{
                                    padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, borderRadius: 6,
                                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: lead.status === 'closed' ? 'rgba(255,255,255,0.06)' : '#FFE500',
                                    color: lead.status === 'closed' ? 'rgba(255,255,255,0.3)' : '#0d0d1a',
                                    opacity: sendingLink === lead.id ? 0.5 : 1,
                                    fontFamily: "'Nautic', sans-serif",
                                  }}
                                >
                                  {sendingLink === lead.id ? 'Sending...' : 'Send Link'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(lead)}
                                disabled={saving === lead.id}
                                title="Delete lead"
                                style={{
                                  padding: '6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                                  background: 'transparent', color: '#ef4444',
                                  opacity: saving === lead.id ? 0.5 : 1, flexShrink: 0,
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3-3h8a1 1 0 0 1 1 1v2H7V4a1 1 0 0 1 1-1z" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#0e0020', borderRadius: 12, padding: 24, width: 420, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflow: 'auto' }}
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
              style={{ marginTop: 16, width: '100%', padding: '8px 0', fontSize: '0.82rem', fontWeight: 700, borderRadius: 6, border: 'none', background: '#FFE500', color: '#0d0d1a', cursor: 'pointer', fontFamily: "'Nautic', sans-serif" }}
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

function LeadsCalendar({ leads, monthOffset, setMonthOffset }: { leads: UnifiedLead[]; monthOffset: number; setMonthOffset: (fn: (n: number) => number) => void }) {
  const now = new Date()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const leadsByDate = useMemo(() => {
    const map: Record<string, UnifiedLead[]> = {}
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
          const dayLeads = (leadsByDate[iso] ?? []).filter((l) => l.status !== 'cancelled' && l.status !== 'lost')
          return (
            <div key={i} style={{ minHeight: 78, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 6 }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{day}</div>
              {dayLeads.slice(0, 3).map((l) => {
                const badge = SOURCE_BADGE[l.source]
                return (
                  <div key={`${l.source}-${l.id}`} title={`${l.name} — ${l.scheduled_time} (${badge.label})`} style={{
                    fontSize: '0.62rem', fontWeight: 600, color: badge.text, background: badge.bg,
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
