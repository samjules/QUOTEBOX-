'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FormField, FieldOption } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────
let _ctr = 0
function uid() {
  return `f${++_ctr}_${Math.random().toString(36).slice(2, 7)}`
}
function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function makeField(type: FormField['type']): FormField {
  const defaults: Record<FormField['type'], Omit<FormField, 'id' | 'type'>> = {
    radio: {
      label: 'Choose a Package',
      required: true,
      options: [
        { id: uid(), label: 'Starter', price: 99 },
        { id: uid(), label: 'Pro', price: 199 },
      ],
    },
    dropdown: {
      label: 'Select an Option',
      required: true,
      options: [
        { id: uid(), label: 'Option A', price: 0 },
        { id: uid(), label: 'Option B', price: 50 },
      ],
    },
    checkbox: {
      label: 'Add-ons',
      required: false,
      options: [
        { id: uid(), label: 'Extra feature', price: 25 },
        { id: uid(), label: 'Rush delivery', price: 50 },
      ],
    },
    number: {
      label: 'Quantity',
      required: false,
      placeholder: '1',
      ratePerUnit: 0,
    },
    textarea: {
      label: 'Project Details',
      required: false,
      placeholder: 'Tell us more…',
    },
    route: {
      label: 'Service Location',
      required: true,
      routeChargeType: 'mileage',
      ratePerMile: 1.5,
      ratePerMinute: 0,
    },
    image: {
      label: 'Upload a Photo',
      required: false,
      imageHint: 'JPG, PNG or WebP — max 5 MB',
      imageMaxMb: 5,
    },
  }
  return { id: uid(), type, ...defaults[type] }
}

// ── Toast component ──────────────────────────────────────────
function Toast({
  msg,
  type,
}: {
  msg: string
  type: 'success' | 'error' | 'info'
}) {
  return (
    <div className={`btoast ${type}`} style={{ display: 'block' }}>
      {msg}
    </div>
  )
}

