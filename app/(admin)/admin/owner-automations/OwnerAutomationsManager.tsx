'use client'

import { useState, useMemo } from 'react'
import type { OwnerStep } from './page'

const STEP_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  no_leads_followup: 'No-Leads Follow-up',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:  { bg: '#fef9c3', text: '#92400e' },
  sent:     { bg: '#dcfce7', text: '#15803d' },
  skipped:  { bg: '#f3f4f6', text: '#6b7280' },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function OwnerAutomationsManager({ steps }: { steps: OwnerStep[] }) {
  const [search, setSearch] = useState('')
  const [stepFilter, setStepFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return steps.filter((s) => {
      if (q && !s.business_name.toLowerCase().includes(q) && !s.owner_email.toLowerCase().includes(q)) return false
      if (stepFilter !== 'all' && s.step !== stepFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [steps, search, stepFilter, statusFilter])

  const stats = useMemo(() => {
    const total = steps.length
    const sent = steps.filter((s) => s.status === 'sent').length
    const pending = steps.filter((s) => s.status === 'pending').length
    const skipped = steps.filter((s) => s.status === 'skipped').length
    const uniqueAccounts = new Set(steps.map((s) => s.account_id)).size
    return { total, sent, pending, skipped, uniqueAccounts }
  }, [steps])

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0e0020', margin: 0 }}>Owner Automations</h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 6 }}>
          Automated welcome and follow-up messages sent to new QuoteBox accounts.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total accounts', value: stats.uniqueAccounts },
          { label: 'Steps sent', value: stats.sent },
          { label: 'Pending', value: stats.pending },
          { label: 'Skipped', value: stats.skipped },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e0020' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search business or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', minWidth: 220,
          }}
        />
        <select
          value={stepFilter}
          onChange={(e) => setStepFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontFamily: 'inherit' }}
        >
          <option value="all">All steps</option>
          <option value="welcome">Welcome</option>
          <option value="no_leads_followup">No-Leads Follow-up</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontFamily: 'inherit' }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Business', 'Email', 'Phone', 'Step', 'Status', 'Scheduled', 'Sent'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8' }}>
                  No records found.
                </td>
              </tr>
            ) : filtered.map((s) => {
              const colors = STATUS_COLORS[s.status] ?? STATUS_COLORS.pending
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0e0020' }}>{s.business_name}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{s.owner_email}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{s.phone ?? <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{STEP_LABELS[s.step] ?? s.step}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 5,
                      fontSize: '0.78rem', fontWeight: 600,
                      background: colors.bg, color: colors.text,
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>{fmt(s.scheduled_at)}</td>
                  <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {s.sent_at ? fmt(s.sent_at) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 12 }}>
        Showing {filtered.length} of {steps.length} records. Booking link points to /get-started.
      </p>
    </div>
  )
}
