'use client'

import { useState, useEffect } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none',
  fontFamily: 'inherit', color: '#0e0020', boxSizing: 'border-box', background: '#fff',
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }

export default function SettingsManager() {
  const [pageId, setPageId] = useState('')
  const [token, setToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [formIds, setFormIds] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string; pageName?: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/meta/leadgen-webhook`)
    fetch('/api/admin/settings/meta-config')
      .then((r) => r.json())
      .then((d) => {
        setPageId(d.page_id ?? '')
        setHasToken(!!d.has_token)
        setFormIds((d.allowed_form_ids ?? []).join(', '))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/meta-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: pageId.trim(),
          page_access_token: token.trim(),
          allowed_form_ids: formIds.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      })
      const d = await res.json()
      if (!res.ok) { showToast(d.error ?? 'Failed to save', false); return }
      setHasToken(!!d.has_token)
      setToken('')
      showToast('Settings saved')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/settings/meta-config/test', { method: 'POST' })
      const d = await res.json()
      setTestResult(d)
    } finally {
      setTesting(false)
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
          Connects your own Facebook Page&apos;s Lead Ads (advertising QuoteBox) into the Sales Pipeline on the Leads page.
          Get a Page Access Token from Meta Business Suite or the Graph API Explorer, then subscribe your page to the
          <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, margin: '0 4px' }}>leadgen</code>
          webhook field.
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Page ID</label>
          <input style={inputStyle} value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="e.g. 123456789012345" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Page Access Token</label>
          <input
            style={inputStyle}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={hasToken ? 'Set — leave blank to keep current' : 'Paste your Page Access Token'}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Allowed Form IDs <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional, comma-separated — blank = all forms on this page)</span></label>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            value={formIds}
            onChange={(e) => setFormIds(e.target.value)}
            placeholder="1234567890, 2345678901"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0e0020', color: '#ffe500',
              fontSize: '0.86rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            style={{
              padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151',
              fontSize: '0.86rem', fontWeight: 700, cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>

        {testResult && (
          <div style={{ marginTop: 10, fontSize: '0.82rem', color: testResult.ok ? '#15803d' : '#dc2626' }}>
            {testResult.ok ? `✓ Connected — page name: ${testResult.pageName}` : `✗ ${testResult.error}`}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0e0020', margin: '0 0 10px' }}>Webhook Setup</h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
          This shares the same webhook endpoint used for tenant Meta connections. In your Meta App&apos;s webhook settings, subscribe this URL to the <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>leadgen</code> field on the Page object:
        </p>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#0e0020', wordBreak: 'break-all', marginBottom: 12 }}>
          {webhookUrl || '…'}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Requires <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>META_APP_SECRET</code> and{' '}
          <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>META_WEBHOOK_VERIFY_TOKEN</code> to be set as environment variables in Vercel (shared with the tenant-facing Meta integration).
          A daily cron job also backfills any leads the webhook misses.
        </p>
      </div>

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
