'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FormField } from '@/lib/types'
import TrialLanding from './TrialLanding'

// Junk removal is hidden for now — focusing on moving only.
const SERVICE_TYPES = [
  { id: 'moving', label: 'Moving', desc: 'Local & long-distance residential moves', color: '#F97316' },
] as const
type ServiceId = typeof SERVICE_TYPES[number]['id']

function fid() { return Math.random().toString(36).slice(2, 9) }

const TIER_LABELS = ['Studio / 1 Bedroom', '2–3 Bedrooms', '4+ Bedrooms']
const TIER_HOURS = [3, 5, 8]

const DEFAULT_EXTRAS: Record<ServiceId, Array<{ label: string; price: string }>> = {
  moving: [
    { label: 'Packing & Unpacking', price: '150' },
    { label: 'Piano / Heavy Items', price: '100' },
    { label: 'Long Carry (>75 ft)', price: '75' },
  ],
}

interface RadiusTierDraft { id: string; maxMiles: number | null; driveCharge: number }

const DEFAULT_RADIUS_TIERS: RadiusTierDraft[] = [
  { id: fid(), maxMiles: 20, driveCharge: 50 },
  { id: fid(), maxMiles: 40, driveCharge: 100 },
  { id: fid(), maxMiles: null, driveCharge: 175 },
]

function generateFields(service: ServiceId, hourlyRate: number, chargeDrive: boolean, radiusTiers: RadiusTierDraft[]): FormField[] {
  const fields: FormField[] = []

  fields.push({
    id: fid(), type: 'radio',
    label: 'Home Size',
    required: true, showPrices: true,
    options: TIER_LABELS.map((label, i) => ({ id: fid(), label, price: hourlyRate * TIER_HOURS[i], hours: TIER_HOURS[i] })),
  })

  if (chargeDrive) {
    fields.push({
      id: fid(), type: 'route',
      label: 'Moving Route',
      required: true, routeChargeType: 'radius_tiers',
      locationMode: 'point_to_point',
      radiusTiers: radiusTiers.map((r) => ({ id: r.id, maxMiles: r.maxMiles, driveCharge: r.driveCharge })),
    } as FormField)
  }

  fields.push({
    id: fid(), type: 'checkbox', label: 'Add-ons', required: false,
    options: DEFAULT_EXTRAS[service].map((e) => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 })),
  })

  fields.push({ id: fid(), type: 'textarea', label: 'Additional Notes', required: false, placeholder: 'Any special instructions or details about the job…' })

  return fields
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
}

