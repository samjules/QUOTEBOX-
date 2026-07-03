'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function SettingsManager() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [connected, setConnected] = useState(false)
  const [metaUserId, setMetaUserId] = useState<string | null>(null)
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const [leadForms, setLeadForms] = useState<Array<{ id: string; name: string; status: string }>>([])
  const [allowedFormIds, setAllowedFormIds] = useState<string[]>([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [formsLoaded, setFormsLoaded] = useState(false)
  const [formsPermissionNeeded, setFormsPermissionNeeded] = useState(false)
  const [savingForms, setSavingForms] = useState(false)

  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number } | null>(null)

  const [message, setMessage] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')

  async function loadStatus() {
    const res = await fetch('/api/admin/settings/meta-config')
    const d = await res.json()
    setConnected(!!d.connected)
    setMetaUserId(d.meta_user_id)
    setPages(d.pages ?? [])
    setSelectedPageId(d.meta_page_id ?? '')
    setAllowedFormIds(d.meta_allowed_form_ids ?? [])
    if (d.meta_page_id) await loadLeadForms(d.meta_page_id)
    setLoaded(true)
  }

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/meta/leadgen-webhook`)
    loadStatus()
    if (searchParams.get('meta') === 'connected') {
      setMessage('Meta account connected!')
      router.replace('/admin/settings')
      setTimeout(() => setMessage(''), 4000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadLeadForms(pageId?: string) {
    setLoadingForms(true)
    try {
      const params = pageId || selectedPageId ? `?pageId=${pageId ?? selectedPageId}` : ''
      const res = await fetch(`/api/admin/settings/meta-lead-forms${params}`)
      const d = await res.json()
      if (res.status === 403 && d.error === 'permission_required') {
        setFormsLoaded(true)
        setLeadForms([])
        setFormsPermissionNeeded(true)
        return
      }
      if (!res.ok) throw new Error(d.error || 'Failed to load forms')
      setFormsPermissionNeeded(false)
      setLeadForms(d.forms ?? [])
      setAllowedFormIds(d.allowedFormIds ?? [])
      setFormsLoaded(true)
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Failed to load lead forms'}`)
    } finally {
      setLoadingForms(false)
    }
  }

  async function handlePageChange(pageId: string) {
    setSelectedPageId(pageId)
    setFormsLoaded(false)
    setLeadForms([])
    setAllowedFormIds([])
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings/meta-page', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pageId || null }),
      })
      if (!res.ok) throw new Error('Save failed')
    } catch {
      setMessage('Error: Failed to save page selection')
      return
    }
    if (pageId) await loadLeadForms(pageId)
  }

  function toggleFormId(formId: string) {
    setAllowedFormIds((prev) => prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId])
  }

  async function handleSaveAllowedForms() {
    setSavingForms(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings/meta-lead-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formIds: allowedFormIds }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to save')
      setMessage('Lead form preferences saved!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Failed to save lead forms'}`)
    } finally {
      setSavingForms(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/settings/meta-sync', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Sync failed')
      setSyncResult(d)
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Failed to sync leads'}`)
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings/meta-config', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')
      setConnected(false)
      setMetaUserId(null)
      setPages([])
      setSelectedPageId('')
      setLeadForms([])
      setAllowedFormIds([])
      setFormsLoaded(false)
      setMessage('Meta account disconnected.')
      setTimeout(() => setMessage(''), 2000)
    } catch {
      setMessage('Error: Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  if (!loaded) return <div style={{ padding: 40, color: '#94a3b8' }}>Loading…</div>

  return (
    <div style={{ padding: '32px 28px', maxWidth: 720, margin: '0 auto', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e0020', margin: '0 0 4px' }}>Admin Settings</h1>
      <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px' }}>
        Configuration for QuoteBox&apos;s own integrations — not customer/tenant settings.
      </p>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0e0020', margin: '0 0 6px' }}>Meta Lead Ads — Your Own Page</h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
          Connect your own Facebook Page the same way tenant accounts connect theirs — leads land in the Sales Pipeline on the Leads page.
        </p>

        {!connected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>No Meta account connected</span>
            </div>
            <a
              href="/api/meta/connect?admin=1"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1877F2', color: '#fff',
                fontSize: '0.85rem', fontWeight: 600, padding: '9px 16px', borderRadius: 8, textDecoration: 'none',
              }}
            >
              Connect Meta Account
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Connected</span>
                {metaUserId && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>· User ID: {metaUserId}</span>}
              </div>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>

            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Facebook Page</p>
              {pages.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>No Facebook Pages found on this account.</p>
              ) : (
                <select
                  value={selectedPageId}
                  onChange={(e) => handlePageChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', color: '#0e0020', background: '#fff' }}
                >
                  <option value="">Select a page…</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedPageId && (
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Lead Forms</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 10 }}>
                  Choose which lead forms send leads into the Sales Pipeline. If none are selected, all forms are accepted.
                </p>

                {!formsLoaded ? (
                  <button
                    onClick={() => loadLeadForms()}
                    disabled={loadingForms}
                    style={{ fontSize: '0.82rem', color: '#5b50d6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {loadingForms ? 'Loading forms…' : 'Load lead forms →'}
                  </button>
                ) : formsPermissionNeeded ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e', margin: 0 }}>Additional Meta permission required</p>
                    <p style={{ fontSize: '0.75rem', color: '#a16207', margin: '4px 0 0' }}>
                      The <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>leads_retrieval</code> permission needs approval in the Meta App Dashboard. Incoming leads from this page are still accepted meanwhile.
                    </p>
                  </div>
                ) : leadForms.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>No lead forms found on this page.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                      {leadForms.map((form) => (
                        <label key={form.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f8fafc', cursor: 'pointer' }}>
                          <input type="checkbox" checked={allowedFormIds.includes(form.id)} onChange={() => toggleFormId(form.id)} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0e0020', margin: 0 }}>{form.name}</p>
                            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>ID: {form.id} · {form.status}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {allowedFormIds.length === 0 && (
                      <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>No forms selected — all forms will be accepted.</p>
                    )}
                    <button
                      onClick={handleSaveAllowedForms}
                      disabled={savingForms}
                      style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0e0020', color: '#ffe500', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', opacity: savingForms ? 0.6 : 1, fontFamily: 'inherit' }}
                    >
                      {savingForms ? 'Saving…' : 'Save Form Preferences'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                onClick={handleSync}
                disabled={syncing || !selectedPageId}
                style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '0.85rem', fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {syncing ? 'Syncing…' : 'Sync Leads Now'}
              </button>
              {syncResult && (
                <span style={{ marginLeft: 10, fontSize: '0.8rem', color: '#15803d' }}>
                  Imported {syncResult.imported}, skipped {syncResult.skipped} (already synced)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0e0020', margin: '0 0 10px' }}>Webhook Setup</h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
          Connecting via the button above automatically subscribes your page to the <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>leadgen</code> webhook field, sharing the same endpoint used for tenant Meta connections:
        </p>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#0e0020', wordBreak: 'break-all', marginBottom: 12 }}>
          {webhookUrl || '…'}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Requires <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>NEXT_PUBLIC_META_APP_ID</code>,{' '}
          <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>META_APP_SECRET</code>, and{' '}
          <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>META_WEBHOOK_VERIFY_TOKEN</code> set as environment variables. A daily cron job also backfills any leads the webhook misses.
        </p>
      </div>

      {message && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10,
          background: message.startsWith('Error') ? '#dc2626' : '#16a34a', color: 'white', fontSize: '0.85rem',
          fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000,
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