// ── Canvas Preview ───────────────────────────────────────────
function CanvasPreview({
  fields,
  selectedId,
  brandColor,
  activeTab,
  formName,
  formDesc,
  submitLabel,
  currency,
  heroImageUrl,
  quoteDisplay,
  onSelectField,
  onRemoveField,
}: {
  fields: FormField[]
  selectedId: string | null
  brandColor: 'yellow' | 'blue'
  activeTab: 0 | 1 | 2
  formName: string
  formDesc: string
  submitLabel: string
  currency: string
  heroImageUrl: string
  quoteDisplay: 'live' | 'after_submit' | 'hidden'
  onSelectField: (id: string) => void
  onRemoveField: (id: string, e: React.MouseEvent) => void
}) {
  const bg = `${brandColor}-bg`
  const isBlue = brandColor === 'blue'
  const stepLabels = [
    'Step 1 of 3 — Your Quote',
    'Step 2 of 3 — Contact Details',
    'Step 3 of 3',
  ]

  const hasPricing = fields.some(
    (f) =>
      ['radio', 'dropdown', 'checkbox'].includes(f.type) ||
      (f.type === 'number' && (f.ratePerUnit ?? 0) > 0) ||
      (f.type === 'route' && f.routeChargeType !== 'none')
  )

  return (
    <div className="preview-card">
      <div className={`preview-card-header ${bg}`}>
        {/* Hero image */}
        {heroImageUrl && activeTab === 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt="Hero"
            style={{
              width: 'calc(100% + 32px)',
              marginLeft: -16,
              marginTop: -16,
              marginBottom: 16,
              height: 120,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        {/* Step dots */}
        <div className="preview-steps">
          {[0, 1, 2].map((i) => {
            const cls =
              i < activeTab ? 'done' : i === activeTab ? 'active' : 'todo'
            const dotStyle = isBlue
              ? cls === 'active'
                ? { background: 'white', color: '#1A56FF' }
                : cls === 'done'
                  ? {
                      background: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.7)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.3)',
                    }
              : cls === 'active'
                ? { background: '#1a1a2e', color: '#FFE500' }
                : cls === 'done'
                  ? {
                      background: 'rgba(0,0,0,0.15)',
                      color: 'rgba(0,0,0,0.5)',
                    }
                  : {
                      background: 'rgba(0,0,0,0.06)',
                      color: 'rgba(0,0,0,0.3)',
                    }
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? undefined : undefined }}>
                <div className="ps-dot" style={dotStyle}>
                  {i + 1}
                </div>
                {i < 2 && <div className="ps-line" />}
              </div>
            )
          })}
        </div>

        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            marginBottom: 7,
            color: isBlue ? 'rgba(255,255,255,0.55)' : 'rgba(26,26,46,0.5)',
          }}
        >
          {stepLabels[activeTab]}
        </div>
        <div className="pv-title">{esc(formName)}</div>
        <div className="pv-desc">{esc(formDesc)}</div>
      </div>

      <div className="preview-card-body">
        {activeTab === 0 && (
          <>
            <div className="sec-label">Quote Fields</div>
            {fields.length === 0 ? (
              <div className="empty-step">
                No quote fields yet
                <p>Add fields from the left panel.</p>
              </div>
            ) : (
              fields.map((f) => (
                <div
                  key={f.id}
                  className={`field-card${selectedId === f.id ? ' selected' : ''}`}
                  onClick={() => onSelectField(f.id)}
                >
                  <div className="field-card-hdr">
                    <div className="field-card-lbl">
                      {f.required && <span className="req-dot" />}
                      {esc(f.label)}
                    </div>
                    <div className="field-card-acts">
                      <span className="ftype-badge">{f.type}</span>
                      <button
                        className="bb bb-sm bb-danger"
                        onClick={(e) => onRemoveField(f.id, e)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {(f.type === 'textarea' || f.type === 'number') && (
                    <>
                      <div className="fprev-input">
                        {esc(f.placeholder ?? '')}
                      </div>
                      {f.type === 'number' && (f.ratePerUnit ?? 0) > 0 && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--muted)',
                            marginTop: 3,
                            display: 'block',
                          }}
                        >
                          × {currency}
                          {f.ratePerUnit} per unit
                        </span>
                      )}
                    </>
                  )}

                  {f.type === 'route' && (
                    <div style={{ marginTop: 6 }}>
                      <div className="fprev-input" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>●</span>
                        Starting location…
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 7, margin: '2px 0' }}>
                        <div style={{ width: 2, height: 10, background: 'var(--border)', borderRadius: 1 }} />
                      </div>
                      <div className="fprev-input" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>●</span>
                        Ending location…
                      </div>
                      {/* Map placeholder */}
                      <div style={{
                        marginTop: 8,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        height: 90,
                        background: 'linear-gradient(135deg, #e8f4e8 0%, #d4ecd4 30%, #c8e6c9 60%, #dcedc8 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 240 90" preserveAspectRatio="none">
                          {/* fake road lines */}
                          <path d="M20,75 Q80,20 160,40 Q200,50 220,30" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4,3" opacity="0.5"/>
                          <path d="M0,55 Q60,70 120,50 Q180,30 240,45" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.3"/>
                          {/* route line */}
                          <path d="M30,70 Q100,15 210,25" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round"/>
                          {/* start dot */}
                          <circle cx="30" cy="70" r="5" fill="#22c55e" stroke="white" strokeWidth="1.5"/>
                          {/* end dot */}
                          <circle cx="210" cy="25" r="5" fill="#ef4444" stroke="white" strokeWidth="1.5"/>
                        </svg>
                        <span style={{ fontSize: '0.68rem', color: '#475569', background: 'rgba(255,255,255,0.85)', padding: '2px 7px', borderRadius: 10, zIndex: 1, fontWeight: 600 }}>
                          12.4 mi · 22 min
                        </span>
                      </div>
                      {/* Charge info */}
                      {f.routeChargeType !== 'none' && (
                        <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {(f.routeChargeType === 'mileage' || f.routeChargeType === 'both') && (
                            <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>
                              {currency}{f.ratePerMile ?? 0}/mi
                            </span>
                          )}
                          {(f.routeChargeType === 'drivetime' || f.routeChargeType === 'both') && (
                            <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>
                              {currency}{f.ratePerMinute ?? 0}/min
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {f.type === 'image' && (
                    <div className="fprev-image-placeholder">
                      <div className="fprev-image-icon">⬆</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {f.imageHint || 'Click to upload an image'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--border)', marginTop: 2 }}>
                        {f.imageMaxMb ?? 5} MB max
                      </div>
                    </div>
                  )}

                  {f.options && (
                    <div className="fprev-opts">
                      {f.options.map((o) => (
                        <div key={o.id} className="fprev-opt">
                          <span>{esc(o.label)}</span>
                          <span className="ptag">
                            {o.price > 0 ? `+${currency}${o.price}` : 'free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {hasPricing && quoteDisplay === 'live' && (
              <div className="total-prev">
                <div className="total-prev-lbl">Estimated Total</div>
                <div className="total-prev-val">{currency}0</div>
              </div>
            )}
            {hasPricing && quoteDisplay === 'after_submit' && (
              <div className="total-prev" style={{ opacity: 0.4 }}>
                <div className="total-prev-lbl">Total shown after submit</div>
                <div className="total-prev-val">{currency}–</div>
              </div>
            )}
            <button className={`sub-btn-prev ${bg}`} style={{ marginTop: 10 }}>
              Next →
            </button>
          </>
        )}

        {activeTab === 1 && (
          <>
            <div className="sec-label">
              Contact Details (always included)
            </div>
            <div className="contact-prev">
              <div className="contact-prev-field">Full Name</div>
              <div className="contact-prev-field">Email Address</div>
              <div className="contact-prev-field">Phone Number (optional)</div>
            </div>
            <button
              className={`sub-btn-prev ${bg}`}
              style={{ marginTop: 14 }}
            >
              {esc(submitLabel)}
            </button>
          </>
        )}

        {activeTab === 2 && (
          <div className="email-notice-prev">
            <div className={`email-icon-prev ${bg}`}>✉</div>
            <div className="email-notice-txt">Your quote is on its way!</div>
            <div className="email-notice-sub">
              We&apos;ve received your details and will email your personalised
              quote to you shortly.
            </div>
            {hasPricing && quoteDisplay !== 'hidden' && (
              <div className="total-prev" style={{ marginTop: 14, width: '100%' }}>
                <div className="total-prev-lbl">
                  {quoteDisplay === 'after_submit' ? 'Your Estimated Quote (shown here)' : 'Your Estimated Quote'}
                </div>
                <div className="total-prev-val">{currency}–</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Props Panel ──────────────────────────────────────────────
function PropsPanel({
  field,
  onSetProp,
  onToggleProp,
  onSetOpt,
  onAddOpt,
  onRemoveOpt,
}: {
  field: FormField | null
  onSetProp: (id: string, key: string, value: string | number | boolean) => void
  onToggleProp: (id: string, key: string) => void
  onSetOpt: (fid: string, oid: string, key: string, value: string | number) => void
  onAddOpt: (fid: string) => void
  onRemoveOpt: (fid: string, oid: string) => void
}) {
  if (!field) {
    return (
      <aside className="props-panel">
        <div className="props-title">Properties</div>
        <div className="no-sel">
          <span className="icon">☜</span>
          Click a field to edit its properties
        </div>
      </aside>
    )
  }

  const hasOpts = ['radio', 'dropdown', 'checkbox'].includes(field.type)
  const hasRate = field.type === 'number'
  const hasPH = ['number', 'textarea'].includes(field.type)
  const isRoute = field.type === 'route'
  const isImage = field.type === 'image'

  return (
    <aside className="props-panel">
      <div className="props-title">Field Properties</div>

      <div className="prop-group">
        <div className="prop-label">Label</div>
        <input
          className="prop-input"
          value={field.label}
          onChange={(e) => onSetProp(field.id, 'label', e.target.value)}
        />
      </div>

      {hasPH && (
        <div className="prop-group">
          <div className="prop-label">Placeholder</div>
          <input
            className="prop-input"
            value={field.placeholder ?? ''}
            onChange={(e) => onSetProp(field.id, 'placeholder', e.target.value)}
          />
        </div>
      )}

      {hasRate && (
        <div className="prop-group">
          <div className="prop-label">Price per unit</div>
          <input
            className="prop-input"
            type="number"
            min={0}
            step={0.01}
            value={field.ratePerUnit ?? 0}
            onChange={(e) =>
              onSetProp(field.id, 'ratePerUnit', parseFloat(e.target.value) || 0)
            }
          />
        </div>
      )}

      {isRoute && (
        <>
          <div className="prop-group">
            <div className="prop-label">Charge type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
              {([
                ['mileage', '📍 Mileage — charge per mile'],
                ['drivetime', '⏱ Drive time — charge per minute'],
                ['both', '⚡ Both — mileage + drive time'],
                ['none', '✕ None — distance info only'],
              ] as const).map(([val, lbl]) => (
                <label
                  key={val}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    color: field.routeChargeType === val ? 'var(--accent)' : 'var(--fg)',
                    fontWeight: field.routeChargeType === val ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name={`routeCharge_${field.id}`}
                    value={val}
                    checked={(field.routeChargeType ?? 'mileage') === val}
                    onChange={() => onSetProp(field.id, 'routeChargeType', val)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          {(field.routeChargeType === 'mileage' || field.routeChargeType === 'both') && (
            <div className="prop-group">
              <div className="prop-label">Rate per mile ($)</div>
              <input
                className="prop-input"
                type="number"
                min={0}
                step={0.01}
                value={field.ratePerMile ?? 0}
                onChange={(e) =>
                  onSetProp(field.id, 'ratePerMile', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          )}

          {(field.routeChargeType === 'drivetime' || field.routeChargeType === 'both') && (
            <div className="prop-group">
              <div className="prop-label">Rate per minute ($)</div>
              <input
                className="prop-input"
                type="number"
                min={0}
                step={0.001}
                value={field.ratePerMinute ?? 0}
                onChange={(e) =>
                  onSetProp(field.id, 'ratePerMinute', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          )}
        </>
      )}

      {isImage && (
        <>
          <div className="prop-group">
            <div className="prop-label">Hint text</div>
            <input className="prop-input" value={field.imageHint ?? ''}
              placeholder="e.g. JPG, PNG — max 5 MB"
              onChange={(e) => onSetProp(field.id, 'imageHint', e.target.value)} />
          </div>
          <div className="prop-group">
            <div className="prop-label">Max file size (MB)</div>
            <input className="prop-input" type="number" min={1} max={10} step={1}
              value={field.imageMaxMb ?? 5}
              onChange={(e) => onSetProp(field.id, 'imageMaxMb', parseInt(e.target.value) || 5)} />
          </div>
        </>
      )}

      <div className="prop-toggle">
        <span className="prop-toggle-lbl">Required field</span>
        <div
          className={`toggle${field.required ? ' on' : ''}`}
          onClick={() => onToggleProp(field.id, 'required')}
        />
      </div>

      {hasOpts && (
        <div className="prop-group">
          <div className="prop-label">Options</div>
          <div className="opts-list">
            {(field.options ?? []).map((o) => (
              <div key={o.id} className="opt-row">
                <input
                  className="prop-input"
                  value={o.label}
                  onChange={(e) =>
                    onSetOpt(field.id, o.id, 'label', e.target.value)
                  }
                />
                <input
                  className="prop-input opt-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={o.price}
                  onChange={(e) =>
                    onSetOpt(
                      field.id,
                      o.id,
                      'price',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
                <button
                  className="rm-btn"
                  onClick={() => onRemoveOpt(field.id, o.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            className="add-opt-btn"
            onClick={() => onAddOpt(field.id)}
          >
            + Add option
          </button>
        </div>
      )}
    </aside>
  )
}

// ── Main Form Builder Page ───────────────────────────────────
export default function FormBuilderPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  // ── State ──
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState<'yellow' | 'blue'>('yellow')
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0)
  const [formName, setFormName] = useState('My Quote Form')
  const [formDesc, setFormDesc] = useState('Get an instant price for your project.')
  const [submitLabel, setSubmitLabel] = useState('Get My Quote →')
  const [formSlug, setFormSlug] = useState('my-quote-form')
  const [currency, setCurrency] = useState('$')
  const [metaPixelId, setMetaPixelId] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [quoteDisplay, setQuoteDisplay] = useState<'live' | 'after_submit' | 'hidden'>('live')
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [planBadge, setPlanBadge] = useState('Loading…')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error' | 'info'
  } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heroUploadLoading, setHeroUploadLoading] = useState(false)
  const heroFileInputRef = useRef<HTMLInputElement>(null)

  function showToast(
    msg: string,
    type: 'success' | 'error' | 'info' = 'info',
    ms = 3000
  ) {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }

  async function uploadHeroImage(file: File) {
    if (!accountId) { showToast('Not logged in', 'error'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg','jpeg','png','webp','gif'].includes(ext)) {
      showToast('Only JPG, PNG, WebP or GIF images allowed', 'error'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error'); return
    }
    setHeroUploadLoading(true)
    const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const path = `hero/${accountId}/${uuid}.${ext}`
    const { data, error } = await supabase.storage
      .from('form-images')
      .upload(path, file, { contentType: file.type, upsert: false })
    setHeroUploadLoading(false)
    if (error) { showToast(`Upload failed: ${error.message}`, 'error'); return }
    const { data: urlData } = supabase.storage.from('form-images').getPublicUrl(data.path)
    setHeroImageUrl(urlData.publicUrl)
    showToast('Hero image uploaded', 'success')
  }

  // ── Init ──
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (!account) {
        alert('No account found. Please contact support.')
        return
      }
      setAccountId(account.id)

      const { data: billing } = await supabase
        .from('billing')
        .select('plan')
        .eq('account_id', account.id)
        .single()

      const plan = billing?.plan ?? 'base'
      const planLabels: Record<string, string> = {
        base: 'Base · 1 form · 25 leads',
        pro: 'Pro · 10 forms · 500 leads',
        agency: 'Agency · Unlimited',
      }
      setPlanBadge(planLabels[plan] ?? planLabels.base)

      const editId = searchParams.get('form_id')
      if (editId) {
        await loadExistingForm(editId)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadExistingForm(formId: string) {
    setEditingFormId(formId)
    const { data: row } = await supabase
      .from('hosted_forms')
      .select('*')
      .eq('id', formId)
      .single()
    if (!row) return

    const c = row.form_config ?? {}
    setFormName(row.form_name ?? '')
    setFormSlug(c.slug ?? '')
    setFormDesc(c.description ?? '')
    setSubmitLabel(c.submit_label ?? 'Get My Quote →')
    setCurrency(c.currency ?? '$')
    setFields(c.fields ?? [])
    setBrandColor(c.brand_color ?? 'yellow')
    setMetaPixelId(c.meta_pixel_id ?? '')
    setHeroImageUrl(c.hero_image_url ?? '')
    if (c.quote_display) {
      setQuoteDisplay(c.quote_display)
    } else {
      setQuoteDisplay(c.show_total !== false ? 'live' : 'hidden')
    }
  }

  // ── Field operations ──
  function addField(type: FormField['type']) {
    const f = makeField(type)
    setFields((prev) => [...prev, f])
    setSelectedId(f.id)
  }

  function removeField(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function setProp(
    id: string,
    key: string,
    value: string | number | boolean
  ) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    )
  }

  function toggleProp(id: string, key: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, [key]: !f[key as keyof FormField] } : f
      )
    )
  }

  function setOpt(
    fid: string,
    oid: string,
    key: string,
    value: string | number
  ) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fid
          ? {
              ...f,
              options: (f.options ?? []).map((o) =>
                o.id === oid ? { ...o, [key]: value } : o
              ),
            }
          : f
      )
    )
  }

  function addOpt(fid: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fid
          ? {
              ...f,
              options: [
                ...(f.options ?? []),
                { id: uid(), label: 'New Option', price: 0 } as FieldOption,
              ],
            }
          : f
      )
    )
  }

  function removeOpt(fid: string, oid: string) {
    const field = fields.find((f) => f.id === fid)
    if (!field || (field.options ?? []).length <= 1) {
      showToast('Need at least one option', 'error')
      return
    }
    setFields((prev) =>
      prev.map((f) =>
        f.id === fid
          ? { ...f, options: (f.options ?? []).filter((o) => o.id !== oid) }
          : f
      )
    )
  }

  // ── Slug sanitizer ──
  function handleSlugChange(raw: string) {
    const clean = raw
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setFormSlug(clean)
  }

  function copyShareLink() {
    if (!formSlug) {
      showToast('Set a slug first', 'error')
      return
    }
    navigator.clipboard.writeText(`https://quote-box.com/${formSlug}`)
    showToast('Link copied!', 'success')
  }

  // ── Save ──
  async function saveForm() {
    const name = formName.trim()
    const slug = formSlug.trim()
    const description = formDesc.trim()

    if (!name) { showToast('Enter a form name', 'error'); return }
    if (!slug) { showToast('Set a URL slug', 'error'); return }
    if (!fields.length) { showToast('Add at least one field', 'error'); return }
    if (!accountId) { showToast('Not logged in', 'error'); return }

    // Check plan limit
    const { data: billing } = await supabase
      .from('billing')
      .select('plan')
      .eq('account_id', accountId)
      .single()
    const plan = billing?.plan ?? 'base'
    const limits: Record<string, number> = { base: 1, pro: 10, agency: Infinity }

    if (!editingFormId) {
      const { count } = await supabase
        .from('hosted_forms')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)

      if ((count ?? 0) >= limits[plan]) {
        showToast('Form limit reached — upgrade to add more', 'error', 5000)
        return
      }
    }

    setIsSaving(true)

    const payload = {
      account_id: accountId,
      form_name: name,
      form_type: 'quote',
      form_config: {
        slug,
        description,
        submit_label: submitLabel || 'Get My Quote',
        currency,
        brand_color: brandColor,
        show_total: quoteDisplay === 'live',
        quote_display: quoteDisplay,
        ...(heroImageUrl.trim() ? { hero_image_url: heroImageUrl.trim() } : {}),
        fields,
        ...(metaPixelId.trim() ? { meta_pixel_id: metaPixelId.trim() } : {}),
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingFormId) {
        const { error } = await supabase
          .from('hosted_forms')
          .update(payload)
          .eq('id', editingFormId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('hosted_forms')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setEditingFormId(data.id)
      }
      showToast(`✓ Saved! Live at quote-box.com/${slug}`, 'success')
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      if (err.code === '23505')
        showToast('Slug already taken — try another', 'error')
      else
        showToast(`Error: ${err.message ?? 'Unknown'}`, 'error', 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedField = fields.find((f) => f.id === selectedId) ?? null

  return (
    // The protected layout provides the outer sidebar + flex container.
    // The builder fills the remaining space.
    <div className="flex-1 overflow-hidden builder-wrap h-full">
      {/* Builder header */}
      <div className="builder-header">
        <div className="builder-logo">
          wuote<span>.</span>box{' '}
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--muted)',
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            Form Builder
          </span>
        </div>
        <div className="builder-actions">
          <span className="plan-badge">{planBadge}</span>
          <button className="bb bb-ghost" onClick={copyShareLink}>
            Copy Link
          </button>
          <button
            className="bb bb-primary"
            onClick={saveForm}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Form'}
          </button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="builder-layout">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="b-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Form Settings</div>
            <div className="fm">
              <label>Form Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <label>Description</label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Shown to visitors…"
              />
              <label>Submit Button Label</label>
              <input
                type="text"
                value={submitLabel}
                onChange={(e) => setSubmitLabel(e.target.value)}
              />
              <label>URL Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              <div className="slug-prev">
                quote-box.com/{formSlug || 'my-quote-form'}
              </div>
              <label>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="$">USD ($)</option>
                <option value="£">GBP (£)</option>
                <option value="€">EUR (€)</option>
                <option value="CA$">CAD (CA$)</option>
                <option value="AU$">AUD (AU$)</option>
              </select>
              <label>Meta Pixel ID</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="e.g. 1234567890123456"
              />
              <label>Brand Colour</label>
              <div className="color-picker">
                <div
                  className={`cswatch yellow${brandColor === 'yellow' ? ' active' : ''}`}
                  onClick={() => setBrandColor('yellow')}
                >
                  <span>☀</span>
                  <span className="cswatch-lbl">Yellow</span>
                </div>
                <div
                  className={`cswatch blue${brandColor === 'blue' ? ' active' : ''}`}
                  onClick={() => setBrandColor('blue')}
                >
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>◈</span>
                  <span className="cswatch-lbl">Blue</span>
                </div>
              </div>
              <label>Hero Image</label>
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadHeroImage(file)
                  e.target.value = ''
                }}
              />
              <div
                className="hero-upload-zone"
                onClick={() => !heroUploadLoading && heroFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file && !heroUploadLoading) uploadHeroImage(file)
                }}
              >
                {heroUploadLoading ? (
                  <span className="hero-upload-spinner" />
                ) : heroImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroImageUrl} alt="Hero preview" className="hero-upload-preview"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="hero-upload-overlay">Click to replace</div>
                  </>
                ) : (
                  <div className="hero-upload-prompt">
                    <span style={{ fontSize: '1.4rem' }}>+</span>
                    <span>Upload hero image</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>JPG, PNG, WebP · max 5 MB</span>
                  </div>
                )}
              </div>
              {heroImageUrl && !heroUploadLoading && (
                <button className="hero-upload-clear" onClick={() => setHeroImageUrl('')}>
                  Remove hero image
                </button>
              )}
              <label style={{ marginTop: 12 }}>Quote Total Display</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                {([
                  ['live', '▶ Live — show as user fills in'],
                  ['after_submit', '✉ After submit — show on confirmation'],
                  ['hidden', '✕ Hidden — never show total'],
                ] as const).map(([val, lbl]) => (
                  <label
                    key={val}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.78rem',
                      color: quoteDisplay === val ? 'var(--accent)' : 'var(--fg)',
                      cursor: 'pointer',
                      fontWeight: quoteDisplay === val ? 600 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="quoteDisplay"
                      value={val}
                      checked={quoteDisplay === val}
                      onChange={() => setQuoteDisplay(val)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Add Field</div>
            <button className="ftype-btn" onClick={() => addField('radio')}>
              <span className="icon">◉</span> Radio Cards
            </button>
            <button className="ftype-btn" onClick={() => addField('dropdown')}>
              <span className="icon">▾</span> Dropdown
            </button>
            <button className="ftype-btn" onClick={() => addField('checkbox')}>
              <span className="icon">☑</span> Checkboxes
            </button>
            <button className="ftype-btn" onClick={() => addField('number')}>
              <span className="icon">#</span> Qty / Number
            </button>
            <button className="ftype-btn" onClick={() => addField('textarea')}>
              <span className="icon">≡</span> Long Text
            </button>
            <button className="ftype-btn" onClick={() => addField('route')}>
              <span className="icon">⇌</span> Route / Distance
            </button>
            <button className="ftype-btn" onClick={() => addField('image')}>
              <span className="icon">⬆</span> Image Upload
            </button>
          </div>
        </aside>

        {/* ── CANVAS ── */}
        <main className="canvas">
          <div className="canvas-inner">
            {/* Step tabs */}
            <div className="step-tabs">
              {(['Step 1 · Quote', 'Step 2 · Contact', 'Step 3 · Confirm'] as const).map(
                (label, i) => (
                  <div
                    key={i}
                    className={`step-tab${activeTab === i ? ' active' : ''}`}
                    onClick={() => setActiveTab(i as 0 | 1 | 2)}
                  >
                    {label}
                  </div>
                )
              )}
            </div>

            <CanvasPreview
              fields={fields}
              selectedId={selectedId}
              brandColor={brandColor}
              activeTab={activeTab}
              formName={formName}
              formDesc={formDesc}
              submitLabel={submitLabel}
              currency={currency}
              heroImageUrl={heroImageUrl}
              quoteDisplay={quoteDisplay}
              onSelectField={setSelectedId}
              onRemoveField={removeField}
            />
          </div>
        </main>

        {/* ── PROPS PANEL ── */}
        <PropsPanel
          field={selectedField}
          onSetProp={setProp}
          onToggleProp={toggleProp}
          onSetOpt={setOpt}
          onAddOpt={addOpt}
          onRemoveOpt={removeOpt}
        />
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
