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

interface Props {
  data?: OnboardingStep2Data
  onNext: (data: OnboardingStep2Data) => void
  onBack: () => void
  saving: boolean
}

export default function StepServicesPricing({ data, onNext, onBack, saving }: Props) {
  const [hasPackages, setHasPackages] = useState(data?.hasPackages ?? false)
  const [services, setServices] = useState<ServiceItem[]>(data?.services ?? [{ id: uid(), name: '', price: 0, priceType: 'flat' }])
  const [displayPreference, setDisplayPreference] = useState<'radio' | 'dropdown'>(data?.displayPreference ?? 'radio')
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
      displayPreference,
      addOns: addOns.filter((a) => a.name.trim()),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Packages toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>Do you offer distinct packages or tiers?</span>
        <button
          type="button"
          onClick={() => setHasPackages(!hasPackages)}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
            background: hasPackages ? '#1a1a2e' : '#d1d5db', transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: hasPackages ? 22 : 2, width: 20, height: 20,
            borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Services list */}
      <div>
        <label style={labelStyle}>Your Services *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map((service, i) => (
            <div key={service.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <input
                type="text"
                placeholder={`Service ${i + 1} name`}
                value={service.name}
                onChange={(e) => updateService(service.id, { name: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                type="number"
                placeholder="Price"
                value={service.price || ''}
                onChange={(e) => updateService(service.id, { price: parseFloat(e.target.value) || 0 })}
                style={{ ...inputStyle, width: 90 }}
              />
              <select
                value={service.priceType}
                onChange={(e) => updateService(service.id, { priceType: e.target.value as 'flat' | 'starting_at' })}
                style={{ ...inputStyle, width: 120 }}
              >
                <option value="flat">Flat rate</option>
                <option value="starting_at">Starting at</option>
              </select>
              {services.length > 1 && (
                <button type="button" onClick={() => removeService(service.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', padding: '8px 4px' }}>
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addService} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #e5e4e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#64748b', fontFamily: 'inherit' }}>
          + Add Service
        </button>
      </div>

      {/* Display preference */}
      <div>
        <label style={labelStyle}>How should services display on the form?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['radio', 'dropdown'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDisplayPreference(type)}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                border: displayPreference === type ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                background: displayPreference === type ? '#f8fafc' : 'white',
                color: '#334155', fontFamily: 'inherit',
              }}
            >
              {type === 'radio' ? 'Radio buttons' : 'Dropdown'}
            </button>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <label style={labelStyle}>
          Optional Add-ons
          <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>(customers can check these off)</span>
        </label>
        {addOns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {addOns.map((addon, i) => (
              <div key={addon.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={`Add-on ${i + 1}`}
                  value={addon.name}
                  onChange={(e) => updateAddOn(addon.id, { name: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={addon.price || ''}
                  onChange={(e) => updateAddOn(addon.id, { price: parseFloat(e.target.value) || 0 })}
                  style={{ ...inputStyle, width: 90 }}
                />
                <button type="button" onClick={() => removeAddOn(addon.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', padding: '8px 4px' }}>
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addAddOn} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #e5e4e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#64748b', fontFamily: 'inherit' }}>
          + Add Add-on
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
