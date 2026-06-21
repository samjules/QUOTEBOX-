'use client'

import { useState, useRef, useEffect } from 'react'
import type { PPLService } from '@/lib/types'

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0e0020', background: 'white',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }
const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#0e0020',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

const PRICING_METHODS: Array<{ id: PPLService['pricingMethod']; label: string; sub: string; icon: string }> = [
  { id: 'hourly', label: 'Hourly', sub: 'You charge based on how long the job takes', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'sqft', label: 'Per sq ft', sub: 'You charge based on the size of the space', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z' },
  { id: 'flat', label: 'Flat rate', sub: 'One fixed price regardless of size or time', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { id: 'perunit', label: 'Per unit', sub: 'You charge per room, item, load, or similar', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
]

function emptyService(): PPLService {
  return { id: crypto.randomUUID(), name: '', pricingMethod: null, pricingRate: null, pricingUnit: null, description: null, photoUploadEnabled: false, photoUploadPrompt: null }
}

interface Props {
  data: PPLService[]
  onNext: (services: PPLService[]) => void
  onBack: () => void
  saving: boolean
}

export default function StepServices({ data, onNext, onBack, saving }: Props) {
  const [services, setServices] = useState<PPLService[]>(data.length > 0 ? data : [emptyService()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  function updateService(id: string, partial: Partial<PPLService>) {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, ...partial } : s))
    setErrors({})
  }

  function addService() {
    const s = emptyService()
    setServices((prev) => [...prev, s])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function confirmRemove(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id))
    setRemoving(null)
  }

  function submit() {
    const e: Record<string, string> = {}
    for (const s of services) {
      if (!s.name.trim()) e[s.id] = 'name'
      else if (!s.pricingMethod) e[s.id] = 'pricing'
      else if (s.pricingRate == null || s.pricingRate <= 0) e[s.id] = 'rate'
      else if (s.pricingMethod === 'perunit' && !s.pricingUnit?.trim()) e[s.id] = 'unit'
    }
    if (Object.keys(e).length) { setErrors(e); return }
    onNext(services)
  }

  const allValid = services.every((s) => s.name.trim() && s.pricingMethod && s.pricingRate != null && s.pricingRate > 0 && (s.pricingMethod !== 'perunit' || s.pricingUnit?.trim()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0e0020', margin: '0 0 6px' }}>Your Services</h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
          Add each service you offer. You can set a different pricing method for each one.
        </p>
      </div>

      {services.map((service, idx) => (
        <ServiceCard
          key={service.id}
          service={service}
          index={idx}
          error={errors[service.id]}
          canRemove={services.length > 1}
          isRemoving={removing === service.id}
          onUpdate={(p) => updateService(service.id, p)}
          onRemoveClick={() => setRemoving(service.id)}
          onRemoveConfirm={() => confirmRemove(service.id)}
          onRemoveCancel={() => setRemoving(null)}
        />
      ))}

      <button type="button" onClick={addService}
        style={{ padding: '12px', borderRadius: 10, border: '1.5px dashed #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: '#64748b', fontFamily: 'inherit' }}>
        + Add another service
      </button>

      <div ref={bottomRef} />

      <button onClick={submit} disabled={saving || !allValid}
        style={{ ...btn, opacity: saving || !allValid ? 0.5 : 1, cursor: saving || !allValid ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
        ← Back
      </button>
    </div>
  )
}

function ServiceCard({ service, index, error, canRemove, isRemoving, onUpdate, onRemoveClick, onRemoveConfirm, onRemoveCancel }: {
  service: PPLService; index: number; error?: string; canRemove: boolean; isRemoving: boolean
  onUpdate: (p: Partial<PPLService>) => void
  onRemoveClick: () => void; onRemoveConfirm: () => void; onRemoveCancel: () => void
}) {
  const descLen = service.description?.length ?? 0
  const cardRef = useRef<HTMLDivElement>(null)

  // Scroll into view on mount (for newly added cards)
  useEffect(() => {
    if (index > 0) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={cardRef} style={{ border: '1.5px solid #e5e4e0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: '#f8fafc', padding: '10px 16px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Service {index + 1}
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Name */}
        <div>
          <label style={label}>What&apos;s this service called? *</label>
          <input type="text" value={service.name} onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g. Lawn mowing, Full house clean, 16ft truck move"
            style={{ ...input, borderColor: error === 'name' ? '#ef4444' : '#e5e4e0' }} />
          {error === 'name' && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Service name is required</div>}
        </div>

        {/* Pricing method */}
        <div>
          <label style={label}>How do you price this? *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {PRICING_METHODS.map((m) => {
              const sel = service.pricingMethod === m.id
              return (
                <button key={m.id} type="button" onClick={() => onUpdate({ pricingMethod: m.id, pricingRate: null, pricingUnit: null })}
                  style={{
                    padding: '14px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    border: sel ? '2px solid #0e0020' : error === 'pricing' ? '1.5px solid #fca5a5' : '1.5px solid #e5e4e0',
                    background: sel ? '#fafaf8' : 'white',
                    display: 'flex', flexDirection: 'column', gap: 4, minHeight: 80,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="16" height="16" fill="none" stroke={sel ? '#0e0020' : '#94a3b8'} viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={m.icon} /></svg>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: sel ? '#0e0020' : '#334155' }}>{m.label}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>{m.sub}</span>
                </button>
              )
            })}
          </div>
          {error === 'pricing' && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Select a pricing method</div>}
        </div>

        {/* Rate input (conditional) */}
        {service.pricingMethod && (
          <div>
            {service.pricingMethod === 'hourly' && (
              <>
                <label style={label}>Your hourly rate ($)</label>
                <div style={{ position: 'relative', width: 140 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                  <input type="number" placeholder="e.g. 95" value={service.pricingRate ?? ''} onChange={(e) => onUpdate({ pricingRate: parseFloat(e.target.value) || null })}
                    style={{ ...input, width: 140, paddingLeft: 26, borderColor: error === 'rate' ? '#ef4444' : '#e5e4e0' }} />
                </div>
              </>
            )}
            {service.pricingMethod === 'sqft' && (
              <>
                <label style={label}>Your rate per sq ft ($)</label>
                <div style={{ position: 'relative', width: 140 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                  <input type="number" step="0.01" placeholder="e.g. 0.85" value={service.pricingRate ?? ''} onChange={(e) => onUpdate({ pricingRate: parseFloat(e.target.value) || null })}
                    style={{ ...input, width: 140, paddingLeft: 26, borderColor: error === 'rate' ? '#ef4444' : '#e5e4e0' }} />
                </div>
              </>
            )}
            {service.pricingMethod === 'flat' && (
              <>
                <label style={label}>Your flat price ($)</label>
                <div style={{ position: 'relative', width: 140 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                  <input type="number" placeholder="e.g. 299" value={service.pricingRate ?? ''} onChange={(e) => onUpdate({ pricingRate: parseFloat(e.target.value) || null })}
                    style={{ ...input, width: 140, paddingLeft: 26, borderColor: error === 'rate' ? '#ef4444' : '#e5e4e0' }} />
                </div>
              </>
            )}
            {service.pricingMethod === 'perunit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={label}>What&apos;s the unit?</label>
                  <input type="text" placeholder='e.g. room, truckload, item' value={service.pricingUnit ?? ''} onChange={(e) => onUpdate({ pricingUnit: e.target.value })}
                    style={{ ...input, borderColor: error === 'unit' ? '#ef4444' : '#e5e4e0' }} />
                  {error === 'unit' && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Unit name is required</div>}
                </div>
                <div>
                  <label style={label}>Price per unit ($)</label>
                  <div style={{ position: 'relative', width: 140 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                    <input type="number" placeholder="e.g. 50" value={service.pricingRate ?? ''} onChange={(e) => onUpdate({ pricingRate: parseFloat(e.target.value) || null })}
                      style={{ ...input, width: 140, paddingLeft: 26, borderColor: error === 'rate' ? '#ef4444' : '#e5e4e0' }} />
                  </div>
                </div>
              </div>
            )}
            {error === 'rate' && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Price is required</div>}
          </div>
        )}

        {/* Description */}
        <div>
          <label style={label}>Describe this service in one sentence <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
          <div style={{ position: 'relative' }}>
            <textarea value={service.description ?? ''} onChange={(e) => { if (e.target.value.length <= 150) onUpdate({ description: e.target.value || null }) }}
              placeholder="e.g. Full interior clean including kitchen, bathrooms, and all bedrooms"
              rows={2} style={{ ...input, resize: 'none', lineHeight: 1.5, paddingBottom: 24 }} />
            <span style={{ position: 'absolute', bottom: 6, right: 12, fontSize: '0.72rem', color: '#94a3b8' }}>{descLen}/150</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>This appears on your customer form to help them pick the right service.</div>
        </div>

        {/* Photo upload toggle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ ...label, marginBottom: 0 }}>Should customers send you photos?</label>
            <button type="button" onClick={() => onUpdate({ photoUploadEnabled: !service.photoUploadEnabled, photoUploadPrompt: service.photoUploadEnabled ? null : service.photoUploadPrompt })}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                background: service.photoUploadEnabled ? '#0e0020' : '#d1d5db', transition: 'background 0.2s',
              }}>
              <span style={{
                position: 'absolute', top: 2, left: service.photoUploadEnabled ? 22 : 2, width: 20, height: 20,
                borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
          {service.photoUploadEnabled && (
            <div style={{ marginTop: 10 }}>
              <label style={{ ...label, fontSize: '0.82rem' }}>What should they photograph?</label>
              <input type="text" value={service.photoUploadPrompt ?? ''} onChange={(e) => onUpdate({ photoUploadPrompt: e.target.value || null })}
                placeholder="e.g. The rooms to be cleaned, the lawn from the street" style={input} />
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Customers can upload up to 5 photos. Accepted: jpg, png, heic. Max 10MB each.</div>
            </div>
          )}
        </div>

        {/* Remove */}
        {canRemove && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            {isRemoving ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Remove {service.name || 'this service'}?</span>
                <button type="button" onClick={onRemoveCancel} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>Cancel</button>
                <button type="button" onClick={onRemoveConfirm} style={{ background: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', color: 'white', fontWeight: 600, fontFamily: 'inherit' }}>Remove</button>
              </div>
            ) : (
              <button type="button" onClick={onRemoveClick} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Remove this service
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
