'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FormField } from '@/lib/types'

const SERVICE_TYPES = [
  { id: 'moving',       label: 'Moving',       desc: 'Local & long-distance residential moves', color: '#F97316' },
  { id: 'junk_removal', label: 'Junk Removal',  desc: 'Haul-away, cleanouts & debris removal',   color: '#374151' },
] as const
type ServiceId = typeof SERVICE_TYPES[number]['id']

function fid() { return Math.random().toString(36).slice(2, 9) }

interface ServiceTier { id: string; label: string; rate: string; hours: string }
interface ExtraItem   { id: string; label: string; price: string }
interface RadiusTier  { id: string; maxMiles: number | null; driveCharge: number }

const DEFAULT_TIERS: Record<ServiceId, Array<Omit<ServiceTier, 'id'>>> = {
  moving: [
    { label: 'Studio / 1 Bedroom', rate: '120', hours: '3' },
    { label: '2–3 Bedrooms',       rate: '120', hours: '5' },
    { label: '4+ Bedrooms',        rate: '150', hours: '8' },
  ],
  junk_removal: [
    { label: '1/4 Truck Load',  rate: '100', hours: '2' },
    { label: '1/2 Truck Load',  rate: '100', hours: '3' },
    { label: 'Full Truck Load', rate: '120', hours: '4' },
  ],
}

const DEFAULT_EXTRAS: Record<ServiceId, Array<Omit<ExtraItem, 'id'>>> = {
  moving: [
    { label: 'Packing & Unpacking', price: '150' },
    { label: 'Piano / Heavy Items', price: '100' },
    { label: 'Long Carry (>75 ft)', price: '75'  },
  ],
  junk_removal: [
    { label: 'Same-day service',    price: '50' },
    { label: 'Heavy items (piano)', price: '75' },
    { label: 'Appliance removal',   price: '50' },
  ],
}

const DEFAULT_RADIUS_TIERS: Array<Omit<RadiusTier, 'id'>> = [
  { maxMiles: 20,   driveCharge: 50  },
  { maxMiles: 40,   driveCharge: 100 },
  { maxMiles: null, driveCharge: 175 },
]

function generateFields(
  service: ServiceId,
  tiers: ServiceTier[],
  chargeDrive: boolean,
  radiusTiers: RadiusTier[],
  extras: ExtraItem[],
): FormField[] {
  const fields: FormField[] = []

  fields.push({
    id: fid(), type: 'radio',
    label: service === 'moving' ? 'Home Size' : 'Load Size',
    required: true, showPrices: true,
    options: tiers.map((t) => ({
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
      required: true, routeChargeType: 'radius_tiers',
      locationMode: service === 'junk_removal' ? 'single' : 'point_to_point',
      radiusTiers: radiusTiers.map((r) => ({ id: r.id, maxMiles: r.maxMiles, driveCharge: r.driveCharge })),
    } as FormField)
  }

  const validExtras = extras.filter((e) => e.label.trim())
  if (validExtras.length > 0) {
    fields.push({
      id: fid(), type: 'checkbox', label: 'Add-ons', required: false,
      options: validExtras.map((e) => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 })),
    })
  }

  fields.push({
    id: fid(), type: 'textarea', label: 'Additional Notes', required: false,
    placeholder: 'Any special instructions or details about the job…',
  })

  return fields
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
}

