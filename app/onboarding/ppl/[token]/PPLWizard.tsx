'use client'

import { useState, useCallback } from 'react'
import type { OnboardingStepData } from '@/lib/types'
import StepBusinessBasics from './StepBusinessBasics'
import StepServicesPricing from './StepServicesPricing'
import StepPricingLogic from './StepPricingLogic'
import StepLeadPreferences from './StepLeadPreferences'
import StepReview from './StepReview'

const TOTAL_STEPS = 5
const STEP_LABELS = ['Basics', 'Services', 'Pricing', 'Leads', 'Review']

interface Props {
  token: string
  initialStep: number
  initialData: OnboardingStepData
  businessName: string
  isCompleted: boolean
}

export default function PPLWizard({ token, initialStep, initialData, businessName, isCompleted }: Props) {
  const [step, setStep] = useState(isCompleted ? 5 : Math.min(initialStep, 5))
  const [data, setData] = useState<OnboardingStepData>(initialData)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(isCompleted)
  // Track highest completed step for enabling backwards nav on step pills
  const [highestStep, setHighestStep] = useState(isCompleted ? 5 : Math.max(initialStep - 1, 0))

  const saveStep = useCallback(async (stepNum: number, stepData: object, submit = false) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNum, data: stepData, submit }),
      })
      if (!res.ok) throw new Error('Save failed')
      setData((prev) => ({ ...prev, [stepNum]: stepData } as OnboardingStepData))
      if (submit) setSubmitted(true)
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [token])

  const handleNext = useCallback(async (stepNum: number, stepData: object) => {
    const ok = await saveStep(stepNum, stepData)
    if (ok) {
      setHighestStep((h) => Math.max(h, stepNum))
      setStep(stepNum + 1)
    }
  }, [saveStep])

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    const ok = await saveStep(5, {}, true)
    if (ok) setStep(6)
  }, [saveStep])

  const handleEditStep = useCallback((s: number) => {
    setStep(s)
  }, [])

  // Success / confirmation screen (UX #9)
  if (submitted && step >= 5) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: 480, background: 'white', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
          <div style={{ background: '#ffe500', padding: '28px 32px 24px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>Thank you!</div>
          </div>
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '1.6rem', color: '#16a34a' }}>✓</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Onboarding Complete</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16 }}>
              Your quote form is being built. You&apos;ll receive a link to preview and approve it within 1–2 business days.
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, textAlign: 'left' }}>
              <strong style={{ color: '#475569' }}>What happens next:</strong>
              <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                <li>Our team reviews your answers and builds a custom quote form</li>
                <li>You&apos;ll get a preview link to test and approve</li>
                <li>Once approved, we publish it and you start receiving leads</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const progressPct = (step / TOTAL_STEPS) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 600, background: 'white', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#ffe500', padding: '28px 32px 24px' }}>
          {/* Named step pills (UX #1) */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1
              const isActive = stepNum === step
              const isCompleted = stepNum <= highestStep
              const isClickable = isCompleted && !isActive
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => isClickable && setStep(stepNum)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: isClickable ? 'pointer' : 'default',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    letterSpacing: '0.02em',
                    background: isActive ? '#1a1a2e' : isCompleted ? 'rgba(26,26,46,0.15)' : 'rgba(26,26,46,0.06)',
                    color: isActive ? '#ffe500' : isCompleted ? 'rgba(26,26,46,0.7)' : 'rgba(26,26,46,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: 'rgba(26,26,46,0.12)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#1a1a2e', borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.35s ease' }} />
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2, marginBottom: 4 }}>
            {STEP_LABELS[step - 1]}
          </div>

          {/* Time estimate on step 1 (UX #13) */}
          {step === 1 && (
            <>
              {businessName && (
                <div style={{ fontSize: '0.88rem', color: 'rgba(26,26,46,0.6)', lineHeight: 1.55 }}>
                  Let&apos;s get the basics for {businessName}.
                </div>
              )}
              <div style={{ fontSize: '0.82rem', color: 'rgba(26,26,46,0.4)', marginTop: 4 }}>
                Takes about 5 minutes.
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px' }}>
          {step === 1 && (
            <StepBusinessBasics
              data={data[1]}
              businessName={businessName}
              onNext={(d) => handleNext(1, d)}
              saving={saving}
            />
          )}
          {step === 2 && (
            <StepServicesPricing
              data={data[2]}
              onNext={(d) => handleNext(2, d)}
              onBack={handleBack}
              saving={saving}
            />
          )}
          {step === 3 && (
            <StepPricingLogic
              data={data[3]}
              onNext={(d) => handleNext(3, d)}
              onBack={handleBack}
              saving={saving}
            />
          )}
          {step === 4 && (
            <StepLeadPreferences
              data={data[4]}
              services={data[2]?.services ?? []}
              onNext={(d) => handleNext(4, d)}
              onBack={handleBack}
              saving={saving}
            />
          )}
          {step === 5 && (
            <StepReview
              data={data}
              onSubmit={handleSubmit}
              onEdit={handleEditStep}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  )
}
