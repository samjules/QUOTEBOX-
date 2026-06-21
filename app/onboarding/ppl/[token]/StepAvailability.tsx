'use client'

import { useState } from 'react'
import type { PPLAvailability } from '@/lib/types'

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0e0020', background: 'white',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }
const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#0e0020',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

const DAYS: Array<[string, string]> = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']]

interface Props {
  data: PPLAvailability
  onNext: (data: PPLAvailability) => void
  onBack: () => void
  saving: boolean
}

export default function StepAvailability({ data, onNext, onBack, saving }: Props) {
  const [form, setForm] = useState<PPLAvailability>(data)

  function updateHour(day: string, p: Partial<PPLAvailability['hours'][string]>) {
    setForm((f) => ({ ...f, hours: { ...f.hours, [day]: { ...f.hours[day], ...p } } }))
  }

  function u(p: Partial<PPLAvailability>) { setForm((f) => ({ ...f, ...p })) }

  const noteLen = form.customerNote?.length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0e0020', margin: '0 0 6px' }}>Availability</h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
          When are you open for new jobs? This controls when your quote form accepts requests.
        </p>
      </div>

      {/* Business hours */}
      <div>
        <label style={label}>Business Hours</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DAYS.map(([key, name]) => {
            const h = form.hours[key]
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <button type="button" onClick={() => updateHour(key, { open: !h.open })}
                  style={{
                    width: 22, height: 22, borderRadius: 5, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: h.open ? 'none' : '1.5px solid #d1d5db',
                    background: h.open ? '#0e0020' : 'white', color: 'white', fontSize: '0.72rem', fontWeight: 700,
                  }}>
                  {h.open ? '✓' : ''}
                </button>
                <span style={{ width: 55, fontSize: '0.85rem', fontWeight: 500, color: h.open ? '#334155' : '#94a3b8' }}>{name.slice(0, 3)}</span>
                {h.open ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="time" value={h.from} onChange={(e) => updateHour(key, { from: e.target.value })}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e5e4e0', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>to</span>
                    <input type="time" value={h.to} onChange={(e) => updateHour(key, { to: e.target.value })}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e5e4e0', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#c4c4c4' }}>Closed</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lead limits */}
      <div>
        <label style={label}>How many new quote requests do you want per day?</label>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 10, lineHeight: 1.5 }}>
          A &quot;lead&quot; is one customer filling out your quote form. Setting a cap means you won&apos;t wake up to 50 requests you can&apos;t handle.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...label, fontSize: '0.78rem' }}>Max per day <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opt.)</span></label>
            <input type="number" value={form.maxLeadsPerDay ?? ''} onChange={(e) => u({ maxLeadsPerDay: parseInt(e.target.value) || null })} placeholder="No limit" style={input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...label, fontSize: '0.78rem' }}>Max per week <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opt.)</span></label>
            <input type="number" value={form.maxLeadsPerWeek ?? ''} onChange={(e) => u({ maxLeadsPerWeek: parseInt(e.target.value) || null })} placeholder="No limit" style={input} />
          </div>
        </div>
        {!form.maxLeadsPerDay && !form.maxLeadsPerWeek && (
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>No cap set — you&apos;ll receive all requests.</div>
        )}
      </div>

      {/* Customer note */}
      <div>
        <label style={label}>Anything customers should know before requesting a quote? <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
        <div style={{ position: 'relative' }}>
          <textarea value={form.customerNote ?? ''} onChange={(e) => { if (e.target.value.length <= 300) u({ customerNote: e.target.value || null }) }}
            placeholder="e.g. We require a 20% deposit on jobs over $500. We don't service buildings above 3 floors. 48-hour notice required."
            rows={3} style={{ ...input, resize: 'vertical', lineHeight: 1.55, minHeight: 70, paddingBottom: 24 }} />
          <span style={{ position: 'absolute', bottom: 6, right: 12, fontSize: '0.72rem', color: '#94a3b8' }}>{noteLen}/300</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>This text appears at the top of your customer form as a note.</div>
      </div>

      <button onClick={() => onNext(form)} disabled={saving} style={{ ...btn, opacity: saving ? 0.5 : 1 }}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
        ← Back
      </button>
    </div>
  )
}
