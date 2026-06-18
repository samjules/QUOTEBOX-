'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FormField } from '@/lib/types'

// ── Service catalog ───────────────────────────────────────────
const SERVICE_TYPES = [
  { id: 'moving',       label: 'Moving',       desc: 'Local & long-distance residential moves', color: '#F97316' },
  { id: 'junk_removal', label: 'Junk Removal',  desc: 'Haul-away, cleanouts & debris removal',   color: '#374151' },
] as const

type ServiceId = typeof SERVICE_TYPES[number]['id']

function fid() { return Math.random().toString(36).slice(2, 9) }

// ── Pricing data types ────────────────────────────────────────
interface ServiceTier { id: string; label: string; rate: string; hours: string }
interface ExtraItem    { id: string; label: string; price: string }
interface RadiusTierData { id: string; maxMiles: number | null; driveCharge: number }

const DEFAULT_SERVICE_TIERS: Record<ServiceId, Array<{ label: string; rate: string; hours: string }>> = {
  moving: [
    { label: 'Studio / 1 Bedroom',   rate: '120', hours: '3' },
    { label: '2–3 Bedrooms',         rate: '120', hours: '5' },
    { label: '4+ Bedrooms',          rate: '150', hours: '8' },
  ],
  junk_removal: [
    { label: '1/4 Truck Load',  rate: '100', hours: '2' },
    { label: '1/2 Truck Load',  rate: '100', hours: '3' },
    { label: 'Full Truck Load', rate: '120', hours: '4' },
  ],
}

const DEFAULT_EXTRAS: Record<ServiceId, Array<{ label: string; price: string }>> = {
  moving: [
    { label: 'Packing & Unpacking',  price: '150' },
    { label: 'Piano / Heavy Items',  price: '100' },
    { label: 'Long Carry (>75 ft)',  price: '75'  },
  ],
  junk_removal: [
    { label: 'Same-day service',    price: '50'  },
    { label: 'Heavy items (piano)', price: '75'  },
    { label: 'Appliance removal',   price: '50'  },
  ],
}

const DEFAULT_RADIUS_TIERS: RadiusTierData[] = [
  { id: fid(), maxMiles: 20,   driveCharge: 50  },
  { id: fid(), maxMiles: 40,   driveCharge: 100 },
  { id: fid(), maxMiles: null, driveCharge: 175 },
]

// ── Field generation ──────────────────────────────────────────
// Quote = (hourlyRate × hours) + driveCharge + extras
// Each tier stores its own rate as option.price and duration as option.hours
function generateFields(
  service: ServiceId,
  serviceTiers: ServiceTier[],
  chargeDrive: boolean,
  radiusTiers: RadiusTierData[],
  extras: ExtraItem[],
): FormField[] {
  const fields: FormField[] = []

  fields.push({
    id: fid(), type: 'radio',
    label: service === 'moving' ? 'Home Size' : 'Load Size',
    required: true, showPrices: true,
    options: serviceTiers.map((t) => ({
      id: fid(),
      label: t.label,
      price: parseFloat(t.rate)  || 0,
      hours: parseFloat(t.hours) || 1,
    })),
  })

  if (chargeDrive) {
    fields.push({
      id: fid(), type: 'route',
      label: service === 'moving' ? 'Moving Route' : 'Pickup Location',
      required: true,
      routeChargeType: 'radius_tiers',
      locationMode: service === 'junk_removal' ? 'single' : 'point_to_point',
      radiusTiers: radiusTiers.map((rt) => ({
        id: rt.id, maxMiles: rt.maxMiles, driveCharge: rt.driveCharge,
      })),
    } as FormField)
  }

  if (extras.length > 0) {
    fields.push({
      id: fid(), type: 'checkbox',
      label: 'Add-ons', required: false,
      options: extras
        .filter((e) => e.label.trim())
        .map((e) => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 })),
    })
  }

  fields.push({
    id: fid(), type: 'textarea',
    label: 'Additional Notes', required: false,
    placeholder: 'Any special instructions or details about the job…',
  })

  return fields
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
}

