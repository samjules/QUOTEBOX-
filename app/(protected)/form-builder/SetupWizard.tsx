'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FormField } from '@/lib/types'

// ── Service type catalog ──────────────────────────────────────
const SERVICE_TYPES = [
  { id: 'moving',       label: 'Moving',        icon: '🚛', color: '#F97316' },
  { id: 'junk_removal', label: 'Junk Removal',  icon: '🗑️', color: '#374151' },
] as const

type ServiceId = typeof SERVICE_TYPES[number]['id']

// ── Field generation ──────────────────────────────────────────
function fid() {
  return Math.random().toString(36).slice(2, 9)
}

type PricingModel = 'job_size' | 'hourly' | 'skip'
interface JobSizePrices { small: number; medium: number; large: number }
interface HourlyPrice { rate: number }
type PriceData = JobSizePrices | HourlyPrice | null

const SERVICE_ADDONS: Record<ServiceId, Array<{ label: string; price: number }>> = {
  moving:       [{ label: 'Packing & Unpacking', price: 150 }, { label: 'Piano / Heavy Items', price: 100 }, { label: 'Long Carry (>75 ft)', price: 75 }],
  junk_removal: [{ label: 'Same-day service', price: 50 }, { label: 'Heavy items (piano)', price: 75 }, { label: 'Appliance removal', price: 50 }],
}

const JOB_SIZE_LABELS: Record<ServiceId, [string, string, string]> = {
  moving:       ['Studio / 1 Bed', '2–3 Bedrooms', '4+ Bedrooms'],
  junk_removal: ['Small Load (¼ truck)', 'Half Truck', 'Full Truck'],
}

function generateFields(service: ServiceId, model: PricingModel, prices: PriceData): FormField[] {
  const addons = SERVICE_ADDONS[service]
  const sizeLabels = JOB_SIZE_LABELS[service]
  const useRoute = service === 'moving' || service === 'junk_removal'

  let mainField: FormField

  if (model === 'job_size' && prices && 'small' in prices) {
    mainField = {
      id: fid(),
      type: 'radio',
      label: service === 'moving' ? 'Home Size' : service === 'junk_removal' ? 'Load Size' : 'Job Size',
      required: true,
      showPrices: true,
      options: [
        { id: fid(), label: sizeLabels[0], price: prices.small, hours: 2 },
        { id: fid(), label: sizeLabels[1], price: prices.medium, hours: 4 },
        { id: fid(), label: sizeLabels[2], price: prices.large, hours: 6 },
      ],
    }
  } else if (model === 'hourly' && prices && 'rate' in prices) {
    const r = prices.rate
    mainField = {
      id: fid(),
      type: 'radio',
      label: 'How long do you need?',
      required: true,
      showPrices: true,
      options: [
        { id: fid(), label: '1 Hour',     price: r * 1, hours: 1 },
        { id: fid(), label: '2 Hours',    price: r * 2, hours: 2 },
        { id: fid(), label: 'Half Day',   price: r * 4, hours: 4 },
        { id: fid(), label: 'Full Day',   price: r * 8, hours: 8 },
      ],
    }
  } else {
    mainField = {
      id: fid(),
      type: 'radio',
      label: 'Job Size',
      required: true,
      showPrices: false,
      options: [
        { id: fid(), label: sizeLabels[0], price: 0, hours: 2 },
        { id: fid(), label: sizeLabels[1], price: 0, hours: 4 },
        { id: fid(), label: sizeLabels[2], price: 0, hours: 6 },
      ],
    }
  }

  const fields: FormField[] = [mainField]

  if (useRoute) {
    fields.push({
      id: fid(),
      type: 'route',
      label: service === 'moving' ? 'Moving Route' : 'Pickup Location',
      required: true,
      routeChargeType: 'radius_tiers',
      locationMode: service === 'junk_removal' ? 'single' : 'point_to_point',
      radiusTiers: [
        { id: fid(), maxMiles: 20, driveCharge: 50 },
        { id: fid(), maxMiles: 40, driveCharge: 100 },
        { id: fid(), maxMiles: null, driveCharge: 175 },
      ],
    } as FormField)
  }

  if (addons.length > 0) {
    fields.push({
      id: fid(),
      type: 'checkbox',
      label: 'Add-ons',
      required: false,
      options: addons.map((a) => ({ id: fid(), label: a.label, price: a.price })),
    })
  }

  fields.push({
    id: fid(),
    type: 'textarea',
    label: 'Additional Notes',
    required: false,
    placeholder: 'Any special instructions or details about the job…',
  })

  return fields
}

