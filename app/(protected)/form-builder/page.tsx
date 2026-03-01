'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FormField, FieldOption, ConditionalRule, RuleCondition } from '@/lib/types'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

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

function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
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

// ── Crop Modal ───────────────────────────────────────────────
function CropModal({
  file,
  onConfirm,
  onCancel,
}: {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [aspect, setAspect] = useState<number | undefined>(undefined)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => setImgSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [file])

  function handleConfirm() {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) {
      // No crop drawn — upload original
      file.arrayBuffer().then((buf) => onConfirm(new Blob([buf], { type: file.type })))
      return
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height
    )
    canvas.toBlob((blob) => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.92)
  }

  const ASPECTS = [
    { label: 'Free', value: undefined },
    { label: '3:1', value: 3 / 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '1:1', value: 1 },
  ] as const

  return (
    <div className="crop-overlay">
      <div className="crop-modal">
        <div className="crop-modal-header">
          <span className="crop-modal-title">Crop Image</span>
          <div className="crop-aspect-btns">
            {ASPECTS.map(({ label, value }) => (
              <button
                key={label}
                className={`crop-aspect-btn${aspect === value ? ' active' : ''}`}
                onClick={() => { setAspect(value); setCrop(undefined) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="crop-canvas-wrap">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              aspect={aspect}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={imgSrc} alt="Crop preview" className="crop-img" />
            </ReactCrop>
          )}
        </div>
        <div className="crop-modal-footer">
          <button className="bb bb-ghost" onClick={onCancel}>Cancel</button>
          <button className="bb bb-primary" onClick={handleConfirm}>
            {completedCrop?.width ? 'Apply & Upload' : 'Upload As-Is'}
          </button>
        </div>
      </div>
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
  disclaimerEnabled,
  disclaimerText,
  onSelectField,
  onRemoveField,
}: {
  fields: FormField[]
  selectedId: string | null
  brandColor: string
  activeTab: 0 | 1 | 2
  formName: string
  formDesc: string
  submitLabel: string
  currency: string
  heroImageUrl: string
  quoteDisplay: 'live' | 'after_submit' | 'hidden'
  disclaimerEnabled: boolean
  disclaimerText: string
  onSelectField: (id: string) => void
  onRemoveField: (id: string, e: React.MouseEvent) => void
}) {
  const isDark = isColorDark(brandColor)
  const textPrimary = isDark ? 'white' : '#1a1a2e'
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.65)'
  const stepDoneStyle = isDark
    ? { background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }
    : { background: 'rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.5)' }
  const stepTodoStyle = isDark
    ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
    : { background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.3)' }
  const psLineColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'
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
      <div className="preview-card-header" style={{ background: brandColor }}>
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
            const cls = i < activeTab ? 'done' : i === activeTab ? 'active' : 'todo'
            const dotStyle =
              cls === 'active'
                ? { background: isDark ? 'white' : '#1a1a2e', color: isDark ? brandColor : textPrimary }
                : cls === 'done'
                  ? stepDoneStyle
                  : stepTodoStyle
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="ps-dot" style={dotStyle}>
                  {i + 1}
                </div>
                {i < 2 && <div className="ps-line" style={{ background: psLineColor }} />}
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
            color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(26,26,46,0.5)',
          }}
        >
          {stepLabels[activeTab]}
        </div>
        <div className="pv-title" style={{ color: textPrimary }}>{esc(formName)}</div>
        <div className="pv-desc" style={{ color: textSecondary }}>{esc(formDesc)}</div>
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
            <button className="sub-btn-prev" style={{ marginTop: 10, background: brandColor, color: textPrimary }}>
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
            {disclaimerEnabled && disclaimerText && (
              <div className="disclaimer-prev">
                <input type="checkbox" className="disclaimer-check" readOnly />
                <span className="disclaimer-text">{disclaimerText}</span>
              </div>
            )}
            <button
              className="sub-btn-prev"
              style={{ marginTop: 10, background: brandColor, color: textPrimary }}
            >
              {esc(submitLabel)}
            </button>
          </>
        )}

        {activeTab === 2 && (
          <div className="email-notice-prev">
            <div className="email-icon-prev" style={{ background: brandColor }}>
              <span style={{ color: textPrimary }}>✉</span>
            </div>
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
  allFields,
  onSetProp,
  onToggleProp,
  onSetOpt,
  onAddOpt,
  onRemoveOpt,
  onAddRule,
  onRemoveRule,
  onSetRule,
  onAddCondition,
  onRemoveCondition,
  onSetCondition,
}: {
  field: FormField | null
  allFields: FormField[]
  onSetProp: (id: string, key: string, value: string | number | boolean) => void
  onToggleProp: (id: string, key: string) => void
  onSetOpt: (fid: string, oid: string, key: string, value: string | number) => void
  onAddOpt: (fid: string) => void
  onRemoveOpt: (fid: string, oid: string) => void
  onAddRule: (fieldId: string) => void
  onRemoveRule: (fieldId: string, ruleId: string) => void
  onSetRule: (fieldId: string, ruleId: string, key: string, value: string | number) => void
  onAddCondition: (fieldId: string, ruleId: string) => void
  onRemoveCondition: (fieldId: string, ruleId: string, condId: string) => void
  onSetCondition: (fieldId: string, ruleId: string, condId: string, key: string, value: string) => void
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

      {/* ── Conditional Rate Rules ── */}
      {(hasRate || isRoute) && (
        <div className="prop-group" style={{ marginTop: 12 }}>
          <div className="prop-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Conditional Rate Rules</span>
            <button
              className="add-opt-btn"
              style={{ marginTop: 0, padding: '2px 8px', fontSize: '0.72rem' }}
              onClick={() => onAddRule(field.id)}
            >
              + Add rule
            </button>
          </div>
          {(field.conditionalRules ?? []).length === 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>
              Set a different rate when specific answers are selected.
            </div>
          )}
          {(field.conditionalRules ?? []).map((rule) => {
            const otherFields = allFields.filter((f) => f.id !== field.id)
            return (
              <div
                key={rule.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 8,
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                }}
              >
                {/* Conditions — IF / AND rows */}
                {(rule.conditions ?? []).map((cond, idx) => {
                  const triggerField = allFields.find((f) => f.id === cond.whenFieldId)
                  const hasOptions = triggerField && ['radio', 'dropdown', 'checkbox'].includes(triggerField.type)
                  return (
                    <div key={cond.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* IF / AND label + remove */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                          color: idx === 0 ? 'var(--accent)' : 'var(--muted)',
                          textTransform: 'uppercase',
                        }}>
                          {idx === 0 ? 'IF' : 'AND'}
                        </span>
                        {(rule.conditions ?? []).length > 1 && (
                          <button
                            className="rm-btn"
                            style={{ fontSize: '0.68rem', padding: '1px 5px' }}
                            onClick={() => onRemoveCondition(field.id, rule.id, cond.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Field picker */}
                      <select
                        className="prop-input"
                        style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                        value={cond.whenFieldId}
                        onChange={(e) => {
                          onSetCondition(field.id, rule.id, cond.id, 'whenFieldId', e.target.value)
                          onSetCondition(field.id, rule.id, cond.id, 'whenValue', '')
                        }}
                      >
                        <option value="">— pick a field —</option>
                        {otherFields.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>

                      {/* Value picker */}
                      {triggerField && (
                        hasOptions ? (
                          <select
                            className="prop-input"
                            style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            value={cond.whenValue}
                            onChange={(e) => onSetCondition(field.id, rule.id, cond.id, 'whenValue', e.target.value)}
                          >
                            <option value="">— is —</option>
                            {(triggerField.options ?? []).map((o) => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="prop-input"
                            style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            placeholder="equals…"
                            value={cond.whenValue}
                            onChange={(e) => onSetCondition(field.id, rule.id, cond.id, 'whenValue', e.target.value)}
                          />
                        )
                      )}
                    </div>
                  )
                })}

                {/* + AND condition */}
                <button
                  className="add-opt-btn"
                  style={{ marginTop: 0, padding: '2px 8px', fontSize: '0.72rem', alignSelf: 'flex-start' }}
                  onClick={() => onAddCondition(field.id, rule.id)}
                >
                  + AND condition
                </button>

                {/* THEN rate */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2, paddingTop: 7, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    THEN rate
                  </span>
                  <input
                    className="prop-input"
                    type="number"
                    min={0}
                    step={0.01}
                    style={{ flex: 1, fontSize: '0.75rem', padding: '4px 6px' }}
                    placeholder="0.00"
                    value={rule.rate}
                    onChange={(e) =>
                      onSetRule(field.id, rule.id, 'rate', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <button
                  className="rm-btn"
                  style={{ alignSelf: 'flex-end', fontSize: '0.72rem' }}
                  onClick={() => onRemoveRule(field.id, rule.id)}
                >
                  Remove rule
                </button>
              </div>
            )
          })}
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
  const [brandColor, setBrandColor] = useState<string>('#FFE500')
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0)
  const [formName, setFormName] = useState('My Quote Form')
  const [formDesc, setFormDesc] = useState('Get an instant price for your project.')
  const [submitLabel, setSubmitLabel] = useState('Get My Quote →')
  const [formSlug, setFormSlug] = useState('my-quote-form')
  const [currency, setCurrency] = useState('$')
  const [metaPixelId, setMetaPixelId] = useState('')
  const [minQuote, setMinQuote] = useState(0)
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [quoteDisplay, setQuoteDisplay] = useState<'live' | 'after_submit' | 'hidden'>('live')
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [planBadge, setPlanBadge] = useState('Loading…')
  const [metaPixels, setMetaPixels] = useState<Array<{ id: string; name: string }>>([])
  const [metaConnected, setMetaConnected] = useState(false)
  const [metaPixelsLoading, setMetaPixelsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error' | 'info'
  } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heroUploadLoading, setHeroUploadLoading] = useState(false)
  const heroFileInputRef = useRef<HTMLInputElement>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [disclaimerEnabled, setDisclaimerEnabled] = useState(true)
  const [disclaimerText, setDisclaimerText] = useState(
    'I understand this quote is an estimate and is not final until confirmed in writing.'
  )

  function showToast(
    msg: string,
    type: 'success' | 'error' | 'info' = 'info',
    ms = 3000
  ) {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }

  // Called after cropping — receives the final Blob
  async function uploadHeroBlob(blob: Blob, ext = 'jpg') {
    if (!accountId) { showToast('Not logged in', 'error'); return }
    if (blob.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error'); return
    }
    setHeroUploadLoading(true)
    setCropFile(null)
    const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const path = `hero/${accountId}/${uuid}.${ext}`
    const { data, error } = await supabase.storage
      .from('form-images')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    setHeroUploadLoading(false)
    if (error) { showToast(`Upload failed: ${error.message}`, 'error'); return }
    const { data: urlData } = supabase.storage.from('form-images').getPublicUrl(data.path)
    setHeroImageUrl(urlData.publicUrl)
    showToast('Hero image uploaded', 'success')
  }

  function handleHeroFileSelect(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg','jpeg','png','webp','gif'].includes(ext)) {
      showToast('Only JPG, PNG, WebP or GIF images allowed', 'error'); return
    }
    setCropFile(file)
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

      // Fetch Meta pixels for the dropdown
      setMetaPixelsLoading(true)
      fetch('/api/meta/pixels')
        .then((r) => r.json())
        .then((d) => {
          setMetaConnected(d.connected ?? false)
          setMetaPixels(d.pixels ?? [])
          setMetaPixelsLoading(false)
        })
        .catch(() => setMetaPixelsLoading(false))

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
    const legacyColors: Record<string, string> = { yellow: '#FFE500', blue: '#1A56FF' }
    setBrandColor(legacyColors[c.brand_color] ?? c.brand_color ?? '#FFE500')
    setMetaPixelId(c.meta_pixel_id ?? '')
    setMinQuote(c.min_quote ?? 0)
    setHeroImageUrl(c.hero_image_url ?? '')
    if (c.quote_display) {
      setQuoteDisplay(c.quote_display)
    } else {
      setQuoteDisplay(c.show_total !== false ? 'live' : 'hidden')
    }
    if (c.disclaimer_enabled !== undefined) setDisclaimerEnabled(c.disclaimer_enabled)
    if (c.disclaimer_text) setDisclaimerText(c.disclaimer_text)
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

  // ── Conditional rule operations ──
  function addRule(fieldId: string) {
    const firstCond: RuleCondition = { id: uid(), whenFieldId: '', whenValue: '' }
    const newRule: ConditionalRule = { id: uid(), conditions: [firstCond], rate: 0 }
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, conditionalRules: [...(f.conditionalRules ?? []), newRule] }
          : f
      )
    )
  }

  function removeRule(fieldId: string, ruleId: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, conditionalRules: (f.conditionalRules ?? []).filter((r) => r.id !== ruleId) }
          : f
      )
    )
  }

  function setRule(fieldId: string, ruleId: string, key: string, value: string | number) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              conditionalRules: (f.conditionalRules ?? []).map((r) =>
                r.id === ruleId ? { ...r, [key]: value } : r
              ),
            }
          : f
      )
    )
  }

  function addCondition(fieldId: string, ruleId: string) {
    const newCond: RuleCondition = { id: uid(), whenFieldId: '', whenValue: '' }
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              conditionalRules: (f.conditionalRules ?? []).map((r) =>
                r.id === ruleId
                  ? { ...r, conditions: [...(r.conditions ?? []), newCond] }
                  : r
              ),
            }
          : f
      )
    )
  }

  function removeCondition(fieldId: string, ruleId: string, condId: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              conditionalRules: (f.conditionalRules ?? []).map((r) =>
                r.id === ruleId
                  ? { ...r, conditions: (r.conditions ?? []).filter((c) => c.id !== condId) }
                  : r
              ),
            }
          : f
      )
    )
  }

  function setCondition(fieldId: string, ruleId: string, condId: string, key: string, value: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              conditionalRules: (f.conditionalRules ?? []).map((r) =>
                r.id === ruleId
                  ? {
                      ...r,
                      conditions: (r.conditions ?? []).map((c) =>
                        c.id === condId ? { ...c, [key]: value } : c
                      ),
                    }
                  : r
              ),
            }
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
        ...(minQuote > 0 ? { min_quote: minQuote } : {}),
        disclaimer_enabled: disclaimerEnabled,
        disclaimer_text: disclaimerText,
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

  // ── Collapsible sidebar sections ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fields: true,
    settings: true,
    rates: false,
    ui: false,
    hosting: false,
  })
  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    // The protected layout provides the outer sidebar + flex container.
    // The builder fills the remaining space.
    <div className="flex-1 overflow-hidden builder-wrap h-full">
      {/* Builder header */}
      <div className="builder-header">
        <div className="builder-logo">
          Form Builder
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

          {/* ── FIELDS ── */}
          <div className="sidebar-section">
            <div className="sidebar-cat-header" onClick={() => toggleSection('fields')}>
              <span className="sidebar-cat-title">Fields</span>
              <span className={`sidebar-cat-chevron${openSections.fields ? ' open' : ''}`}>▼</span>
            </div>
            {openSections.fields && (
              <div className="sidebar-cat-body">
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
            )}
          </div>

          {/* ── SETTINGS ── */}
          <div className="sidebar-section">
            <div className="sidebar-cat-header" onClick={() => toggleSection('settings')}>
              <span className="sidebar-cat-title">Settings</span>
              <span className={`sidebar-cat-chevron${openSections.settings ? ' open' : ''}`}>▼</span>
            </div>
            {openSections.settings && (
              <div className="sidebar-cat-body">
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
                  <div className="prop-toggle" style={{ marginTop: 12 }}>
                    <span className="prop-toggle-lbl">Quote disclaimer</span>
                    <div
                      className={`toggle${disclaimerEnabled ? ' on' : ''}`}
                      onClick={() => setDisclaimerEnabled((v) => !v)}
                    />
                  </div>
                  {disclaimerEnabled && (
                    <textarea
                      rows={3}
                      value={disclaimerText}
                      onChange={(e) => setDisclaimerText(e.target.value)}
                      style={{ marginTop: 6, fontSize: '0.78rem', lineHeight: 1.45, resize: 'vertical' }}
                      placeholder="Disclaimer shown on the contact step…"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RATES ── */}
          <div className="sidebar-section">
            <div className="sidebar-cat-header" onClick={() => toggleSection('rates')}>
              <span className="sidebar-cat-title">Rates</span>
              <span className={`sidebar-cat-chevron${openSections.rates ? ' open' : ''}`}>▼</span>
            </div>
            {openSections.rates && (
              <div className="sidebar-cat-body">
                <div className="fm">
                  <label>Minimum Quote Amount</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={minQuote || ''}
                    placeholder="0 (no minimum)"
                    onChange={(e) => setMinQuote(parseFloat(e.target.value) || 0)}
                  />
                  <div className="slug-prev" style={{ marginTop: 2 }}>
                    {minQuote > 0
                      ? `Quote will never show below ${currency}${minQuote.toFixed(2)}`
                      : 'No minimum — quote starts from $0'}
                  </div>
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
            )}
          </div>

          {/* ── UI ── */}
          <div className="sidebar-section">
            <div className="sidebar-cat-header" onClick={() => toggleSection('ui')}>
              <span className="sidebar-cat-title">UI</span>
              <span className={`sidebar-cat-chevron${openSections.ui ? ' open' : ''}`}>▼</span>
            </div>
            {openSections.ui && (
              <div className="sidebar-cat-body">
                <div className="fm">
                  <label>Brand Colour</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4, marginBottom: 6 }}>
                    {([
                      ['#FFE500', 'Yellow'],
                      ['#1A56FF', 'Blue'],
                      ['#10B981', 'Green'],
                      ['#8B5CF6', 'Purple'],
                      ['#F97316', 'Orange'],
                      ['#EF4444', 'Red'],
                    ] as const).map(([hex, name]) => (
                      <div
                        key={hex}
                        title={name}
                        onClick={() => setBrandColor(hex)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: hex,
                          cursor: 'pointer',
                          border: brandColor === hex ? '2px solid var(--accent)' : '2px solid transparent',
                          boxShadow: brandColor === hex ? '0 0 0 3px rgba(79,70,229,0.18)' : undefined,
                          transition: 'all 0.13s',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                    <label
                      title="Custom colour"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '2px dashed var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        color: 'var(--muted)',
                        flexShrink: 0,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                      +
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: brandColor, border: '1px solid var(--border)', flexShrink: 0 }} />
                    <input
                      className="prop-input"
                      style={{ fontFamily: 'monospace', fontSize: '0.78rem', flex: 1 }}
                      value={brandColor}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBrandColor(v)
                      }}
                      maxLength={7}
                      placeholder="#FFE500"
                    />
                  </div>
                  <label>Hero Image</label>
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleHeroFileSelect(file)
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
                      if (file && !heroUploadLoading) handleHeroFileSelect(file)
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
                </div>
              </div>
            )}
          </div>

          {/* ── HOSTING ── */}
          <div className="sidebar-section">
            <div className="sidebar-cat-header" onClick={() => toggleSection('hosting')}>
              <span className="sidebar-cat-title">Hosting</span>
              <span className={`sidebar-cat-chevron${openSections.hosting ? ' open' : ''}`}>▼</span>
            </div>
            {openSections.hosting && (
              <div className="sidebar-cat-body">
                <div className="fm">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  <div className="slug-prev">
                    quote-box.com/{formSlug || 'my-quote-form'}
                  </div>
                  <label style={{ marginTop: 10 }}>Meta Pixel ID</label>
                  {metaPixelsLoading ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', padding: '6px 0' }}>
                      Loading pixels…
                    </div>
                  ) : metaConnected && metaPixels.length > 0 ? (
                    <select
                      value={metaPixelId}
                      onChange={(e) => setMetaPixelId(e.target.value)}
                    >
                      <option value="">— Select a pixel —</option>
                      {metaPixels.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={metaPixelId}
                        onChange={(e) => setMetaPixelId(e.target.value)}
                        placeholder="e.g. 1234567890123456"
                      />
                      <div className="slug-prev" style={{ marginTop: 2 }}>
                        {!metaConnected
                          ? 'Connect Meta in Settings to pick from your pixels'
                          : 'No pixels found on this Meta account'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
              disclaimerEnabled={disclaimerEnabled}
              disclaimerText={disclaimerText}
              onSelectField={setSelectedId}
              onRemoveField={removeField}
            />
          </div>
        </main>

        {/* ── PROPS PANEL ── */}
        <PropsPanel
          field={selectedField}
          allFields={fields}
          onSetProp={setProp}
          onToggleProp={toggleProp}
          onSetOpt={setOpt}
          onAddOpt={addOpt}
          onRemoveOpt={removeOpt}
          onAddRule={addRule}
          onRemoveRule={removeRule}
          onSetRule={setRule}
          onAddCondition={addCondition}
          onRemoveCondition={removeCondition}
          onSetCondition={setCondition}
        />
      </div>

      {/* Toast */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onConfirm={(blob) => {
            const ext = cropFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
            uploadHeroBlob(blob, ext)
          }}
          onCancel={() => setCropFile(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
