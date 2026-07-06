'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminAccount, PendingInvite } from './page'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  fully_managed: 'Fully Managed',
  pay_per_lead: 'Retainer',
}

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  starter: { bg: '#f3f4f6', text: '#374151' },
  growth: { bg: '#ede9fe', text: '#6d28d9' },
  fully_managed: { bg: '#0e0020', text: '#FFE500' },
  pay_per_lead: { bg: '#dcfce7', text: '#15803d' },
  none: { bg: '#fef9c3', text: '#92400e' },
}

function planStyle(plan: string | null) {
  return PLAN_COLORS[plan ?? 'none'] ?? PLAN_COLORS.none
}

const ONBOARDING_BADGES: Record<AdminAccount['onboarding_status'], { bg: string; color: string; label: string; shortLabel: string }> = {
  none: { bg: '#f1f5f9', color: '#64748b', label: '', shortLabel: '' },
  pending: { bg: '#fff7ed', color: '#ea580c', label: 'Onboarding Sent', shortLabel: 'Sent' },
  awaiting_payment: { bg: '#fef3c7', color: '#b45309', label: 'Awaiting Payment', shortLabel: 'Awaiting Payment' },
  in_progress: { bg: '#eff6ff', color: '#2563eb', label: 'Filling Out', shortLabel: 'In Progress' },
  completed: { bg: '#f0fdf4', color: '#16a34a', label: 'Ready to Build', shortLabel: 'Ready to Build' },
  form_built: { bg: '#f1f5f9', color: '#64748b', label: 'Form Built', shortLabel: 'Built' },
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

export default function AdminDashboard({ accounts, pendingInvites }: { accounts: AdminAccount[]; pendingInvites: PendingInvite[] }) {
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
  const [onboardingData, setOnboardingData] = useState<Record<string, unknown> | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [markingBuilt, setMarkingBuilt] = useState(false)
  const [resettingOnboarding, setResettingOnboarding] = useState(false)
  const [blessSaving, setBlessSaving] = useState(false)
  const [downloadingData, setDownloadingData] = useState(false)
  const [localPendingInvites, setLocalPendingInvites] = useState<PendingInvite[]>(pendingInvites)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteSaving, setInviteSaving] = useState(false)
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null)
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)

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


  async function handleToggleBlessed() {
    if (!selectedId || !selected) return
    setBlessSaving(true)
    const newVal = !selected.blessed
    const res = await fetch(`/api/admin/accounts/${selectedId}/bless`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blessed: newVal }),
    })
    const data = await res.json()
    setBlessSaving(false)
    if (!res.ok) { showToast(data.error ?? 'Failed', false); return }
    setLocalAccounts((prev) =>
      prev.map((a) => a.id === selectedId ? { ...a, blessed: data.blessed } : a)
    )
    showToast(newVal ? 'Account blessed' : 'Blessing removed')
  }

  async function handleDownloadData() {
    if (!selected) return
    setDownloadingData(true)
    try {
      const res = await fetch(`/api/admin/accounts/${selected.id}/export`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast(data.error ?? 'Failed to export account data', false)
        return
      }
      const blob = await res.blob()
      const filename = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'account-export.zip'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showToast('Export downloaded')
    } finally {
      setDownloadingData(false)
    }
  }

  async function handleImpersonate(redirectPath?: string, sameTab = false) {
    if (!selected) return
    setImpersonating(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selected.owner_id, redirectPath }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to generate link', false); return }
      if (sameTab) {
        // Save admin session before navigating away
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          localStorage.setItem('admin_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }))
        }
        window.location.href = data.url
      } else {
        window.open(data.url, '_blank')
      }
    } finally {
      setImpersonating(false)
    }
  }

  function inviteResultMessage(data: { emailSent?: boolean; smsSent?: boolean; existing?: boolean }, hadPhone: boolean) {
    const parts: string[] = []
    if (data.emailSent) parts.push('email')
    if (hadPhone && data.smsSent) parts.push('SMS')
    const prefix = data.existing ? 'Resent' : 'Invite created — sent'
    if (parts.length === 0) return `${data.existing ? 'Resent' : 'Invite created'}, but sending failed — link copied to clipboard instead`
    return `${prefix} via ${parts.join(' + ')}, link also copied`
  }

  async function handleSendInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) return
    setInviteSaving(true)
    try {
      const res = await fetch('/api/admin/onboarding/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadName: inviteName, leadEmail: inviteEmail, leadPhone: invitePhone || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed', false); return }
      await navigator.clipboard.writeText(data.url)
      if (!data.existing) {
        setLocalPendingInvites((prev) => [
          { id: data.sessionId, lead_name: inviteName.trim(), lead_email: inviteEmail.trim().toLowerCase(), lead_phone: invitePhone.trim() || null, token: data.token, created_at: new Date().toISOString() },
          ...prev,
        ])
      }
      setInviteOpen(false)
      setInviteName('')
      setInviteEmail('')
      setInvitePhone('')
      showToast(inviteResultMessage(data, !!invitePhone.trim()), !!(data.emailSent || data.smsSent))
    } finally {
      setInviteSaving(false)
    }
  }

  async function handleResendInvite(inv: PendingInvite) {
    setSendingInviteId(inv.id)
    try {
      const res = await fetch('/api/admin/onboarding/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadName: inv.lead_name, leadEmail: inv.lead_email, leadPhone: inv.lead_phone ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to resend', false); return }
      showToast(inviteResultMessage(data, !!inv.lead_phone), !!(data.emailSent || data.smsSent))
    } finally {
      setSendingInviteId(null)
    }
  }

  async function handleCopyInviteLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/onboarding/ppl/${token}`)
    showToast('Link copied!')
  }

  async function handleRevokeInvite(sessionId: string) {
    if (!confirm('Revoke this invite? The link will stop working.')) return
    setRevokingInviteId(sessionId)
    try {
      const res = await fetch(`/api/admin/onboarding/pending/${sessionId}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalPendingInvites((prev) => prev.filter((i) => i.id !== sessionId))
        showToast('Invite revoked')
      } else {
        const data = await res.json()
        showToast(data.error ?? 'Failed to revoke', false)
      }
    } finally {
      setRevokingInviteId(null)
    }
  }

  async function handleCopyOnboardingLink() {
    if (!selected?.onboarding_token) return
    const url = `${window.location.origin}/onboarding/ppl/${selected.onboarding_token}`
    await navigator.clipboard.writeText(url)
    showToast('Link copied!')
  }

  async function handleViewOnboardingData() {
    if (!selectedId) return
    setOnboardingOpen(!onboardingOpen)
    if (onboardingData) return // already loaded
    try {
      const res = await fetch(`/api/admin/onboarding/${selectedId}`)
      if (res.ok) {
        const data = await res.json()
        setOnboardingData(data.step_data ?? {})
      }
    } catch { /* ignore */ }
  }

  async function handleMarkFormBuilt() {
    if (!selectedId) return
    setMarkingBuilt(true)
    try {
      const res = await fetch(`/api/admin/onboarding/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'form_built' }),
      })
      if (res.ok) {
        setLocalAccounts((prev) =>
          prev.map((a) => a.id === selectedId ? { ...a, onboarding_status: 'form_built' as const } : a)
        )
        showToast('Marked as form built')
      }
    } finally {
      setMarkingBuilt(false)
    }
  }

  async function handleResetOnboarding() {
    if (!selectedId) return
    if (!confirm('Reset onboarding for this account? This will delete the current session and they will need to start over.')) return
    setResettingOnboarding(true)
    try {
      const res = await fetch(`/api/admin/onboarding/${selectedId}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalAccounts((prev) =>
          prev.map((a) => a.id === selectedId ? { ...a, onboarding_status: 'none' as const, onboarding_token: null } : a)
        )
        setOnboardingData(null)
        setOnboardingOpen(false)
        showToast('Onboarding reset')
      } else {
        const data = await res.json()
        showToast(data.error ?? 'Failed to reset', false)
      }
    } finally {
      setResettingOnboarding(false)
    }
  }

  // Reset onboarding panel when account changes
  useEffect(() => {
    setOnboardingData(null)
    setOnboardingOpen(false)
  }, [selectedId])

  const planCounts = useMemo(() => {
    const c: Record<string, number> = { all: localAccounts.length, starter: 0, growth: 0, fully_managed: 0, pay_per_lead: 0, none: 0 }
    for (const a of localAccounts) c[a.plan ?? 'none'] = (c[a.plan ?? 'none'] ?? 0) + 1
    return c
  }, [localAccounts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9', fontFamily: "'Nautic', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ height: 56, background: '#0e0020', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
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
        <button
          onClick={() => setInviteOpen(true)}
          style={{ fontSize: '0.82rem', color: '#16a34a', background: 'transparent', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
        >
          + Send Invite
        </button>
        <a href="/admin/leads" style={{ fontSize: '0.82rem', color: '#FFE500', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,229,0,0.3)', borderRadius: 6, fontWeight: 600 }}>
          CRM
        </a>
        <a href="/admin/demo" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: '#0e0020', textDecoration: 'none', padding: '6px 14px', background: '#FFE500', borderRadius: 6, fontWeight: 700 }}>
          🎬 Sales Demo
        </a>
        <a href="/dashboard" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
          &larr; Dashboard
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

          {/* Pending PPL invites — lead has a link but hasn't created an account yet */}
          {localPendingInvites.length > 0 && (
            <div style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Pending Invites ({localPendingInvites.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {localPendingInvites.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: '#fff7ed', borderRadius: 8, padding: '6px 10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.lead_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.lead_email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => handleResendInvite(inv)}
                        disabled={sendingInviteId === inv.id}
                        title="Send link (email + SMS)"
                        style={{ border: 'none', background: '#16a34a', color: 'white', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, opacity: sendingInviteId === inv.id ? 0.5 : 1 }}
                      >
                        {sendingInviteId === inv.id ? '…' : 'Send Link'}
                      </button>
                      <button onClick={() => handleCopyInviteLink(inv.token)} title="Copy link" style={{ border: 'none', background: 'white', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: '0.78rem' }}>🔗</button>
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        disabled={revokingInviteId === inv.id}
                        title="Revoke"
                        style={{ border: 'none', background: 'white', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: '0.78rem', opacity: revokingInviteId === inv.id ? 0.5 : 1 }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan filter chips */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            {([['all', 'All'], ['starter', 'Starter'], ['growth', 'Growth'], ['fully_managed', 'FM'], ['pay_per_lead', 'Retainer'], ['none', 'No plan']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPlanFilter(val)}
                style={{
                  padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: planFilter === val ? '#0e0020' : '#f1f5f9',
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
                  {acc.onboarding_status !== 'none' && (
                    <div style={{ marginBottom: 4 }}>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: ONBOARDING_BADGES[acc.onboarding_status].bg,
                        color: ONBOARDING_BADGES[acc.onboarding_status].color,
                      }}>
                        {ONBOARDING_BADGES[acc.onboarding_status].label}
                      </span>
                    </div>
                  )}
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
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleImpersonate()}
                    disabled={impersonating}
                    style={{
                      padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600,
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: '#2563eb', color: 'white',
                      opacity: impersonating ? 0.6 : 1,
                    }}
                  >
                    {impersonating ? 'Generating…' : '↗ Enter as User'}
                  </button>
                  <button
                    onClick={handleDownloadData}
                    disabled={downloadingData}
                    style={{
                      padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600,
                      borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                      background: 'white', color: '#475569',
                      opacity: downloadingData ? 0.6 : 1,
                    }}
                  >
                    {downloadingData ? 'Zipping…' : '⬇ Download Data'}
                  </button>
                  {selected.onboarding_status !== 'none' && (
                    <>
                      <button
                        onClick={handleCopyOnboardingLink}
                        style={{
                          padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600,
                          borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                          background: 'white', color: '#475569',
                        }}
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={handleResetOnboarding}
                        disabled={resettingOnboarding}
                        style={{
                          padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600,
                          borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#dc2626', color: 'white',
                          opacity: resettingOnboarding ? 0.6 : 1,
                        }}
                      >
                        {resettingOnboarding ? 'Resetting…' : 'Reset Onboarding'}
                      </button>
                    </>
                  )}
                  </div>
                  </div>
                </div>
              </div>

              {/* PPL Tool Tabs */}
              {selected.plan === 'pay_per_lead' && (
                <div style={{
                  background: '#0e0020', borderRadius: 10, display: 'flex', gap: 0, overflow: 'hidden',
                }}>
                  {([
                    { label: 'Form Builder', path: '/form-builder' },
                    { label: 'Hosted Forms', path: '/hosted-forms' },
                    { label: 'Lead Machine', path: '/lead-machine' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.path}
                      onClick={() => handleImpersonate(tab.path, true)}
                      disabled={impersonating}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: 'none',
                        borderBottom: '3px solid transparent',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.7)',
                        opacity: impersonating ? 0.5 : 1,
                        transition: 'color 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FFE500'; e.currentTarget.style.borderBottomColor = '#FFE500' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderBottomColor = 'transparent' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

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
                        <option value="pay_per_lead">Retainer — $750/mo</option>
                      </select>
                      <button
                        onClick={handleSavePlan}
                        disabled={planSaving || planEdit === (selected.plan ?? '')}
                        style={{
                          padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#0e0020', color: '#FFE500', opacity: planSaving || planEdit === (selected.plan ?? '') ? 0.5 : 1,
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

                {/* Bless toggle */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block' }}>Bless This Account</label>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Bypass all billing gates and credit deductions</span>
                  </div>
                  <button
                    onClick={handleToggleBlessed}
                    disabled={blessSaving}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                      background: selected.blessed ? '#16a34a' : '#d1d5db',
                      opacity: blessSaving ? 0.5 : 1,
                      transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      display: 'block', width: 18, height: 18, borderRadius: 9, background: 'white',
                      position: 'absolute', top: 3,
                      left: selected.blessed ? 23 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
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

              {/* Onboarding Data */}
              {selected.onboarding_status !== 'none' && (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{ padding: '16px 24px', borderBottom: onboardingOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={handleViewOnboardingData}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                        Onboarding
                      </h3>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: ONBOARDING_BADGES[selected.onboarding_status].bg,
                        color: ONBOARDING_BADGES[selected.onboarding_status].color,
                      }}>
                        {ONBOARDING_BADGES[selected.onboarding_status].shortLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {onboardingData && (onboardingData as Record<string, unknown>)['5'] && ((onboardingData as Record<string, unknown>)['5'] as Record<string, unknown>)?.metaSkipped === true ? (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef3c7', color: '#92400e' }}>
                          Needs Meta Help
                        </span>
                      ) : null}
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{onboardingOpen ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {onboardingOpen && (
                    <div style={{ padding: '16px 24px' }}>
                      {!onboardingData ? (
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: 8 }}>Loading…</div>
                      ) : Object.keys(onboardingData).length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: 8 }}>No data submitted yet</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {/* Mapping guide */}
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, lineHeight: 1.6 }}>
                            <strong style={{ color: '#64748b' }}>Field mapping guide:</strong> Services → radio/dropdown · Add-ons → checkbox · Sqft (number) → number field · Sqft (map) → draw_area · Travel → route · Quantity → number · Min quote → form-level min_quote
                          </div>

                          {/* Render each step */}
                          {Object.entries(onboardingData).map(([stepNum, stepData]) => {
                            const sd = stepData as Record<string, unknown>
                            return (
                              <div key={stepNum} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ background: '#f8fafc', padding: '8px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Step {stepNum}
                                </div>
                                <div style={{ padding: '12px 14px' }}>
                                  {Object.entries(sd).map(([key, val]) => (
                                    <div key={key} style={{ fontSize: '0.82rem', padding: '4px 0', display: 'flex', gap: 8 }}>
                                      <span style={{ fontWeight: 600, color: '#475569', minWidth: 140, flexShrink: 0 }}>{key}:</span>
                                      <span style={{ color: '#1e293b', wordBreak: 'break-word' }}>
                                        {typeof val === 'object' ? JSON.stringify(val, null, 0) : String(val)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleCopyOnboardingLink} style={{ padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569' }}>
                              Copy Link
                            </button>
                            {selected.onboarding_status === 'completed' && (
                              <button
                                onClick={handleMarkFormBuilt}
                                disabled={markingBuilt}
                                style={{ padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: 'none', background: '#0e0020', color: '#ffe500', cursor: 'pointer', opacity: markingBuilt ? 0.6 : 1 }}
                              >
                                {markingBuilt ? 'Marking…' : 'Mark Form Built'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* New PPL invite modal */}
      {inviteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Send Onboarding Invite</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px' }}>
              They&apos;ll get the link by email (and text, if you add a number), then create a password, subscribe at $750/mo, and fill out the business wizard.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Business / Contact Name</label>
                <input
                  type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Smith Moving Co."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="owner@example.com"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Phone <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — enables SMS)</span>
                </label>
                <input
                  type="tel" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setInviteOpen(false)}
                style={{ flex: 1, padding: '9px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={inviteSaving || !inviteName.trim() || !inviteEmail.trim()}
                style={{
                  flex: 1, padding: '9px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: 8, border: 'none',
                  background: '#0e0020', color: '#FFE500', cursor: 'pointer',
                  opacity: inviteSaving || !inviteName.trim() || !inviteEmail.trim() ? 0.5 : 1,
                }}
              >
                {inviteSaving ? 'Creating…' : 'Create & Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

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
