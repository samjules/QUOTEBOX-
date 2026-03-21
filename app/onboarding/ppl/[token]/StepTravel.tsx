'use client'

import { useState } from 'react'
import type { PPLTravel } from '@/lib/types'

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }
const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1a1a2e',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

interface Props {
  travel: PPLTravel
  minimumJobPrice: number | null
  onNext: (travel: PPLTravel, minimumJobPrice: number | null) => void
  onBack: () => void
  saving: boolean
}

export default function StepTravel({ travel: initTravel, minimumJobPrice: initMin, onNext, onBack, saving }: Props) {
  const [travel, setTravel] = useState<PPLTravel>(initTravel)
  const [minPrice, setMinPrice] = useState<number | null>(initMin)
  const [hasMin, setHasMin] = useState(initMin != null && initMin > 0)

  function uTravel(p: Partial<PPLTravel>) { setTravel((t) => ({ ...t, ...p })) }

  // Dynamic example
  function travelExample(): string | null {
    if (!travel.chargesForTravel || !travel.travelMethod || !travel.travelRate) return null
    if (travel.travelMethod === 'drivetime') {
      return `e.g. A 30-minute drive would add $${(travel.travelRate * 0.5).toFixed(2)} to the quote`
    }
    return `e.g. A 25-mile trip would add $${(travel.travelRate * 25).toFixed(2)} to the quote`
  }

  function submit() {
    onNext(travel, hasMin ? minPrice : null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Travel & Minimums</h2>

      {/* Travel */}
      <div>
        <label style={label}>Do you charge extra when you travel to a job?</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          {([false, true] as const).map((val) => (
            <button key={String(val)} type="button" onClick={() => uTravel({ chargesForTravel: val, travelMethod: val ? travel.travelMethod : null, travelRate: val ? travel.travelRate : null })}
              style={{
                padding: '14px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                border: travel.chargesForTravel === val ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                background: travel.chargesForTravel === val ? '#fafaf8' : 'white',
              }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{val ? 'Yes' : 'No'}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{val ? 'I charge for travel' : 'Travel is included'}</div>
            </button>
          ))}
        </div>
      </div>

      {travel.chargesForTravel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>
          <div>
            <label style={label}>Where do you travel from?</label>
            <input type="text" value={travel.travelFrom ?? ''} onChange={(e) => uTravel({ travelFrom: e.target.value, travelFromResolved: e.target.value })}
              placeholder="City or address" style={input} />
            {travel.travelFromResolved && travel.travelFrom && (
              <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: 4 }}>
                ✓ {travel.travelFromResolved}
              </div>
            )}
          </div>

          <div>
            <label style={label}>How do you charge for travel?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([['drivetime', 'By drive time', 'e.g. $150/hr drive time'], ['mileage', 'By mileage', 'e.g. $1.50 per mile']] as const).map(([id, lbl, sub]) => (
                <button key={id} type="button" onClick={() => uTravel({ travelMethod: id as PPLTravel['travelMethod'], travelRate: null })}
                  style={{
                    padding: '14px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    border: travel.travelMethod === id ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                    background: travel.travelMethod === id ? '#fafaf8' : 'white',
                  }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 2 }}>{lbl}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {travel.travelMethod && (
            <div>
              <label style={label}>{travel.travelMethod === 'drivetime' ? 'Rate per hour ($)' : 'Rate per mile ($)'}</label>
              <div style={{ position: 'relative', width: 160 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                <input type="number" step="0.01" placeholder={travel.travelMethod === 'drivetime' ? 'e.g. 150' : 'e.g. 1.50'}
                  value={travel.travelRate ?? ''} onChange={(e) => uTravel({ travelRate: parseFloat(e.target.value) || null })}
                  style={{ ...input, width: 160, paddingLeft: 26 }} />
              </div>
              {travelExample() && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                  {travelExample()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Minimum */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
        <label style={label}>Is there a minimum amount you charge for any job?</label>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 10, lineHeight: 1.5 }}>
          If a quote comes out lower than this, customers will see this as the minimum instead.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([false, true] as const).map((val) => (
            <button key={String(val)} type="button" onClick={() => { setHasMin(val); if (!val) setMinPrice(null) }}
              style={{
                padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                border: hasMin === val ? '2px solid #1a1a2e' : '1.5px solid #e5e4e0',
                background: hasMin === val ? '#fafaf8' : 'white',
                fontSize: '0.85rem', fontWeight: 600, color: '#334155',
              }}>
              {val ? 'Yes, set a minimum' : 'No minimum'}
            </button>
          ))}
        </div>
        {hasMin && (
          <div style={{ marginTop: 10, position: 'relative', width: 160 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
            <input type="number" placeholder="e.g. 150" value={minPrice ?? ''} onChange={(e) => setMinPrice(parseFloat(e.target.value) || null)}
              style={{ ...input, width: 160, paddingLeft: 26 }} />
          </div>
        )}
      </div>

      <button onClick={submit} disabled={saving} style={{ ...btn, opacity: saving ? 0.5 : 1 }}>
        {saving ? 'Saving…' : 'Continue →'}
      </button>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
        ← Back
      </button>
    </div>
  )
}