const COLOR_PRESETS = ['#F97316', '#374151', '#0e0020', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#0EA5E9']

type Phase = 'landing' | 'build' | 'rate' | 'drive' | 'upsell' | 'account'

export default function TrialFlow() {
  const [phase, setPhase] = useState<Phase>('landing')

  // Build step
  const [businessName, setBusinessName] = useState('')
  const [serviceType] = useState<ServiceId>('moving')
  const [brandColor, setBrandColor] = useState('#F97316')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Hourly rate step
  const [hourlyRate, setHourlyRate] = useState('120')

  // Drive time step
  const [chargeDrive, setChargeDrive] = useState(true)
  const [radiusTiers, setRadiusTiers] = useState<RadiusTierDraft[]>(DEFAULT_RADIUS_TIERS)
  const [avgMph, setAvgMph] = useState('')

  function setRadiusField(id: string, key: 'maxMiles' | 'driveCharge', val: string) {
    setRadiusTiers((p) => p.map((r) => r.id === id
      ? { ...r, [key]: key === 'maxMiles' ? (val === '' ? null : Number(val)) : Number(val) }
      : r
    ))
  }
  function addZone() { setRadiusTiers((p) => [...p, { id: fid(), maxMiles: null, driveCharge: 0 }]) }
  function removeZone(id: string) { setRadiusTiers((p) => p.filter((r) => r.id !== id)) }

  // Upsell step
  const [upsell, setUpsell] = useState(false)

  // Account step
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function handleLogoSelect(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext) || file.size > 5 * 1024 * 1024) return
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
  }

  async function handleCreateAccount() {
    if (!serviceType || !businessName.trim()) return
    if (!email.trim()) { setSaveError('Email is required'); return }
    if (password.length < 6) { setSaveError('Password must be at least 6 characters'); return }

    setSaving(true)
    setSaveError('')
    const supabase = createClient()

    const createRes = await fetch('/api/build/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, businessName: businessName.trim() }),
    })
    const createData = await createRes.json()
    if (!createRes.ok || !createData.accountId) {
      setSaveError(createData.error ?? 'Failed to create account')
      setSaving(false)
      return
    }
    const accountId: string = createData.accountId

    // The account was created server-side (service role) — sign in now so the
    // browser has an authenticated session for the rest of this step and for checkout.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) { setSaveError(signInError.message); setSaving(false); return }
    await supabase.auth.getSession()

    fetch('/api/auth/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, phone: null }),
    }).catch(() => {})

    if (logoFile) {
      const ext = logoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${accountId}/${Date.now()}-${fid()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('vsls').upload(path, logoFile, { contentType: logoFile.type, upsert: false })
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('vsls').getPublicUrl(uploadData.path)
        await supabase.from('accounts').update({ logo_url: publicUrl }).eq('id', accountId)
      }
    }

    // Average local driving speed, reused for every future quote's drive-time calc.
    if (chargeDrive && avgMph.trim()) {
      const clampedMph = Math.min(80, Math.max(10, parseInt(avgMph, 10) || 35))
      await supabase.from('accounts').update({ avg_driving_mph: clampedMph }).eq('id', accountId)
    }

    const baseSlug = toSlug(businessName.trim())
    let slug = baseSlug
    const { data: conflicts } = await supabase.from('hosted_forms').select('id').eq('form_config->>slug', slug)
    if ((conflicts ?? []).length > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`

    const fields = generateFields(serviceType, parseFloat(hourlyRate) || 0, chargeDrive, radiusTiers)
    const formConfig = {
      slug,
      description: `Get an instant quote for your ${SERVICE_TYPES.find((s) => s.id === serviceType)!.label.toLowerCase()} job.`,
      submit_label: 'Get My Quote →',
      currency: '$', brand_color: brandColor,
      show_total: true, quote_display: 'after_submit',
      fields,
      disclaimer_enabled: true,
      disclaimer_text: 'This is a minimum estimate. Final price is confirmed once our crew assesses the job on-site.',
      send_email_estimate: true,
      confirm_title: "You're all set!",
      confirm_message: "We've received your details and will be in touch shortly.",
      next_step_label: 'Next Step',
      total_label: 'Minimum estimate',
      email_template: { subject: '', intro: '', outro: '', header_image: '', accent_color: brandColor },
    }

    const { error: formError } = await supabase.from('hosted_forms')
      .insert({ account_id: accountId, form_name: `${businessName.trim()} Quote`, form_type: 'quote', form_config: formConfig, is_active: true, updated_at: new Date().toISOString() })
    if (formError) { setSaveError(formError.message); setSaving(false); return }

    // Everything is durably saved — now send them to Stripe Checkout for the $1 trial.
    const res = await fetch('/api/build/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, upsell }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setSaveError(data.error ?? 'Could not start checkout. Your account was created — you can finish setup from your dashboard.')
      setSaving(false)
      return
    }

    window.location.href = data.url
  }

  if (phase === 'landing') {
    return <TrialLanding onStart={() => setPhase('build')} />
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
    padding: '48px 24px 80px', background: '#0e0b1a',
  }
  const cardStyle: React.CSSProperties = {
    maxWidth: 560, width: '100%', background: '#fff', color: '#1c1830', borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 40px 90px -35px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', minHeight: 520,
  }
  const bodyStyle: React.CSSProperties = { padding: '36px 40px', flex: 1, display: 'flex', flexDirection: 'column' }
  const footStyle: React.CSSProperties = { borderTop: '1px solid #e3e0ef', padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }
  const btnPrimary: React.CSSProperties = { background: '#5c51d6', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14.5, padding: '13px 24px', cursor: 'pointer' }
  const btnGold: React.CSSProperties = { background: 'linear-gradient(135deg,#f5a623,#ffcf6b)', color: '#241704', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14.5, padding: '13px 24px', cursor: 'pointer', width: '100%' }
  const btnGhost: React.CSSProperties = { background: 'none', border: 'none', color: '#8b86a8', fontWeight: 700, fontSize: 14.5, padding: '13px 10px', cursor: 'pointer' }
  const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #e3e0ef', borderRadius: 10, padding: '11px 13px', fontSize: 14.5, color: '#1c1830', boxSizing: 'border-box', outline: 'none' }
  const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 700, color: '#8b86a8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }

  if (phase === 'build') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={bodyStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5c51d6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Step 1 of 5</div>
            <h2 style={{ fontSize: 24, margin: '0 0 6px' }}>Build your instant quote form</h2>
            <p style={{ color: '#8b86a8', fontSize: 14.5, margin: '0 0 26px', lineHeight: 1.5 }}>This is what your customers will see once you&apos;re live.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 28 }}>
              <div>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>Business name</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Titan Tuff Moving" value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>Brand color</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setBrandColor(c)}
                        style={{ width: 34, height: 34, borderRadius: 9, background: c, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                      >
                        {brandColor === c && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Logo</label>
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoSelect(f) }} />
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{ border: '1.5px dashed #e3e0ef', borderRadius: 10, padding: 18, textAlign: 'center', fontSize: 12.5, color: '#8b86a8', cursor: 'pointer' }}
                  >
                    {logoPreviewUrl
                      ? // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreviewUrl} alt="Logo" style={{ maxHeight: 40, borderRadius: 6 }} />
                      : 'Drop your logo here, or click to upload'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 11, color: '#8b86a8', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>Live preview</div>
                <div style={{ width: 190, height: 380, borderRadius: 26, background: '#0c0a16', padding: 8, boxShadow: '0 20px 45px -18px rgba(0,0,0,.5)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 64, height: 14, background: '#0c0a16', borderRadius: '0 0 8px 8px', zIndex: 2 }} />
                  <div style={{ width: '100%', height: '100%', borderRadius: 19, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 12px 12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, background: brandColor }}>
                      {logoPreviewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreviewUrl} alt="" style={{ width: 18, height: 18, borderRadius: 4, background: '#fff', objectFit: 'cover' }} />
                      )}
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{businessName || 'Your Business Name'}</div>
                    </div>
                    <div style={{ padding: 12, flex: 1 }}>
                      <div style={{ fontSize: 9, color: '#8b86a8', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, marginBottom: 8 }}>
                        Home Size
                      </div>
                      <div style={{ border: '1.5px solid #e3e0ef', borderRadius: 9, padding: '9px 10px', fontSize: 11, fontWeight: 600, color: '#2b2640', marginBottom: 7 }}>
                        Studio / 1 Bed
                      </div>
                      <div style={{ border: `1.5px solid ${brandColor}`, background: `${brandColor}0f`, color: brandColor, borderRadius: 9, padding: '9px 10px', fontSize: 11, fontWeight: 600, marginBottom: 7 }}>
                        2 Bedrooms
                      </div>
                      <div style={{ border: '1.5px solid #e3e0ef', borderRadius: 9, padding: '9px 10px', fontSize: 11, fontWeight: 600, color: '#2b2640' }}>
                        3 Bedrooms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={footStyle}>
            <div />
            <button
              style={{ ...btnPrimary, opacity: businessName.trim().length > 1 && serviceType ? 1 : 0.4, cursor: businessName.trim().length > 1 && serviceType ? 'pointer' : 'default' }}
              disabled={!(businessName.trim().length > 1 && serviceType !== null)}
              onClick={() => setPhase('rate')}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'rate') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={bodyStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5c51d6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Step 2 of 5</div>
            <h2 style={{ fontSize: 24, margin: '0 0 6px' }}>What do you charge per hour?</h2>
            <p style={{ color: '#8b86a8', fontSize: 14.5, margin: '0 0 26px', lineHeight: 1.5 }}>This is your base labor rate. We&apos;ll use it to price the Studio/1BR, 2–3BR, and 4+BR options on your form.</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#8b86a8' }}>$</span>
              <input
                type="number" min={0} step={5} autoFocus
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                style={{ ...inputStyle, fontSize: '2rem', fontWeight: 800, padding: '14px 16px', maxWidth: 160, textAlign: 'center' as const }}
              />
              <span style={{ fontSize: '1.1rem', color: '#8b86a8', fontWeight: 600 }}>/hr</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: '#8b86a8', lineHeight: 1.5 }}>
              Not sure? Most moving companies charge $80–$150/hr.
            </div>
          </div>
          <div style={footStyle}>
            <button style={btnGhost} onClick={() => setPhase('build')}>Back</button>
            <button
              style={{ ...btnPrimary, opacity: !hourlyRate || parseFloat(hourlyRate) <= 0 ? 0.4 : 1 }}
              disabled={!hourlyRate || parseFloat(hourlyRate) <= 0}
              onClick={() => setPhase('drive')}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'drive') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={bodyStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5c51d6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Step 3 of 5</div>
            <h2 style={{ fontSize: 24, margin: '0 0 6px' }}>Do you charge extra for drive time?</h2>
            <p style={{ color: '#8b86a8', fontSize: 14.5, margin: '0 0 20px', lineHeight: 1.5 }}>Some companies add a fee based on how far the job is from their location.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: chargeDrive ? 20 : 0 }}>
              {[
                { val: true, label: 'Yes — I charge by distance', desc: 'Set a fee for different distance zones' },
                { val: false, label: 'No — drive time is included in my rate', desc: "Distance doesn't affect the quote" },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setChargeDrive(opt.val)}
                  style={{
                    width: '100%', padding: '16px 18px', borderRadius: 11, textAlign: 'left', cursor: 'pointer',
                    border: `2px solid ${chargeDrive === opt.val ? '#5c51d6' : '#e3e0ef'}`,
                    background: chargeDrive === opt.val ? 'rgba(92,81,214,0.06)' : '#fff',
                  }}
                >
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: chargeDrive === opt.val ? '#5c51d6' : '#1c1830' }}>{opt.label}</div>
                  <div style={{ fontSize: 12.5, color: '#8b86a8', marginTop: 3 }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {chargeDrive && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8b86a8', letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Your distance zones</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8b86a8', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Up to (miles)</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8b86a8', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Add to quote</span>
                  <span />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {radiusTiers.map((r, i) => (
                    <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number" min={1} placeholder={i === radiusTiers.length - 1 ? 'Any distance' : '20'}
                        value={r.maxMiles ?? ''}
                        onChange={(e) => setRadiusField(r.id, 'maxMiles', e.target.value)}
                        disabled={i === radiusTiers.length - 1}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.85rem', opacity: i === radiusTiers.length - 1 ? 0.5 : 1 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#8b86a8', flexShrink: 0 }}>$</span>
                        <input type="number" min={0} placeholder="50" value={r.driveCharge || ''} onChange={(e) => setRadiusField(r.id, 'driveCharge', e.target.value)} style={{ ...inputStyle, padding: '8px 8px', fontSize: '0.85rem' }} />
                      </div>
                      <button onClick={() => removeZone(r.id)} disabled={radiusTiers.length <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e3e0ef', background: 'none', color: '#8b86a8', fontSize: '0.76rem', cursor: radiusTiers.length <= 1 ? 'default' : 'pointer', opacity: radiusTiers.length <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addZone} style={{ marginTop: 8, padding: '8px 0', width: '100%', borderRadius: 8, border: '1px dashed #e3e0ef', background: 'none', color: '#5c51d6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>+ Add zone</button>
                <div style={{ marginTop: 4, fontSize: '0.7rem', color: '#8b86a8' }}>Last row = any distance beyond your other zones.</div>

                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e3e0ef' }}>
                  <label style={fieldLabel}>Average speed (mph)</label>
                  <div style={{ fontSize: '0.78rem', color: '#8b86a8', marginBottom: 10, lineHeight: 1.5 }}>
                    How many miles can you typically drive in one hour in your area? We use this — not the map API&apos;s own time estimate, which isn&apos;t reliable — to turn the distance to a job into an accurate drive time.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number" min={10} max={80}
                      placeholder="e.g. 35–45"
                      value={avgMph}
                      onChange={(e) => setAvgMph(e.target.value)}
                      style={{ ...inputStyle, maxWidth: 140 }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#8b86a8', fontWeight: 600 }}>mph</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={footStyle}>
            <button style={btnGhost} onClick={() => setPhase('rate')}>Back</button>
            <button style={btnPrimary} onClick={() => setPhase('upsell')}>Continue →</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'upsell') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ ...bodyStyle, alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5c51d6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16, alignSelf: 'flex-start' }}>Step 4 of 5</div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(92,81,214,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" fill="#5c51d6" /></svg>
            </div>
            <h2 style={{ fontSize: 24, margin: '10px 0 6px' }}>Want it built and live by Friday?</h2>
            <p style={{ color: '#8b86a8', fontSize: 14.5, margin: '0 0 18px', lineHeight: 1.5, maxWidth: 380 }}>Our team can wire up your SMS/email sequence, CRM pipeline, and pricing rules for you.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'grid', gap: 9, textAlign: 'left', maxWidth: 380 }}>
              {['30-day SMS & email nurture sequence built for you', 'Pricing & route calculator configured to your real rates', 'Live 30-minute walkthrough call with our team'].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: '#1c1830' }}>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ fontSize: 15, color: '#8b86a8', marginBottom: 18 }}>One-time setup — <b style={{ color: '#1c1830', fontSize: 22 }}>$297</b></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
              <button style={btnGold} onClick={() => { setUpsell(true); setPhase('account') }}>Yes, build it for me — $297 →</button>
              <button style={{ background: 'none', border: 'none', color: '#8b86a8', textDecoration: 'underline', fontSize: 13, cursor: 'pointer' }} onClick={() => { setUpsell(false); setPhase('account') }}>
                Continue with my $1 trial instead
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // phase === 'account'
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={bodyStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#5c51d6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Step 5 of 5</div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px' }}>Create your account</h2>
          <p style={{ color: '#8b86a8', fontSize: 14.5, margin: '0 0 26px', lineHeight: 1.5 }}>
            Your form is ready. Next, you&apos;ll be sent to secure checkout for your $1 trial{upsell ? ' plus the done-for-you setup' : ''}.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={fieldLabel}>Email</label>
              <input style={inputStyle} type="email" placeholder="you@yourbusiness.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <label style={fieldLabel}>Password</label>
              <input
                style={inputStyle} type="password" placeholder="At least 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !saving && handleCreateAccount()}
              />
            </div>
          </div>

          {saveError && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: 13, color: '#ef4444' }}>{saveError}</div>
          )}

          <div style={{ marginTop: 16, fontSize: 11.5, color: '#8b86a8', lineHeight: 1.5 }}>
            By continuing you agree to our{' '}
            <a href="/terms" target="_blank" style={{ color: '#5c51d6', textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" style={{ color: '#5c51d6', textDecoration: 'underline' }}>Privacy Policy</a>.
          </div>
        </div>
        <div style={footStyle}>
          <button style={btnGhost} onClick={() => setPhase('upsell')}>Back</button>
          <button
            style={{ ...btnPrimary, minWidth: 200, opacity: saving || !email.trim() || password.length < 6 ? 0.5 : 1 }}
            disabled={saving || !email.trim() || password.length < 6}
            onClick={handleCreateAccount}
          >
            {saving ? 'Setting up your form…' : 'Continue to payment →'}
          </button>
        </div>
      </div>
    </div>
  )
}
