'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FormField } from '@/lib/types'

function fid() { return Math.random().toString(36).slice(2, 9) }

// Quick Setup for a moving quote form — business info, hourly rate (with per-size
// job hours), and drive-time pricing. Extras/minimum-charge/from-scratch templates
// live in the (currently hidden) advanced builder; this only ever manages these two
// generated fields plus business name/color/photo, whether creating or editing.
const TIER_LABELS = ['Studio / 1 Bedroom', '2–3 Bedrooms', '4+ Bedrooms']
const DEFAULT_TIER_HOURS = [3, 5, 8]
const DEFAULT_EXTRAS = [
  { label: 'Packing & Unpacking', price: '150' },
  { label: 'Piano / Heavy Items', price: '100' },
  { label: 'Long Carry (>75 ft)', price: '75' },
]

// option.price is the hourly RATE, not the total — pricing.ts multiplies
// price × hours itself, so storing an already-multiplied total here would
// double-charge (this bit us once already: a $100/hr, 3hr job showed $900,
// not $300, because price was pre-multiplied AND hours was still attached).
function homeSizeField(hourlyRate: number, tierHours: number[]): FormField {
  return {
    id: fid(), type: 'radio', label: 'Home Size', required: true, showPrices: true,
    options: TIER_LABELS.map((label, i) => ({ id: fid(), label, price: hourlyRate, hours: tierHours[i] || 1 })),
  }
}

// Drive time is charged as (distance ÷ the business's average mph) hours × their
// drive-time rate — never a flat fee, since that would ignore how far the job
// actually is. ratePerMinute is stored since that's what pricing.ts multiplies
// duration by; the wizard only ever shows/asks for the equivalent hourly rate.
function routeField(driveRatePerHour: number): FormField {
  return {
    id: fid(), type: 'route', label: 'Moving Route', required: true,
    routeChargeType: 'drivetime',
    locationMode: 'point_to_point',
    ratePerMinute: driveRatePerHour / 60,
  } as FormField
}

function addonsField(): FormField {
  return {
    id: fid(), type: 'checkbox', label: 'Add-ons', required: false,
    options: DEFAULT_EXTRAS.map((e) => ({ id: fid(), label: e.label, price: parseFloat(e.price) || 0 })),
  }
}

function notesField(): FormField {
  return { id: fid(), type: 'textarea', label: 'Additional Notes', required: false, placeholder: 'Any special instructions or details about the job…' }
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
}

