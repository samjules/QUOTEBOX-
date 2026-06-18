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

// ── Field generation ──────────────────────────────────────────
function fid() {
  return Math.random().toString(36).slice(2, 9)
}

type PricingModel = 'job_size' | 'hourly' | 'skip'

interface Tier { id: string; label: string; price: string }

const SERVICE_ADDONS: Record<ServiceId, Array<{ label: string; price: number }>> = {
  moving:       [{ label: 'Packing & Unpacking', price: 150 }, { label: 'Piano / Heavy Items', price: 100 }, { label: 'Long Carry (>75 ft)', price: 75 }],
  junk_removal: [{ label: 'Same-day service', price: 50 }, { label: 'Heavy items (piano)', price: 75 }, { label: 'Appliance removal', price: 50 }],
}

const DEFAULT_TIERS: Record<ServiceId, Array<{ label: string }>> = {
  moving:       [{ label: 'Studio / 1 Bed' }, { label: '2–3 Bedrooms' }, { label: '4+ Bedrooms' }],
  junk_removal: [{ label: '1/4 Truck' }, { label: '1/2 Truck' }, { label: 'Full Truck' }],
}

function generateFields(
  service: ServiceId,
  model: PricingModel,
  tiers: Tier[],
  hourlyRate: number,
): FormField[] {
  let mainField: FormField

  if (model === 'job_size') {
    mainField = {
      id: fid(), type: 'radio',
      label: service === 'moving' ? 'Home Size' : 'Load Size',
      required: true, showPrices: true,
      options: tiers.map((t, i) => ({
        id: fid(),
        label: t.label,
        price: parseFloat(t.price) || 0,
        hours: (i + 1) * 2,
      })),
    }
  } else if (model === 'hourly') {
    const r = hourlyRate
    mainField = {
      id: fid(), type: 'radio',
      label: 'How long do you need?',
      required: true, showPrices: true,
      options: [
        { id: fid(), label: '1 Hour',   price: r * 1, hours: 1 },
        { id: fid(), label: '2 Hours',  price: r * 2, hours: 2 },
        { id: fid(), label: 'Half Day', price: r * 4, hours: 4 },
        { id: fid(), label: 'Full Day', price: r * 8, hours: 8 },
      ],
    }
  } else {
    const defaults = DEFAULT_TIERS[service]
    mainField = {
      id: fid(), type: 'radio',
      label: service === 'moving' ? 'Home Size' : 'Load Size',
      required: true, showPrices: false,
      options: defaults.map((d, i) => ({ id: fid(), label: d.label, price: 0, hours: (i + 1) * 2 })),
    }
  }

  const fields: FormField[] = [mainField]

  fields.push({
    id: fid(), type: 'route',
    label: service === 'moving' ? 'Moving Route' : 'Pickup Location',
    required: true,
    routeChargeType: 'radius_tiers',
    locationMode: service === 'junk_removal' ? 'single' : 'point_to_point',
    radiusTiers: [
      { id: fid(), maxMiles: 20,   driveCharge: 50 },
      { id: fid(), maxMiles: 40,   driveCharge: 100 },
      { id: fid(), maxMiles: null, driveCharge: 175 },
    ],
  } as FormField)

  fields.push({
    id: fid(), type: 'checkbox',
    label: 'Add-ons', required: false,
    options: SERVICE_ADDONS[service].map((a) => ({ id: fid(), label: a.label, price: a.price })),
  })

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
}

