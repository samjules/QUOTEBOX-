'use client'

import { useState } from 'react'
import type { OnboardingStep2Data, ServiceItem, AddOnItem } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 8 }
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

function uid() { return Math.random().toString(36).slice(2, 10) }

// Tooltip component (UX #5)
function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        style={{ cursor: 'help', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, userSelect: 'none' }}
      >
        (?)
      </span>
      {show && (
        <span style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: 'white', padding: '8px 12px', borderRadius: 8,
          fontSize: '0.78rem', lineHeight: 1.5, whiteSpace: 'normal', width: 240,
          marginBottom: 6, zIndex: 10, fontWeight: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

interface Props {
  data?: OnboardingStep2Data
  onNext: (data: OnboardingStep2Data) => void
  onBack: () => void
  saving: boolean
}

export default function StepServicesPricing({ data, onNext, onBack, saving }: Props) {
  const [hasPackages, setHasPackages] = useState(data?.hasPackages ?? false)
  const [services, setServices] = useState<ServiceItem[]>(data?.services ?? [{ id: uid(), name: '', price: 0, priceType: 'flat' }])
  const [addOns, setAddOns] = useState<AddOnItem[]>(data?.addOns ?? [])
  const [error, setError] = useState('')

  function updateService(id: string, partial: Partial<ServiceItem>) {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, ...partial } : s))
    setError('')
  }

  function addService() {
    setServices((prev) => [...prev, { id: uid(), name: '', price: 0, priceType: 'flat' }])
  }

  function removeService(id: string) {
    if (services.length <= 1) return
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  function addAddOn() {
    setAddOns((prev) => [...prev, { id: uid(), name: '', price: 0 }])
  }

  function updateAddOn(id: string, partial: Partial<AddOnItem>) {
    setAddOns((prev) => prev.map((a) => a.id === id ? { ...a, ...partial } : a))
  }

  function removeAddOn(id: string) {
    setAddOns((prev) => prev.filter((a) => a.id !== id))
  }

  function handleSubmit() {
    const validServices = services.filter((s) => s.name.trim())
    if (validServices.length === 0) { setError('Add at least one service'); return }
    onNext({
      hasPackages,
      services: validServices,
      displayPreference: 'dropdown',
      addOns: addOns.filter((a) => a.name.trim()),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Packages toggle — rewritten label (UX #6) */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
              Do you offer preset bundles with different price points?
            </span>
            <Tip text="Turn this on if customers choose between set packages like 'Basic move' vs 'Full-service move' at different prices." />
          </div>
          <button
            type="button"
            onClick={() => setHasPackages(!hasPackages)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, marginLeft: 12,
              background: hasPackages ? '#1a1a2e' : '#d1d5db', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: hasPackages ? 22 : 2, width: 20, height: 20,
              borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
          e.g. Basic move / Full-service move / White glove
        </div>
      </div>

      {/* Services list — vertical card layout (UX #2) */}
      <div>
        <label style={labelStyle}>Your Services *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map((service, i) => (
            <div key={service.id} style={{ background: '#f8fafc', borderRadius: 12, padding: '16px' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Service name</div>
                <input
                  type="text"
                  placeholder={`e.g. ${i === 0 ? '16ft trailer' : i === 1 ? 'Full-service move' : `Service ${i + 1}`}`}
                  value={service.name}
                  onChange={(e) => updateService(service.id, { name: e.target.value })}
                  style={{ ...inputStyle, background: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Price ($)</div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', color: '#94a3b8', pointerEvents: 'none' }}>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={service.price || ''}
                      onChange={(e) => updateService(service.id, { price: parseFloat(e.target.value) || 0 })}
                      style={{ ...inputStyle, width: 120, paddingLeft: 26, background: 'white' }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Pricing type</div>
                  <select
                    value={service.priceType}
                    onChange={(e) => updateService(service.id, { priceType: e.target.value as 'flat' | 'starting_at' })}
                    style={{ ...inputStyle, background: 'white' }}
                  >
                    <option value="flat">Flat rate</option>
                    <option value="starting_at">Starting at</option>
                  </select>
                </div>
                {services.length > 1 && (
                  <button type="button" onClick={() => removeService(service.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.78rem', padding: '10px 4px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addService} style={{ marginTop: 8, padding: '10px 18px', borderRadius: 8, border: '1.5px dashed #e5e4e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#64748b', fontFamily: 'inherit', width: '100%' }}>
          + Add another service
        </button>
      </div>

      {/* Optional extras — renamed from "Add-ons" (UX #16) */}
      <div>
        <label style={labelStyle}>
          Optional extras
          <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>· customers can add these to their quote</span>
        </label>
        {addOns.length === 0 && (
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8 }}>
            e.g. Packing service, piano moving, furniture disassembly
          </div>
        )}
        {addOns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {addOns.map((addon, i) => (
              <div key={addon.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={i === 0 ? 'e.g. Packing service' : `Extra ${i + 1}`}
                  value={addon.name}
                  onChange={(e) => updateAddOn(addon.id, { name: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <div style={{ position: 'relative', flex: '0 0 auto' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', color: '#94a3b8', pointerEvents: 'none' }}>$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={addon.price || ''}
                    onChange={(e) => updateAddOn(addon.id, { price: parseFloat(e.target.value) || 0 })}
                    style={{ ...inputStyle, width: 100, paddingLeft: 26 }}
                  />
                </div>
                <button type="button" onClick={() => removeAddOn(addon.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.78rem', padding: '4px', fontFamily: 'inherit' }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addAddOn} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #e5e4e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#64748b', fontFamily: 'inherit' }}>
          + Add an extra
        </button>
      </div>

      {error && <div style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 500 }}>{error}</div>}

      <button style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleSubmit}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
      <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }} onClick={onBack}>
        ← Back
      </button>
    </div>
  )
}
