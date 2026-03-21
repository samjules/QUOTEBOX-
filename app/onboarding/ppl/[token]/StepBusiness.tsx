'use client'

import { useState } from 'react'
import type { PPLBusiness } from '@/lib/types'

const TRADES = ['Plumbing', 'HVAC', 'Roofing', 'Lawn Care', 'Moving', 'Cleaning', 'Electrical', 'Painting', 'Pest Control', 'Other']

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: 8 }
const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

interface Props {
  data: PPLBusiness
  onNext: (data: PPLBusiness) => void
  saving: boolean
}

export default function StepBusiness({ data, onNext, saving }: Props) {
  const [form, setForm] = useState<PPLBusiness>(data)
  const [zipInput, setZipInput] = useState('')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  function u(partial: Partial<PPLBusiness>) { setForm((f) => ({ ...f, ...partial })); setErrors({}) }
  function uArea(partial: Partial<PPLBusiness['serviceArea']>) { setForm((f) => ({ ...f, serviceArea: { ...f.serviceArea, ...partial } })); setErrors({}) }

  function addZip() {
    const z = zipInput.trim()
    if (!z || form.serviceArea.zipCodes.includes(z)) return
    uArea({ zipCodes: [...form.serviceArea.zipCodes, z] })
    setZipInput('')
  }

  function submit() {
    const e: Record<string, boolean> = {}
    if (!form.name.trim()) e.name = true
    if (!form.trade) e.trade = true
    if (form.serviceArea.type === 'radius' && !form.serviceArea.location.trim()) e.location = true
    if (form.serviceArea.type === 'zipcodes' && form.serviceArea.zipCodes.length === 0) e.zips = true
    if (Object.keys(e).length) { setErrors(e); return }
    onNext(form)
  }

  const canSubmit = form.name.trim() && form.trade && (
    form.serviceArea.type === 'radius' ? form.serviceArea.location.trim() : form.serviceArea.zipCodes.length > 0
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Your Business</h2>

      {/* Business name */}
      <div>
        <label style={label}>What&apos;s your business called? *</label>
        <input type="text" value={form.name} onChange={(e) => u({ name: e.target.value })} placeholder="e.g. Tampa Bay Movers" style={{ ...input, borderColor: errors.name ? '#ef4444' : '#e5e4e0' }} />
        {errors.name && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Business name is required</div>}
      </div>

      {/* Trade type */}
      <div>
        <label style={label}>What kind of work do you do? *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {TRADES.map((t) => (
            <button key={t} type="button" onClick={() => u({ trade: t, tradeOther: t === 'Other' ? form.tradeOther : null })}
              style={{
                padding: '11px 8px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                border: form.trade === t ? '2px solid #1a1a2e' : errors.trade ? '1.5px solid #fca5a5' : '1.5px solid #e5e4e0',
                background: form.trade === t ? '#1a1a2e' : 'white',
                color: form.trade === t ? '#ffe500' : '#334155',
              }}>
              {t}
            </button>
          ))}
        </div>
        {form.trade === 'Other' && (
          <input type="text" value={form.tradeOther ?? ''} onChange={(e) => u({ tradeOther: e.target.value })} placeholder="Describe your trade" style={{ ...input, marginTop: 10 }} />
        )}
        {errors.trade && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Please select your trade</div>}
      </div>

      {/* Service area */}
      <div>
        <label style={label}>Where do you work? *</label>
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e5e4e0', marginBottom: 12 }}>
          {(['radius', 'zipcodes'] as const).map((t) => (
            <button key={t} type="button" onClick={() => uArea({ type: t })}
              style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '0.82rem', fontWeight: 600,
                background: form.serviceArea.type === t ? '#1a1a2e' : 'white',
                color: form.serviceArea.type === t ? '#ffe500' : '#64748b',
              }}>
              {t === 'radius' ? 'Radius from address' : 'Specific zip codes'}
            </button>
          ))}
        </div>

        {form.serviceArea.type === 'radius' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <input type="text" placeholder="City or address" value={form.serviceArea.location} onChange={(e) => uArea({ location: e.target.value, locationResolved: e.target.value })}
                style={{ ...input, borderColor: errors.location ? '#ef4444' : '#e5e4e0' }} />
              {form.serviceArea.locationResolved && form.serviceArea.location && (
                <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✓ {form.serviceArea.locationResolved}
                  <button type="button" onClick={() => uArea({ location: '', locationResolved: '' })} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Change</button>
                </div>
              )}
              {errors.location && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Location is required</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={form.serviceArea.radiusMiles ?? 25} onChange={(e) => uArea({ radiusMiles: parseInt(e.target.value) || 0 })} style={{ ...input, width: 80, textAlign: 'center' }} />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>miles</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="text" placeholder="Type a zip code and press Enter" value={zipInput} onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addZip() } }}
                style={{ ...input, flex: 1, borderColor: errors.zips ? '#ef4444' : '#e5e4e0' }} />
              <button type="button" onClick={addZip} style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #e5e4e0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#334155', fontFamily: 'inherit' }}>Add</button>
            </div>
            {form.serviceArea.zipCodes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                {form.serviceArea.zipCodes.map((z) => (
                  <span key={z} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 99, background: '#f1f5f9', fontSize: '0.82rem', color: '#334155', fontWeight: 500 }}>
                    {z}
                    <button type="button" onClick={() => uArea({ zipCodes: form.serviceArea.zipCodes.filter((x) => x !== z) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: 0, lineHeight: 1 }}>&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{form.serviceArea.zipCodes.length} zip code{form.serviceArea.zipCodes.length !== 1 ? 's' : ''} added</div>
            {errors.zips && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Add at least one zip code</div>}
          </div>
        )}
      </div>

      <button onClick={submit} disabled={saving || !canSubmit}
        style={{ ...btn, opacity: saving || !canSubmit ? 0.5 : 1, cursor: saving || !canSubmit ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
    </div>
  )
}