const COLOR_PRESETS = ['#F97316', '#374151', '#1a1a2e', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#0EA5E9']

// ── Props ─────────────────────────────────────────────────────
interface SetupWizardProps {
  accountId: string
  onCustomize: (formId: string, formName: string, slug: string) => void
  onAdvanced: () => void
  onDone?: (formId: string) => void
}

// ── Component ─────────────────────────────────────────────────
export default function SetupWizard({ accountId, onCustomize, onAdvanced, onDone }: SetupWizardProps) {
  const supabase = createClient()
  const TOTAL_STEPS = 4
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'success'>(1)

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [serviceType, setServiceType] = useState<ServiceId | null>(null)
  const [brandColor, setBrandColor] = useState('#F97316')

  // Step 2 — the pricing equation
  const [serviceTiers, setServiceTiers] = useState<ServiceTier[]>([
    { id: fid(), label: '', rate: '', hours: '' },
    { id: fid(), label: '', rate: '', hours: '' },
    { id: fid(), label: '', rate: '', hours: '' },
  ])
  const [chargeDrive, setChargeDrive] = useState(true)
  const [radiusTiers, setRadiusTiers] = useState<RadiusTierData[]>(DEFAULT_RADIUS_TIERS)
  const [extras, setExtras] = useState<ExtraItem[]>([
    { id: fid(), label: '', price: '' },
  ])
  const [minQuote, setMinQuote] = useState('')

  // Step 3
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [heroUploading, setHeroUploading] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)

  // Step 4
  const [pixelId, setPixelId] = useState('')

  // Save
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [liveSlug, setLiveSlug] = useState('')
  const [savedFormId, setSavedFormId] = useState('')
  const [copied, setCopied] = useState(false)

  // Seed defaults when service type is chosen
  function selectService(id: ServiceId, color: string) {
    setServiceType(id)
    setBrandColor(color)
    setServiceTiers(DEFAULT_SERVICE_TIERS[id].map((d) => ({ id: fid(), ...d })))
    setExtras(DEFAULT_EXTRAS[id].map((e) => ({ id: fid(), ...e })))
  }

  // ── Tier helpers ──
  function setTierField(id: string, key: keyof Omit<ServiceTier, 'id'>, val: string) {
    setServiceTiers((prev) => prev.map((t) => t.id === id ? { ...t, [key]: val } : t))
  }
  function addTier() { setServiceTiers((p) => [...p, { id: fid(), label: '', rate: '', hours: '' }]) }
  function removeTier(id: string) { setServiceTiers((p) => p.filter((t) => t.id !== id)) }

  // ── Radius tier helpers ──
  function setRadiusField(id: string, key: 'maxMiles' | 'driveCharge', val: string) {
    setRadiusTiers((prev) => prev.map((r) => r.id === id
      ? { ...r, [key]: key === 'maxMiles' ? (val === '' ? null : Number(val)) : Number(val) }
      : r
    ))
  }
  function addRadiusTier() { setRadiusTiers((p) => [...p, { id: fid(), maxMiles: null, driveCharge: 0 }]) }
  function removeRadiusTier(id: string) { setRadiusTiers((p) => p.filter((r) => r.id !== id)) }

  // ── Extra helpers ──
  function setExtraField(id: string, key: keyof Omit<ExtraItem, 'id'>, val: string) {
    setExtras((prev) => prev.map((e) => e.id === id ? { ...e, [key]: val } : e))
  }
  function addExtra() { setExtras((p) => [...p, { id: fid(), label: '', price: '' }]) }
  function removeExtra(id: string) { setExtras((p) => p.filter((e) => e.id !== id)) }

  // ── Hero upload ──
  async function handleHeroFileSelect(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return
    if (file.size > 5 * 1024 * 1024) return
    setHeroUploading(true)
    const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const storagePath = `${accountId}/${uuid}.${ext}`
    const { data, error } = await supabase.storage
      .from('vsls')
      .upload(storagePath, file, { contentType: file.type || 'image/jpeg', upsert: false })
    if (error || !data) { setHeroUploading(false); return }
    const { data: urlData } = supabase.storage.from('vsls').getPublicUrl(data.path)
    await supabase.from('vsls').insert({
      account_id: accountId,
      title: `Hero image ${new Date().toLocaleDateString()}`,
      file_name: `hero-image.${ext}`,
      file_url: urlData.publicUrl,
      storage_path: storagePath,
      file_size: file.size,
    })
    setHeroImageUrl(urlData.publicUrl)
    setHeroUploading(false)
  }

  // ── Save ──
  async function handleLaunch() {
    if (!serviceType || !businessName.trim()) return
    setSaving(true)
    setSaveError('')

    const fields = generateFields(serviceType, serviceTiers, chargeDrive, radiusTiers, extras)
    const serviceInfo = SERVICE_TYPES.find((s) => s.id === serviceType)!
    const formName = `${businessName.trim()} Quote`
    const baseSlug = toSlug(businessName.trim())

    let slug = baseSlug
    const { data: conflicts } = await supabase.from('hosted_forms').select('id').eq('form_config->>slug', slug)
    if ((conflicts ?? []).length > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`

    const minVal = parseFloat(minQuote) || 0

    const formConfig = {
      slug,
      description: `Get an instant quote for your ${serviceInfo.label.toLowerCase()} job.`,
      submit_label: 'Get My Instant Quote',
      currency: '$',
      brand_color: brandColor,
      show_total: true,
      quote_display: 'live',
      hero_image_url: heroImageUrl,
      fields,
      min_quote: minVal,
      disclaimer_enabled: true,
      disclaimer_text: 'This is a minimum estimate based on the details provided. Final price is confirmed by our crew once the job is assessed on-site.',
      send_email_estimate: true,
      confirm_title: "You're all set!",
      confirm_message: "We've received your details and will be in touch shortly to confirm your booking.",
      next_step_label: 'Next Step',
      total_label: minVal > 0 ? `Minimum estimate — starts at $${minVal}` : 'Minimum estimate',
      ...(pixelId.trim() ? { meta_pixel_id: pixelId.trim() } : {}),
      email_template: { subject: '', intro: '', outro: '', header_image: '', accent_color: brandColor },
    }

    try {
      const { data, error } = await supabase
        .from('hosted_forms')
        .insert({ account_id: accountId, form_name: formName, form_type: 'quote', form_config: formConfig, is_active: true, updated_at: new Date().toISOString() })
        .select().single()
      if (error) throw error
      setLiveSlug(slug)
      setSavedFormId(data.id)
      setStep('success')
    } catch (e: unknown) {
      setSaveError((e as { message?: string }).message ?? 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://quote-box.com/${liveSlug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tiersValid = serviceTiers.length > 0 &&
    serviceTiers.every((t) => t.label.trim() !== '' && t.rate !== '' && t.hours !== '')

  // ── Shared styles ──
  const pageStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-start',
    padding: '52px 24px 80px', background: 'var(--bg)',
  }
  const cardStyle: React.CSSProperties = {
    maxWidth: 560, width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)',
  }
  const bodyStyle: React.CSSProperties = { padding: '32px 40px 24px', overflowY: 'auto', flex: 1 }
  const footerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 40px', borderTop: '1px solid var(--border)',
    background: 'var(--surface)', flexShrink: 0,
  }
  const stepLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
  }
  const headingStyle: React.CSSProperties = {
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 6, lineHeight: 1.2,
  }
  const subStyle: React.CSSProperties = {
    fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24,
  }
  const fieldLabel: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)',
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--fg)', fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none',
  }
  const sectionHead: React.CSSProperties = {
    fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
  }
  const sectionDivider: React.CSSProperties = {
    height: 1, flex: 1, background: 'var(--border)',
  }

  function ProgressBar({ current }: { current: number }) {
    return (
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${(current / TOTAL_STEPS) * 100}%`,
          background: brandColor, transition: 'width 0.3s ease', borderRadius: '0 2px 2px 0',
        }} />
      </div>
    )
  }

  // ── SUCCESS ──
  if (step === 'success') {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, maxHeight: 'none' }}>
          <div style={{ height: 4, background: brandColor, flexShrink: 0 }} />
          <div style={{ ...bodyStyle, textAlign: 'center', overflow: 'visible' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `${brandColor}18`, border: `2px solid ${brandColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', color: brandColor,
            }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div style={{ ...headingStyle, marginBottom: 8 }}>Your form is live</div>
            <div style={{ ...subStyle, marginBottom: 24 }}>Share this link to start collecting leads immediately.</div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', marginBottom: 16, textAlign: 'left',
            }}>
              <div style={{ flex: 1, fontSize: '0.86rem', fontFamily: "'DM Mono', monospace", color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                quote-box.com/{liveSlug}
              </div>
              <button onClick={copyLink} style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 7,
                background: copied ? brandColor : 'var(--surface)',
                border: `1px solid ${copied ? brandColor : 'var(--border)'}`,
                color: copied ? '#fff' : 'var(--fg)',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {onDone && (
                <button onClick={() => onDone(savedFormId)} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10,
                  background: brandColor, color: '#fff', border: 'none',
                  fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                }}>Continue to next step →</button>
              )}
              <a href={`https://quote-box.com/${liveSlug}`} target="_blank" rel="noreferrer" style={{
                display: 'block', textAlign: 'center', padding: '12px 0',
                background: onDone ? 'none' : brandColor,
                color: onDone ? 'var(--fg)' : '#fff',
                border: onDone ? '1px solid var(--border)' : 'none',
                borderRadius: 10, fontWeight: onDone ? 600 : 700, fontSize: '0.88rem', textDecoration: 'none',
              }}>Preview form</a>
              {!onDone && (
                <button onClick={() => onCustomize(savedFormId, businessName.trim() + ' Quote', liveSlug)} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10,
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--fg)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                }}>Customize your form</button>
              )}
            </div>

            {pixelId.trim() && (
              <div style={{ marginTop: 18, padding: '10px 14px', background: 'rgba(24,119,242,0.06)', borderRadius: 9, border: '1px solid rgba(24,119,242,0.15)', fontSize: '0.76rem', color: 'var(--muted)', textAlign: 'left' }}>
                Meta Pixel <span style={{ fontWeight: 700, color: 'var(--fg)' }}>{pixelId.trim()}</span> is connected.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1 ──
  if (step === 1) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={1} />
          <div style={bodyStyle}>
            <div style={stepLabelStyle}>Step 1 of {TOTAL_STEPS}</div>
            <div style={headingStyle}>Let's set up your form</div>
            <div style={subStyle}>Tell us about your business and we'll build a tailored quote form.</div>

            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Business name</label>
              <input style={inputStyle} type="text" placeholder="e.g. Smith's Moving Co."
                value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Service type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {SERVICE_TYPES.map((s) => {
                  const sel = serviceType === s.id
                  return (
                    <button key={s.id} onClick={() => selectService(s.id, s.color)} style={{
                      padding: '18px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                      border: `1.5px solid ${sel ? s.color : 'var(--border)'}`,
                      background: sel ? `${s.color}0e` : 'var(--surface2)',
                      transition: 'border-color 0.12s, background 0.12s',
                    }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: sel ? s.color : 'var(--fg)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--muted)', lineHeight: 1.4 }}>{s.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={fieldLabel}>Brand color</label>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((c) => (
                  <button key={c} onClick={() => setBrandColor(c)} style={{
                    width: 26, height: 26, borderRadius: 6, background: c, padding: 0,
                    border: brandColor === c ? '2.5px solid var(--fg)' : '2.5px solid transparent',
                    outline: brandColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer', flexShrink: 0,
                  }} />
                ))}
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                  title="Custom color"
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 1, background: 'none' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{brandColor}</span>
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button onClick={onAdvanced} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
              Advanced builder
            </button>
            <button className="bb bb-primary" disabled={!(businessName.trim().length > 1 && serviceType !== null)} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: PRICING ───────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: 600 }}>
          <ProgressBar current={2} />
          <div style={bodyStyle}>
            <div style={stepLabelStyle}>Step 2 of {TOTAL_STEPS}</div>
            <div style={headingStyle}>Pricing</div>
            <div style={subStyle}>Build out your pricing equation. Every quote your customers see will be clearly marked as a minimum estimate.</div>

            {/* Formula pill */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              marginBottom: 28, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg)', fontFamily: "'DM Mono', monospace" }}>Quote</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>=</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: brandColor, fontFamily: "'DM Mono', monospace" }}>(hourly rate × hours)</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>+</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: brandColor, fontFamily: "'DM Mono', monospace" }}>drive time</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>+</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: brandColor, fontFamily: "'DM Mono', monospace" }}>extras</span>
            </div>

            {/* ── 1. SERVICE TIERS ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={sectionHead}>
                <span>1. Service tiers</span>
                <div style={sectionDivider} />
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
                Each tier = a quote option. Set the hourly rate and estimated job length.
                Different truck sizes or crew sizes? Give each its own rate.
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 28px', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Label</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Rate / hr</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Est. hrs</span>
                <span />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {serviceTiers.map((t, i) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 28px', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={DEFAULT_SERVICE_TIERS[serviceType ?? 'moving'][i]?.label ?? `Tier ${i + 1}`}
                      value={t.label}
                      onChange={(e) => setTierField(t.id, 'label', e.target.value)}
                      style={{ ...inputStyle, padding: '8px 11px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--muted)', flexShrink: 0 }}>$</span>
                      <input
                        type="number" min={0} step={5} placeholder="120"
                        value={t.rate}
                        onChange={(e) => setTierField(t.id, 'rate', e.target.value)}
                        style={{ ...inputStyle, padding: '8px 8px' }}
                      />
                    </div>
                    <input
                      type="number" min={0.5} step={0.5} placeholder="3"
                      value={t.hours}
                      onChange={(e) => setTierField(t.id, 'hours', e.target.value)}
                      style={{ ...inputStyle, padding: '8px 8px' }}
                    />
                    <button onClick={() => removeTier(t.id)} disabled={serviceTiers.length <= 1} style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: '1px solid var(--border)', background: 'none',
                      color: 'var(--muted)', fontSize: '0.76rem', cursor: serviceTiers.length <= 1 ? 'default' : 'pointer',
                      opacity: serviceTiers.length <= 1 ? 0.3 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addTier} style={{
                marginTop: 8, padding: '8px 0', width: '100%', borderRadius: 8,
                border: '1px dashed var(--border)', background: 'none',
                color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}>
                + Add tier (different truck or crew size)
              </button>

              {/* Live preview of first tier equation */}
              {serviceTiers[0]?.rate && serviceTiers[0]?.hours && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: `${brandColor}0d`, borderRadius: 8, fontSize: '0.72rem', color: 'var(--muted)' }}>
                  First tier: ${serviceTiers[0].rate}/hr × {serviceTiers[0].hours} hrs = <strong style={{ color: 'var(--fg)' }}>${(parseFloat(serviceTiers[0].rate || '0') * parseFloat(serviceTiers[0].hours || '0')).toFixed(0)}</strong> base (before drive + extras)
                </div>
              )}
            </div>

            {/* ── 2. DRIVE TIME ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={sectionHead}>
                <span>2. Drive time</span>
                <div style={sectionDivider} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>Charge for drive time</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Added to the quote based on distance from your location</div>
                </div>
                <div className={`toggle${chargeDrive ? ' on' : ''}`} onClick={() => setChargeDrive((v) => !v)} style={{ flexShrink: 0, marginLeft: 16 }} />
              </div>

              {chargeDrive && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Up to (miles)</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Charge</span>
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
                          style={{ ...inputStyle, padding: '8px 11px', opacity: i === radiusTiers.length - 1 ? 0.5 : 1 }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.84rem', color: 'var(--muted)', flexShrink: 0 }}>$</span>
                          <input
                            type="number" min={0} placeholder="50"
                            value={r.driveCharge || ''}
                            onChange={(e) => setRadiusField(r.id, 'driveCharge', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 8px' }}
                          />
                        </div>
                        <button onClick={() => removeRadiusTier(r.id)} disabled={radiusTiers.length <= 1} style={{
                          width: 28, height: 28, borderRadius: 6,
                          border: '1px solid var(--border)', background: 'none',
                          color: 'var(--muted)', fontSize: '0.76rem', cursor: radiusTiers.length <= 1 ? 'default' : 'pointer',
                          opacity: radiusTiers.length <= 1 ? 0.3 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    Last row = fallback for any distance beyond the zones above.
                  </div>
                  <button onClick={addRadiusTier} style={{
                    marginTop: 8, padding: '7px 0', width: '100%', borderRadius: 8,
                    border: '1px dashed var(--border)', background: 'none',
                    color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    + Add zone
                  </button>
                </>
              )}
            </div>

            {/* ── 3. EXTRAS ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={sectionHead}>
                <span>3. Extras / add-ons</span>
                <div style={sectionDivider} />
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 12 }}>
                Optional items customers can add to their quote.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 28px', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Label</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Price</span>
                <span />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {extras.map((e) => (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 28px', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text" placeholder="e.g. Piano removal"
                      value={e.label}
                      onChange={(ev) => setExtraField(e.id, 'label', ev.target.value)}
                      style={{ ...inputStyle, padding: '8px 11px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--muted)', flexShrink: 0 }}>$</span>
                      <input
                        type="number" min={0} placeholder="100"
                        value={e.price}
                        onChange={(ev) => setExtraField(e.id, 'price', ev.target.value)}
                        style={{ ...inputStyle, padding: '8px 8px' }}
                      />
                    </div>
                    <button onClick={() => removeExtra(e.id)} style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: '1px solid var(--border)', background: 'none',
                      color: 'var(--muted)', fontSize: '0.76rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addExtra} style={{
                marginTop: 8, padding: '7px 0', width: '100%', borderRadius: 8,
                border: '1px dashed var(--border)', background: 'none',
                color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              }}>
                + Add extra
              </button>
            </div>

            {/* ── 4. MINIMUM QUOTE ── */}
            <div>
              <div style={sectionHead}>
                <span>4. Minimum quote</span>
                <div style={sectionDivider} />
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
                Every quote on your form is already labeled <strong style={{ color: 'var(--fg)' }}>"Minimum estimate"</strong> — customers know the price can only go up from here. Set a floor so no quote ever shows below a certain dollar amount.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 180 }}>
                <span style={{ color: 'var(--muted)' }}>$</span>
                <input
                  type="number" min={0} step={25} placeholder="0"
                  value={minQuote}
                  onChange={(e) => setMinQuote(e.target.value)}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                />
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 6 }}>
                Leave at 0 to show calculated totals only.
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="bb bb-primary" disabled={!tiersValid} onClick={() => setStep(3)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 3 ──
  if (step === 3) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={3} />
          <div style={bodyStyle}>
            <div style={stepLabelStyle}>Step 3 of {TOTAL_STEPS}</div>
            <div style={headingStyle}>Hero photo</div>
            <div style={subStyle}>A photo at the top of your form builds trust and improves conversions. You can skip this and add one later.</div>

            <input ref={heroFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroFileSelect(f) }} />

            {heroImageUrl ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt="Hero" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '8px 12px', background: 'var(--surface2)', display: 'flex', gap: 8 }}>
                  <button onClick={() => heroFileRef.current?.click()} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: '0.78rem', cursor: 'pointer' }}>
                    Change photo
                  </button>
                  <button onClick={() => setHeroImageUrl('')} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => heroFileRef.current?.click()} disabled={heroUploading} style={{
                display: 'block', width: '100%', padding: '44px 20px', borderRadius: 10,
                border: '1.5px dashed var(--border)', background: 'var(--surface2)',
                cursor: heroUploading ? 'wait' : 'pointer', textAlign: 'center',
              }}>
                {heroUploading
                  ? <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>Uploading…</div>
                  : <>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>Upload a photo</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>JPG, PNG or WebP — max 5 MB</div>
                    </>
                }
              </button>
            )}
          </div>

          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(2)}>Back</button>
            <button className="bb bb-primary" disabled={heroUploading} onClick={() => setStep(4)}>
              {heroImageUrl ? 'Continue' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 4 ──
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <ProgressBar current={4} />
        <div style={bodyStyle}>
          <div style={stepLabelStyle}>Step 4 of {TOTAL_STEPS}</div>
          <div style={headingStyle}>Ad tracking</div>
          <div style={subStyle}>
            Connect a Meta Pixel to retarget people who visit your form and measure which ads are driving leads. Optional — you can add it later in settings.
          </div>

          <label style={fieldLabel}>Meta Pixel ID (optional)</label>
          <input style={inputStyle} type="text" placeholder="e.g. 1234567890123456"
            value={pixelId} onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))} />
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
            Found in Meta Events Manager under Data Sources.
          </div>

          {saveError && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: '0.8rem', color: '#ef4444' }}>
              {saveError}
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <button className="bb bb-ghost" onClick={() => setStep(3)}>Back</button>
          <button className="bb bb-primary" disabled={saving} onClick={handleLaunch} style={{ minWidth: 120 }}>
            {saving ? 'Launching…' : 'Launch form'}
          </button>
        </div>
      </div>
    </div>
  )
}
