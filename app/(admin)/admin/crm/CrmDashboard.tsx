'use client'

import { useState, useMemo } from 'react'
import type { SalesLead } from './page'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: '#1e40af20', text: '#3b82f6' },
  contacted: { bg: '#d9770620', text: '#f59e0b' },
  closed: { bg: '#16a34a20', text: '#22c55e' },
  lost: { bg: '#dc262620', text: '#ef4444' },
}

const STATUS_ORDER = ['new', 'contacted', 'closed', 'lost'] as const

type FilterTab = 'all' | 'new' | 'contacted' | 'closed' | 'lost'

export default function CrmDashboard({ leads: initialLeads }: { leads: SalesLead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [sendingLink, setSendingLink] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter((l) => {
      const matchFilter = filter === 'all' || l.status === filter
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [leads, filter, search])

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    const thisWeekCalls = leads.filter((l) => {
      if (!l.scheduled_date) return false
      const d = new Date(l.scheduled_date)
      return d >= now && d <= weekFromNow
    }).length
    const pipelineValue = leads
      .filter((l) => l.status === 'new' || l.status === 'contacted')
      .reduce((sum, l) => sum + Number(l.monthly_total), 0)
    return {
      total: leads.length,
      new: leads.filter((l) => l.status === 'new').length,
      thisWeekCalls,
      pipelineValue,
    }
  }, [leads])

  async function handleStatusChange(id: string, newStatus: string) {
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/sales-leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        showToast('Failed to update status', false)
        return
      }
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updated } : l))
      showToast(`Status updated to ${newStatus}`)
    } finally {
      setSaving(null)
    }
  }

  async function handleSendLink(id: string) {
    setSendingLink(id)
    try {
      const res = await fetch(`/api/admin/sales-leads/${id}/send-link`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? 'Failed to send link', false)
        return
      }
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: 'contacted' } : l))
      showToast(data.accountCreated ? 'Account created & magic link sent!' : 'Magic link sent (account already existed)')
    } finally {
      setSendingLink(null)
    }
  }

  async function handleSaveNotes(id: string) {
    const notes = noteInputs[id] ?? ''
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/sales-leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) {
        showToast('Failed to save notes', false)
        return
      }
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updated } : l))
      showToast('Notes saved')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d1a', fontFamily: "'Inter', sans-serif", color: 'white' }}>

      {/* Top bar */}
      <div style={{ height: 56, background: '#1a1a2e', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'white', letterSpacing: '0.02em' }}>
          Quote<span style={{ color: '#FFE500' }}>.</span>Box
        </span>
        <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFE500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          CRM
        </span>
        <span style={{ flex: 1 }} />
        <a href="/admin" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
          &larr; Admin
        </a>
        <a href="/dashboard" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
          Dashboard
        </a>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Leads', value: stats.total },
              { label: 'New', value: stats.new },
              { label: "This Week's Calls", value: stats.thisWeekCalls },
              { label: 'Pipeline Value', value: `$${stats.pipelineValue.toLocaleString()}/mo` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#1a1a2e', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFE500', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '10px 16px', fontSize: '0.85rem', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a2e', color: 'white',
                outline: 'none', width: 260, fontFamily: "'Inter', sans-serif",
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'new', 'contacted', 'closed', 'lost'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, borderRadius: 99,
                    border: 'none', cursor: 'pointer',
                    background: filter === tab ? '#FFE500' : 'rgba(255,255,255,0.06)',
                    color: filter === tab ? '#0d0d1a' : 'rgba(255,255,255,0.5)',
                    textTransform: 'capitalize',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#1a1a2e', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                No leads found
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Name', 'Email', 'Phone', 'Tier', 'Monthly', 'Scheduled Call', 'Status', 'Created', ''].map((h) => (
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
                    const sc = STATUS_COLORS[lead.status] ?? STATUS_COLORS.new
                    const isExpanded = expandedId === lead.id
                    return (
                      <tr key={lead.id} style={{ cursor: 'default' }}>
                        {/* Row cells - wrapped in a fragment with expand toggle */}
                        <td style={{ padding: '12px 14px', color: 'white', fontWeight: 500 }}>
                          <span
                            onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                            style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}
                          >
                            {lead.name}
                          </span>
                          {isExpanded && (
                            <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Notes</label>
                              <textarea
                                value={noteInputs[lead.id] ?? lead.notes ?? ''}
                                onChange={(e) => setNoteInputs((p) => ({ ...p, [lead.id]: e.target.value }))}
                                rows={3}
                                style={{
                                  width: '100%', padding: '8px 10px', fontSize: '0.82rem', borderRadius: 6,
                                  border: '1px solid rgba(255,255,255,0.1)', background: '#0d0d1a', color: 'white',
                                  outline: 'none', resize: 'vertical', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                                }}
                              />
                              <button
                                onClick={() => handleSaveNotes(lead.id)}
                                disabled={saving === lead.id}
                                style={{
                                  marginTop: 8, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
                                  borderRadius: 6, border: 'none', cursor: 'pointer',
                                  background: '#FFE500', color: '#0d0d1a',
                                  opacity: saving === lead.id ? 0.5 : 1,
                                  fontFamily: "'Inter', sans-serif",
                                }}
                              >
                                {saving === lead.id ? 'Saving...' : 'Save Notes'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{lead.email}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{lead.phone || '\u2014'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FFE500' }}>{lead.tier}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>${Number(lead.monthly_total).toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                          {lead.scheduled_date ? (
                            <>
                              {new Date(lead.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {lead.scheduled_time && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>{lead.scheduled_time}</span>}
                            </>
                          ) : '\u2014'}
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
                                fontFamily: "'Inter', sans-serif",
                                outline: 'none',
                              }}
                            >
                              {STATUS_ORDER.map((s) => (
                                <option key={s} value={s}>{s}</option>
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
                            onClick={() => handleSendLink(lead.id)}
                            disabled={sendingLink === lead.id}
                            style={{
                              padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, borderRadius: 6,
                              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                              background: lead.status === 'closed' ? 'rgba(255,255,255,0.06)' : '#FFE500',
                              color: lead.status === 'closed' ? 'rgba(255,255,255,0.3)' : '#0d0d1a',
                              opacity: sendingLink === lead.id ? 0.5 : 1,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {sendingLink === lead.id ? 'Sending...' : 'Send Link'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
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
