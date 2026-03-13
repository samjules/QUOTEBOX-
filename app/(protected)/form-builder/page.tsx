'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FormField, FieldOption, ConditionalRule, RuleCondition } from '@/lib/types'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

async function geocodeAddress(query: string): Promise<{ place_name: string }[]> {
  if (!MAPBOX_TOKEN || query.length < 3) return []
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place,locality,neighborhood`
    const res = await fetch(url)
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.features ?? []).map((f: any) => ({ place_name: f.place_name as string }))
  } catch {
    return []
  }
}

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

function isImageFile(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(ext)
}

function formatMediaDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
      label: 'Image',
      required: false,
      imageUrl: '',
    },
    draw_area: {
      label: 'Draw Your Area',
      required: true,
      ratePerSqFt: 0.10,
    },
    booking: {
      label: 'Preferred Booking Date',
      required: true,
    },
  }
  return { id: uid(), type, ...defaults[type] }
}

// ── Templates ─────────────────────────────────────────────────
interface TemplateConfig {
  id: string
  icon: string
  name: string
  tagline: string
  brandColor: string
  formName: string
  formDesc: string
  submitLabel: string
  fields: Omit<FormField, 'id'>[]
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'lawn',
    icon: '🌿',
    name: 'Lawn & Garden',
    tagline: 'Mowing, landscaping, hedging & more',
    brandColor: '#10B981',
    formName: 'Lawn & Garden Quote',
    formDesc: 'Get an instant quote for your lawn care service.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'dropdown', label: 'Service Type', required: true, options: [
        { id: 'x', label: 'Lawn Mowing', price: 0 },
        { id: 'x', label: 'Hedge Trimming', price: 0 },
        { id: 'x', label: 'Full Landscaping', price: 0 },
        { id: 'x', label: 'Leaf Removal', price: 0 },
      ]},
      { type: 'draw_area', label: 'Draw Your Lawn', required: true, ratePerSqFt: 0.05 },
      { type: 'route', label: 'Service Location', required: true, routeChargeType: 'mileage', ratePerMile: 1.5, ratePerMinute: 0 },
    ],
  },
  {
    id: 'cleaning',
    icon: '🧹',
    name: 'Cleaning Service',
    tagline: 'Residential & commercial cleaning',
    brandColor: '#3B82F6',
    formName: 'Cleaning Service Quote',
    formDesc: 'Get an instant quote for your cleaning needs.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'radio', label: 'Home Size', required: true, options: [
        { id: 'x', label: 'Studio / 1 Bed', price: 89 },
        { id: 'x', label: '2 Bedrooms', price: 129 },
        { id: 'x', label: '3 Bedrooms', price: 169 },
        { id: 'x', label: '4+ Bedrooms', price: 209 },
      ]},
      { type: 'checkbox', label: 'Add-ons', required: false, options: [
        { id: 'x', label: 'Deep Clean', price: 50 },
        { id: 'x', label: 'Oven & Appliances', price: 30 },
        { id: 'x', label: 'Window Cleaning', price: 40 },
        { id: 'x', label: 'Carpet Steam Clean', price: 60 },
      ]},
      { type: 'textarea', label: 'Anything else we should know?', required: false, placeholder: 'Special instructions, pets, access details…' },
    ],
  },
  {
    id: 'moving',
    icon: '🚛',
    name: 'Moving Service',
    tagline: 'Local & long-distance moves',
    brandColor: '#F97316',
    formName: 'Moving Service Quote',
    formDesc: 'Tell us about your move and get an instant estimate.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'radio', label: 'Move Size', required: true, options: [
        { id: 'x', label: 'Studio / 1 Bed', price: 299 },
        { id: 'x', label: '2 Bedrooms', price: 449 },
        { id: 'x', label: '3 Bedrooms', price: 599 },
        { id: 'x', label: '4+ Bedrooms', price: 799 },
      ]},
      { type: 'route', label: 'Moving Route', required: true, routeChargeType: 'both', ratePerMile: 2.0, ratePerMinute: 0.5 },
      { type: 'checkbox', label: 'Additional Services', required: false, options: [
        { id: 'x', label: 'Packing & Unpacking', price: 150 },
        { id: 'x', label: 'Piano / Heavy Items', price: 100 },
        { id: 'x', label: 'Storage (1 month)', price: 80 },
      ]},
    ],
  },
  {
    id: 'photography',
    icon: '📷',
    name: 'Photography',
    tagline: 'Portraits, events & weddings',
    brandColor: '#8B5CF6',
    formName: 'Photography Quote',
    formDesc: 'Tell us about your shoot and get a quote in minutes.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'radio', label: 'Session Type', required: true, options: [
        { id: 'x', label: 'Portrait / Headshots', price: 199 },
        { id: 'x', label: 'Family Session', price: 299 },
        { id: 'x', label: 'Corporate Event', price: 499 },
        { id: 'x', label: 'Wedding', price: 1499 },
      ]},
      { type: 'number', label: 'Extra Hours', required: false, placeholder: '0', ratePerUnit: 150 },
      { type: 'checkbox', label: 'Add-ons', required: false, options: [
        { id: 'x', label: 'Drone Footage', price: 200 },
        { id: 'x', label: 'Rush Editing (48 hrs)', price: 100 },
        { id: 'x', label: 'Printed Album', price: 120 },
      ]},
    ],
  },
  {
    id: 'pressure',
    icon: '💧',
    name: 'Pressure Washing',
    tagline: 'Driveways, decks & house exteriors',
    brandColor: '#06B6D4',
    formName: 'Pressure Washing Quote',
    formDesc: 'Get a quick quote for pressure washing services.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'radio', label: 'Surface Type', required: true, options: [
        { id: 'x', label: 'Driveway', price: 99 },
        { id: 'x', label: 'Deck / Patio', price: 129 },
        { id: 'x', label: 'House Exterior', price: 249 },
        { id: 'x', label: 'Fence', price: 79 },
      ]},
      { type: 'draw_area', label: 'Draw Your Area', required: true, ratePerSqFt: 0.08 },
      { type: 'route', label: 'Service Address', required: true, routeChargeType: 'mileage', ratePerMile: 1.5, ratePerMinute: 0 },
    ],
  },
  {
    id: 'handyman',
    icon: '🔧',
    name: 'Handyman',
    tagline: 'Home repairs & installations',
    brandColor: '#EF4444',
    formName: 'Handyman Quote',
    formDesc: 'Describe the job and get an instant hourly estimate.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'dropdown', label: 'Service Type', required: true, options: [
        { id: 'x', label: 'Furniture Assembly', price: 0 },
        { id: 'x', label: 'TV Mounting', price: 0 },
        { id: 'x', label: 'Shelf / Cabinet Install', price: 0 },
        { id: 'x', label: 'General Repairs', price: 0 },
        { id: 'x', label: 'Painting', price: 0 },
      ]},
      { type: 'number', label: 'Estimated Hours', required: true, placeholder: '2', ratePerUnit: 85 },
      { type: 'textarea', label: 'Job Description', required: false, placeholder: 'Tell us more about the work needed…' },
    ],
  },
  {
    id: 'roofing',
    icon: '🏠',
    name: 'Roofing',
    tagline: 'Repairs, replacement & inspections',
    brandColor: '#78350F',
    formName: 'Roofing Quote',
    formDesc: 'Trace your roof on the map for an instant estimate.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'radio', label: 'Service Type', required: true, options: [
        { id: 'x', label: 'Roof Inspection', price: 99 },
        { id: 'x', label: 'Repair / Patching', price: 0 },
        { id: 'x', label: 'Full Replacement', price: 0 },
        { id: 'x', label: 'New Installation', price: 0 },
      ]},
      { type: 'dropdown', label: 'Roofing Material', required: true, options: [
        { id: 'x', label: 'Asphalt Shingles', price: 0 },
        { id: 'x', label: 'Metal Roofing', price: 0 },
        { id: 'x', label: 'Tile / Slate', price: 0 },
        { id: 'x', label: 'Flat / TPO', price: 0 },
      ]},
      { type: 'draw_area', label: 'Trace Your Roof', required: true, ratePerSqFt: 4.50 },
    ],
  },
  {
    id: 'painting',
    icon: '🎨',
    name: 'Painting',
    tagline: 'Interior & exterior house painting',
    brandColor: '#D97706',
    formName: 'Painting Quote',
    formDesc: 'Trace the area to be painted for an instant price.',
    submitLabel: 'Get My Quote →',
    fields: [
      { type: 'radio', label: 'Project Type', required: true, options: [
        { id: 'x', label: 'Interior Walls', price: 0 },
        { id: 'x', label: 'Exterior Siding', price: 0 },
        { id: 'x', label: 'Fence / Deck', price: 0 },
        { id: 'x', label: 'Ceiling', price: 0 },
      ]},
      { type: 'draw_area', label: 'Draw the Area', required: true, ratePerSqFt: 2.00 },
      { type: 'checkbox', label: 'Add-ons', required: false, options: [
        { id: 'x', label: 'Primer Coat', price: 80 },
        { id: 'x', label: 'Trim & Doors', price: 120 },
        { id: 'x', label: 'Ceiling Paint', price: 90 },
      ]},
    ],
  },
]

// ── Template Picker ───────────────────────────────────────────
function TemplatePicker({
  onSelect,
  onBlank,
  onAi,
}: {
  onSelect: (tpl: TemplateConfig) => void
  onBlank: () => void
  onAi: () => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const fieldTypeLabel: Record<string, string> = {
    radio: '◉ radio',
    dropdown: '▾ dropdown',
    checkbox: '☑ checkbox',
    number: '# number',
    route: '⇌ route',
    textarea: '≡ text',
    image: '🖼 image',
    draw_area: '⬡ draw area',
    booking: '📅 booking',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 60px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 880, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--fg)', marginBottom: 8 }}>
            Start with a template
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.55, maxWidth: 420, margin: '0 auto' }}>
            Pick a template to get started fast — every field, label and price is fully customisable after.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button
              className="bb bb-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff' }}
              onClick={onAi}
            >
              <img src="/icons/logo-1772578089154.jpg" alt="Robert" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
              Build with Robert
            </button>
            <button className="bb bb-ghost" onClick={onBlank}>
              Start blank
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: 'var(--muted)', fontSize: '0.75rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ whiteSpace: 'nowrap' }}>or choose a template</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {TEMPLATES.map((tpl) => {
            const isHov = hovered === tpl.id
            return (
              <div
                key={tpl.id}
                onClick={() => onSelect(tpl)}
                onMouseEnter={() => setHovered(tpl.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  border: `2px solid ${isHov ? tpl.brandColor : 'var(--border)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.14s',
                  background: 'var(--surface)',
                  boxShadow: isHov ? `0 6px 24px ${tpl.brandColor}30` : '0 1px 4px rgba(0,0,0,0.06)',
                  transform: isHov ? 'translateY(-3px)' : 'none',
                }}
              >
                {/* Coloured top strip with icon */}
                <div style={{ height: 76, background: tpl.brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.1rem' }}>
                  {tpl.icon}
                </div>
                {/* Card body */}
                <div style={{ padding: '13px 15px 15px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>{tpl.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.4, marginBottom: 11 }}>{tpl.tagline}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tpl.fields.map((f, i) => (
                      <span key={i} style={{ fontSize: '0.64rem', fontWeight: 500, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px', color: 'var(--muted)' }}>
                        {fieldTypeLabel[f.type] ?? f.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
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

// ── AI Modal ─────────────────────────────────────────────────
function AiModal({
  open,
  defaultName,
  generating,
  onGenerate,
  onClose,
}: {
  open: boolean
  defaultName: string
  generating: boolean
  onGenerate: (name: string, desc: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [desc, setDesc] = useState('')

  if (!open) return null

  return (
    <div className="crop-overlay" onClick={(e) => { if (e.target === e.currentTarget && !generating) onClose() }}>
      <div className="crop-modal" style={{ maxWidth: 480, width: '90%' }}>
        <div className="crop-modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <span className="crop-modal-title" style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icons/logo-1772578089154.jpg" alt="Robert" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
            Build with Robert
          </span>
        </div>

        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            Describe your business and Robert will generate a tailored quote form with realistic pricing fields.
          </p>

          <div className="fm" style={{ gap: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Green Lawn Services"
              disabled={generating}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div className="fm" style={{ gap: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
              Describe your business
            </label>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Residential lawn mowing and landscaping. We offer weekly, bi-weekly and one-time cuts for small to large yards. Add-ons include fertilizing and edging."
              disabled={generating}
              style={{ fontSize: '0.82rem', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--muted)' }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Generating your form…
            </div>
          )}
        </div>

        <div className="crop-modal-footer">
          <button className="bb bb-ghost" onClick={onClose} disabled={generating}>
            Cancel
          </button>
          <button
            className="bb bb-primary"
            disabled={generating || !name.trim() || !desc.trim()}
            onClick={() => onGenerate(name.trim(), desc.trim())}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {generating ? 'Generating…' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/icons/logo-1772578089154.jpg" alt="Robert" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                Generate Form
              </span>
            )}
          </button>
        </div>
      </div>
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
  const textSecondary = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(26,26,46,0.62)'
  const progressBarBg = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'
  const progressBarFill = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.45)'
  const progressWidths = [40, 72, 100]
  const progressWidth = progressWidths[activeTab]

  const tabLabels = [
    fields.length > 0 ? `${fields.length} STEP${fields.length !== 1 ? 'S' : ''} · QUOTE FORM` : 'QUOTE FORM',
    'CONTACT DETAILS',
    'CONFIRMATION',
  ]

  const hasPricing = fields.some(
    (f) =>
      ['radio', 'dropdown', 'checkbox'].includes(f.type) ||
      (f.type === 'number' && (f.ratePerUnit ?? 0) > 0) ||
      (f.type === 'route' && f.routeChargeType !== 'none')
  )

  const totalSteps = fields.length + 2
  const currentStepNum = activeTab === 0 ? 1 : activeTab === 1 ? fields.length + 1 : totalSteps

  return (
    <div className="preview-card">
      {/* ── Branded header ── */}
      <div style={{ background: brandColor }}>
        {/* Hero image */}
        {heroImageUrl && activeTab === 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt="Hero"
            style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Slim progress bar */}
        <div style={{ height: 4, background: progressBarBg, position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progressWidth}%`,
            background: progressBarFill,
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.35s ease',
          }} />
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* Step counter + tab label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <span style={{
              fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em',
              color: textSecondary, textTransform: 'uppercase',
            }}>
              {tabLabels[activeTab]}
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em',
              color: textSecondary, marginLeft: 'auto',
            }}>
              {currentStepNum}/{totalSteps}
            </span>
          </div>

          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '1.35rem', fontWeight: 800,
            lineHeight: 1.2, color: textPrimary,
          }}>
            {esc(formName) || 'My Quote Form'}
          </div>
          {formDesc && (
            <div style={{ fontSize: '0.82rem', marginTop: 5, color: textSecondary, lineHeight: 1.4 }}>
              {esc(formDesc)}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="preview-card-body">

        {/* ── Tab 0: Quote Fields ── */}
        {activeTab === 0 && (
          <>
            {fields.length === 0 ? (
              <div className="empty-step">
                No quote fields yet
                <p>Add fields from the left panel.</p>
              </div>
            ) : (
              fields.map((f, idx) => (
                <div
                  key={f.id}
                  onClick={() => onSelectField(f.id)}
                  style={{
                    border: `2px solid ${selectedId === f.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 16,
                    padding: '14px 15px',
                    marginBottom: 10,
                    cursor: 'pointer',
                    background: selectedId === f.id ? 'rgba(79,70,229,0.03)' : 'white',
                    boxShadow: selectedId === f.id ? '0 0 0 3px rgba(79,70,229,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    position: 'relative',
                  }}
                >
                  {/* Step badge + type badge + remove */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{
                      fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--muted)',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '2px 7px',
                    }}>
                      Step {idx + 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{
                        fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: 'var(--muted)', background: 'var(--border)', borderRadius: 4, padding: '2px 6px',
                      }}>
                        {f.type}
                      </span>
                      <button
                        className="bb bb-sm bb-danger"
                        onClick={(e) => onRemoveField(f.id, e)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Question label */}
                  <div style={{
                    fontSize: '0.92rem', fontWeight: 700, color: '#111827',
                    lineHeight: 1.35, marginBottom: 11,
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    {f.required && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                    )}
                    {esc(f.label) || <em style={{ color: 'var(--muted)', fontWeight: 400 }}>Untitled field</em>}
                  </div>

                  {/* Radio / Checkbox / Dropdown → big tap-target buttons */}
                  {(f.type === 'radio' || f.type === 'checkbox' || f.type === 'dropdown') && f.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {f.options.slice(0, 4).map((o) => (
                        <div key={o.id} style={{
                          display: 'flex', alignItems: 'center', gap: 11,
                          border: '1.5px solid #e5e7eb', borderRadius: 11,
                          padding: '10px 13px', background: 'white',
                        }}>
                          <div style={{
                            width: 18, height: 18, flexShrink: 0,
                            borderRadius: f.type === 'checkbox' ? 4 : '50%',
                            border: '2px solid #d1d5db',
                          }} />
                          <span style={{ fontSize: '0.84rem', fontWeight: 500, color: '#374151', flex: 1 }}>
                            {esc(o.label)}
                          </span>
                          {f.showPrices !== false && o.price > 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent2)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              +{currency}{o.price}
                            </span>
                          )}
                        </div>
                      ))}
                      {f.options.length > 4 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', padding: '3px 0' }}>
                          +{f.options.length - 4} more options
                        </div>
                      )}
                    </div>
                  )}

                  {/* Textarea / Number → styled input */}
                  {(f.type === 'textarea' || f.type === 'number') && (
                    <>
                      <div style={{
                        background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10,
                        color: '#9ca3af', fontSize: '0.83rem', padding: '11px 13px', lineHeight: 1.4,
                      }}>
                        {esc(f.placeholder ?? (f.type === 'number' ? 'Enter a number…' : 'Type your answer…'))}
                      </div>
                      {f.type === 'number' && (f.ratePerUnit ?? 0) > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                          × {currency}{f.ratePerUnit} per unit
                        </span>
                      )}
                    </>
                  )}

                  {/* Route → two address inputs + mini map */}
                  {f.type === 'route' && (
                    <div>
                      <div style={{
                        background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10,
                        color: '#9ca3af', fontSize: '0.83rem', padding: '10px 13px',
                        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5,
                      }}>
                        <span style={{ color: '#22c55e', fontSize: '0.85rem', lineHeight: 1 }}>●</span>
                        Starting location…
                      </div>
                      <div style={{
                        background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10,
                        color: '#9ca3af', fontSize: '0.83rem', padding: '10px 13px',
                        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8,
                      }}>
                        <span style={{ color: '#ef4444', fontSize: '0.85rem', lineHeight: 1 }}>●</span>
                        Ending location…
                      </div>
                      <div style={{
                        borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e5e7eb',
                        height: 80, background: 'linear-gradient(135deg,#e8f4e8 0%,#c8e6c9 60%,#dcedc8 100%)',
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 240 80" preserveAspectRatio="none">
                          <path d="M20,65 Q80,20 160,35 Q200,45 220,25" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4,3" opacity="0.45"/>
                          <path d="M30,60 Q100,15 210,20" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round"/>
                          <circle cx="30" cy="60" r="5" fill="#22c55e" stroke="white" strokeWidth="1.5"/>
                          <circle cx="210" cy="20" r="5" fill="#ef4444" stroke="white" strokeWidth="1.5"/>
                        </svg>
                        <span style={{ fontSize: '0.65rem', color: '#475569', background: 'rgba(255,255,255,0.92)', padding: '2px 8px', borderRadius: 10, zIndex: 1, fontWeight: 700 }}>
                          12.4 mi · 22 min
                        </span>
                      </div>
                      {f.routeChargeType !== 'none' && (
                        <div style={{ marginTop: 7, fontSize: '0.7rem', color: 'var(--muted)', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                          {(f.routeChargeType === 'mileage' || f.routeChargeType === 'both') && (
                            <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>
                              {currency}{f.ratePerMile ?? 0}/mi
                            </span>
                          )}
                          {(f.routeChargeType === 'drivetime' || f.routeChargeType === 'both') && (
                            <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>
                              {currency}{parseFloat(((f.ratePerMinute ?? 0) * 60).toFixed(2))}/hr
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image field */}
                  {f.type === 'image' && (
                    f.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.imageUrl}
                        alt={f.label}
                        style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 180, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        border: '2px dashed #e5e7eb', borderRadius: 10, padding: '22px 16px',
                        textAlign: 'center', color: '#9ca3af',
                      }}>
                        <div style={{ fontSize: '1.6rem', marginBottom: 5 }}>🖼</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>No image selected</div>
                        <div style={{ fontSize: '0.7rem', color: '#d1d5db', marginTop: 2 }}>Select in properties panel</div>
                      </div>
                    )
                  )}

                  {/* Draw area field */}
                  {f.type === 'draw_area' && (
                    <div>
                      <div style={{
                        borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e5e7eb',
                        height: 80, background: 'linear-gradient(160deg,#2d4a22 0%,#1a3a1a 40%,#0f2d0f 100%)',
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 240 80" preserveAspectRatio="none">
                          <polygon points="55,18 175,13 190,65 65,70 40,45" fill="rgba(255,230,0,0.2)" stroke="#ffe500" strokeWidth="2" strokeDasharray="5,3"/>
                        </svg>
                        <span style={{ fontSize: '0.65rem', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '2px 9px', borderRadius: 10, zIndex: 1, fontWeight: 700 }}>
                          Draw area on satellite map
                        </span>
                      </div>
                      {(f.ratePerSqFt ?? 0) > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                          × {currency}{f.ratePerSqFt}/sq ft
                        </span>
                      )}
                    </div>
                  )}

                  {/* Booking date field */}
                  {f.type === 'booking' && (
                    <div style={{ padding: '10px 0' }}>
                      <input type="date" disabled style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e4e0', fontSize: '0.9rem', background: '#fafaf9', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Live total */}
            {hasPricing && quoteDisplay === 'live' && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(79,70,229,0.07),rgba(16,185,129,0.04))',
                border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12,
                padding: '12px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginTop: 4, marginBottom: 10,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Estimated Total</span>
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{currency}0</span>
              </div>
            )}
            {hasPricing && quoteDisplay === 'after_submit' && (
              <div style={{
                background: 'rgba(0,0,0,0.03)', border: '1px dashed var(--border)', borderRadius: 12,
                padding: '12px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginTop: 4, marginBottom: 10, opacity: 0.55,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Total shown after submit</span>
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--muted)' }}>{currency}–</span>
              </div>
            )}

            <button style={{
              width: '100%', padding: '13px 16px',
              fontFamily: "'Oswald', sans-serif", fontWeight: 800, fontSize: '0.95rem',
              letterSpacing: '0.04em', border: 'none', borderRadius: 12, cursor: 'default',
              background: brandColor, color: textPrimary,
            }}>
              Next Step →
            </button>
          </>
        )}

        {/* ── Tab 1: Contact ── */}
        {activeTab === 1 && (
          <>
            <div style={{ marginBottom: 14 }}>
              {[
                { label: 'Full Name', placeholder: 'Jane Smith' },
                { label: 'Email Address', placeholder: 'jane@example.com' },
                { label: 'Phone Number', placeholder: '+1 (555) 000-0000', optional: true },
              ].map(({ label, placeholder, optional }) => (
                <div key={label} style={{ marginBottom: 11 }}>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: '#6b7280', marginBottom: 5,
                  }}>
                    {label}{optional && <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none', marginLeft: 5 }}>(optional)</span>}
                  </div>
                  <div style={{
                    background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10,
                    color: '#9ca3af', fontSize: '0.84rem', padding: '11px 14px',
                  }}>
                    {placeholder}
                  </div>
                </div>
              ))}
            </div>

            {disclaimerEnabled && disclaimerText && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 13px',
                background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)',
                borderRadius: 10, marginBottom: 14,
              }}>
                <input type="checkbox" readOnly style={{ marginTop: 2, flexShrink: 0, accentColor: brandColor }} />
                <span style={{ fontSize: '0.74rem', color: '#6b7280', lineHeight: 1.5 }}>{disclaimerText}</span>
              </div>
            )}

            {hasPricing && quoteDisplay === 'live' && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(79,70,229,0.07),rgba(16,185,129,0.04))',
                border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12,
                padding: '12px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 12,
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Your Estimate</span>
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{currency}0</span>
              </div>
            )}

            <button style={{
              width: '100%', padding: '13px 16px',
              fontFamily: "'Oswald', sans-serif", fontWeight: 800, fontSize: '0.95rem',
              letterSpacing: '0.04em', border: 'none', borderRadius: 12, cursor: 'default',
              background: brandColor, color: textPrimary,
            }}>
              {esc(submitLabel) || 'Get My Quote'}
            </button>
          </>
        )}

        {/* ── Tab 2: Confirmation ── */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 12px 16px', textAlign: 'center', gap: 10 }}>
            {/* Checkmark circle */}
            <div style={{
              width: 66, height: 66, borderRadius: '50%',
              background: brandColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 10px 28px ${brandColor}55`,
              marginBottom: 4,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={textPrimary} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
              You&apos;re all set!
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', maxWidth: 230, lineHeight: 1.55 }}>
              We&apos;ve received your details and will send your personalised quote shortly.
            </div>

            {hasPricing && quoteDisplay !== 'hidden' && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(79,70,229,0.07),rgba(16,185,129,0.04))',
                border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12,
                padding: '13px 18px', marginTop: 8, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {quoteDisplay === 'after_submit' ? 'Your Estimate (revealed)' : 'Your Estimate'}
                </span>
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>{currency}–</span>
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
  onSetOptRateOverride,
  onSetOptRouteOverride,
  onOpenMediaPicker,
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
  onSetOptRateOverride: (fid: string, oid: string, targetFid: string, rateStr: string) => void
  onSetOptRouteOverride: (fid: string, oid: string, targetFid: string, key: 'mile' | 'min', rateStr: string) => void
  onOpenMediaPicker: (fieldId: string) => void
}) {
  const [baseAddrSuggestions, setBaseAddrSuggestions] = useState<{ place_name: string }[]>([])
  const [baseAddrOpen, setBaseAddrOpen] = useState(false)

  const isRoute = field?.type === 'route'

  useEffect(() => {
    if (!isRoute) return
    const query = field?.baseAddress ?? ''
    if (query.length < 3) { setBaseAddrSuggestions([]); return }
    const t = setTimeout(async () => {
      const results = await geocodeAddress(query)
      setBaseAddrSuggestions(results)
      if (results.length > 0) setBaseAddrOpen(true)
    }, 300)
    return () => clearTimeout(t)
  }, [field?.baseAddress, isRoute])

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
  const isImage = field.type === 'image'
  const isDrawArea = field.type === 'draw_area'

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
            <div className="prop-label">Location mode</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
              {([
                ['point_to_point', '🔀 Point-to-point — customer enters start & end'],
                ['single', '📍 Single location — customer enters their address only'],
              ] as const).map(([val, lbl]) => (
                <label
                  key={val}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: '0.78rem', cursor: 'pointer',
                    color: (field.locationMode ?? 'point_to_point') === val ? 'var(--accent)' : 'var(--fg)',
                    fontWeight: (field.locationMode ?? 'point_to_point') === val ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name={`locationMode_${field.id}`}
                    value={val}
                    checked={(field.locationMode ?? 'point_to_point') === val}
                    onChange={() => onSetProp(field.id, 'locationMode', val)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {lbl}
                </label>
              ))}
            </div>
            {(field.locationMode ?? 'point_to_point') === 'single' && (
              <div style={{ fontSize: '0.71rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.45, padding: '6px 8px', background: 'var(--surface2)', borderRadius: 6 }}>
                Customer enters one address. Set a Base Address below to calculate travel cost.
              </div>
            )}
          </div>

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
              <div className="prop-label">Rate per hour ($)</div>
              <input
                className="prop-input"
                type="number"
                min={0}
                step={0.01}
                value={parseFloat(((field.ratePerMinute ?? 0) * 60).toFixed(4))}
                onChange={(e) =>
                  onSetProp(field.id, 'ratePerMinute', parseFloat(e.target.value) / 60 || 0)
                }
              />
            </div>
          )}

          <div className="prop-group">
            <div className="prop-label">Base address (optional)</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 5, lineHeight: 1.4 }}>
              Your business or starting location. When set, customers only enter their destination — distance is calculated from here.
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="prop-input"
                type="text"
                placeholder="e.g. 123 Main St, Chicago, IL"
                value={field.baseAddress ?? ''}
                onChange={(e) => {
                  onSetProp(field.id, 'baseAddress', e.target.value)
                  setBaseAddrOpen(true)
                }}
                onFocus={() => { if (baseAddrSuggestions.length > 0) setBaseAddrOpen(true) }}
                onBlur={() => setTimeout(() => setBaseAddrOpen(false), 150)}
                autoComplete="off"
              />
              {baseAddrOpen && baseAddrSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 60,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
                }}>
                  {baseAddrSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '7px 11px', fontSize: '0.76rem', color: 'var(--fg)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: i < baseAddrSuggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        lineHeight: 1.35,
                      }}
                      onMouseDown={() => {
                        onSetProp(field.id, 'baseAddress', s.place_name)
                        setBaseAddrSuggestions([])
                        setBaseAddrOpen(false)
                      }}
                    >
                      📍 {s.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {isImage && (
        <div className="prop-group">
          <div className="prop-label">Image</div>
          {field.imageUrl ? (
            <div style={{ marginTop: 4, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={field.imageUrl} alt="" style={{ width: '100%', display: 'block', maxHeight: 110, objectFit: 'cover' }} />
              <div style={{ display: 'flex', gap: 6, padding: '6px 8px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                <button
                  className="add-opt-btn"
                  style={{ flex: 1, marginTop: 0, textAlign: 'center' }}
                  onClick={() => onOpenMediaPicker(field.id)}
                >
                  Change image
                </button>
                <button className="hero-upload-clear" style={{ padding: '4px 8px' }}
                  onClick={() => onSetProp(field.id, 'imageUrl', '')}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              style={{ display: 'block', width: '100%', marginTop: 4, background: 'var(--surface2)', border: '2px dashed var(--border)', borderRadius: 8, padding: '18px 8px', cursor: 'pointer', textAlign: 'center' }}
              onClick={() => onOpenMediaPicker(field.id)}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>🖼</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Choose from Media Library</div>
            </button>
          )}
        </div>
      )}

      {isDrawArea && (
        <div className="prop-group">
          <div className="prop-label">Rate per sq ft ($)</div>
          <input
            className="prop-input"
            type="number"
            min={0}
            step={0.001}
            value={field.ratePerSqFt ?? 0}
            onChange={(e) =>
              onSetProp(field.id, 'ratePerSqFt', parseFloat(e.target.value) || 0)
            }
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
            Customer draws a polygon on a satellite map — sq ft calculated automatically.
          </div>
        </div>
      )}

      {field.type !== 'image' && field.type !== 'draw_area' && (
        <div className="prop-toggle">
          <span className="prop-toggle-lbl">Required field</span>
          <div
            className={`toggle${field.required ? ' on' : ''}`}
            onClick={() => onToggleProp(field.id, 'required')}
          />
        </div>
      )}

      {hasOpts && (
        <div className="prop-toggle">
          <span className="prop-toggle-lbl">Show prices on options</span>
          <div
            className={`toggle${field.showPrices !== false ? ' on' : ''}`}
            onClick={() => onSetProp(field.id, 'showPrices', field.showPrices !== false ? false : true)}
          />
        </div>
      )}

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

      {/* ── Rate Overrides per Service ── */}
      {hasOpts && (() => {
        const rateFields = allFields.filter(
          (f) =>
            f.id !== field.id &&
            (f.type === 'number' || (f.type === 'route' && f.routeChargeType !== 'none'))
        )
        if (rateFields.length === 0) return null
        return (
          <div className="prop-group" style={{ marginTop: 12 }}>
            <div className="prop-label">Rate Overrides per Service</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginBottom: 8, lineHeight: 1.45 }}>
              Set different rates when each option is selected.
            </div>
            {(field.options ?? []).map((opt) => (
              <div
                key={opt.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '7px 9px',
                  marginBottom: 6,
                  background: 'var(--surface)',
                }}
              >
                <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.02em' }}>
                  {opt.label || '(unnamed)'}
                </div>
                {rateFields.map((rf) => (
                  <div key={rf.id} style={{ marginBottom: 5 }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 3, fontWeight: 500 }}>{rf.label}</div>
                    {rf.type === 'number' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          className="prop-input"
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder={String(rf.ratePerUnit ?? 0)}
                          value={opt.rateOverrides?.[rf.id] ?? ''}
                          onChange={(e) => onSetOptRateOverride(field.id, opt.id, rf.id, e.target.value)}
                          style={{ flex: 1, fontSize: '0.73rem', padding: '3px 5px' }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>/unit</span>
                      </div>
                    )}
                    {rf.type === 'route' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {(rf.routeChargeType === 'mileage' || rf.routeChargeType === 'both') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              className="prop-input"
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder={String(rf.ratePerMile ?? 0)}
                              value={opt.routeOverrides?.[rf.id]?.mile ?? ''}
                              onChange={(e) => onSetOptRouteOverride(field.id, opt.id, rf.id, 'mile', e.target.value)}
                              style={{ flex: 1, fontSize: '0.73rem', padding: '3px 5px' }}
                            />
                            <span style={{ fontSize: '0.68rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>/mi</span>
                          </div>
                        )}
                        {(rf.routeChargeType === 'drivetime' || rf.routeChargeType === 'both') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              className="prop-input"
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder={String(parseFloat(((rf.ratePerMinute ?? 0) * 60).toFixed(4)))}
                              value={(() => { const m = opt.routeOverrides?.[rf.id]?.min; return m !== undefined ? parseFloat((m * 60).toFixed(4)) : '' })()}
                              onChange={(e) => {
                                const h = parseFloat(e.target.value)
                                onSetOptRouteOverride(field.id, opt.id, rf.id, 'min', isNaN(h) ? '' : String(h / 60))
                              }}
                              style={{ flex: 1, fontSize: '0.73rem', padding: '3px 5px' }}
                            />
                            <span style={{ fontSize: '0.68rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>/hr</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })()}

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
  const router = useRouter()

  // ── State ──
  const [screen, setScreen] = useState<'picker' | 'builder'>('picker')
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState<string>('#FFE500')
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3>(0)
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
  const [existingForms, setExistingForms] = useState<Array<{ id: string; form_name: string; form_config: { slug?: string } }>>([])
  const [existingFormsLoading, setExistingFormsLoading] = useState(false)
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
  // 'hero' = hero image, any other string = field ID for image fields
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null)
  const [heroMediaFiles, setHeroMediaFiles] = useState<Array<{ id: string; title: string; file_name: string; file_url: string; file_size: number; created_at: string }>>([])
  const [heroMediaLoading, setHeroMediaLoading] = useState(false)
  const [heroMediaCopiedId, setHeroMediaCopiedId] = useState<string | null>(null)
  const [disclaimerEnabled, setDisclaimerEnabled] = useState(true)
  const [disclaimerText, setDisclaimerText] = useState(
    'I understand this quote is an estimate and is not final until confirmed in writing.'
  )
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailIntro, setEmailIntro] = useState('')
  const [emailOutro, setEmailOutro] = useState('')
  const [emailHeaderImage, setEmailHeaderImage] = useState('')
  const [emailAccentColor, setEmailAccentColor] = useState('#1a1a2e')

  function showToast(
    msg: string,
    type: 'success' | 'error' | 'info' = 'info',
    ms = 3000
  ) {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }

  // ── AI generation ──
  async function generateWithAI(businessName: string, businessDesc: string) {
    setAiGenerating(true)
    try {
      const res = await fetch('/api/form-builder/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, businessDescription: businessDesc }),
      })
      const data = await res.json()
      if (!res.ok || !data.formConfig) {
        showToast('AI generation failed — try again', 'error')
        return
      }
      const c = data.formConfig
      if (c.fields?.length) setFields(c.fields)
      if (c.description) setFormDesc(c.description)
      if (c.submit_label) setSubmitLabel(c.submit_label)
      if (!formName || formName === 'My Quote Form') setFormName(`${businessName} Quote Form`)
      setAiModalOpen(false)
      showToast('Form generated! Review and save when ready.', 'success', 4000)
    } catch {
      showToast('AI generation failed — try again', 'error')
    } finally {
      setAiGenerating(false)
    }
  }

  // Load images from the shared media library (vsls bucket)
  async function loadHeroMedia() {
    if (!accountId) return
    setHeroMediaLoading(true)
    const { data } = await supabase
      .from('vsls')
      .select('id, title, file_name, file_url, file_size, created_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    setHeroMediaFiles((data ?? []).filter((f) => isImageFile(f.file_name)))
    setHeroMediaLoading(false)
  }

  // Called after cropping — uploads to vsls so it appears in the media library
  async function uploadHeroBlob(blob: Blob, ext = 'jpg') {
    if (!accountId) { showToast('Not logged in', 'error'); return }
    if (blob.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error'); return
    }
    setHeroUploadLoading(true)
    setCropFile(null)
    const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const storagePath = `${accountId}/${uuid}.${ext}`
    const { data, error } = await supabase.storage
      .from('vsls')
      .upload(storagePath, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (error) {
      setHeroUploadLoading(false)
      showToast(`Upload failed: ${error.message}`, 'error')
      return
    }
    const { data: urlData } = supabase.storage.from('vsls').getPublicUrl(data.path)
    const fileUrl = urlData.publicUrl
    await supabase.from('vsls').insert({
      account_id: accountId,
      title: `Hero image ${new Date().toLocaleDateString()}`,
      file_name: `hero-image.${ext}`,
      file_url: fileUrl,
      storage_path: storagePath,
      file_size: blob.size,
    })
    setHeroImageUrl(fileUrl)
    setHeroUploadLoading(false)
    showToast('Hero image uploaded', 'success')
    await loadHeroMedia()
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

      // Fetch existing forms for the picker screen
      setExistingFormsLoading(true)
      supabase
        .from('hosted_forms')
        .select('id, form_name, form_config')
        .eq('account_id', account.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          setExistingForms(data ?? [])
          setExistingFormsLoading(false)
        })

      // Default slug to business name for new forms (not editing an existing one)
      if (!searchParams.get('form_id') && account.business_name) {
        const defaultSlug = account.business_name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        setFormSlug(defaultSlug)
      }

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
        setScreen('builder')
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
    setEmailSubject(c.email_template?.subject ?? '')
    setEmailIntro(c.email_template?.intro ?? '')
    setEmailOutro(c.email_template?.outro ?? '')
    setEmailHeaderImage(c.email_template?.header_image ?? '')
    setEmailAccentColor(c.email_template?.accent_color ?? '#1a1a2e')
  }

  // ── Template apply ──
  function applyTemplate(tpl: TemplateConfig) {
    const fields: FormField[] = tpl.fields.map((f) => ({
      ...f,
      id: uid(),
      options: f.options?.map((o) => ({ ...o, id: uid() })),
    }))
    setFields(fields)
    setFormName(tpl.formName)
    setFormDesc(tpl.formDesc)
    setBrandColor(tpl.brandColor)
    setSubmitLabel(tpl.submitLabel)
    setSelectedId(null)
    setScreen('builder')
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

  // ── Option rate override handlers ──
  function setOptRateOverride(fid: string, oid: string, targetFid: string, rateStr: string) {
    const rate = parseFloat(rateStr)
    setFields((prev) =>
      prev.map((f) =>
        f.id !== fid
          ? f
          : {
              ...f,
              options: (f.options ?? []).map((o) => {
                if (o.id !== oid) return o
                const rateOverrides = { ...(o.rateOverrides ?? {}) }
                if (rateStr === '' || isNaN(rate)) {
                  delete rateOverrides[targetFid]
                } else {
                  rateOverrides[targetFid] = rate
                }
                return { ...o, rateOverrides }
              }),
            }
      )
    )
  }

  function setOptRouteOverride(fid: string, oid: string, targetFid: string, key: 'mile' | 'min', rateStr: string) {
    const rate = parseFloat(rateStr)
    setFields((prev) =>
      prev.map((f) =>
        f.id !== fid
          ? f
          : {
              ...f,
              options: (f.options ?? []).map((o) => {
                if (o.id !== oid) return o
                const existing = o.routeOverrides?.[targetFid] ?? {}
                const updated = { ...existing }
                if (rateStr === '' || isNaN(rate)) {
                  delete updated[key]
                } else {
                  updated[key] = rate
                }
                const routeOverrides = { ...(o.routeOverrides ?? {}), [targetFid]: updated }
                if (Object.keys(routeOverrides[targetFid]).length === 0) {
                  delete routeOverrides[targetFid]
                }
                return { ...o, routeOverrides }
              }),
            }
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
        email_template: {
          ...(emailSubject ? { subject: emailSubject } : {}),
          ...(emailIntro ? { intro: emailIntro } : {}),
          ...(emailOutro ? { outro: emailOutro } : {}),
          ...(emailHeaderImage ? { header_image: emailHeaderImage } : {}),
          ...(emailAccentColor && emailAccentColor !== '#1a1a2e' ? { accent_color: emailAccentColor } : {}),
        },
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    try {
      // Check if any form (any account) already owns this slug
      const { data: slugConflicts } = await supabase
        .from('hosted_forms')
        .select('id, account_id')
        .eq('form_config->>slug', slug)

      const otherAccountConflict = (slugConflicts ?? []).find(
        (f) => f.account_id !== accountId && f.id !== editingFormId
      )
      if (otherAccountConflict) {
        showToast('That URL is already taken — choose a different one', 'error', 5000)
        setIsSaving(false)
        return
      }

      // Same-account forms with this slug (could be ghost duplicates)
      const sameAccountWithSlug = (slugConflicts ?? []).filter(
        (f) => f.account_id === accountId && f.id !== editingFormId
      )

      let savedId = editingFormId

      if (editingFormId) {
        const res = await fetch('/api/form-builder/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId: editingFormId, payload }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Failed to save form')
        }
        setExistingForms((prev) => prev.map((f) =>
          f.id === editingFormId ? { ...f, form_name: name, form_config: { slug } } : f
        ))
      } else if (sameAccountWithSlug.length > 0) {
        // Reuse existing form at this slug instead of creating a duplicate
        const existingId = sameAccountWithSlug[0].id
        const res = await fetch('/api/form-builder/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId: existingId, payload }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Failed to save form')
        }
        savedId = existingId
        setEditingFormId(existingId)
        router.replace(`/form-builder?form_id=${existingId}`, { scroll: false } as never)
        setExistingForms((prev) => prev.map((f) =>
          f.id === existingId ? { ...f, form_name: name, form_config: { slug } } : f
        ))
      } else {
        const { data, error } = await supabase
          .from('hosted_forms')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        savedId = data.id
        setEditingFormId(data.id)
        router.replace(`/form-builder?form_id=${data.id}`, { scroll: false } as never)
        setExistingForms((prev) => [{ id: data.id, form_name: name, form_config: { slug } }, ...prev])
      }

      // Clean up any remaining ghost duplicates for this slug (old bug artifacts)
      const ghostIds = (slugConflicts ?? [])
        .filter((f) => f.account_id === accountId && f.id !== savedId)
        .map((f) => f.id)
      if (ghostIds.length > 0) {
        await supabase.from('hosted_forms').delete().in('id', ghostIds)
        setExistingForms((prev) => prev.filter((f) => !ghostIds.includes(f.id)))
      }

      showToast(`✓ Saved! Live at quote-box.com/${slug}`, 'success')
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      if (err.code === '23505')
        showToast('URL already taken — try another', 'error')
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

  // ── Email preview derived values ──
  const emailPreviewBg = emailAccentColor || '#1a1a2e'
  const emailPreviewFg = isColorDark(emailPreviewBg) ? '#ffffff' : '#0f172a'
  const emailPreviewTotalColor = isColorDark(emailPreviewBg) ? '#FFE500' : '#0f172a'

  return (
    // The protected layout provides the outer sidebar + flex container.
    // The builder fills the remaining space.
    <div className="flex-1 overflow-hidden builder-wrap h-full">
      {/* Builder header */}
      <div className="builder-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="builder-logo">Form Builder</div>
          {screen === 'builder' && (
            <button
              className="bb bb-ghost"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              onClick={() => setScreen('picker')}
            >
              ← {editingFormId ? 'All Forms' : 'Templates'}
            </button>
          )}
        </div>
        {screen === 'builder' && (
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
        )}
      </div>

      {/* Template picker or builder */}
      {screen === 'picker' ? (
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 56px)' }}>
          {/* ── Existing forms ── */}
          {(existingForms.length > 0 || existingFormsLoading) && (
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
                  Your Forms
                </h2>
              </div>
              {existingFormsLoading ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Loading…</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
                  {existingForms.map((f) => (
                    <div key={f.id} style={{
                      background: 'var(--surface)', border: '2px solid var(--border)',
                      borderRadius: 12, padding: '16px 18px',
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--fg)', lineHeight: 1.3 }}>{f.form_name}</div>
                      {f.form_config?.slug && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                          /{f.form_config.slug}
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          await loadExistingForm(f.id)
                          setScreen('builder')
                        }}
                        style={{
                          marginTop: 4, background: '#4f46e5', color: 'white',
                          border: 'none', borderRadius: 8, padding: '8px 0',
                          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Edit Form →
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
            </div>
          )}
          <TemplatePicker
            onSelect={applyTemplate}
            onBlank={() => setScreen('builder')}
            onAi={() => { setScreen('builder'); setAiModalOpen(true) }}
          />
        </div>
      ) : null}

      {/* 3-panel layout */}
      <div className="builder-layout" style={{ display: screen === 'builder' ? undefined : 'none' }}>
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
                <button
                  className="ftype-btn"
                  onClick={() => setAiModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    border: 'none',
                    marginBottom: 8,
                    letterSpacing: '0.01em',
                  }}
                >
                  <span className="icon">✨</span> Build with AI
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '0 0 8px' }} />
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
                  <span className="icon">🖼</span> Image
                </button>
                <button className="ftype-btn" onClick={() => addField('draw_area')}>
                  <span className="icon">⬡</span> Draw Area
                </button>
                <button className="ftype-btn" onClick={() => addField('booking')}>
                  <span className="icon">📅</span> Booking Date
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
                  {/* Hidden file input — triggered from inside the media picker */}
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
                  {heroImageUrl ? (
                    <div style={{ position: 'relative', marginTop: 4, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImageUrl} alt="Hero preview" className="hero-upload-preview"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div style={{ display: 'flex', gap: 6, padding: '6px 8px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                        <button
                          className="add-opt-btn"
                          style={{ flex: 1, marginTop: 0, textAlign: 'center' }}
                          onClick={() => { loadHeroMedia(); setMediaPickerTarget('hero') }}
                        >
                          Change image
                        </button>
                        <button className="hero-upload-clear" style={{ padding: '4px 8px' }} onClick={() => setHeroImageUrl('')}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="hero-upload-zone"
                      style={{ border: '2px dashed var(--border)', cursor: 'pointer', width: '100%', background: 'var(--surface2)', borderRadius: 8, padding: '18px 0' }}
                      disabled={heroUploadLoading}
                      onClick={() => { loadHeroMedia(); setMediaPickerTarget('hero') }}
                    >
                      {heroUploadLoading ? (
                        <span className="hero-upload-spinner" />
                      ) : (
                        <div className="hero-upload-prompt">
                          <span style={{ fontSize: '1.2rem' }}>🖼</span>
                          <span>Choose from Media Library</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>or upload a new image</span>
                        </div>
                      )}
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
              {(['Step 1 · Quote', 'Step 2 · Contact', 'Step 3 · Confirm', '✉ Email'] as const).map(
                (label, i) => (
                  <div
                    key={i}
                    className={`step-tab${activeTab === i ? ' active' : ''}`}
                    onClick={() => setActiveTab(i as 0 | 1 | 2 | 3)}
                  >
                    {label}
                  </div>
                )
              )}
            </div>

            {activeTab === 3 ? (
              /* ── Email editor ── */
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', maxHeight: '100%' }}>
                {/* Mock email shell */}
                <div style={{ background: '#f7f6f3', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.1)', fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>

                  {/* ── Email header (live preview) ── */}
                  <div style={{ background: emailPreviewBg, position: 'relative', overflow: 'hidden' }}>
                    {emailHeaderImage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={emailHeaderImage} alt="" style={{ display: 'block', width: '100%', maxHeight: 110, objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 5 }}>
                          <button type="button" onClick={() => { loadHeroMedia(); setMediaPickerTarget('email-header') }}
                            style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 5, padding: '3px 8px', color: 'white', fontSize: '0.65rem', cursor: 'pointer' }}>
                            Change
                          </button>
                          <button type="button" onClick={() => setEmailHeaderImage('')}
                            style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 5, padding: '3px 8px', color: 'white', fontSize: '0.65rem', cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      </>
                    ) : (
                      <button type="button" onClick={() => { loadHeroMedia(); setMediaPickerTarget('email-header') }}
                        style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: '1.5px dashed rgba(255,255,255,0.3)', borderRadius: 0, cursor: 'pointer', color: emailPreviewFg + '99', fontSize: '0.72rem', fontWeight: 600 }}>
                        + Add header image / logo
                      </button>
                    )}

                    {/* Logo row + color picker */}
                    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 900, color: emailPreviewFg }}>
                        Quote<span style={{ color: emailPreviewTotalColor }}>.</span>Box
                      </span>
                      <label style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} title="Header color">
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: emailPreviewBg, border: '2px solid rgba(255,255,255,0.45)', display: 'inline-block', boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
                        <span style={{ fontSize: '0.7rem', color: emailPreviewFg + 'cc', fontWeight: 600 }}>Color</span>
                        <input type="color" value={emailPreviewBg} onChange={(e) => setEmailAccentColor(e.target.value)}
                          style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                      </label>
                    </div>
                  </div>
                  <div style={{ background: emailPreviewBg, height: 3, opacity: 0.7 }} />

                  {/* Body */}
                  <div style={{ background: 'white', padding: '18px 20px 14px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b' }}>Hi [Customer Name],</p>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Intro text</div>
                      <textarea rows={2} value={emailIntro} onChange={(e) => setEmailIntro(e.target.value)}
                        placeholder={`Thank you for your enquiry with ${formName || 'our team'}. Here's a summary of your quote.`}
                        style={{ width: '100%', fontSize: 11, padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e2e8f0', resize: 'vertical', fontFamily: 'inherit', color: '#334155', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
                    </div>

                    {/* Live total block */}
                    <div style={{ background: emailPreviewBg, borderRadius: 8, padding: '12px', textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isColorDark(emailPreviewBg) ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)', marginBottom: 3 }}>Estimated Total</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: emailPreviewTotalColor, lineHeight: 1 }}>$0.00</div>
                      <div style={{ fontSize: 9, color: isColorDark(emailPreviewBg) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', marginTop: 4 }}>Estimate — final price confirmed on booking</div>
                    </div>

                    {/* Line items mock */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, marginBottom: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5 }}>Your selections</div>
                      {[{ label: 'Service Type', value: 'Standard Package', price: '$99.00' }, { label: 'Add-ons', value: 'Rush delivery', price: '$50.00' }].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#334155' }}>{item.label}</div>
                            <div style={{ color: '#64748b', marginTop: 1 }}>{item.value}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.price}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Follow-up text</div>
                      <textarea rows={2} value={emailOutro} onChange={(e) => setEmailOutro(e.target.value)}
                        placeholder="We'll be in touch shortly to confirm your booking. If you have any questions in the meantime, just reply to this email."
                        style={{ width: '100%', fontSize: 11, padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e2e8f0', resize: 'vertical', fontFamily: 'inherit', color: '#334155', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
                    </div>
                  </div>

                  <div style={{ background: '#f7f6f3', padding: '8px 20px', textAlign: 'center' }}>
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>Sent via Quote.Box · Automated quote summary</span>
                  </div>
                </div>

                {/* Subject line editor */}
                <div style={{ marginTop: 14, background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email subject line</div>
                  <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={`Your quote from ${formName || 'our team'}`}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--border)', fontFamily: 'inherit', color: 'var(--fg)', outline: 'none', boxSizing: 'border-box', background: 'var(--surface2)' }} />
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 5 }}>
                    Leave blank for default: &ldquo;Your quote from {formName || '[form name]'}&rdquo;
                  </div>
                </div>

                <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: '0.72rem', color: '#166534' }}>
                  Click <strong>Save</strong> (top right) to apply changes to this form&apos;s email.
                </div>
              </div>
            ) : (
              <CanvasPreview
                fields={fields}
                selectedId={selectedId}
                brandColor={brandColor}
                activeTab={activeTab as 0 | 1 | 2}
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
            )}
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
          onSetOptRateOverride={setOptRateOverride}
          onSetOptRouteOverride={setOptRouteOverride}
          onOpenMediaPicker={(fieldId) => { loadHeroMedia(); setMediaPickerTarget(fieldId) }}
        />
      </div>

      {/* ── Hero Media Picker Lightbox ── */}
      {mediaPickerTarget !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.72)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setMediaPickerTarget(null) }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 820, maxHeight: '88vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1rem', fontWeight: 700 }}>Media Library</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                  {heroMediaFiles.length} image{heroMediaFiles.length !== 1 ? 's' : ''} · click one to select
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="bb bb-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={() => heroFileInputRef.current?.click()}
                >
                  Upload New
                </button>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1 }}
                  onClick={() => setMediaPickerTarget(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Grid body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {heroMediaLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                  <span className="hero-upload-spinner" />
                </div>
              ) : heroMediaFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🖼</div>
                  <div style={{ marginBottom: 14 }}>No images in your media library yet.</div>
                  <button className="bb bb-primary" onClick={() => heroFileInputRef.current?.click()}>
                    Upload your first image
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {heroMediaFiles.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        if (mediaPickerTarget === 'hero') {
                          setHeroImageUrl(f.file_url)
                        } else if (mediaPickerTarget === 'email-header') {
                          setEmailHeaderImage(f.file_url)
                        } else if (mediaPickerTarget) {
                          setProp(mediaPickerTarget, 'imageUrl', f.file_url)
                        }
                        setMediaPickerTarget(null)
                      }}
                      style={{
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: heroImageUrl === f.file_url ? '2px solid var(--accent)' : '2px solid var(--border)',
                        cursor: 'pointer',
                        background: 'var(--surface2)',
                        transition: 'all 0.13s',
                        boxShadow: heroImageUrl === f.file_url ? '0 0 0 3px rgba(79,70,229,0.15)' : undefined,
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', position: 'relative', background: '#111' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.file_url} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {heroImageUrl === f.file_url && (
                          <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</div>
                        )}
                        {/* Copy URL on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(f.file_url)
                            setHeroMediaCopiedId(f.id)
                            setTimeout(() => setHeroMediaCopiedId(null), 2000)
                          }}
                          style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: 'white', fontSize: '0.65rem', opacity: 0 }}
                          className="media-copy-btn"
                        >
                          {heroMediaCopiedId === f.id ? '✓' : 'copy'}
                        </button>
                      </div>
                      {/* Label */}
                      <div style={{ padding: '7px 9px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'monospace', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.id}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>{formatMediaDate(f.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
      <AiModal
        open={aiModalOpen}
        defaultName={formName}
        generating={aiGenerating}
        onGenerate={generateWithAI}
        onClose={() => { if (!aiGenerating) setAiModalOpen(false) }}
      />
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