// ── Slug helpers ──────────────────────────────────────────────
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

// ── Props ─────────────────────────────────────────────────────
interface SetupWizardProps {
  accountId: string
  onCustomize: (formId: string, formName: string, slug: string) => void
  onAdvanced: () => void
}

// ── Component ─────────────────────────────────────────────────
export default function SetupWizard({ accountId, onCustomize, onAdvanced }: SetupWizardProps) {
  const supabase = createClient()

  // Step tracking (1–4 + 'success')
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'success'>(1)

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [serviceType, setServiceType] = useState<ServiceId | null>(null)

  const [brandColor, setBrandColor] = useState('#F97316')

  // Step 2
  const [pricingModel, setPricingModel] = useState<PricingModel | null>(null)
  const [smallPrice, setSmallPrice] = useState('')
  const [mediumPrice, setMediumPrice] = useState('')
  const [largePrice, setLargePrice] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [showPrices, setShowPrices] = useState(true)

  // Step 3
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [heroUploading, setHeroUploading] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)

  // Step 4
  const [pixelId, setPixelId] = useState('')

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [liveSlug, setLiveSlug] = useState('')
  const [savedFormId, setSavedFormId] = useState('')
  const [copied, setCopied] = useState(false)

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

  // ── Save form ──
  async function handleLaunch() {
    if (!serviceType || !businessName.trim()) return
    setSaving(true)
    setSaveError('')

    const model: PricingModel = pricingModel ?? 'skip'
    let priceData: PriceData = null
    if (model === 'job_size') {
      priceData = {
        small: parseFloat(smallPrice) || 0,
        medium: parseFloat(mediumPrice) || 0,
        large: parseFloat(largePrice) || 0,
      }
    } else if (model === 'hourly') {
      priceData = { rate: parseFloat(hourlyRate) || 0 }
    }

    const rawFields = generateFields(serviceType, model, priceData)
    const fields = rawFields.map((f) => ({ ...f, showPrices }))
    const serviceInfo = SERVICE_TYPES.find((s) => s.id === serviceType)!
    const formName = `${businessName.trim()} Quote`
    const baseSlug = toSlug(businessName.trim())

    // Find a unique slug
    let slug = baseSlug
    const { data: conflicts } = await supabase
      .from('hosted_forms')
      .select('id')
      .eq('form_config->>slug', slug)
    if ((conflicts ?? []).length > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`
    }

    const formConfig = {
      slug,
      description: `Get an instant quote for your ${serviceInfo.label.toLowerCase()} job.`,
      submit_label: 'Get My Quote →',
      currency: '$',
      brand_color: brandColor,
      show_total: showPrices,
      quote_display: showPrices ? 'live' : 'hidden',
      hero_image_url: heroImageUrl,
      fields,
      min_quote: 0,
      disclaimer_enabled: true,
      disclaimer_text: 'I understand this quote is an estimate and is not final until confirmed in writing.',
      send_email_estimate: true,
      confirm_title: "You're all set!",
      confirm_message: "We've received your details and will send your personalised quote shortly.",
      next_step_label: 'Next Step →',
      total_label: showPrices ? 'Jobs start at' : 'Estimated Total',
      ...(pixelId.trim() ? { meta_pixel_id: pixelId.trim() } : {}),
      email_template: { subject: '', intro: '', outro: '', header_image: '', accent_color: brandColor },
    }

    try {
      const { data, error } = await supabase
        .from('hosted_forms')
        .insert({
          account_id: accountId,
          form_name: formName,
          form_type: 'quote',
          form_config: formConfig,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      setLiveSlug(slug)
      setSavedFormId(data.id)
      setStep('success')
    } catch (e: unknown) {
      const err = e as { message?: string }
      setSaveError(err.message ?? 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Copy link ──
  function copyLink() {
    navigator.clipboard.writeText(`https://quote-box.com/${liveSlug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Helpers for step nav ──
  const canGoNext1 = businessName.trim().length > 1 && serviceType !== null
  const canGoNext2 = pricingModel !== null && (
    pricingModel === 'skip' ||
    (pricingModel === 'hourly' && hourlyRate !== '') ||
    (pricingModel === 'job_size' && smallPrice !== '' && mediumPrice !== '' && largePrice !== '')
  )

  // ── Render ──
  const wrapStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 24px 80px',
    background: 'var(--bg)',
  }

  const cardStyle: React.CSSProperties = {
    maxWidth: 560,
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '36px 40px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--fg)',
    fontSize: '0.92rem',
    boxSizing: 'border-box',
    outline: 'none',
  }

  // ── Step dots ──
  function StepDots() {
    const steps = [1, 2, 3, 4] as const
    const current = step === 'success' ? 5 : step
    return (
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
        {steps.map((s) => (
          <div
            key={s}
            style={{
              width: s < current ? 20 : s === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: s < current ? 'var(--accent)' : s === current ? 'var(--accent)' : 'var(--border)',
              opacity: s < current ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>
    )
  }

  // ── SUCCESS screen ──
  if (step === 'success') {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>
              Your form is live!
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Share this link and start getting leads today.
            </div>
          </div>

          {/* URL box */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 20,
          }}>
            <div style={{ flex: 1, fontSize: '0.9rem', fontFamily: "'DM Mono', monospace", color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              quote-box.com/{liveSlug}
            </div>
            <button
              onClick={copyLink}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 8,
                background: copied ? 'var(--accent)' : 'var(--surface)',
                border: '1px solid var(--border)', color: copied ? '#fff' : 'var(--fg)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href={`https://quote-box.com/${liveSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block', textAlign: 'center', padding: '12px 0',
                background: 'linear-gradient(135deg, #1a1a2e, #2a2a4e)',
                color: '#fff', borderRadius: 12, fontWeight: 700,
                fontSize: '0.92rem', textDecoration: 'none',
              }}
            >
              Preview Your Form →
            </a>
            <button
              onClick={() => onCustomize(savedFormId, businessName.trim() + ' Quote', liveSlug)}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12,
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Customize your form
            </button>
          </div>

          {/* Meta pixel notice */}
          {pixelId.trim() && (
            <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(24,119,242,0.08)', borderRadius: 10, border: '1px solid rgba(24,119,242,0.2)', fontSize: '0.78rem', color: 'var(--muted)' }}>
              📡 Meta Pixel <strong>{pixelId.trim()}</strong> connected — every form visitor will be tracked.
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── STEP 1 — Business Info ──
  if (step === 1) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <StepDots />
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 6 }}>
              Tell us about your business
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
              We'll build a quote form tailored to your service.
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Business name</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Smith's Moving Co."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Which service?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {SERVICE_TYPES.map((s) => {
                const selected = serviceType === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => { setServiceType(s.id); setBrandColor(s.color) }}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 12,
                      border: `2px solid ${selected ? s.color : 'var(--border)'}`,
                      background: selected ? `${s.color}15` : 'var(--surface2)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.13s',
                      transform: selected ? 'translateY(-2px)' : 'none',
                      boxShadow: selected ? `0 4px 16px ${s.color}30` : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: selected ? s.color : 'var(--fg)', lineHeight: 1.3 }}>{s.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>Brand color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['#F97316','#374151','#1a1a2e','#22C55E','#3B82F6','#8B5CF6','#EF4444','#F59E0B'].map((c) => (
                <button
                  key={c}
                  onClick={() => setBrandColor(c)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, background: c,
                    border: brandColor === c ? '3px solid var(--fg)' : '3px solid transparent',
                    outline: brandColor === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                />
              ))}
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                title="Custom color"
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2, background: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <button
              onClick={onAdvanced}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
            >
              Skip wizard → Advanced builder
            </button>
            <button
              className="bb bb-primary"
              disabled={!canGoNext1}
              onClick={() => setStep(2)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2 — Pricing ──
  if (step === 2) {
    const sizeLabels = serviceType ? JOB_SIZE_LABELS[serviceType] : ['Small', 'Medium', 'Large']
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <StepDots />
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 6 }}>
              How do you charge?
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
              We'll set up the pricing fields automatically. You can fine-tune them later.
            </div>
          </div>

          {/* Model selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {([
              { id: 'job_size', label: 'By job size', desc: 'Small / Medium / Large with fixed prices' },
              { id: 'hourly',   label: 'By the hour', desc: 'Set an hourly rate, customer picks duration' },
              { id: 'skip',     label: "I'll set this up later", desc: 'Start with a blank pricing section' },
            ] as { id: PricingModel; label: string; desc: string }[]).map((m) => {
              const sel = pricingModel === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setPricingModel(m.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    background: sel ? 'rgba(var(--accent-rgb, 26,26,46),0.06)' : 'var(--surface2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.13s',
                  }}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: sel ? 'var(--accent)' : 'var(--fg)', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{m.desc}</div>
                </button>
              )
            })}
          </div>

          {/* Job size prices */}
          {pricingModel === 'job_size' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'small' as const, label: sizeLabels[0], val: smallPrice, set: setSmallPrice },
                { key: 'medium' as const, label: sizeLabels[1], val: mediumPrice, set: setMediumPrice },
                { key: 'large' as const, label: sizeLabels[2], val: largePrice, set: setLargePrice },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: '0.84rem', color: 'var(--fg)', fontWeight: 500 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 120 }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>$</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      placeholder="0"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={{ ...inputStyle, width: '100%', padding: '8px 10px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hourly rate */}
          {pricingModel === 'hourly' && (
            <div>
              <label style={labelStyle}>Your hourly rate ($)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 160 }}>
                <span style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>$</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  placeholder="75"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                  autoFocus
                />
                <span style={{ color: 'var(--muted)', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>/hr</span>
              </div>
            </div>
          )}

          {/* Show prices toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>Show prices on your form?</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {showPrices ? 'Prices will display as "Jobs start at $X"' : 'Prices are hidden — we collect contact info first'}
              </div>
            </div>
            <div
              className={`toggle${showPrices ? ' on' : ''}`}
              onClick={() => setShowPrices((v) => !v)}
              style={{ flexShrink: 0, marginLeft: 16 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              onClick={() => setStep(1)}
              className="bb bb-ghost"
            >
              ← Back
            </button>
            <button
              className="bb bb-primary"
              disabled={!canGoNext2}
              onClick={() => setStep(3)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 3 — Hero Photo ──
  if (step === 3) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <StepDots />
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 6 }}>
              Add a hero photo
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
              A photo of your work appears at the top of your form. Customers convert better when they can see your quality.
            </div>
          </div>

          <input
            ref={heroFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleHeroFileSelect(file)
            }}
          />

          {heroImageUrl ? (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImageUrl} alt="Hero" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '8px 12px', background: 'var(--surface2)', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => heroFileRef.current?.click()}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Change photo
                </button>
                <button
                  onClick={() => setHeroImageUrl('')}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={heroUploading}
              style={{
                display: 'block', width: '100%', padding: '40px 20px',
                borderRadius: 14, border: '2px dashed var(--border)',
                background: 'var(--surface2)', cursor: heroUploading ? 'wait' : 'pointer',
                textAlign: 'center', marginBottom: 16,
              }}
            >
              {heroUploading ? (
                <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>Uploading…</div>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>Upload a photo</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>JPG, PNG or WebP · max 5 MB</div>
                </>
              )}
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setStep(2)} className="bb bb-ghost">← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {!heroImageUrl && (
                <button
                  onClick={() => setStep(4)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.84rem', cursor: 'pointer', padding: '8px 4px' }}
                >
                  Skip
                </button>
              )}
              <button
                className="bb bb-primary"
                disabled={heroUploading}
                onClick={() => setStep(4)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 4 — Meta Pixel ──
  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <StepDots />
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 6 }}>
            Track your form visitors
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            If you run Facebook or Instagram ads, connecting your Pixel lets you retarget people who visited your form — and track which ads are driving leads.
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Meta Pixel ID (optional)</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="e.g. 1234567890123456"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            Find this in Meta Events Manager → Data Sources → your Pixel.
          </div>
        </div>

        {saveError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: '0.8rem', color: '#ef4444', marginBottom: 16 }}>
            {saveError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <button onClick={() => setStep(3)} className="bb bb-ghost">← Back</button>
          <button
            className="bb bb-primary"
            disabled={saving}
            onClick={handleLaunch}
            style={{ minWidth: 140 }}
          >
            {saving ? 'Launching…' : '🚀 Go Live'}
          </button>
        </div>
      </div>
    </div>
  )
}
