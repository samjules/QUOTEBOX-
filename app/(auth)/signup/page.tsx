'use client'

import { useState, useEffect, KeyboardEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Step IDs ─────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5
type Plan = 'starter' | 'growth' | 'managed'
type LeadsPerWeek = 5 | 10 | 15 | 20 | null
type ServiceChoice = 'self' | 'managed' | null

// ── Progress bar labels ───────────────────────────────────────────────────────
const STEP_LABELS: Record<Step, string> = {
  1: 'Account',
  2: 'Leads',
  3: 'Service',
  4: 'Meta',
  5: 'Plan',
}

const LEADS_OPTIONS: { value: 5 | 10 | 15 | 20; label: string }[] = [
  { value: 5, label: '5 leads/week' },
  { value: 10, label: '10 leads/week' },
  { value: 15, label: '15 leads/week' },
  { value: 20, label: '20+ leads/week' },
]

const COST_PER_LEAD = 30

// ── Plan definitions ──────────────────────────────────────────────────────────
const PLANS: Record<
  Plan,
  {
    name: string
    price: string
    badge?: string
    features: string[]
    cta: string
    href: string
    dark?: boolean
  }
> = {
  starter: {
    name: 'Starter',
    price: '$20/mo',
    badge: '7-day free trial',
    features: ['1 quote form', '10 leads/month', '1 VSL video'],
    cta: 'Start free trial →',
    href: '/billing',
  },
  growth: {
    name: 'Growth',
    price: '$30/mo',
    features: ['3 quote forms', '50 leads/month', 'Priority support'],
    cta: 'Start with Growth →',
    href: '/billing',
  },
  managed: {
    name: 'Fully Managed',
    price: '$15/lead',
    features: ['Guaranteed leads', 'Dedicated account manager', 'Full ad management'],
    cta: 'Book a call →',
    href: 'mailto:sales@quote-box.com',
    dark: true,
  },
}

// ── Left panel ────────────────────────────────────────────────────────────────
function LeftPanel() {
  const bullets = [
    'Capture leads with beautiful quote forms',
    'Run Meta Ads without the complexity',
    'Know exactly what every lead costs',
  ]
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 flex-col justify-center px-12 py-16 text-white">
      <div className="max-w-sm">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">QuoteBox</h1>
        <p className="text-lg text-indigo-200 mb-10">
          Turn clicks into customers, automatically.
        </p>
        <ul className="space-y-4">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              </span>
              <span className="text-indigo-100 text-sm leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current }: { current: Step }) {
  const steps: Step[] = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                s < current
                  ? 'bg-indigo-600 text-white'
                  : s === current
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {s < current ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              ) : (
                s
              )}
            </div>
            <span
              className={`mt-1 text-xs font-medium whitespace-nowrap ${
                s <= current ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-4 transition-colors duration-300 ${
                s < current ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function SignupWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── State ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)
  const [visible, setVisible] = useState(true)

  // Step 1: Account
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step1Error, setStep1Error] = useState('')
  const [step1Loading, setStep1Loading] = useState(false)

  // Step 2: Leads per week
  const [leadsPerWeek, setLeadsPerWeek] = useState<LeadsPerWeek>(null)

  // Step 3: Self vs Managed
  const [serviceChoice, setServiceChoice] = useState<ServiceChoice>(null)

  // Step 4: Meta
  const [metaConnected, setMetaConnected] = useState(false)
  const [metaFlash, setMetaFlash] = useState(false)

  // Step 5: Plan
  const [plan, setPlan] = useState<Plan>('starter')

  // ── Read query params on mount ────────────────────────────────────────────
  useEffect(() => {
    const metaParam = searchParams.get('meta')
    const stepParam = searchParams.get('step')

    if (metaParam === 'connected') {
      setMetaConnected(true)
      setMetaFlash(true)

      if (stepParam === '4') {
        setStep(4)
        const timer = setTimeout(() => {
          setMetaFlash(false)
          animateTo(5)
        }, 1400)
        return () => clearTimeout(timer)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Smooth step transition ────────────────────────────────────────────────
  function animateTo(next: Step) {
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 220)
  }

  // ── Step 1 handler ────────────────────────────────────────────────────────
  async function handleStep1() {
    setStep1Error('')

    if (!businessName.trim()) {
      setStep1Error('Business name is required')
      return
    }
    if (!email.trim()) {
      setStep1Error('Email is required')
      return
    }
    if (password.length < 6) {
      setStep1Error('Password must be at least 6 characters')
      return
    }

    setStep1Loading(true)

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setStep1Error(authError.message)
      setStep1Loading(false)
      return
    }

    if (!authData.user) {
      setStep1Error('No user data returned. Please try again.')
      setStep1Loading(false)
      return
    }

    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert([{ business_name: businessName.trim(), owner_id: authData.user.id }])
      .select('id')
      .single()

    if (accountError || !newAccount) {
      setStep1Error(accountError?.message ?? 'Failed to create account')
      setStep1Loading(false)
      return
    }

    // Create the billing row immediately so webhook updates always find it
    await supabase
      .from('billing')
      .insert([{ account_id: newAccount.id, credit_balance: 0, total_spent: 0 }])

    setStep1Loading(false)
    animateTo(2)
  }

  function handleStep1KeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleStep1()
  }

  // ── Step 2: Select leads per week ─────────────────────────────────────────
  function handleLeadsSelect(count: 5 | 10 | 15 | 20) {
    setLeadsPerWeek(count)
    setTimeout(() => animateTo(3), 300)
  }

  // ── Step 3: Self vs Managed ───────────────────────────────────────────────
  function handleServiceSelect(choice: ServiceChoice) {
    setServiceChoice(choice)
    if (choice === 'managed') {
      setPlan('managed')
    } else {
      // For self-serve, recommend based on lead volume
      const weeklyLeads = leadsPerWeek ?? 5
      setPlan(weeklyLeads >= 15 ? 'growth' : 'starter')
    }
    setTimeout(() => animateTo(4), 350)
  }

  // Computed managed estimate
  const managedWeeklyEstimate = (leadsPerWeek ?? 5) * COST_PER_LEAD
  const managedMonthlyEstimate = managedWeeklyEstimate * 4

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <LeftPanel />

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white lg:px-16">
        <div className="w-full max-w-md">
          {/* Progress bar */}
          <ProgressBar current={step} />

          {/* Step content with slide transition */}
          <div
            className="transition-all duration-200"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            {/* ── STEP 1: Account Setup ────────────────────────────────── */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Already have an account?{' '}
                  <Link href="/login" className="text-indigo-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="business-name"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onKeyDown={handleStep1KeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Acme Roofing Co."
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleStep1KeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleStep1KeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Minimum 6 characters"
                    />
                    <p className="mt-1 text-xs text-gray-400">Must be at least 6 characters</p>
                  </div>

                  {step1Error && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                      <p className="text-sm text-red-700">{step1Error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleStep1}
                    disabled={step1Loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {step1Loading ? 'Creating account…' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: How many leads per week? ─────────────────────── */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  How many leads do you want per week?
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  This helps us recommend the right plan and estimate your costs.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {LEADS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleLeadsSelect(opt.value)}
                      className={`relative p-5 rounded-xl border-2 transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50 text-center ${
                        leadsPerWeek === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-2xl font-extrabold text-indigo-600 mb-1">
                        {opt.value === 20 ? '20+' : opt.value}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">leads / week</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 3: DIY or Fully Managed ────────────────────────── */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  How do you want to get leads?
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Run your own ads or let us handle everything for guaranteed results.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Card A: Self-serve */}
                  <button
                    onClick={() => handleServiceSelect('self')}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50 ${
                      serviceChoice === 'self'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-3">💻</div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      I&apos;ll do it myself
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      I&apos;ll run my own ads and manage my leads
                    </p>
                  </button>

                  {/* Card B: Managed */}
                  <button
                    onClick={() => handleServiceSelect('managed')}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50 relative overflow-hidden ${
                      serviceChoice === 'managed'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="absolute top-2 right-2 text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                    <div className="text-3xl mb-3">✨</div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Guaranteed results
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      We handle everything — you just close the deals
                    </p>
                  </button>
                </div>

                {/* Managed estimate */}
                {serviceChoice === 'managed' && leadsPerWeek && (
                  <div className="mt-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">Your estimated investment</p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-extrabold text-indigo-600">
                        ${managedWeeklyEstimate}
                      </span>
                      <span className="text-sm text-gray-500">/ week</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {leadsPerWeek === 20 ? '20+' : leadsPerWeek} leads x ${COST_PER_LEAD}/lead = ~${managedMonthlyEstimate.toLocaleString()}/mo
                    </p>
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                      </svg>
                      Only pay for leads delivered
                    </div>
                  </div>
                )}

                {/* Back button */}
                <div className="mt-4">
                  <button
                    onClick={() => animateTo(2)}
                    className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    ← Change lead volume
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Connect Meta ─────────────────────────────────── */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Connect your Facebook Business account
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  We&apos;ll use this to run lead ads on your behalf. You can do this later too.
                </p>

                {metaFlash && (
                  <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                    </svg>
                    <p className="text-sm text-green-700 font-medium">Connected! Taking you to the next step…</p>
                  </div>
                )}

                {!metaFlash && (
                  <div className="space-y-4">
                    <a
                      href="/api/meta/connect?from=signup"
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                      </svg>
                      Connect Meta →
                    </a>

                    <div className="text-center">
                      <button
                        onClick={() => animateTo(5)}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Skip for now →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: Plan ─────────────────────────────────────────── */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Your recommended plan</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Based on your answers, here&apos;s the best fit for you.
                </p>

                {(() => {
                  const p = PLANS[plan]
                  // For managed, override price with their personalized estimate
                  const displayPrice = plan === 'managed' && leadsPerWeek
                    ? `~$${managedMonthlyEstimate.toLocaleString()}/mo`
                    : p.price
                  const displayFeatures = plan === 'managed' && leadsPerWeek
                    ? [
                        `${leadsPerWeek === 20 ? '20+' : leadsPerWeek} guaranteed leads/week`,
                        'Dedicated account manager',
                        'Full ad management',
                      ]
                    : p.features

                  return (
                    <div
                      className={`rounded-2xl p-6 border-2 ${
                        p.dark
                          ? 'bg-gray-900 border-gray-700 text-white'
                          : 'bg-white border-indigo-500 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`text-xl font-bold ${p.dark ? 'text-white' : 'text-gray-900'}`}>
                          {p.name}
                        </h3>
                        {p.badge && (
                          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>

                      <p className={`text-3xl font-extrabold mb-4 ${p.dark ? 'text-white' : 'text-indigo-600'}`}>
                        {displayPrice}
                      </p>

                      <ul className="space-y-2 mb-6">
                        {displayFeatures.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <svg
                              className={`w-4 h-4 flex-shrink-0 ${p.dark ? 'text-indigo-400' : 'text-indigo-500'}`}
                              fill="none"
                              viewBox="0 0 16 16"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3 3 7-7" />
                            </svg>
                            <span className={p.dark ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={p.href}
                        className={`block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold transition-colors ${
                          p.dark
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {p.cta}
                      </a>
                    </div>
                  )
                })()}

                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    Go to dashboard instead →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupWizard />
    </Suspense>
  )
}
