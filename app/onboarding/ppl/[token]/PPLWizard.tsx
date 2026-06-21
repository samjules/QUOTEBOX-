'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { PPLBusiness, PPLService, PPLTravel, PPLAvailability } from '@/lib/types'
import StepBusiness from './StepBusiness'
import StepServices from './StepServices'
import StepTravel from './StepTravel'
import StepAvailability from './StepAvailability'
import StepMeta from './StepMeta'
import StepReview from './StepReview'

const STEP_LABELS = ['Business', 'Services', 'Travel', 'Availability', 'Meta', 'Review']
const LS_KEY_PREFIX = 'ppl_onboarding_'

interface FormState {
  business: PPLBusiness
  services: PPLService[]
  travel: PPLTravel
  minimumJobPrice: number | null
  availability: PPLAvailability
  metaConnected: boolean
  metaSkipped: boolean
}

const DEFAULT_HOURS: PPLAvailability['hours'] = {
  mon: { open: true, from: '08:00', to: '17:00' },
  tue: { open: true, from: '08:00', to: '17:00' },
  wed: { open: true, from: '08:00', to: '17:00' },
  thu: { open: true, from: '08:00', to: '17:00' },
  fri: { open: true, from: '08:00', to: '17:00' },
  sat: { open: false, from: '08:00', to: '17:00' },
  sun: { open: false, from: '08:00', to: '17:00' },
}

function defaultState(): FormState {
  return {
    business: { name: '', trade: '', tradeOther: null, serviceArea: { type: 'radius', location: '', locationResolved: '', radiusMiles: 25, zipCodes: [] } },
    services: [{ id: crypto.randomUUID(), name: '', pricingMethod: null, pricingRate: null, pricingUnit: null, description: null, photoUploadEnabled: false, photoUploadPrompt: null }],
    travel: { chargesForTravel: false, travelFrom: null, travelFromResolved: null, travelMethod: null, travelRate: null },
    minimumJobPrice: null,
    availability: { hours: DEFAULT_HOURS, maxLeadsPerDay: null, maxLeadsPerWeek: null, customerNote: null },
    metaConnected: false,
    metaSkipped: false,
  }
}

interface Props {
  token: string
  initialStep: number
  initialData: Record<string, unknown>
  businessName: string
  isCompleted: boolean
}