const COLOR_PRESETS = ['#F97316', '#374151', '#0e0020', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#0EA5E9']

interface ExistingForm {
  id: string
  form_name: string
  form_config: { slug?: string; brand_color?: string; hero_image_url?: string; fields?: FormField[] }
}

interface SetupWizardProps {
  accountId: string
  existingForm?: ExistingForm | null
  initialAvgMph?: number | null
  onCustomize: (formId: string, formName: string, slug: string) => void
  onAdvanced?: () => void
  onDone?: (formId: string) => void
}

function stripSuffix(name: string) {
  return name.replace(/\s+(Quote|Quiz)$/i, '')
}

// Pull the hourly rate + per-size job hours back out of a previously-generated
// Home Size field — uses the middle (2–3 Bedroom) tier's rate since that's what
// seeded all three originally.
function tiersFromExistingFields(fields: FormField[] | undefined): { rate: string; hours: number[] } {
  const radio = fields?.find((f) => f.type === 'radio' && f.label === 'Home Size')
  const opts = radio?.options
  if (opts && opts.length === TIER_LABELS.length) {
    const hours = opts.map((o) => (o as { hours?: number }).hours || 1)
    const rate = Math.round(opts[1]?.price ?? opts[0]?.price ?? 0)
    return { rate: String(rate || 120), hours }
  }
  return { rate: '120', hours: DEFAULT_TIER_HOURS }
}

// Whether drive time is charged, and the equivalent hourly rate if so. Forms saved
// before this used a flat radius-tier fee that can't convert to an hourly rate —
// those come back with chargeDrive on but an empty rate to re-enter.
function driveFromExistingFields(fields: FormField[] | undefined): { chargeDrive: boolean; driveRate: string } {
  const route = fields?.find((f) => f.type === 'route')
  if (!route) return { chargeDrive: false, driveRate: '' }
  if (route.routeChargeType === 'drivetime' || route.routeChargeType === 'both') {
    const perMin = route.ratePerMinute ?? 0
    return { chargeDrive: true, driveRate: perMin > 0 ? String(Math.round(perMin * 60)) : '' }
  }
  return { chargeDrive: true, driveRate: '' }
}

type Step = 'business' | 'rate' | 'drive'
const STEPS: Step[] = ['business', 'rate', 'drive']

export default function SetupWizard({ accountId, existingForm, initialAvgMph, onCustomize, onAdvanced, onDone }: SetupWizardProps) {
  const supabase = createClient()
  const isEditing = !!existingForm
  const existingFields = existingForm?.form_config.fields

  const [step, setStep] = useState<Step>('business')

  // Business info
  const [businessName, setBusinessName] = useState(existingForm ? stripSuffix(existingForm.form_name) : '')
  const [brandColor, setBrandColor] = useState(existingForm?.form_config.brand_color ?? '#F97316')
  const [heroImageUrl, setHeroImageUrl] = useState(existingForm?.form_config.hero_image_url ?? '')
  const [heroUploading, setHeroUploading] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)

  // Hourly rate + per-size job hours
  const initialTiers = tiersFromExistingFields(existingFields)
  const [hourlyRate, setHourlyRate] = useState(initialTiers.rate)
  const [tierHours, setTierHours] = useState<number[]>(initialTiers.hours)

  // Drive time
  const initialDrive = driveFromExistingFields(existingFields)
  const [chargeDrive, setChargeDrive] = useState<boolean>(!isEditing || initialDrive.chargeDrive)
  const [driveRate, setDriveRate] = useState(initialDrive.driveRate || initialTiers.rate)
  const [avgMph, setAvgMph] = useState(initialAvgMph ? String(initialAvgMph) : '')

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

  function setTierHour(i: number, val: string) {
    setTierHours((p) => p.map((h, idx) => idx === i ? (parseFloat(val) || 0) : h))
  }

  async function handleSave() {
    if (!businessName.trim()) return
    if (chargeDrive && !avgMph.trim()) return
    const rate = parseFloat(hourlyRate) || 0
    setSaving(true); setSaveError('')

    try {
      // Average local driving speed lives on the account, reused across every future
      // quote calculation — not re-asked per form or per submission.
      const clampedMph = avgMph.trim() ? Math.min(80, Math.max(10, parseInt(avgMph, 10) || 35)) : null
      if (clampedMph !== null) {
        await supabase.from('accounts').update({ avg_driving_mph: clampedMph }).eq('id', accountId)
      }

      const newHomeSize = homeSizeField(rate, tierHours)
      const newRoute = chargeDrive ? routeField(parseFloat(driveRate) || 0) : null

      if (existingForm) {
        // Editing: regenerate only the two fields this wizard manages (Home Size, Route).
        // Anything else on the form (extras, notes, custom fields from the advanced
        // builder) is preserved exactly as-is.
        const others = (existingFields ?? []).filter((f) => f.type !== 'radio' && f.type !== 'route')
        const fields = [newHomeSize, ...(newRoute ? [newRoute] : []), ...others]

        const { error } = await supabase.from('hosted_forms')
          .update({
            form_name: `${businessName.trim()} Quote`,
            form_config: { ...existingForm.form_config, brand_color: brandColor, hero_image_url: heroImageUrl, fields },
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

        const fields = [newHomeSize, ...(newRoute ? [newRoute] : []), addonsField(), notesField()]

        const formConfig = {
          slug,
          description: 'Get an instant quote for your moving job.',
          submit_label: 'Get My Instant Quote',
          currency: '$', brand_color: brandColor,
          show_total: true, quote_display: 'live',
          hero_image_url: heroImageUrl, fields,
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

  function BigChoice({ label, desc, selected, onClick }: { label: string; desc?: string; selected: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} style={{
        width: '100%', padding: '18px 20px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${selected ? brandColor : 'var(--border)'}`,
        background: selected ? `${brandColor}0e` : 'var(--surface2)',
        transition: 'border-color 0.12s, background 0.12s', marginBottom: 10,
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: selected ? brandColor : 'var(--fg)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{desc}</div>}
      </button>
    )
  }

  function ProgressBar({ current }: { current: number }) {
    return (
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${(current / STEPS.length) * 100}%`, background: brandColor, transition: 'width 0.35s ease', borderRadius: '0 2px 2px 0' }} />
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
              {!onDone && <button onClick={() => { setDone(false); setStep('business') }} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>Edit details</button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: business info ──────────────────────────────────────────
  if (step === 'business') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={1} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 1 of {STEPS.length}</div>
            <Q label={isEditing ? 'Edit your quote form' : 'Build your instant quote form'} sub="Business name, color, and an optional photo." />

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
              <label style={fieldLabel}>Photo (optional)</label>
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
          </div>
          <div style={footerStyle}>
            {onAdvanced ? (
              <button onClick={onAdvanced} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>Advanced builder</button>
            ) : <div />}
            <button className="bb bb-primary" disabled={businessName.trim().length < 2} onClick={() => setStep('rate')}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: hourly rate ─────────────────────────────────────────────
  if (step === 'rate') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <ProgressBar current={2} />
          <div style={bodyStyle}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 2 of {STEPS.length}</div>
            <Q label="What do you charge per hour?" sub="This is your base labor rate. We'll use it to price the Studio/1BR, 2–3BR, and 4+BR options on your form." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--muted)' }}>$</span>
              <input
                type="number" min={0} step={5} autoFocus
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                style={{ ...inputStyle, fontSize: '2rem', fontWeight: 800, padding: '14px 16px', maxWidth: 160, textAlign: 'center' as const }}
              />
              <span style={{ fontSize: '1.1rem', color: 'var(--muted)', fontWeight: 600 }}>/hr</span>
            </div>
            <div style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Not sure? Most moving companies charge $80–$150/hr.
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <label style={fieldLabel}>How many hours does each size typically take?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {TIER_LABELS.map((label, i) => {
                  const rate = parseFloat(hourlyRate) || 0
                  const price = Math.round(rate * (tierHours[i] || 0))
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, fontSize: '0.86rem', fontWeight: 600, color: 'var(--fg)' }}>{label}</span>
                      <input
                        type="number" min={0.5} step={0.5}
                        value={tierHours[i]}
                        onChange={(e) => setTierHour(i, e.target.value)}
                        style={{ ...inputStyle, width: 68, padding: '7px 8px', fontSize: '0.85rem', textAlign: 'center' as const }}
                      />
                      <span style={{ fontSize: '0.76rem', color: 'var(--muted)', width: 24 }}>hrs</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', width: 58, textAlign: 'right' as const }}>${price}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div style={footerStyle}>
            <button className="bb bb-ghost" onClick={() => setStep('business')}>Back</button>
            <button className="bb bb-primary" disabled={!hourlyRate || parseFloat(hourlyRate) <= 0} onClick={() => setStep('drive')}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: drive time ──────────────────────────────────────────────
  const driveDisabled = chargeDrive && !avgMph.trim()
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <ProgressBar current={3} />
        <div style={bodyStyle}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>Step 3 of {STEPS.length}</div>
          <Q label="Do you charge extra for drive time?" sub="We calculate drive time ourselves from the distance to the job — mapping apps guess badly for this, so we use your own numbers instead." />
          <BigChoice label="Yes — charge for drive time" desc="Distance ÷ your average speed × your rate" selected={chargeDrive === true} onClick={() => setChargeDrive(true)} />
          <BigChoice label="No — drive time is included in my rate" desc="Distance doesn't affect the quote" selected={chargeDrive === false} onClick={() => setChargeDrive(false)} />

          {chargeDrive && (
            <div style={{ marginTop: 8 }}>
              <label style={fieldLabel}>Average speed (mph)</label>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
                How many miles can you typically drive in one hour in your area? We use this — not the map API's own time estimate, which isn't reliable — to turn the distance to a job into an accurate drive time.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number" min={10} max={80} autoFocus
                  placeholder="e.g. 35–45"
                  value={avgMph}
                  onChange={(e) => setAvgMph(e.target.value)}
                  style={{ ...inputStyle, maxWidth: 140 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>mph</span>
              </div>

              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <label style={fieldLabel}>What do you charge for drive time?</label>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
                  Distance ÷ {avgMph || 'your mph'} = drive time in hours, × this rate = the drive-time charge added to the quote.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--muted)' }}>$</span>
                  <input
                    type="number" min={0} step={5}
                    value={driveRate}
                    onChange={(e) => setDriveRate(e.target.value)}
                    style={{ ...inputStyle, fontSize: '1.4rem', fontWeight: 800, padding: '10px 14px', maxWidth: 130, textAlign: 'center' as const }}
                  />
                  <span style={{ fontSize: '0.95rem', color: 'var(--muted)', fontWeight: 600 }}>/hr of drive time</span>
                </div>
              </div>
            </div>
          )}

          {saveError && <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: '0.8rem', color: '#ef4444' }}>{saveError}</div>}
        </div>
        <div style={footerStyle}>
          <button className="bb bb-ghost" onClick={() => setStep('rate')}>Back</button>
          <button className="bb bb-primary" disabled={saving || driveDisabled} onClick={handleSave} style={{ minWidth: 140 }}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Launch my form'}
          </button>
        </div>
      </div>
    </div>
  )
}
