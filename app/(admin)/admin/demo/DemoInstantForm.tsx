'use client'

import { useState } from 'react'

const SERVICES = [
  { id: 'driveway', label: 'Driveway & Walkway', base: 150 },
  { id: 'house', label: 'House Wash (Full Exterior)', base: 320 },
  { id: 'deck', label: 'Deck / Fence Restoration', base: 240 },
  { id: 'roof', label: 'Roof Soft Wash', base: 450 },
]

const ADDONS = [
  { id: 'gutters', label: 'Gutter Brightening', price: 60 },
  { id: 'sealing', label: 'Concrete Sealing', price: 120 },
  { id: 'windows', label: 'Exterior Window Wash', price: 45 },
]

export default function DemoInstantForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [service, setService] = useState<string | null>(null)
  const [sqft, setSqft] = useState(1500)
  const [addons, setAddons] = useState<string[]>([])
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)

  const svc = SERVICES.find((s) => s.id === service)
  const sizeMultiplier = Math.max(1, sqft / 1500)
  const addonTotal = addons.reduce((sum, id) => sum + (ADDONS.find((a) => a.id === id)?.price ?? 0), 0)
  const total = svc ? Math.round(svc.base * sizeMultiplier + addonTotal) : 0

  function toggleAddon(id: string) {
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const steps = ['Service', 'Property Size', 'Add-ons', 'Your Info']
  const canNext = [!!service, sqft > 0, true, contact.name && contact.email][step]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ background: '#ffe500', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>
                {submitted ? 'Quote Sent' : `Step ${step + 1} of ${steps.length}`}
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#5b5bd6' }}>
                Instant Pressure Wash Quote
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'rgba(0,0,0,0.4)' }}>✕</button>
          </div>
          {!submitted && (
            <div style={{ height: 4, background: 'rgba(0,0,0,0.12)', borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((step + 1) / steps.length) * 100}%`, background: 'rgba(0,0,0,0.4)', transition: 'width 0.3s' }} />
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 22px', minHeight: 260 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Thanks, {contact.name.split(' ')[0] || 'there'}!</div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 18 }}>Your instant quote has been sent to {contact.email || 'your email'}.</div>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', display: 'inline-block' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated Total</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>${total}</div>
              </div>
            </div>
          ) : step === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>What do you need cleaned?</div>
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setService(s.id)}
                  style={{
                    textAlign: 'left', padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    border: service === s.id ? '2px solid #5b5bd6' : '1.5px solid #e2e8f0',
                    background: service === s.id ? '#f5f3ff' : 'white',
                    fontSize: '0.88rem', fontWeight: 600, color: '#1e293b',
                  }}
                >
                  {s.label} <span style={{ float: 'right', color: '#94a3b8', fontWeight: 500 }}>from ${s.base}</span>
                </button>
              ))}
            </div>
          ) : step === 1 ? (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 14 }}>Approximate size (sq ft)</div>
              <input
                type="range" min={500} max={5000} step={100} value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#5b5bd6', marginTop: 10 }}>{sqft.toLocaleString()} sq ft</div>
            </div>
          ) : step === 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Any add-ons?</div>
              {ADDONS.map((a) => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addons.includes(a.id)} onChange={() => toggleAddon(a.id)} />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', flex: 1 }}>{a.label}</span>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>+${a.price}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Where should we send your quote?</div>
              <input placeholder="Full name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.86rem' }} />
              <input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.86rem' }} />
              <input placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.86rem' }} />
              {total > 0 && (
                <div style={{ marginTop: 6, background: '#f8fafc', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Estimated Total</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>${total}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{ padding: '0 22px 22px', display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} style={{ padding: '11px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Back
              </button>
            )}
            <button
              onClick={() => (step < steps.length - 1 ? setStep(step + 1) : setSubmitted(true))}
              disabled={!canNext}
              style={{
                flex: 1, padding: '11px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: canNext ? 'pointer' : 'not-allowed',
                background: '#5b5bd6', color: 'white', opacity: canNext ? 1 : 0.5,
              }}
            >
              {step < steps.length - 1 ? 'Next →' : 'Get My Quote →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