export default function PPLWizard({ token, initialStep, initialData, businessName, isCompleted }: Props) {
  // Hydrate from server data or localStorage
  function hydrateState(): FormState {
    const def = defaultState()
    if (businessName) def.business.name = businessName

    // Try localStorage first
    try {
      const saved = localStorage.getItem(LS_KEY_PREFIX + token)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...def, ...parsed }
      }
    } catch { /* ignore */ }

    // Fall back to server data
    const s1 = initialData['1'] as PPLBusiness | undefined
    const s2 = initialData['2'] as { services: PPLService[] } | undefined
    const s3 = initialData['3'] as { travel: PPLTravel; minimumJobPrice: number | null } | undefined
    const s4 = initialData['4'] as PPLAvailability | undefined
    const s5 = initialData['5'] as { metaConnected: boolean; metaSkipped?: boolean } | undefined

    if (s1) def.business = { ...def.business, ...s1 }
    if (s2?.services) def.services = s2.services
    if (s3) { def.travel = s3.travel; def.minimumJobPrice = s3.minimumJobPrice }
    if (s4) def.availability = s4
    if (s5) { def.metaConnected = s5.metaConnected; def.metaSkipped = s5.metaSkipped ?? false }

    return def
  }

  const searchParams = useSearchParams()
  const metaReturnConnected = searchParams.get('meta') === 'connected'

  const [step, setStep] = useState(() => {
    if (isCompleted) return 7
    if (metaReturnConnected) return 5 // return to Meta step after OAuth
    return initialStep <= 1 ? 0 : Math.min(initialStep, 6)
  })
  const [form, setForm] = useState<FormState>(() => {
    const s = hydrateState()
    if (metaReturnConnected) s.metaConnected = true
    return s
  })
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(isCompleted)
  const [highestStep, setHighestStep] = useState(isCompleted ? 6 : Math.max(initialStep - 1, 0))

  // Save to localStorage whenever form changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_PREFIX + token, JSON.stringify(form))
    } catch { /* ignore */ }
  }, [form, token])

  const saveToServer = useCallback(async (stepNum: number, stepData: object, submit = false) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNum, data: stepData, submit }),
      })
      if (!res.ok) throw new Error('Save failed')
      if (submit) {
        setSubmitted(true)
        try { localStorage.removeItem(LS_KEY_PREFIX + token) } catch { /* ignore */ }
      }
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [token])

  const goToStep = useCallback((s: number) => {
    setStep(s)
    window.scrollTo(0, 0)
  }, [])

  // Step 0 → Step 1
  const handleStart = useCallback(() => goToStep(1), [goToStep])

  // Step handlers
  const handleBusinessNext = useCallback(async (data: PPLBusiness) => {
    setForm((f) => ({ ...f, business: data }))
    const ok = await saveToServer(1, data)
    if (ok) { setHighestStep((h) => Math.max(h, 1)); goToStep(2) }
  }, [saveToServer, goToStep])

  const handleServicesNext = useCallback(async (services: PPLService[]) => {
    setForm((f) => ({ ...f, services }))
    const ok = await saveToServer(2, { services })
    if (ok) { setHighestStep((h) => Math.max(h, 2)); goToStep(3) }
  }, [saveToServer, goToStep])

  const handleTravelNext = useCallback(async (travel: PPLTravel, minimumJobPrice: number | null) => {
    setForm((f) => ({ ...f, travel, minimumJobPrice }))
    const ok = await saveToServer(3, { travel, minimumJobPrice })
    if (ok) { setHighestStep((h) => Math.max(h, 3)); goToStep(4) }
  }, [saveToServer, goToStep])

  const handleAvailabilityNext = useCallback(async (availability: PPLAvailability) => {
    setForm((f) => ({ ...f, availability }))
    const ok = await saveToServer(4, availability)
    if (ok) { setHighestStep((h) => Math.max(h, 4)); goToStep(5) }
  }, [saveToServer, goToStep])

  const handleMetaNext = useCallback(async () => {
    const data = { metaConnected: form.metaConnected, metaSkipped: form.metaSkipped }
    const ok = await saveToServer(5, data)
    if (ok) { setHighestStep((h) => Math.max(h, 5)); goToStep(6) }
  }, [form.metaConnected, form.metaSkipped, saveToServer, goToStep])

  const handleMetaSkip = useCallback(async () => {
    setForm((f) => ({ ...f, metaConnected: false, metaSkipped: true }))
    const ok = await saveToServer(5, { metaConnected: false, metaSkipped: true })
    if (ok) { setHighestStep((h) => Math.max(h, 5)); goToStep(6) }
  }, [saveToServer, goToStep])

  const handleSubmit = useCallback(async () => {
    await saveToServer(6, {}, true)
  }, [saveToServer])

  // Post-submit confirmation
  if (submitted) {
    return (
      <Shell>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.8rem', color: '#16a34a' }}>✓</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>You&apos;re all set.</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
            Your quote form is being built. We&apos;ll send you a preview link within 1–2 business days.
          </p>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '18px 20px', textAlign: 'left', fontSize: '0.85rem', color: '#475569', lineHeight: 1.7 }}>
            <strong style={{ color: '#1e293b' }}>What to expect:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>You&apos;ll get a link to review and test your form</li>
              <li>Once approved, we&apos;ll give you an embed code or shareable link</li>
              <li>Your customers can start getting instant quotes right away</li>
            </ul>
          </div>
        </div>
      </Shell>
    )
  }

  // Step 0 — Welcome
  if (step === 0) {
    return (
      <Shell hideProgress>
        <div style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0e0020', lineHeight: 1.25, marginBottom: 8 }}>
            Let&apos;s build your quote form.
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
            Answer a few questions about how your business works, and we&apos;ll build a custom quote form your customers can fill out to get an instant price.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {[
              ['Your business and service area', 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
              ['Your services and how you price each one', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01'],
              ['Whether you charge for travel', 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
              ['Your availability', 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
            ].map(([label, path]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="#64748b" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                </div>
                <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Time warning */}
          <div style={{ background: '#fef9c3', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 28 }}>
            <svg width="20" height="20" fill="none" stroke="#92400e" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.55, fontWeight: 500 }}>
              This takes about 20 minutes. We recommend doing it when you have some quiet time — the pricing details matter.
            </div>
          </div>

          <button onClick={handleStart} style={{ width: '100%', padding: '16px', borderRadius: 10, border: 'none', background: '#0e0020', color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
            Let&apos;s get started →
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
            Your progress saves automatically. You can finish later if needed.
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {/* Step pills */}
      <div style={{ padding: '20px 32px 0' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEP_LABELS.map((label, i) => {
            const sn = i + 1
            const active = sn === step
            const completed = sn <= highestStep
            const clickable = completed && !active
            return (
              <button
                key={label}
                type="button"
                onClick={() => clickable && goToStep(sn)}
                style={{
                  flex: 1, padding: '8px 2px', borderRadius: 8, border: 'none',
                  cursor: clickable ? 'pointer' : 'default',
                  fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.02em',
                  background: active ? '#0e0020' : completed ? 'rgba(26,26,46,0.15)' : 'rgba(26,26,46,0.06)',
                  color: active ? '#ffe500' : completed ? 'rgba(26,26,46,0.7)' : 'rgba(26,26,46,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(26,26,46,0.12)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#0e0020', borderRadius: 2, width: `${(step / 6) * 100}%`, transition: 'width 0.35s ease' }} />
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>
        {step === 1 && <StepBusiness data={form.business} onNext={handleBusinessNext} saving={saving} />}
        {step === 2 && <StepServices data={form.services} onNext={handleServicesNext} onBack={() => goToStep(1)} saving={saving} />}
        {step === 3 && <StepTravel travel={form.travel} minimumJobPrice={form.minimumJobPrice} onNext={handleTravelNext} onBack={() => goToStep(2)} saving={saving} />}
        {step === 4 && <StepAvailability data={form.availability} onNext={handleAvailabilityNext} onBack={() => goToStep(3)} saving={saving} />}
        {step === 5 && <StepMeta token={token} metaConnected={form.metaConnected} onNext={handleMetaNext} onSkip={handleMetaSkip} onBack={() => goToStep(4)} saving={saving} />}
        {step === 6 && <StepReview form={form} onSubmit={handleSubmit} onEdit={goToStep} saving={saving} />}
      </div>
    </Shell>
  )
}

function Shell({ children, hideProgress }: { children: React.ReactNode; hideProgress?: boolean }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 600, background: 'white', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
        {!hideProgress && (
          <div style={{ background: '#ffe500', height: 6 }} />
        )}
        {children}
      </div>
    </div>
  )
}
