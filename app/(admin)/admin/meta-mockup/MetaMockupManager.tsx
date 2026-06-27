'use client'

import { useState, useTransition } from 'react'
import InstagramPhonePreview from './InstagramPhonePreview'

type FormOption = { id: string; form_name: string; slug: string; business_name: string }
type Mockup = {
  id: string
  title: string
  page_name: string
  page_avatar_url: string | null
  ad_image_url: string | null
  ad_body: string
  cta_label: string
  target_form_slug: string
  created_at: string
}

const SITE = 'https://quote-box.com'

const defaultDraft = {
  title: '',
  page_name: '',
  page_avatar_url: '',
  ad_image_url: '',
  ad_body: '',
  cta_label: 'Get Quote',
  target_form_slug: '',
}

export default function MetaMockupManager({
  forms,
  initialMockups,
}: {
  forms: FormOption[]
  initialMockups: Mockup[]
}) {
  const [mockups, setMockups] = useState<Mockup[]>(initialMockups)
  const [draft, setDraft] = useState({ ...defaultDraft })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const selectedForm = forms.find(f => f.slug === draft.target_form_slug)

  function startNew() {
    setEditingId(null)
    setDraft({ ...defaultDraft })
    setError('')
  }

  function startEdit(m: Mockup) {
    setEditingId(m.id)
    setDraft({
      title: m.title,
      page_name: m.page_name,
      page_avatar_url: m.page_avatar_url ?? '',
      ad_image_url: m.ad_image_url ?? '',
      ad_body: m.ad_body,
      cta_label: m.cta_label,
      target_form_slug: m.target_form_slug,
    })
    setError('')
  }

  function handleFormSelect(slug: string) {
    const f = forms.find(x => x.slug === slug)
    setDraft(d => ({
      ...d,
      target_form_slug: slug,
      page_name: d.page_name || f?.business_name || '',
      title: d.title || (f ? `${f.business_name} Ad Mockup` : ''),
    }))
  }

  async function handleSave() {
    if (!draft.target_form_slug) { setError('Select a client form first.'); return }
    if (!draft.page_name) { setError('Enter a page name.'); return }
    setError('')

    startTransition(async () => {
      const method = 'POST'
      const body = editingId
        ? { id: editingId, ...draft }
        : { ...draft }
      const url = '/api/admin/meta-mockup'
      const res = await fetch(editingId ? url : url, {
        method: editingId ? 'PUT' : method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }

      if (editingId) {
        setMockups(ms => ms.map(m => m.id === editingId ? data : m))
      } else {
        setMockups(ms => [data, ...ms])
        setEditingId(data.id)
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this mockup?')) return
    startTransition(async () => {
      await fetch(`/api/admin/meta-mockup?id=${id}`, { method: 'DELETE' })
      setMockups(ms => ms.filter(m => m.id !== id))
      if (editingId === id) { setEditingId(null); setDraft({ ...defaultDraft }) }
    })
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${SITE}/ad-preview/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const previewUrl = `${SITE}/${draft.target_form_slug}`

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '100vh', background: '#f5f5f7' }}>

      {/* ── Left panel: list + editor ── */}
      <div style={{ width: 420, flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>Meta Mockup</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Build shareable ad funnel previews</div>
          </div>
          <button
            onClick={startNew}
            style={{ padding: '8px 16px', background: '#111', color: '#fff', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            + New
          </button>
        </div>

        {/* Mockup list */}
        {mockups.length > 0 && (
          <div style={{ borderBottom: '1px solid #f3f4f6', maxHeight: 200, overflowY: 'auto' }}>
            {mockups.map(m => (
              <div
                key={m.id}
                onClick={() => startEdit(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', cursor: 'pointer',
                  background: editingId === m.id ? '#f5f3ff' : 'transparent',
                  borderLeft: editingId === m.id ? '3px solid #5b5bd6' : '3px solid transparent',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title || 'Untitled'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>quote-box.com/{m.target_form_slug}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); copyLink(m.id) }}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: copiedId === m.id ? '#f0fdf4' : '#f9fafb', fontSize: '0.7rem', fontWeight: 600, color: copiedId === m.id ? '#16a34a' : '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {copiedId === m.id ? '✓ Copied' : 'Copy link'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(m.id) }}
                  style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Editor form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {editingId ? 'Edit Mockup' : 'New Mockup'}
          </div>

          {/* Client form selector */}
          <div>
            <label style={labelStyle}>Client Form</label>
            <select
              value={draft.target_form_slug}
              onChange={e => handleFormSelect(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Select a client form —</option>
              {forms.map(f => (
                <option key={f.id} value={f.slug}>
                  {f.business_name} — {f.form_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Mockup Title (internal)</label>
            <input style={inputStyle} placeholder="e.g. Joe's Junk Removal Preview" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>Facebook / IG Page Name</label>
            <input style={inputStyle} placeholder="e.g. Joe's Junk Removal" value={draft.page_name} onChange={e => setDraft(d => ({ ...d, page_name: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>Page Avatar URL <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
            <input style={inputStyle} placeholder="https://..." value={draft.page_avatar_url} onChange={e => setDraft(d => ({ ...d, page_avatar_url: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>Ad Image URL</label>
            <input style={inputStyle} placeholder="https://..." value={draft.ad_image_url} onChange={e => setDraft(d => ({ ...d, ad_image_url: e.target.value }))} />
            {draft.ad_image_url && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', height: 120, background: '#f3f4f6' }}>
                <img src={draft.ad_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Ad Caption / Body</label>
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' as const }}
              placeholder="Get a free instant quote in 60 seconds…"
              value={draft.ad_body}
              onChange={e => setDraft(d => ({ ...d, ad_body: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>CTA Button Label</label>
            <input style={inputStyle} placeholder="Get Quote" value={draft.cta_label} onChange={e => setDraft(d => ({ ...d, cta_label: e.target.value }))} />
          </div>

          {error && <div style={{ fontSize: '0.82rem', color: '#ef4444' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{ flex: 1, padding: '11px', background: '#111', color: '#fff', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : editingId ? 'Save Changes' : 'Create Mockup'}
            </button>
            {editingId && (
              <button
                onClick={() => copyLink(editingId)}
                style={{ padding: '11px 18px', background: copiedId === editingId ? '#f0fdf4' : '#f3f4f6', color: copiedId === editingId ? '#16a34a' : '#374151', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                {copiedId === editingId ? '✓ Copied!' : '🔗 Share'}
              </button>
            )}
          </div>

          {editingId && (
            <a
              href={`/ad-preview/${editingId}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', fontSize: '0.78rem', color: '#5b5bd6', fontWeight: 600, textDecoration: 'none' }}
            >
              Open preview in new tab ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Right panel: live phone preview ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', minHeight: '100vh', gap: 20 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Live Preview
        </div>
        <InstagramPhonePreview
          pageName={draft.page_name || 'Your Business'}
          pageAvatarUrl={draft.page_avatar_url || null}
          adImageUrl={draft.ad_image_url || null}
          adBody={draft.ad_body || 'Your ad copy will appear here…'}
          ctaLabel={draft.cta_label || 'Get Quote'}
          destinationUrl={draft.target_form_slug ? previewUrl : '#'}
        />
        {draft.target_form_slug && (
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            CTA links to → quote-box.com/{draft.target_form_slug}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', color: '#111', background: '#fafafa',
}
