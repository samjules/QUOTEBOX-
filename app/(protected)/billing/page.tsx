'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Built from NEXT_PUBLIC_SUPABASE_URL rather than dedicated per-function env vars —
// those (NEXT_PUBLIC_PORTAL_FUNCTION_URL etc.) were never actually set, which made
// "Manage Subscription" 404 against this app's own routes instead of Supabase.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const VERIFY_SESSION_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/verify-subscription-session`
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Current public pricing (quote-box.com/pricing): $99/mo software, $350 one-time ad
// setup, $750/mo fully managed. Legacy plans are label-only here — existing accounts
// on them keep working, just with no price asserted that could go stale, and no path
// to newly subscribe to them.
const PLAN_INFO: Record<string, { label: string; detail: string }> = {
  trial: { label: 'Trial', detail: 'Legacy trial plan' },
  starter: { label: 'Software', detail: '$99/month · Full platform access' },
  growth: { label: 'Growth', detail: 'Full platform access · Unlimited leads' },
  fully_managed: { label: 'Fully Managed', detail: '$750/month · Full platform access · Unlimited leads' },
  pay_per_lead: { label: 'Retainer', detail: '$15 per booked lead' },
  pro: { label: 'Pro', detail: 'Full platform access · Unlimited leads' },
}

const NEW_PLANS = [
  {
    id: 'software_99',
    label: 'Software',
    price: '$99',
    cadence: '/month',
    detail: 'Everything you need to run instant quotes, CRM, and follow-up.',
    features: ['Branded instant quote form', 'Unlimited leads', 'Instant SMS + email follow-up', 'Full CRM & lead pipeline', 'iOS app access'],
    cta: 'Get Started — $99/mo',
  },
  {
    id: 'ad_setup_350',
    label: 'Paid Ad Campaign Setup',
    price: '$350',
    cadence: 'one-time',
    detail: 'We build and launch your Meta/Google paid ad campaign.',
    features: ['Campaign targeting & budget setup', 'Ad creative built for your brand', 'Conversion tracking wired into your CRM'],
    cta: 'Get Started — $350',
  },
  {
    id: 'fully_managed_750',
    label: 'Fully Managed',
    price: '$750',
    cadence: '/month',
    detail: 'Software plus done-for-you ad management and lead follow-up.',
    features: ['Everything in Software', 'Done-for-you ad management', 'Ongoing CRM & pipeline upkeep'],
    cta: 'Get Started — $750/mo',
  },
] as const

