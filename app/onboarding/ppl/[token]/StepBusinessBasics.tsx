'use client'

import { useState } from 'react'
import type { OnboardingStep1Data } from '@/lib/types'

// 3x4 grid — added "General Contractor" to avoid orphaned "Other" (UX #15)
const TRADES = ['Plumbing', 'HVAC', 'Roofing', 'Lawn Care', 'Moving', 'Cleaning', 'Electrical', 'Painting', 'Pest Control', 'General Contractor', 'Fencing', 'Other']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 8 }
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

interface Props {
  data?: OnboardingStep1Data
  businessName: string
  onNext: (data: OnboardingStep1Data) => void
  saving: boolean
}

export default function StepBusinessBasics({ data, businessName, onNext, saving }: Props) {
  const [form, setForm] = useState<OnboardingStep1Data>({
    businessName: data?.businessName ?? businessName,
    tradeType: data?.tradeType ?? '',
    serviceAreaType: data?.serviceAreaType ?? 'radius',
    serviceAreaRadius: data?.serviceAreaRadius ?? 25,
    serviceAreaAddress: data?.serviceAreaAddress ?? '',
    serviceAreaZipCodes: data?.serviceAreaZipCodes ?? [],
    businessDescription: data?.businessDescription ?? '',
  })
  const [zipInput, setZipInput] = useState('')
  const [error, setError] = useState('')

  function update(partial: Partial<OnboardingStep1Data>) {
    setForm((prev) => ({ ...prev, ...partial }))
    setError('')
  }

  function addZip() {
    const zip = zipInput.trim()
    if (!zip) return
    if (form.serviceAreaZipCodes?.includes(zip)) return
    update({ serviceAreaZipCodes: [...(form.serviceAreaZipCodes ?? []), zip] })
    setZipInput('')
  }

  function removeZip(zip: string) {
    update({ serviceAreaZipCodes: (form.serviceAreaZipCodes ?? []).filter((z) => z !== zip) })
  }

  function handleSubmit() {
    if (!form.businessName.trim()) { setError('Business name is required'); return }
    if (!form.tradeType) { setError('Please select your trade'); return }
    if (!form.businessDescription.trim()) { setError('Please describe your business'); return }
    onNext(form)
  }

  const charCount = form.businessDescription.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Business Name */}
      <div>
        <label style={labelStyle}>Business Name *</label>
        <input type="text" value={form.businessName} onChange={(e) => update({ businessName: e.target.value })} style={inputStyle} />
      </div>

      {/* Trade Type — 4-column grid (UX #15) */}
      <div>
        <label style={labelStyle}>Trade Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {TRADES.map((trade) => (
            <button
              key={trade}
              type="button"
              onClick={() => update({ tradeType: trade })}
              style={{
                padding: '10px 8px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
                border: form.tradeType === trade ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                background: form.tradeType === trade ? '#1a1a2e' : 'white',
                color: form.tradeType === trade ? '#ffe500' : '#334155',
                fontFamily: 'inherit',
              }}
            >
              {trade}
            </button>
          ))}
        </div>
      </div>

      {/* Service Area */}
      <div>
        <label style={labelStyle}>Service Area *</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['radius', 'zip_codes'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update({ serviceAreaType: type })}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                border: form.serviceAreaType === type ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                background: form.serviceAreaType === type ? '#f8fafc' : 'white',
                color: '#334155', fontFamily: 'inherit',
              }}
            >
              {type === 'radius' ? 'Radius from address' : 'Specific zip codes'}
            </button>
          ))}
        </div>

        {form.serviceAreaType === 'radius' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Base address"
              value={form.serviceAreaAddress ?? ''}
              onChange={(e) => update({ serviceAreaAddress: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                value={form.serviceAreaRadius ?? 25}
                onChange={(e) => update({ serviceAreaRadius: parseInt(e.target.value) || 0 })}
                style={{ ...inputStyle, width: 70, textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>mi</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Enter zip code"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addZip() } }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addZip} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e4e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#334155', fontFamily: 'inherit' }}>
                Add
              </button>
            </div>
            {(form.serviceAreaZipCodes?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.serviceAreaZipCodes!.map((zip) => (
                  <span key={zip} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#f1f5f9', fontSize: '0.82rem', color: '#334155', fontWeight: 500 }}>
                    {zip}
                    <button type="button" onClick={() => removeZip(zip)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: 0, lineHeight: 1 }}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Business Description with placeholder + char counter (UX #10) */}
      <div>
        <label style={labelStyle}>Business Description *</label>
        <div style={{ position: 'relative' }}>
          <textarea
            value={form.businessDescription}
            onChange={(e) => update({ businessDescription: e.target.value })}
            placeholder="e.g. We specialize in residential moves within 50 miles of Tampa — full service including packing, loading, and delivery."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55, minHeight: 90, paddingBottom: 28 }}
          />
          <div style={{
            position: 'absolute', bottom: 8, right: 14,
            fontSize: '0.72rem', fontWeight: 500,
            color: charCount > 0 && charCount < 50 ? '#ea580c' : '#94a3b8',
          }}>
            {charCount}/300
          </div>
        </div>
        {charCount > 0 && charCount < 50 && (
          <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: 4 }}>
            A bit more detail helps us build a better form — aim for at least 50 characters.
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 500 }}>{error}</div>}

      <button style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleSubmit}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
    </div>
  )
}
