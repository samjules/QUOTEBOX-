'use client'

import { useState } from 'react'
import type { OnboardingStep4Data, ServiceItem } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 8 }
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DEFAULT_HOURS: Record<string, { enabled: boolean; start: string; end: string }> = Object.fromEntries(
  DAYS.map((d, i) => [d, { enabled: i < 5, start: '08:00', end: '17:00' }])
)

interface Props {
  data?: OnboardingStep4Data
  services: ServiceItem[]
  onNext: (data: OnboardingStep4Data) => void
  onBack: () => void
  saving: boolean
}

export default function StepLeadPreferences({ data, services, onNext, onBack, saving }: Props) {
  const [form, setForm] = useState<OnboardingStep4Data>({
    maxLeadsPerDay: data?.maxLeadsPerDay,
    maxLeadsPerWeek: data?.maxLeadsPerWeek,
    monthlyBudgetCap: data?.monthlyBudgetCap,
    preferredLeadTypes: data?.preferredLeadTypes ?? services.map((s) => s.name),
    businessHours: data?.businessHours ?? DEFAULT_HOURS,
    additionalNotes: data?.additionalNotes ?? '',
  })

  function update(partial: Partial<OnboardingStep4Data>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function toggleLeadType(name: string) {
    setForm((prev) => {
      const types = prev.preferredLeadTypes.includes(name)
        ? prev.preferredLeadTypes.filter((t) => t !== name)
        : [...prev.preferredLeadTypes, name]
      return { ...prev, preferredLeadTypes: types }
    })
  }

  function updateHours(day: string, partial: Partial<{ enabled: boolean; start: string; end: string }>) {
    setForm((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], ...partial },
      },
    }))
  }

  function handleSubmit() {
    onNext(form)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Lead limits */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max leads/day <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opt.)</span></label>
          <input type="number" value={form.maxLeadsPerDay ?? ''} onChange={(e) => update({ maxLeadsPerDay: parseInt(e.target.value) || undefined })} style={inputStyle} placeholder="No limit" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max leads/week <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opt.)</span></label>
          <input type="number" value={form.maxLeadsPerWeek ?? ''} onChange={(e) => update({ maxLeadsPerWeek: parseInt(e.target.value) || undefined })} style={inputStyle} placeholder="No limit" />
        </div>
      </div>

      {/* Monthly budget */}
      <div>
        <label style={labelStyle}>Monthly budget cap ($) <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
        <input type="number" value={form.monthlyBudgetCap ?? ''} onChange={(e) => update({ monthlyBudgetCap: parseFloat(e.target.value) || undefined })} style={{ ...inputStyle, width: 180 }} placeholder="No limit" />
      </div>

      {/* Preferred lead types */}
      {services.length > 0 && (
        <div>
          <label style={labelStyle}>Which services do you want leads for?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {services.map((s) => {
              const checked = form.preferredLeadTypes.includes(s.name)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleLeadType(s.name)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
                    border: checked ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                    background: checked ? '#1a1a2e' : 'white',
                    color: checked ? '#ffe500' : '#334155',
                    fontFamily: 'inherit',
                  }}
                >
                  {checked ? '✓ ' : ''}{s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Business hours */}
      <div>
        <label style={labelStyle}>Business Hours</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DAYS.map((day) => {
            const h = form.businessHours[day] ?? { enabled: false, start: '08:00', end: '17:00' }
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <button
                  type="button"
                  onClick={() => updateHours(day, { enabled: !h.enabled })}
                  style={{
                    width: 20, height: 20, borderRadius: 4, border: h.enabled ? 'none' : '1.5px solid #d1d5db',
                    background: h.enabled ? '#1a1a2e' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {h.enabled ? '✓' : ''}
                </button>
                <span style={{ width: 80, fontSize: '0.85rem', fontWeight: 500, color: h.enabled ? '#334155' : '#94a3b8' }}>{day.slice(0, 3)}</span>
                {h.enabled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="time" value={h.start} onChange={(e) => updateHours(day, { start: e.target.value })}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e5e4e0', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>to</span>
                    <input type="time" value={h.end} onChange={(e) => updateHours(day, { end: e.target.value })}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e5e4e0', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Closed</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label style={labelStyle}>Additional Notes <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
        <textarea
          value={form.additionalNotes ?? ''}
          onChange={(e) => update({ additionalNotes: e.target.value })}
          placeholder="Anything else we should know when building your form?"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55, minHeight: 70 }}
        />
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