const COLOR_PRESETS = ['#F97316', '#374151', '#0e0020', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#0EA5E9']

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
const TOTAL_STEPS = 8

export default function PublicWizard({ totalBookedRevenue }: { totalBookedRevenue: number }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [serviceType, setServiceType] = useState<ServiceId | null>(null)
  const [brandColor, setBrandColor] = useState('#F97316')

  // Step 2
  const [hourlyRate, setHourlyRate] = useState('120')

  // Step 3
  const [hasTrucks, setHasTrucks] = useState<boolean | null>(null)
  const [tiers, setTiers] = useState<ServiceTier[]>([])

  // Step 4
  const [chargeDrive, setChargeDrive] = useState<boolean | null>(null)
  const [radiusTiers, setRadiusTiers] = useState<RadiusTier[]>(
    DEFAULT_RADIUS_TIERS.map(r => ({ ...r, id: fid() }))
  )

  // Step 5
  const [extras, setExtras] = useState<ExtraItem[]>([])

  // Step 6
  const [hasMinimum, setHasMinimum] = useState<boolean | null>(null)
  const [minQuote, setMinQuote] = useState('')

  // Step 7 — store file in memory, preview via object URL
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState('')
  const heroFileRef = useRef<HTMLInputElement>(null)

  // Step 8 — signup gate
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function selectService(id: ServiceId, color: string) {
    setServiceType(id)
    setBrandColor(color)
    setTiers(DEFAULT_TIERS[id].map((d) => ({ id: fid(), ...d })))
    setExtras(DEFAULT_EXTRAS[id].map((e) => ({ id: fid(), ...e })))
  }

  function updateBaseRate(val: string) {
    setHourlyRate(val)
    if (hasTrucks === null || hasTrucks === false) {
      setTiers((prev) => prev.map((t) => ({ ...t, rate: val })))
    }
  }

  function setTierField(id: string, key: keyof Omit<ServiceTier, 'id'>, val: string) {
    setTiers((p) => p.map((t) => t.id === id ? { ...t, [key]: val } : t))
  }
  function addTier() { setTiers((p) => [...p, { id: fid(), label: '', rate: hourlyRate, hours: '3' }]) }
  function removeTier(id: string) { setTiers((p) => p.filter((t) => t.id !== id)) }

  function setRadiusField(id: string, key: 'maxMiles' | 'driveCharge', val: string) {
    setRadiusTiers((p) => p.map((r) => r.id === id
      ? { ...r, [key]: key === 'maxMiles' ? (val === '' ? null : Number(val)) : Number(val) }
      : r
    ))
  }
  function addZone() { setRadiusTiers((p) => [...p, { id: fid(), maxMiles: null, driveCharge: 0 }]) }
  function removeZone(id: string) { setRadiusTiers((p) => p.filter((r) => r.id !== id)) }

  function setExtraField(id: string, key: keyof Omit<ExtraItem, 'id'>, val: string) {
    setExtras((p) => p.map((e) => e.id === id ? { ...e, [key]: val } : e))
  }
  function addExtra() { setExtras((p) => [...p, { id: fid(), label: '', price: '' }]) }
  function removeExtra(id: string) { setExtras((p) => p.filter((e) => e.id !== id)) }

  function handleHeroFileSelect(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext) || file.size > 5 * 1024 * 1024) return
    setHeroFile(file)
    setHeroPreviewUrl(URL.createObjectURL(file))
  }

  async function handleClaim() {
    if (!serviceType || !businessName.trim()) return
    if (!email.trim()) { setSaveError('Email is required'); return }
    if (password.length < 6) { setSaveError('Password must be at least 6 characters'); return }

    setSaving(true)
    setSaveError('')
    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
    if (authError) { setSaveError(authError.message); setSaving(false); return }
    if (!authData.user) { setSaveError('Could not create account. Please try again.'); setSaving(false); return }

    // 2. Create account row
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert([{ business_name: businessName.trim(), owner_id: authData.user.id }])
      .select('id')
      .single()
    if (accountError || !newAccount) {
      setSaveError(accountError?.message ?? 'Failed to create account')
      setSaving(false)
      return
    }

    const accountId = newAccount.id

    // 3. Seed billing
    await supabase.from('billing').insert([{ account_id: accountId, credit_balance: 0, total_spent: 0 }])

    // 4. Upload hero image if provided
    let heroImageUrl = ''
    if (heroFile) {
      const ext = heroFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${accountId}/${Date.now()}-${fid()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('vsls').upload(path, heroFile, { contentType: heroFile.type, upsert: false })
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('vsls').getPublicUrl(uploadData.path)
        await supabase.from('vsls').insert({ account_id: accountId, title: 'Hero image', file_name: `hero.${ext}`, file_url: publicUrl, storage_path: path, file_size: heroFile.size })
        heroImageUrl = publicUrl
      }
    }

    // 5. Build + save form
    const minVal = hasMinimum ? (parseFloat(minQuote) || 0) : 0
    const driveOn = chargeDrive === true
    const fields = generateFields(serviceType, tiers, driveOn, radiusTiers, extras)
    const formName = `${businessName.trim()} Quote`
    const baseSlug = toSlug(businessName.trim())
    let slug = baseSlug
    const { data: conflicts } = await supabase.from('hosted_forms').select('id').eq('form_config->>slug', slug)
    if ((conflicts ?? []).length > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`

    const formConfig = {
      slug,
      description: `Get an instant quote for your ${SERVICE_TYPES.find(s => s.id === serviceType)!.label.toLowerCase()} job.`,
      submit_label: 'Get My Instant Quote',
      currency: '$', brand_color: brandColor,
      show_total: true, quote_display: 'live',
      hero_image_url: heroImageUrl, fields,
      min_quote: minVal,
      disclaimer_enabled: true,
      disclaimer_text: 'This is a minimum estimate. Final price is confirmed once our crew assesses the job on-site.',
      send_email_estimate: true,
      confirm_title: "You're all set!",
      confirm_message: "We've received your details and will be in touch shortly.",
      next_step_label: 'Next Step',
      total_label: minVal > 0 ? `Starts at $${minVal} — minimum estimate` : 'Minimum estimate',
      email_template: { subject: '', intro: '', outro: '', header_image: '', accent_color: brandColor },
    }

    const { error: formError } = await supabase.from('hosted_forms')
      .insert({ account_id: accountId, form_name: formName, form_type: 'quote', form_config: formConfig, is_active: true, updated_at: new Date().toISOString() })
    if (formError) { setSaveError(formError.message); setSaving(false); return }

    router.push('/dashboard?new=1')
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

  function ProgressBar({ current }: { current: number }) {
    return (
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${(current / TOTAL_STEPS) * 100}%`, background: brandColor, transition: 'width 0.35s ease', borderRadius: '0 2px 2px 0' }} />
      </div>
    )
  }

  function BigChoice({ label, desc, selected, onClick }: { label: string; desc?: string; selected: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} style={{
        width: '100%', padding: '18px 20px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${selected ? brandColor : 'var(--border)'}`,
        background: selected ? `${brandColor}0e` : 'var(--surface2)',
        transition: 'border-color 0.12s, background 0.12s', marginBottom: 10,
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: selected ? brandColor : 'var(--fg)', fontFamily: "'Nautic', sans-serif" }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{desc}</div>}
      </button>
    )
  }

  function Q({ label, sub }: { label: string; sub?: string }) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--fg)', lineHeight: 1.2, marginBottom: sub ? 8 : 0, fontFamily: "'Nautic', sans-serif" }}>{label}</div>
        {sub && <div style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>{sub}</div>}
      </div>
    )
  }

  // ── STEP 1 ──────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={1} />
          <div style={bodyStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>Step 1 of {TOTAL_STEPS}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#22c55e', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '3px 10px' }}>Live in minutes</div>
            </div>
            <Q label="Let's build your quote form" sub="Tell us your business name and what you do." />
            {totalBookedRevenue > 0 && (
              <div style={{ marginBottom: 20, padding: '11px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 0 3px #dcfce7' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                  Quotebox businesses have booked{' '}
                  <strong style={{ color: 'var(--fg)' }}>
                    ${totalBookedRevenue >= 1_000_000
                      ? `${(totalBookedRevenue / 1_000_000).toFixed(1)}M`
                      : totalBookedRevenue >= 1_000
                      ? `${Math.floor(totalBookedRevenue / 1_000)}k`
                      : totalBookedRevenue.toLocaleString()}
                  </strong>
                  {' '}in jobs from their forms
                </div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Your business name</label>
              <input style={inputStyle} type="text" placeholder="e.g. Smith's Moving Co." value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />
            </div>
            <div>
              <label style={fieldLabel}>What service do you offer?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {SERVICE_TYPES.map((s) => (
                  <BigChoice key={s.id} label={s.label} desc={s.desc} selected={serviceType === s.id} onClick={() => selectService(s.id, s.color)} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 4 }}>
              <label style={fieldLabel}>Brand color</label>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((c) => (
                  <button key={c} onClick={() => setBrandColor(c)} style={{ width: 26, height: 26, borderRadius: 6, background: c, padding: 0, border: brandColor === c ? '2.5px solid var(--fg)' : '2.5px solid transparent', outline: brandColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer', flexShrink: 0 }} />
                ))}
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 1, background: 'none' }} />
              </div>
            </div>
          </div>
          <div style={footerStyle}>
            <div />
            <button className="bb bb-primary" disabled={!(businessName.trim().length > 1 && serviceType !== null)} onClick={() => setStep(2)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2 ──────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={2} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 2 of {TOTAL_STEPS}</div>
            <Q label="What do you charge per hour?" sub="This is your base labor rate. We'll use it to calculate instant quotes for your customers." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--muted)' }}>$</span>
              <input
                type="number" min={0} step={5} autoFocus
                value={hourlyRate}
                onChange={(e) => updateBaseRate(e.target.value)}
                style={{ ...inputStyle, fontSize: '2rem', fontWeight: 800, padding: '14px 16px', maxWidth: 160, textAlign: 'center' as const }}
              />
              <span style={{ fontSize: '1.1rem', color: 'var(--muted)', fontWeight: 600 }}>/hr</span>
            </div>
            <div style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Not sure? Most moving companies charge $80–$150/hr. Junk removal $80–$130/hr.
            </div>
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="bb bb-primary" disabled={!hourlyRate || parseFloat(hourlyRate) <= 0} onClick={() => setStep(3)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 3 ──────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={3} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 3 of {TOTAL_STEPS}</div>
            <Q label="Do any of your jobs cost more than others?" sub="For example: a bigger truck, more crew members, or a larger load." />
            <BigChoice
              label="Yes — different jobs have different rates"
              desc="e.g. 2-man crew is $120/hr, 3-man crew is $160/hr"
              selected={hasTrucks === true}
              onClick={() => {
                setHasTrucks(true)
                if (tiers.length === 0 && serviceType) {
                  setTiers(DEFAULT_TIERS[serviceType].map(d => ({ id: fid(), ...d })))
                }
              }}
            />
            <BigChoice
              label="No — same rate for all jobs"
              desc={`Every job is quoted at $${hourlyRate}/hr`}
              selected={hasTrucks === false}
              onClick={() => {
                setHasTrucks(false)
                if (serviceType) {
                  setTiers(DEFAULT_TIERS[serviceType].map(d => ({ id: fid(), ...d, rate: hourlyRate })))
                }
              }}
            />
            {hasTrucks === true && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Your job types</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 28px', gap: 6, marginBottom: 6 }}>
                  {['Name', '$/hr', 'Hrs', ''].map((h) => (
                    <span key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{h}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {tiers.map((t, i) => (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 28px', gap: 6, alignItems: 'center' }}>
                      <input type="text" placeholder={DEFAULT_TIERS[serviceType ?? 'moving'][i]?.label ?? `Option ${i+1}`} value={t.label} onChange={(e) => setTierField(t.id, 'label', e.target.value)} style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.88rem' }} />
                      <input type="number" min={0} step={5} placeholder="120" value={t.rate} onChange={(e) => setTierField(t.id, 'rate', e.target.value)} style={{ ...inputStyle, padding: '8px 8px', fontSize: '0.88rem' }} />
                      <input type="number" min={0.5} step={0.5} placeholder="3" value={t.hours} onChange={(e) => setTierField(t.id, 'hours', e.target.value)} style={{ ...inputStyle, padding: '8px 8px', fontSize: '0.88rem' }} />
                      <button onClick={() => removeTier(t.id)} disabled={tiers.length <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.76rem', cursor: tiers.length <= 1 ? 'default' : 'pointer', opacity: tiers.length <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addTier} style={{ marginTop: 8, padding: '8px 0', width: '100%', borderRadius: 8, border: '1px dashed var(--border)', background: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>+ Add another</button>
              </div>
            )}
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(2)}>Back</button>
            <button className="bb bb-primary" disabled={hasTrucks === null} onClick={() => setStep(4)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 4 ──────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={4} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 4 of {TOTAL_STEPS}</div>
            <Q label="Do you charge extra for drive time?" sub="Some companies add a fee based on how far the job is from their location." />
            <BigChoice label="Yes — I charge by distance" desc="Set a fee for different distance zones" selected={chargeDrive === true} onClick={() => setChargeDrive(true)} />
            <BigChoice label="No — drive time is included in my rate" desc="Distance doesn't affect the quote" selected={chargeDrive === false} onClick={() => setChargeDrive(false)} />
            {chargeDrive === true && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Your distance zones</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Up to (miles)</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Add to quote</span>
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
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.88rem', opacity: i === radiusTiers.length - 1 ? 0.5 : 1 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>$</span>
                        <input type="number" min={0} placeholder="50" value={r.driveCharge || ''} onChange={(e) => setRadiusField(r.id, 'driveCharge', e.target.value)} style={{ ...inputStyle, padding: '8px 8px', fontSize: '0.88rem' }} />
                      </div>
                      <button onClick={() => removeZone(r.id)} disabled={radiusTiers.length <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.76rem', cursor: radiusTiers.length <= 1 ? 'default' : 'pointer', opacity: radiusTiers.length <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addZone} style={{ marginTop: 8, padding: '8px 0', width: '100%', borderRadius: 8, border: '1px dashed var(--border)', background: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>+ Add zone</button>
                <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--muted)' }}>Last row = any distance beyond your other zones.</div>
              </div>
            )}
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(3)}>Back</button>
            <button className="bb bb-primary" disabled={chargeDrive === null} onClick={() => setStep(5)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 5 ──────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={5} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 5 of {TOTAL_STEPS}</div>
            <Q label="What extras can customers add on?" sub="These show up as optional checkboxes at the bottom of your form. Remove any that don't apply." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {extras.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--fg)', fontWeight: 500 }}>
                    <input type="text" value={e.label} onChange={(ev) => setExtraField(e.id, 'label', ev.target.value)} placeholder="e.g. Piano removal" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', fontSize: '0.9rem', fontWeight: 500, width: '100%', fontFamily: 'inherit' }} />
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>$</span>
                    <input type="number" min={0} placeholder="0" value={e.price} onChange={(ev) => setExtraField(e.id, 'price', ev.target.value)} style={{ width: 60, padding: '4px 6px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: '0.88rem', outline: 'none', textAlign: 'right' as const }} />
                  </div>
                  <button onClick={() => removeExtra(e.id)} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={addExtra} style={{ marginTop: 10, padding: '9px 0', width: '100%', borderRadius: 9, border: '1px dashed var(--border)', background: 'none', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>+ Add your own</button>
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(4)}>Back</button>
            <button className="bb bb-primary" onClick={() => setStep(6)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 6 ──────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={6} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 6 of {TOTAL_STEPS}</div>
            <Q label="Is there a minimum you charge per job?" sub="If a job calculates to less than this, the quote will show your minimum instead." />
            <BigChoice label="Yes — I have a minimum charge" desc="e.g. I never take a job for less than $250" selected={hasMinimum === true} onClick={() => setHasMinimum(true)} />
            <BigChoice label="No — I charge whatever it calculates to" selected={hasMinimum === false} onClick={() => setHasMinimum(false)} />
            {hasMinimum === true && (
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--muted)' }}>$</span>
                <input
                  type="number" min={0} step={25} autoFocus
                  placeholder="250"
                  value={minQuote}
                  onChange={(e) => setMinQuote(e.target.value)}
                  style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: 800, padding: '12px 14px', maxWidth: 150, textAlign: 'center' as const }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>minimum</span>
              </div>
            )}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Every quote on your form is automatically labeled <strong style={{ color: 'var(--fg)' }}>"Minimum estimate"</strong> — customers always know the final price could be higher.
            </div>
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(5)}>Back</button>
            <button className="bb bb-primary" disabled={hasMinimum === null} onClick={() => setStep(7)}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 7 ──────────────────────────────────────────────────────
  if (step === 7) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={7} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 7 of {TOTAL_STEPS}</div>
            <Q label="Want to add a photo to your form?" sub="A photo of your truck or crew builds trust and gets more customers to fill out the form." />
            <input ref={heroFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroFileSelect(f) }} />
            {heroPreviewUrl ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroPreviewUrl} alt="Hero" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '8px 12px', background: 'var(--surface2)', display: 'flex', gap: 8 }}>
                  <button onClick={() => heroFileRef.current?.click()} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: '0.78rem', cursor: 'pointer' }}>Change photo</button>
                  <button onClick={() => { setHeroFile(null); setHeroPreviewUrl('') }} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ) : (
              <button onClick={() => heroFileRef.current?.click()} style={{ display: 'block', width: '100%', padding: '44px 20px', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'var(--surface2)', cursor: 'pointer', textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>Upload a photo</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>JPG, PNG or WebP — max 5 MB</div>
              </button>
            )}
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep(6)}>Back</button>
            <button className="bb bb-primary" onClick={() => setStep(8)}>{heroPreviewUrl ? 'Continue' : 'Skip for now'}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 8: Signup gate ─────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxHeight: 'none' }}>
        <ProgressBar current={8} />
        <div style={bodyStyle}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${brandColor}18`, border: `2px solid ${brandColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: brandColor }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <Q label="Your form is ready!" sub="Create a free account to get your link and start collecting leads." />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={fieldLabel}>Email</label>
              <input
                style={inputStyle} type="email" placeholder="you@yourbusiness.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label style={fieldLabel}>Password</label>
              <input
                style={inputStyle} type="password" placeholder="At least 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !saving && handleClaim()}
              />
            </div>
          </div>

          {saveError && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: '0.8rem', color: '#ef4444' }}>{saveError}</div>
          )}

          <div style={{ marginTop: 16, fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            By creating an account you agree to our{' '}
            <a href="/terms" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</a>.
          </div>
        </div>
        <div style={footerStyle}>
          <button className="bb bb-ghost" onClick={() => setStep(7)}>Back</button>
          <button
            className="bb bb-primary"
            disabled={saving || !email.trim() || password.length < 6}
            onClick={handleClaim}
            style={{ minWidth: 160 }}
          >
            {saving ? 'Creating your form…' : 'Claim my form →'}
          </button>
        </div>
      </div>
    </div>
  )
}
