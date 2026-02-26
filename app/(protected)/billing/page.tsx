'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BillingTransaction } from '@/lib/types'

const COST_PER_LEAD = 15
const CHECKOUT_FUNCTION_URL = process.env.NEXT_PUBLIC_CHECKOUT_FUNCTION_URL!
const SUBSCRIPTION_FUNCTION_URL = process.env.NEXT_PUBLIC_SUBSCRIPTION_FUNCTION_URL!
const PORTAL_FUNCTION_URL = process.env.NEXT_PUBLIC_PORTAL_FUNCTION_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface CreditPackage {
  credits: number
  amount: number // cents
  label: string
  perLead: string
  savings?: string
  featured?: boolean
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 5, amount: 7500, label: '5 Leads', perLead: '$15.00 per lead' },
  {
    credits: 10,
    amount: 13500,
    label: '10 Leads',
    perLead: '$13.50 per lead',
    savings: 'Save 10%',
  },
  {
    credits: 25,
    amount: 30000,
    label: '25 Leads',
    perLead: '$12.00 per lead',
    savings: 'Save 20%',
  },
  {
    credits: 50,
    amount: 52500,
    label: '50 Leads',
    perLead: '$10.50 per lead',
    savings: 'Save 30%',
    featured: true,
  },
]

export default function BillingPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [accountId, setAccountId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<'starter' | 'growth' | 'fully_managed' | null>(null)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const [monthlyLeads, setMonthlyLeads] = useState(0)
  const [transactions, setTransactions] = useState<BillingTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
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

      const balance = billing?.credit_balance ?? 0
      const spent = billing?.total_spent ?? 0
      setPlan(billing?.plan ?? null)
      setStripeCustomerId(billing?.stripe_customer_id ?? null)
      setCurrentBalance(balance)
      setTotalSpent(spent)

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

      const { data: txns } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('account_id', accId)
        .order('created_at', { ascending: false })
        .limit(50)

      setTransactions(txns ?? [])
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
      setUserId(user.id)

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

  // Handle Stripe redirect params
  useEffect(() => {
    if (searchParams.get('canceled')) {
      alert('Payment canceled. No charges were made.')
      window.history.replaceState({}, document.title, '/billing')
    }
    if (searchParams.get('success')) {
      alert('Payment successful! Your credits have been added.')
      setTimeout(() => {
        if (accountId) loadBillingData(accountId)
        window.history.replaceState({}, document.title, '/billing')
      }, 2000)
    }
    if (searchParams.get('subscription') === 'success') {
      const plan = searchParams.get('plan')
      const label = plan === 'starter' ? 'Starter' : 'Growth'
      alert(`You're now subscribed to the ${label} plan! Welcome aboard.`)
      window.history.replaceState({}, document.title, '/billing')
    }
  }, [searchParams, accountId, loadBillingData])

  // Real-time lead subscription for credit deduction (fully managed only)
  useEffect(() => {
    if (!accountId || plan !== 'fully_managed') return

    const channel = supabase
      .channel('leads-billing-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `account_id=eq.${accountId}`,
        },
        async (payload) => {
          if (currentBalance < COST_PER_LEAD) {
            alert('Insufficient credits!')
            return
          }
          const newBalance = currentBalance - COST_PER_LEAD
          await supabase
            .from('billing')
            .update({ credit_balance: newBalance })
            .eq('account_id', accountId)
          await supabase.from('billing_transactions').insert([
            {
              account_id: accountId,
              type: 'lead_charge',
              amount: -COST_PER_LEAD,
              balance_after: newBalance,
              description: `Lead from ${payload.new.name || 'Unknown'}`,
            },
          ])
          loadBillingData(accountId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId, currentBalance, supabase, loadBillingData])

  async function purchaseCredits(amountCents: number, credits: number) {
    setPurchasing(true)
    try {
      const response = await fetch(CHECKOUT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: amountCents,
          credits,
          accountId,
          userId,
        }),
      })
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      alert(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setPurchasing(false)
    }
  }

  async function purchaseSubscription(plan: 'starter' | 'growth') {
    if (!SUBSCRIPTION_FUNCTION_URL) {
      alert('Subscription checkout is not configured. Please contact support.')
      return
    }
    setSubscribing(plan)
    try {
      const response = await fetch(SUBSCRIPTION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ plan, accountId, userId }),
      })
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setSubscribing(null)
    }
  }

  async function openPortal() {
    setOpeningPortal(true)
    try {
      const response = await fetch(PORTAL_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ accountId }),
      })
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const { url, error } = await response.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      alert(`Could not open billing portal: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setOpeningPortal(false)
    }
  }

  const isLow = currentBalance > 0 && currentBalance < COST_PER_LEAD * 10
  const isEmpty = currentBalance <= 0

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Billing & Credits
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Current Plan Card */}
      {plan && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
          <div className={`rounded-xl p-6 flex items-center justify-between ${plan === 'fully_managed' ? 'bg-gray-900 text-white' : 'bg-indigo-50 border border-indigo-200'}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${plan === 'fully_managed' ? 'text-gray-400' : 'text-indigo-400'}`}>
                Current Plan
              </p>
              <p className={`text-xl font-bold ${plan === 'fully_managed' ? 'text-white' : 'text-indigo-900'}`}>
                {plan === 'starter' && 'Starter — $20/month'}
                {plan === 'growth' && 'Growth — $30/month'}
                {plan === 'fully_managed' && 'Fully Managed — $15/lead'}
              </p>
              <p className={`text-sm mt-1 ${plan === 'fully_managed' ? 'text-gray-400' : 'text-indigo-600'}`}>
                {plan === 'starter' && '1 quote form · 10 leads/month · 1 VSL'}
                {plan === 'growth' && '3 quote forms · 50 leads/month · Priority support'}
                {plan === 'fully_managed' && 'Guaranteed qualified leads · Dedicated account manager'}
              </p>
            </div>
            {plan !== 'fully_managed' && stripeCustomerId && (
              <button
                onClick={openPortal}
                disabled={openingPortal}
                className="ml-6 flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {openingPortal ? 'Opening…' : 'Manage Subscription'}
              </button>
            )}
            {plan === 'fully_managed' && (
              <a
                href="mailto:sales@quote-box.com?subject=Fully%20Managed%20Account%20Changes"
                className="ml-6 flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition"
              >
                Contact Us
              </a>
            )}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Subscription Plans</h2>
        <p className="text-sm text-gray-500 mb-6">Choose the plan that fits your business</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Starter */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 mb-3">STARTER</span>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-gray-900">$20</span>
                <span className="text-gray-500 mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Everything you need to get started</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {[
                '1 quote form',
                '10 leads per month',
                '1 VSL',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {plan === 'starter' ? (
              <div className="w-full py-2 px-4 rounded-lg border-2 border-green-400 bg-green-50 text-green-700 font-semibold text-sm text-center">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => purchaseSubscription('starter')}
                disabled={subscribing !== null || plan !== null}
                className="w-full py-2 px-4 rounded-lg border-2 border-indigo-500 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {subscribing === 'starter' ? 'Redirecting…' : plan ? 'Switch Plan via Portal' : 'Get Started'}
              </button>
            )}
          </div>

          {/* Growth */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-500 p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
            </div>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-600 mb-3">GROWTH</span>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-gray-900">$30</span>
                <span className="text-gray-500 mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Scale your lead generation</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {[
                '3 quote forms',
                '50 leads per month',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {plan === 'growth' ? (
              <div className="w-full py-2 px-4 rounded-lg border-2 border-green-400 bg-green-50 text-green-700 font-semibold text-sm text-center">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => purchaseSubscription('growth')}
                disabled={subscribing !== null || plan !== null}
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {subscribing === 'growth' ? 'Redirecting…' : plan ? 'Switch Plan via Portal' : 'Upgrade to Growth'}
              </button>
            )}
          </div>

          {/* Fully Managed */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 flex flex-col text-white">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white bg-opacity-20 text-white mb-3">FULLY MANAGED</span>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">$15</span>
                <span className="text-gray-300 mb-1">/lead</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Guaranteed results, hands-free</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {[
                'Guaranteed qualified leads',
                'Fully managed account',
                'Dedicated account manager',
                'Pay only for results',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-200">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="mailto:sales@quote-box.com?subject=Fully%20Managed%20Account%20Inquiry"
              className="block w-full py-2 px-4 rounded-lg bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition text-center"
            >
              Contact Us
            </a>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        {loading ? (
          <div className="bg-white shadow rounded-xl p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
            </div>
            <p className="mt-2 text-gray-500">Loading billing information…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Credit Balance Card — fully managed only */}
            {plan === 'fully_managed' && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">
                      Available Credits
                    </p>
                    <p className="text-5xl font-bold mt-2">
                      ${currentBalance.toFixed(2)}
                    </p>
                    <p className="text-indigo-100 text-sm mt-2">
                      {Math.floor(currentBalance / COST_PER_LEAD)} leads remaining
                      at ${COST_PER_LEAD.toFixed(2)}/lead
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-md"
                  >
                    Add Credits
                  </button>
                </div>

                {isEmpty && (
                  <div className="mt-4 bg-red-500 bg-opacity-30 border border-red-300 rounded-lg p-4">
                    <p className="font-semibold">Insufficient Credits</p>
                    <p className="text-sm text-red-100 mt-1">
                      You&apos;ve run out of credits. New leads will be paused
                      until you add more credits.
                    </p>
                  </div>
                )}

                {isLow && !isEmpty && (
                  <div className="mt-4 bg-yellow-500 bg-opacity-20 border border-yellow-300 rounded-lg p-4">
                    <p className="font-semibold">Low Balance Warning</p>
                    <p className="text-sm text-yellow-100 mt-1">
                      Your credit balance is running low. Add more credits to
                      continue receiving leads.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow p-6 flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Leads
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalLeads}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {monthlyLeads}
                  </p>
                </div>
              </div>
            </div>

            {/* Usage History */}
            <div className="bg-white shadow rounded-xl">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Credit Usage History
                </h3>
              </div>
              <div className="overflow-x-auto">
                {transactions.length === 0 ? (
                  <p className="p-8 text-center text-gray-500">
                    No usage history yet.
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Date', 'Type', 'Description', 'Amount', 'Balance'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((tx) => {
                        const isCredit = tx.type === 'credit_purchase'
                        return (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(tx.created_at).toLocaleDateString()}{' '}
                              {new Date(tx.created_at).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                              >
                                {isCredit ? 'Credit Purchase' : 'Lead Charge'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {tx.description || '-'}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {isCredit ? '+' : '-'}$
                              {Math.abs(tx.amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${tx.balance_after.toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Credits Modal — fully managed only */}
      {plan === 'fully_managed' && showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Credits
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Select a credit package to purchase. Each credit allows you
                  to receive one lead.
                </p>

                <div className="space-y-3">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.credits}
                      onClick={() =>
                        purchaseCredits(pkg.amount, pkg.credits)
                      }
                      disabled={purchasing}
                      className={`w-full text-left rounded-lg p-4 hover:bg-indigo-50 transition border-2 ${pkg.featured ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-500'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {pkg.label}
                          </p>
                          <p className="text-sm text-gray-500">{pkg.perLead}</p>
                          {pkg.featured && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-indigo-800 bg-indigo-200 rounded">
                              BEST VALUE
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${(pkg.amount / 100).toFixed(0)}
                          </p>
                          {pkg.savings && (
                            <p className="text-xs text-green-600 font-semibold">
                              {pkg.savings}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {purchasing && (
                  <div className="mt-4 text-center">
                    <div className="animate-pulse flex space-x-2 justify-center items-center">
                      <div className="h-3 w-3 bg-indigo-600 rounded-full" />
                      <div className="h-3 w-3 bg-indigo-600 rounded-full" />
                      <div className="h-3 w-3 bg-indigo-600 rounded-full" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Redirecting to checkout…
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