export default function BillingPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [accountId, setAccountId] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [blessed, setBlessed] = useState(false)
  const [totalLeads, setTotalLeads] = useState(0)
  const [monthlyLeads, setMonthlyLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  const loadBillingData = useCallback(
    async (accId: string) => {
      let { data: billing, error: billingError } = await supabase
        .from('billing')
        .select('*')
        .eq('account_id', accId)
        .single()

      if (billingError?.code === 'PGRST116') {
        const { data: newBilling } = await supabase
          .from('billing')
          .insert([{ account_id: accId, credit_balance: 0, total_spent: 0 }])
          .select()
          .single()
        billing = newBilling
      }

      setPlan(billing?.plan ?? null)
      setBlessed(billing?.blessed === true)
      setStripeCustomerId(billing?.stripe_customer_id ?? null)
      setTrialEndsAt(billing?.trial_ends_at ?? null)

      const { data: leads } = await supabase
        .from('leads')
        .select('created_at')
        .eq('account_id', accId)

      const allLeads = leads ?? []
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      setTotalLeads(allLeads.length)
      setMonthlyLeads(
        allLeads.filter(
          (l: { created_at: string }) => new Date(l.created_at) >= startOfMonth
        ).length
      )

      setLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (!account) return

      setAccountId(account.id)
      await loadBillingData(account.id)
    }
    init()
  }, [supabase, loadBillingData])

  useEffect(() => {
    if (searchParams.get('canceled')) {
      alert('Payment canceled. No charges were made.')
      window.history.replaceState({}, document.title, '/billing')
    }
    if (searchParams.get('subscription') === 'success' && accountId) {
      const sessionId = searchParams.get('session_id')
      window.history.replaceState({}, document.title, '/billing')

      const run = async () => {
        if (sessionId && VERIFY_SESSION_FUNCTION_URL) {
          try {
            await fetch(VERIFY_SESSION_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ sessionId, accountId }),
            })
          } catch (_) {}
        }
        await loadBillingData(accountId)
      }
      run()
    }
  }, [searchParams, accountId, loadBillingData])

  async function subscribe(planId: string) {
    setSubscribing(true)
    try {
      const response = await fetch('/api/build/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, plan: planId }),
      })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error(data.error ?? `HTTP error! status: ${response.status}`)
      window.location.href = data.url
    } catch (err) {
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setSubscribing(false)
    }
  }

  async function openPortal() {
    setOpeningPortal(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const { url, error } = await response.json()
      if (!response.ok || error) throw new Error(error ?? `HTTP error! status: ${response.status}`)
      window.location.href = url
    } catch (err) {
      alert(`Could not open billing portal: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setOpeningPortal(false)
    }
  }

  const isActive = blessed || plan !== null

  return (
    <div className="py-6" style={{ background: '#f4f4f6', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your subscription and billing history</p>
        </div>

        {/* Active plan / blessed banner */}
        {isActive && (
          <div
            className="rounded-2xl p-6 flex items-center justify-between mb-6"
            style={{
              background: blessed
                ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                : 'linear-gradient(135deg, #5b5bd6 0%, #4c4cbf 100%)',
            }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-white/70">
                {blessed ? 'Account Status' : 'Current Plan'}
              </p>
              <p className="text-xl font-bold text-white">
                {blessed ? 'Blessed Account — Free Access' : (PLAN_INFO[plan ?? '']?.label ?? plan)}
              </p>
              <p className="text-sm mt-1 text-white/70">
                {blessed
                  ? 'Full platform access granted by admin'
                  : (PLAN_INFO[plan ?? '']?.detail ?? 'Active subscription')}
              </p>
              {trialEndsAt && new Date(trialEndsAt) > new Date() && (
                <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                  Free trial —{' '}
                  {Math.ceil(
                    (new Date(trialEndsAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days remaining
                </span>
              )}
            </div>
            {!blessed && stripeCustomerId && (
              <button
                onClick={openPortal}
                disabled={openingPortal}
                className="ml-6 flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/20 hover:bg-white/30 text-white transition disabled:opacity-60"
              >
                {openingPortal ? 'Opening…' : 'Manage Subscription'}
              </button>
            )}
          </div>
        )}

        {/* Plan picker — shown when not yet subscribed. */}
        {!isActive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {NEW_PLANS.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-6 flex flex-col"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
              >
                <span
                  className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-4 self-start"
                  style={{ background: 'rgba(91,91,214,0.1)', color: '#5b5bd6' }}
                >
                  {p.label.toUpperCase()}
                </span>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{p.price}</span>
                  <span className="text-gray-400 mb-1">{p.cadence}</span>
                </div>
                <p className="text-gray-500 text-sm mb-5">{p.detail}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#5b5bd6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribe(p.id)}
                  disabled={subscribing}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #5b5bd6 0%, #4c4cbf 100%)' }}
                >
                  {subscribing ? 'Redirecting…' : p.cta}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Total Leads', value: totalLeads, icon: '📊', color: 'rgba(91,91,214,0.1)' },
              { label: 'This Month', value: monthlyLeads, icon: '📈', color: 'rgba(245,158,11,0.1)' },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-6 flex items-center"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
              >
                <div
                  className="flex-shrink-0 rounded-xl p-3 mr-4 text-2xl"
                  style={{ background: color }}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}


        {loading && (
          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
            </div>
            <p className="mt-2 text-sm text-gray-400">Loading…</p>
          </div>
        )}
      </div>
    </div>
  )
}
