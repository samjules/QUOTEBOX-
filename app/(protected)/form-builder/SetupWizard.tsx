'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FormField } from '@/lib/types'

function fid() { return Math.random().toString(36).slice(2, 9) }

// Fixed defaults for a moving quote form — no rate/tier/drive-time/extras editing here.
// That's what the (currently hidden) advanced builder is for; Quick Setup only touches
// business name, brand color, and hero photo, whether creating a form or editing one.
const DEFAULT_TIERS = [
  { label: 'Studio / 1 Bedroom', rate: '120', hours: '3' },
  { label: '2–3 Bedrooms', rate: '120', hours: '5' },
  { label: '4+ Bedrooms', rate: '150', hours: '8' },
]
const DEFAULT_EXTRAS = [
  { label: 'Packing & Unpacking', price: '150' },
  { label: 'Piano / Heavy Items', price: '100' },
  { label: 'Long Carry (>75 ft)', price: '75' },
]
const DEFAULT_RADIUS_TIERS = [
  { maxMiles: 20, driveCharge: 50 },
  { maxMiles: 40, driveCharge: 100 },
  { maxMiles: null as number | null, driveCharge: 175 },
]

function generateFields(): FormField[] {
  return [
    {
      id: fid(), type: 'radio', label: 'Home Size', required: true, showPrices: true,
      options: DEFAULT_TIERS.map((t) => ({ id: fid(), label: t.label, price: parseFloat(t.rate) || 0, hours: parseFloat(t.hours) || 1 })),
    },
    {
      id: fid(), type: 'route', label: 'Moving Route', required: true, routeChargeType: 'radius_tiers',
      locationMode: 'point_to_point',
      radiusTiers: DEFAULT_RADIUS_TIERS.map((r) => ({ id: fid(), maxMiles: r.maxMiles, driveCharge: r.driveCharge })),
    } as FormField,
    {
      id: fid(), type: 'checkbox', label: 'Add-ons', required: false,
      options: DEFAULT_EXTRAS.map((e) => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 })),
    },
    { id: fid(), type: 'textarea', label: 'Additional Notes', required: false, placeholder: 'Any special instructions or details about the job…' },
  ]
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
}