// ── Component ─────────────────────────────────────────────────
export default function SetupWizard({ accountId, onCustomize, onAdvanced }: SetupWizardProps) {
  const supabase = createClient()
  const TOTAL_STEPS = 4
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'success'>(1)

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [serviceType, setServiceType] = useState<ServiceId | null>(null)
  const [brandColor, setBrandColor] = useState('#F97316')

  // Step 2
  const [pricingModel, setPricingModel] = useState<PricingModel | null>(null)
  const [tiers, setTiers] = useState<Tier[]>([
    { id: fid(), label: '', price: '' },
    { id: fid(), label: '', price: '' },
    { id: fid(), label: '', price: '' },
  ])
  const [hourlyRate, setHourlyRate] = useState('')
  const [showPrices, setShowPrices] = useState(true)
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

  // Seed default tier labels when service type is chosen
  function selectService(id: ServiceId, color: string) {
    setServiceType(id)
    setBrandColor(color)
    setTiers(DEFAULT_TIERS[id].map((d) => ({ id: fid(), label: d.label, price: '' })))
  }

  // Tier helpers
  function setTierField(id: string, key: 'label' | 'price', val: string) {
    setTiers((prev) => prev.map((t) => t.id === id ? { ...t, [key]: val } : t))
  }
  function addTier() {
    setTiers((prev) => [...prev, { id: fid(), label: '', price: '' }])
  }
  function removeTier(id: string) {
    setTiers((prev) => prev.filter((t) => t.id !== id))
  }

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

    const model: PricingModel = pricingModel ?? 'skip'
    const rawFields = generateFields(serviceType, model, tiers, parseFloat(hourlyRate) || 0)
    const fields = rawFields.map((f) => ({ ...f, showPrices }))
    const serviceInfo = SERVICE_TYPES.find((s) => s.id === serviceType)!
    const formName = `${businessName.trim()} Quote`
    const baseSlug = toSlug(businessName.trim())

    let slug = baseSlug
    const { data: conflicts } = await supabase.from('hosted_forms').select('id').eq('form_config->>slug', slug)
    if ((conflicts ?? []).length > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`

    const formConfig = {
      slug,
      description: `Get an instant quote for your ${serviceInfo.label.toLowerCase()} job.`,
      submit_label: 'Get My Quote',
      currency: '$',
      brand_color: brandColor,
      show_total: showPrices,
      quote_display: showPrices ? 'live' : 'hidden',
      hero_image_url: heroImageUrl,
      fields,
      min_quote: parseFloat(minQuote) || 0,
      disclaimer_enabled: true,
      disclaimer_text: 'I understand this quote is an estimate and is not final until confirmed in writing.',
      send_email_estimate: true,
      confirm_title: "You're all set!",
      confirm_message: "We've received your details and will send your personalised quote shortly.",
      next_step_label: 'Next Step',
      total_label: showPrices ? 'Jobs start at' : 'Estimated Total',
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

  const tiersValid = tiers.length > 0 && tiers.every((t) => t.label.trim() !== '' && t.price !== '')
  const canGoNext2 = pricingModel !== null && (
    pricingModel === 'skip' ||
    (pricingModel === 'hourly' && hourlyRate !== '') ||
    (pricingModel === 'job_size' && tiersValid)
  )

  // ── Shared styles ──
  const pageStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '52px 24px 80px',
    background: 'var(--bg)',
  }

  // Card uses flex-column so the footer is always visible, body scrolls
  const cardStyle: React.CSSProperties = {
    maxWidth: 520,
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 160px)',
  }

  const bodyStyle: React.CSSProperties = {
    padding: '36px 44px 28px',
    overflowY: 'auto',
    flex: 1,
  }

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 44px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
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

  function ProgressBar({ current }: { current: number }) {
    return (
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          width: `${(current / TOTAL_STEPS) * 100}%`,
          background: brandColor,
          transition: 'width 0.3s ease',
          borderRadius: '0 2px 2px 0',
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
              margin: '0 auto 18px', fontSize: '1.3rem', color: brandColor, fontWeight: 800,
            }}>✓</div>
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
              <a href={`https://quote-box.com/${liveSlug}`} target="_blank" rel="noreferrer" style={{
                display: 'block', textAlign: 'center', padding: '12px 0',
                background: brandColor, color: '#fff', borderRadius: 10,
                fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
              }}>Preview form</a>
              <button onClick={() => onCustomize(savedFormId, businessName.trim() + ' Quote', liveSlug)} style={{
                width: '100%', padding: '12px 0', borderRadius: 10,
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              }}>Customize your form</button>
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
                    outline: brandColor === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer', flexShrink: 0,
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

  // ── STEP 2 ──
  if (step === 2) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={2} />
          <div style={bodyStyle}>
            <div style={stepLabelStyle}>Step 2 of {TOTAL_STEPS}</div>
            <div style={headingStyle}>Pricing</div>
            <div style={subStyle}>Set your rates. You can fine-tune everything later in the form builder.</div>

            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>How do you charge?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  { id: 'job_size', label: 'By job size',   desc: 'Fixed price per size — add as many tiers as you need' },
                  { id: 'hourly',   label: 'By the hour',   desc: 'Customer picks a duration, price scales with time' },
                  { id: 'skip',     label: 'Set up later',  desc: 'Skip for now and configure manually' },
                ] as { id: PricingModel; label: string; desc: string }[]).map((m) => {
                  const sel = pricingModel === m.id
                  return (
                    <button key={m.id} onClick={() => setPricingModel(m.id)} style={{
                      padding: '13px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      background: sel ? 'rgba(var(--accent-rgb,26,26,46),0.05)' : 'var(--surface2)',
                      transition: 'border-color 0.12s, background 0.12s',
                    }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: sel ? 'var(--accent)' : 'var(--fg)', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{m.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {pricingModel === 'job_size' && (
              <div style={{ marginBottom: 20 }}>
                <label style={fieldLabel}>Size tiers</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tiers.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={`e.g. ${DEFAULT_TIERS[serviceType ?? 'moving'][i]?.label ?? 'Tier ' + (i + 1)}`}
                        value={t.label}
                        onChange={(e) => setTierField(t.id, 'label', e.target.value)}
                        style={{ ...inputStyle, flex: 2, padding: '9px 12px' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', flexShrink: 0 }}>$</span>
                        <input
                          type="number" min={0} step={5} placeholder="0"
                          value={t.price}
                          onChange={(e) => setTierField(t.id, 'price', e.target.value)}
                          style={{ ...inputStyle, padding: '9px 10px' }}
                        />
                      </div>
                      {tiers.length > 1 && (
                        <button onClick={() => removeTier(t.id)} style={{
                          flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                          border: '1px solid var(--border)', background: 'none',
                          color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addTier} style={{
                    marginTop: 2, padding: '8px 0', width: '100%', borderRadius: 8,
                    border: '1px dashed var(--border)', background: 'none',
                    color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    + Add another size
                  </button>
                </div>
              </div>
            )}

            {pricingModel === 'hourly' && (
              <div style={{ marginBottom: 20 }}>
                <label style={fieldLabel}>Hourly rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 160 }}>
                  <span style={{ color: 'var(--muted)' }}>$</span>
                  <input type="number" min={0} step={5} placeholder="75" value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    style={{ ...inputStyle, padding: '10px 12px' }} autoFocus />
                  <span style={{ fontSize: '0.84rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>/hr</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={fieldLabel}>Minimum job price</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--muted)' }}>$</span>
                  <input type="number" min={0} step={5} placeholder="0" value={minQuote}
                    onChange={(e) => setMinQuote(e.target.value)}
                    style={{ ...inputStyle, padding: '10px 12px' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 5, lineHeight: 1.4 }}>We will never quote below this amount.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>Show prices on your form</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>
                  {showPrices ? 'Prices will display as "Jobs start at $X"' : 'Prices are hidden until contact info is submitted'}
                </div>
              </div>
              <div className={`toggle${showPrices ? ' on' : ''}`} onClick={() => setShowPrices((v) => !v)}
                style={{ flexShrink: 0, marginLeft: 16 }} />
            </div>
          </div>

          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="bb bb-primary" disabled={!canGoNext2} onClick={() => setStep(3)}>Continue</button>
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
