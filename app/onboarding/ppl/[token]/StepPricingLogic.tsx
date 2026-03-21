'use client'

import { useState } from 'react'
import type { OnboardingStep3Data } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 8 }
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}
const subLabel: React.CSSProperties = { fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 10 }}>
      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
          background: on ? '#1a1a2e' : '#d1d5db', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

interface Props {
  data?: OnboardingStep3Data
  onNext: (data: OnboardingStep3Data) => void
  onBack: () => void
  saving: boolean
}

export default function StepPricingLogic({ data, onNext, onBack, saving }: Props) {
  const [form, setForm] = useState<OnboardingStep3Data>({
    perSqft: data?.perSqft ?? false,
    sqftRate: data?.sqftRate,
    sqftMethod: data?.sqftMethod ?? 'enter_number',
    travelCharges: data?.travelCharges ?? false,
    travelType: data?.travelType ?? 'mileage',
    ratePerMile: data?.ratePerMile,
    ratePerMinute: data?.ratePerMinute,
    baseLocation: data?.baseLocation ?? '',
    byQuantity: data?.byQuantity ?? false,
    quantityLabel: data?.quantityLabel ?? '',
    ratePerUnit: data?.ratePerUnit,
    minimumJobPrice: data?.minimumJobPrice,
  })

  function update(partial: Partial<OnboardingStep3Data>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function handleSubmit() {
    onNext(form)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.55 }}>
        Toggle on any pricing methods that apply to your business. Only fill in the sections relevant to you.
      </p>

      {/* Per Sqft */}
      <div>
        <Toggle on={form.perSqft} onChange={(v) => update({ perSqft: v })} label="Charge per square foot?" />
        {form.perSqft && (
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Rate per sq ft ($)</label>
              <input type="number" step="0.01" value={form.sqftRate ?? ''} onChange={(e) => update({ sqftRate: parseFloat(e.target.value) || undefined })} style={{ ...inputStyle, width: 140 }} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>How do customers provide the area?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['enter_number', 'Enter a number'], ['draw_on_map', 'Draw on a map']] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => update({ sqftMethod: val })}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', border: form.sqftMethod === val ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0', background: form.sqftMethod === val ? '#f8fafc' : 'white', color: '#334155', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Travel Charges */}
      <div>
        <Toggle on={form.travelCharges} onChange={(v) => update({ travelCharges: v })} label="Charge for travel?" />
        {form.travelCharges && (
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Charge by</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['mileage', 'drivetime', 'both'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => update({ travelType: type })}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', border: form.travelType === type ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0', background: form.travelType === type ? '#f8fafc' : 'white', color: '#334155', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                    {type === 'both' ? 'Both' : type === 'mileage' ? 'Mileage' : 'Drive time'}
                  </button>
                ))}
              </div>
            </div>
            {(form.travelType === 'mileage' || form.travelType === 'both') && (
              <div>
                <label style={labelStyle}>Rate per mile ($)</label>
                <input type="number" step="0.01" value={form.ratePerMile ?? ''} onChange={(e) => update({ ratePerMile: parseFloat(e.target.value) || undefined })} style={{ ...inputStyle, width: 140 }} placeholder="0.00" />
              </div>
            )}
            {(form.travelType === 'drivetime' || form.travelType === 'both') && (
              <div>
                <label style={labelStyle}>Rate per hour ($)</label>
                <input type="number" step="0.01" value={form.ratePerMinute != null ? form.ratePerMinute * 60 : ''} onChange={(e) => update({ ratePerMinute: (parseFloat(e.target.value) || 0) / 60 })} style={{ ...inputStyle, width: 140 }} placeholder="0.00" />
                <div style={subLabel}>We&apos;ll convert this to per-minute for the form</div>
              </div>
            )}
            <div>
              <label style={labelStyle}>Base location (your shop/office address)</label>
              <input type="text" value={form.baseLocation ?? ''} onChange={(e) => update({ baseLocation: e.target.value })} style={inputStyle} placeholder="123 Main St, City, State" />
            </div>
          </div>
        )}
      </div>

      {/* By Quantity */}
      <div>
        <Toggle on={form.byQuantity} onChange={(v) => update({ byQuantity: v })} label="Charge by quantity?" />
        {form.byQuantity && (
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>What are you counting?</label>
              <input type="text" value={form.quantityLabel ?? ''} onChange={(e) => update({ quantityLabel: e.target.value })} style={inputStyle} placeholder='e.g. "windows", "rooms", "units"' />
            </div>
            <div>
              <label style={labelStyle}>Rate per unit ($)</label>
              <input type="number" step="0.01" value={form.ratePerUnit ?? ''} onChange={(e) => update({ ratePerUnit: parseFloat(e.target.value) || undefined })} style={{ ...inputStyle, width: 140 }} placeholder="0.00" />
            </div>
          </div>
        )}
      </div>

      {/* Minimum Job Price */}
      <div>
        <label style={labelStyle}>Minimum job price <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
        <input type="number" step="0.01" value={form.minimumJobPrice ?? ''} onChange={(e) => update({ minimumJobPrice: parseFloat(e.target.value) || undefined })} style={{ ...inputStyle, width: 160 }} placeholder="0.00" />
        <div style={subLabel}>If set, quotes below this amount will show this as the minimum</div>
      </div>

      <button style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleSubmit}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
      <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }} onClick={onBack}>
        ← Back
      </button>
    </div>
  )
}
