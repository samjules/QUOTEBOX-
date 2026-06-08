'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BillingTransaction } from '@/lib/types'

const SUBSCRIPTION_FUNCTION_URL = process.env.NEXT_PUBLIC_SUBSCRIPTION_FUNCTION_URL!
const PORTAL_FUNCTION_URL = process.env.NEXT_PUBLIC_PORTAL_FUNCTION_URL!
const VERIFY_SESSION_FUNCTION_URL = process.env.NEXT_PUBLIC_VERIFY_SESSION_FUNCTION_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function BillingPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [accountId, setAccountId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [blessed, setBlessed] = useState(false)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const [monthlyLeads, setMonthlyLeads] = useState(0)
  const [transactions, setTransactions] = useState<BillingTransaction[]>([])
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
      setTotalSpent(billing?.total_spent ?? 0)

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

  async function subscribe() {
    if (!SUBSCRIPTION_FUNCTION_URL) {
      alert('Subscription checkout is not configured. Please contact support.')
      return
    }
    setSubscribing(true)
    try {
      const response = await fetch(SUBSCRIPTION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ plan: 'pro', accountId, userId }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setSubscribing(false)
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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const { url, error } = await response.json()
      if (error) throw new Error(error)
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
                {blessed ? 'Blessed Account — Free Access' : 'Pro — $350/month'}
              </p>
              <p className="text-sm mt-1 text-white/70">
                {blessed
                  ? 'Full platform access granted by admin'
                  : 'Full platform access · Unlimited leads'}
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

        {/* Pro plan card — shown when not yet subscribed */}
        {!isActive && (
          <div
            className="bg-white rounded-2xl p-8 mb-6"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <span
              className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-4"
              style={{ background: 'rgba(91,91,214,0.1)', color: '#5b5bd6' }}
            >
              PRO
            </span>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-bold text-gray-900">$350</span>
              <span className="text-gray-400 mb-2">/month</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Everything you need to grow your contracting business
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited quote forms',
                'Unlimited leads per month',
                'Meta Ads campaign management',
                'Automated follow-up sequences',
                'Lead analytics & reporting',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: '#5b5bd6' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={subscribe}
              disabled={subscribing}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              style={{ background: 'linear-gradient(135deg, #5b5bd6 0%, #4c4cbf 100%)' }}
            >
              {subscribing ? 'Redirecting to checkout…' : 'Get Started — $350/month'}
            </button>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Leads', value: totalLeads, icon: '📊', color: 'rgba(91,91,214,0.1)' },
              { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, icon: '💰', color: 'rgba(16,185,129,0.1)' },
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

        {/* Transaction history */}
        {!loading && transactions.length > 0 && (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Billing History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Type', 'Description', 'Amount', 'Balance'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'credit_purchase'
                    return (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isCredit
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isCredit ? 'Credit' : 'Charge'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {tx.description || '—'}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${tx.balance_after.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
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