const COLOR_PRESETS = ['#F97316', '#374151', '#0e0020', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#0EA5E9']

interface ExistingForm {
  id: string
  form_name: string
  form_config: { slug?: string; brand_color?: string; hero_image_url?: string }
}

interface SetupWizardProps {
  accountId: string
  existingForm?: ExistingForm | null
  onCustomize: (formId: string, formName: string, slug: string) => void
  onAdvanced?: () => void
  onDone?: (formId: string) => void
}

function stripSuffix(name: string) {
  return name.replace(/\s+(Quote|Quiz)$/i, '')
}

export default function SetupWizard({ accountId, existingForm, onCustomize, onAdvanced, onDone }: SetupWizardProps) {
  const supabase = createClient()
  const isEditing = !!existingForm

  const [businessName, setBusinessName] = useState(existingForm ? stripSuffix(existingForm.form_name) : '')
  const [brandColor, setBrandColor] = useState(existingForm?.form_config.brand_color ?? '#F97316')
  const [heroImageUrl, setHeroImageUrl] = useState(existingForm?.form_config.hero_image_url ?? '')
  const [heroUploading, setHeroUploading] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [done, setDone] = useState(false)
  const [liveSlug, setLiveSlug] = useState(existingForm?.form_config.slug ?? '')
  const [savedFormId, setSavedFormId] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleHeroFileSelect(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext) || file.size > 5 * 1024 * 1024) return
    setHeroUploading(true)
    const path = `${accountId}/${Date.now()}-${fid()}.${ext}`
    const { data, error } = await supabase.storage.from('vsls').upload(path, file, { contentType: file.type, upsert: false })
    if (error || !data) { setHeroUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('vsls').getPublicUrl(data.path)
    await supabase.from('vsls').insert({ account_id: accountId, title: 'Hero image', file_name: `hero.${ext}`, file_url: publicUrl, storage_path: path, file_size: file.size })
    setHeroImageUrl(publicUrl)
    setHeroUploading(false)
  }

  async function handleSave() {
    if (!businessName.trim()) return
    setSaving(true); setSaveError('')

    try {
      if (existingForm) {
        // Editing: only touch branding — never overwrite the form's pricing fields.
        const { error } = await supabase.from('hosted_forms')
          .update({
            form_name: `${businessName.trim()} Quote`,
            form_config: { ...existingForm.form_config, brand_color: brandColor, hero_image_url: heroImageUrl },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingForm.id)
        if (error) throw error
        setLiveSlug(existingForm.form_config.slug ?? '')
        setSavedFormId(existingForm.id)
      } else {
        const baseSlug = toSlug(businessName.trim())
        let slug = baseSlug
        const { data: conflicts } = await supabase.from('hosted_forms').select('id').eq('form_config->>slug', slug)
        if ((conflicts ?? []).length > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`

        const formConfig = {
          slug,
          description: 'Get an instant quote for your moving job.',
          submit_label: 'Get My Instant Quote',
          currency: '$', brand_color: brandColor,
          show_total: true, quote_display: 'live',
          hero_image_url: heroImageUrl, fields: generateFields(),
          min_quote: 0,
          disclaimer_enabled: true,
          disclaimer_text: 'This is a minimum estimate. Final price is confirmed once our crew assesses the job on-site.',
          send_email_estimate: true,
          confirm_title: "You're all set!",
          confirm_message: "We've received your details and will be in touch shortly.",
          next_step_label: 'Next Step',
          total_label: 'Minimum estimate',
          email_template: { subject: '', intro: '', outro: '', header_image: '', accent_color: brandColor },
        }

        const { data, error } = await supabase.from('hosted_forms')
          .insert({ account_id: accountId, form_name: `${businessName.trim()} Quote`, form_type: 'quote', form_config: formConfig, is_active: true, updated_at: new Date().toISOString() })
          .select().single()
        if (error) throw error
        setLiveSlug(slug)
        setSavedFormId(data.id)
      }
      setDone(true)
    } catch (e: unknown) {
      setSaveError((e as { message?: string }).message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://quote-box.com/${liveSlug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Shared styles ──────────────────────────────────────────────
  const pageStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-start',
    padding: '48px 24px 80px', background: 'var(--bg)',
  }
  const cardStyle: React.CSSProperties = {
    maxWidth: 500, width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 140px)',
  }
  const bodyStyle: React.CSSProperties = { padding: '32px 36px 24px', overflowY: 'auto', flex: 1 }
  const footerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 36px', borderTop: '1px solid var(--border)',
    background: 'var(--surface)', flexShrink: 0,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--fg)', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none',
  }
  const fieldLabel: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)',
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7, display: 'block',
  }

  function Q({ label, sub }: { label: string; sub?: string }) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--fg)', lineHeight: 1.2, marginBottom: sub ? 8 : 0 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>{sub}</div>}
      </div>
    )
  }

  // ── SUCCESS ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, maxHeight: 'none' }}>
          <div style={{ height: 4, background: brandColor, flexShrink: 0 }} />
          <div style={{ ...bodyStyle, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${brandColor}18`, border: `2px solid ${brandColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: brandColor }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>{isEditing ? 'Your changes are saved' : 'Your form is live'}</div>
            <div style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: 24 }}>{isEditing ? 'Your quote form is already up to date.' : 'Share this link to start collecting leads immediately.'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ flex: 1, fontSize: '0.86rem', fontFamily: "'DM Mono', monospace", color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>quote-box.com/{liveSlug}</div>
              <button onClick={copyLink} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 7, background: copied ? brandColor : 'var(--surface)', border: `1px solid ${copied ? brandColor : 'var(--border)'}`, color: copied ? '#fff' : 'var(--fg)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>{copied ? 'Copied' : 'Copy link'}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {onDone && <button onClick={() => onDone(savedFormId)} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: brandColor, color: '#fff', border: 'none', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>Continue to next step →</button>}
              <a href={`https://quote-box.com/${liveSlug}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px 0', background: onDone ? 'none' : brandColor, color: onDone ? 'var(--fg)' : '#fff', border: onDone ? '1px solid var(--border)' : 'none', borderRadius: 10, fontWeight: onDone ? 600 : 700, fontSize: '0.88rem', textDecoration: 'none' }}>Preview form</a>
              {!onDone && !isEditing && <button onClick={() => onCustomize(savedFormId, businessName.trim(), liveSlug)} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>Edit details</button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SINGLE SCREEN: business name, brand color, hero photo ───────
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ height: 4, background: brandColor, flexShrink: 0 }} />
        <div style={bodyStyle}>
          <Q
            label={isEditing ? 'Edit your quote form' : 'Build your instant quote form'}
            sub={isEditing ? 'Update your business name, brand color, or photo — pricing stays as you\'ve set it.' : 'Business name, color, and an optional photo. Takes about 30 seconds.'}
          />

          <div style={{ marginBottom: 20 }}>
            <label style={fieldLabel}>Your business name</label>
            <input style={inputStyle} type="text" placeholder="e.g. Smith's Moving Co." value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={fieldLabel}>Brand color</label>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setBrandColor(c)} style={{ width: 26, height: 26, borderRadius: 6, background: c, padding: 0, border: brandColor === c ? '2.5px solid var(--fg)' : '2.5px solid transparent', outline: brandColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer', flexShrink: 0 }} />
              ))}
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 1, background: 'none' }} />
            </div>
          </div>

          <div>
            <label style={fieldLabel}>Photo {isEditing ? '' : '(optional)'}</label>
            <input ref={heroFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroFileSelect(f) }} />
            {heroImageUrl ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt="Hero" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '8px 12px', background: 'var(--surface2)', display: 'flex', gap: 8 }}>
                  <button onClick={() => heroFileRef.current?.click()} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: '0.78rem', cursor: 'pointer' }}>Change photo</button>
                  <button onClick={() => setHeroImageUrl('')} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ) : (
              <button onClick={() => heroFileRef.current?.click()} disabled={heroUploading} style={{ display: 'block', width: '100%', padding: '32px 20px', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'var(--surface2)', cursor: heroUploading ? 'wait' : 'pointer', textAlign: 'center' as const }}>
                {heroUploading ? <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>Uploading…</div> : <>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>A photo of your truck or crew builds trust</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>JPG, PNG or WebP — max 5 MB</div>
                </>}
              </button>
            )}
          </div>

          {saveError && <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: '0.8rem', color: '#ef4444' }}>{saveError}</div>}
        </div>
        <div style={footerStyle}>
          {onAdvanced ? (
            <button onClick={onAdvanced} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>Advanced builder</button>
          ) : <div />}
          <button
            className="bb bb-primary"
            disabled={saving || businessName.trim().length < 2}
            onClick={handleSave}
            style={{ minWidth: 140 }}
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Launch my form'}
          </button>
        </div>
      </div>
    </div>
  )
}
