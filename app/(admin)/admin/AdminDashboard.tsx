'use client'

import { useState, useMemo, useEffect } from 'react'
import type { AdminAccount } from './page'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  fully_managed: 'Fully Managed',
  pay_per_lead: 'Pay Per Lead',
}

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  starter: { bg: '#f3f4f6', text: '#374151' },
  growth: { bg: '#ede9fe', text: '#6d28d9' },
  fully_managed: { bg: '#1a1a2e', text: '#FFE500' },
  pay_per_lead: { bg: '#dcfce7', text: '#15803d' },
  none: { bg: '#fef9c3', text: '#92400e' },
}

function planStyle(plan: string | null) {
  return PLAN_COLORS[plan ?? 'none'] ?? PLAN_COLORS.none
}

interface DetailData {
  leads: Array<{ id: string; name: string | null; email: string | null; phone: string | null; status: string; created_at: string }>
  forms: Array<{ id: string; form_name: string; is_active: boolean; created_at: string; form_config: { slug?: string } }>
}

const STATUS_COLORS: Record<string, string> = {
  new: '#2563eb',
  contacted: '#d97706',
  booked: '#16a34a',
  lost: '#dc2626',
  held: '#6b7280',
}

export default function AdminDashboard({ accounts }: { accounts: AdminAccount[] }) {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Billing edit state
  const [creditInput, setCreditInput] = useState('')
  const [creditMode, setCreditMode] = useState<'add' | 'set'>('add')
  const [creditSaving, setCreditSaving] = useState(false)
  const [planEdit, setPlanEdit] = useState<string>('')
  const [planSaving, setPlanSaving] = useState(false)
  const [impersonating, setImpersonating] = useState(false)
  const [localAccounts, setLocalAccounts] = useState<AdminAccount[]>(accounts)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const selected = localAccounts.find((a) => a.id === selectedId) ?? null

  // When an account is selected, pre-fill the plan editor and fetch detail data
  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    setPlanEdit(selected?.plan ?? '')
    setDetailLoading(true)
    fetch(`/api/admin/accounts/${selectedId}/detail`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setDetailLoading(false) })
      .catch(() => setDetailLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return localAccounts.filter((a) => {
      const matchSearch = !q || a.business_name.toLowerCase().includes(q) || a.owner_email.toLowerCase().includes(q)
      const matchPlan = planFilter === 'all' || (planFilter === 'none' ? !a.plan : a.plan === planFilter)
      return matchSearch && matchPlan
    })
  }, [localAccounts, search, planFilter])

  async function handleSaveCredits() {
    if (!selectedId || !creditInput.trim()) return
    const amount = parseFloat(creditInput)
    if (isNaN(amount)) return
    setCreditSaving(true)
    const res = await fetch(`/api/admin/accounts/${selectedId}/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, mode: creditMode }),
    })
    const data = await res.json()
    setCreditSaving(false)
    if (!res.ok) { showToast(data.error ?? 'Failed', false); return }
    setLocalAccounts((prev) =>
      prev.map((a) => a.id === selectedId ? { ...a, credit_balance: data.credit_balance } : a)
    )
    setCreditInput('')
    showToast(`Credits updated — new balance $${data.credit_balance.toFixed(2)}`)
  }

  async function handleSavePlan() {
    if (!selectedId) return
    setPlanSaving(true)
    const res = await fetch(`/api/admin/accounts/${selectedId}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planEdit || null }),
    })
    const data = await res.json()
    setPlanSaving(false)
    if (!res.ok) { showToast(data.error ?? 'Failed', false); return }
    setLocalAccounts((prev) =>
      prev.map((a) => a.id === selectedId ? { ...a, plan: data.plan } : a)
    )
    showToast('Plan updated')
  }


  async function handleImpersonate() {
    if (!selected) return
    setImpersonating(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selected.owner_id }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to generate link', false); return }
      window.open(data.url, '_blank')
    } finally {
      setImpersonating(false)
    }
  }

  const planCounts = useMemo(() => {
    const c: Record<string, number> = { all: localAccounts.length, starter: 0, growth: 0, fully_managed: 0, pay_per_lead: 0, none: 0 }
    for (const a of localAccounts) c[a.plan ?? 'none'] = (c[a.plan ?? 'none'] ?? 0) + 1
    return c
  }, [localAccounts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ height: 56, background: '#1a1a2e', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'white', letterSpacing: '0.02em' }}>
          Quote<span style={{ color: '#FFE500' }}>.</span>Box
        </span>
        <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Admin
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
          {localAccounts.length} accounts
        </span>
        <a href="/dashboard" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
          ← Dashboard
        </a>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: Account list ── */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', background: 'white', overflow: 'hidden' }}>

          {/* Search */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Plan filter chips */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            {([['all', 'All'], ['starter', 'Starter'], ['growth', 'Growth'], ['fully_managed', 'FM'], ['pay_per_lead', 'PPL'], ['none', 'No plan']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPlanFilter(val)}
                style={{
                  padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: planFilter === val ? '#1a1a2e' : '#f1f5f9',
                  color: planFilter === val ? '#FFE500' : '#64748b',
                }}
              >
                {label} <span style={{ opacity: 0.7 }}>({planCounts[val] ?? 0})</span>
              </button>
            ))}
          </div>

          {/* Account list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No accounts found</div>
            )}
            {filtered.map((acc) => {
              const ps = planStyle(acc.plan)
              const isSelected = acc.id === selectedId
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedId(acc.id)}
                  style={{
                    padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                    background: isSelected ? '#eff6ff' : 'white',
                    borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                      {acc.business_name}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: ps.bg, color: ps.text, flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap',
                    }}>
                      {acc.plan ? PLAN_LABELS[acc.plan] : 'No plan'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 6 }}>{acc.owner_email}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#94a3b8' }}>
                    <span>${acc.credit_balance.toFixed(2)} credits</span>
                    <span>{acc.leads_total} leads</span>
                    <span>{acc.forms_count} forms</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Account detail ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👈</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>Select an account to view details</div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Account header */}
              <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: 0, marginBottom: 4 }}>
                      {selected.business_name}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selected.owner_email}</div>
                    {selected.phone && <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>{selected.phone}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Joined {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>{selected.id}</div>
                  <button
                    onClick={handleImpersonate}
                    disabled={impersonating}
                    style={{
                      marginTop: 8, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600,
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: '#2563eb', color: 'white',
                      opacity: impersonating ? 0.6 : 1,
                    }}
                  >
                    {impersonating ? 'Generating…' : '↗ Enter as User'}
                  </button>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Credit Balance', value: `$${selected.credit_balance.toFixed(2)}`, sub: `$${selected.total_spent.toFixed(2)} spent total` },
                  { label: 'Total Leads', value: selected.leads_total, sub: `${selected.leads_this_month} this month` },
                  { label: 'Forms', value: selected.forms_count, sub: 'hosted forms' },
                  { label: 'Plan', value: selected.plan ? PLAN_LABELS[selected.plan] : 'No plan', sub: selected.trial_ends_at && new Date(selected.trial_ends_at) > new Date() ? `Trial ends ${new Date(selected.trial_ends_at).toLocaleDateString()}` : selected.stripe_customer_id ? 'Stripe connected' : 'No Stripe' },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Billing management */}
              <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
                  Billing Management
                </h3>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>

                  {/* Plan change */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Change Plan</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={planEdit}
                        onChange={(e) => setPlanEdit(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                      >
                        <option value="">No plan</option>
                        <option value="starter">Starter — $20/mo</option>
                        <option value="growth">Growth — $30/mo</option>
                        <option value="fully_managed">Fully Managed — $15/lead</option>
                        <option value="pay_per_lead">Pay Per Lead — no monthly limit</option>
                      </select>
                      <button
                        onClick={handleSavePlan}
                        disabled={planSaving || planEdit === (selected.plan ?? '')}
                        style={{
                          padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#1a1a2e', color: '#FFE500', opacity: planSaving || planEdit === (selected.plan ?? '') ? 0.5 : 1,
                        }}
                      >
                        {planSaving ? '…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Credit adjustment */}
                  <div style={{ flex: '1 1 260px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Adjust Credits
                      <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>current: ${selected.credit_balance.toFixed(2)}</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={creditMode}
                        onChange={(e) => setCreditMode(e.target.value as 'add' | 'set')}
                        style={{ padding: '8px 10px', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                      >
                        <option value="add">Add</option>
                        <option value="set">Set to</option>
                      </select>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={creditInput}
                        onChange={(e) => setCreditInput(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                      />
                      <button
                        onClick={handleSaveCredits}
                        disabled={creditSaving || !creditInput.trim()}
                        style={{
                          padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#16a34a', color: 'white', opacity: creditSaving || !creditInput.trim() ? 0.5 : 1,
                        }}
                      >
                        {creditSaving ? '…' : 'Apply'}
                      </button>
                    </div>
                    {/* Quick-add buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {[15, 50, 100, 250].map((n) => (
                        <button
                          key={n}
                          onClick={() => { setCreditMode('add'); setCreditInput(String(n)) }}
                          style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569' }}
                        >
                          +${n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent leads */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                    Recent Leads
                  </h3>
                </div>
                {detailLoading ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Loading…</div>
                ) : !detail || detail.leads.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No leads yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Name', 'Email', 'Phone', 'Status', 'Date'].map((h) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.leads.map((lead) => (
                        <tr key={lead.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '10px 16px', color: '#1e293b', fontWeight: 500 }}>{lead.name || '—'}</td>
                          <td style={{ padding: '10px 16px', color: '#64748b' }}>{lead.email || '—'}</td>
                          <td style={{ padding: '10px 16px', color: '#64748b' }}>{lead.phone || '—'}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                              background: STATUS_COLORS[lead.status] + '20',
                              color: STATUS_COLORS[lead.status] ?? '#64748b',
                            }}>
                              {lead.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Forms */}
              {detail && detail.forms.length > 0 && (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                      Hosted Forms
                    </h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Form Name', 'Slug', 'Status', 'Created'].map((h) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.forms.map((form) => (
                        <tr key={form.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '10px 16px', color: '#1e293b', fontWeight: 500 }}>{form.form_name}</td>
                          <td style={{ padding: '10px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            {form.form_config?.slug ? `/${form.form_config.slug}` : '—'}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                              background: form.is_active ? '#dcfce7' : '#f1f5f9',
                              color: form.is_active ? '#16a34a' : '#64748b',
                            }}>
                              {form.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(form.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10,
          background: toast.ok ? '#16a34a' : '#dc2626', color: 'white', fontSize: '0.85rem',
          fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
