import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIERS = [
  {
    label: 'Starter',
    threshold: 0,
    accentColor: '#94a3b8',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    textColor: '#64748b',
  },
  {
    label: 'Pro',
    threshold: 1000,
    accentColor: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    textColor: '#1d4ed8',
  },
  {
    label: 'Expert',
    threshold: 5000,
    accentColor: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#b45309',
  },
]

export default async function RewardsPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!account) {
    return (
      <div className="p-8 text-red-600">
        No account found. Please contact support.
      </div>
    )
  }

  const { data: allLeads } = await supabase
    .from('leads')
    .select('form_data')
    .eq('account_id', account.id)

  const leads = allLeads ?? []

  const admin = createAdminClient()
  const { data: billing } = await admin
    .from('billing')
    .select('plan')
    .eq('account_id', account.id)
    .single()

  // All-time pipeline: sum of _quote_total across every lead
  const allTimePipeline = leads.reduce((sum, l) => {
    const qt = (l.form_data as Record<string, unknown> | null)?._quote_total
    return sum + (typeof qt === 'number' ? qt : 0)
  }, 0)

  const currentTierIdx = TIERS.reduce(
    (best, t, i) => (allTimePipeline >= t.threshold ? i : best),
    0
  )
  const currentTier = TIERS[currentTierIdx]
  const nextTier = TIERS[currentTierIdx + 1] ?? null

  const progressPct = nextTier
    ? Math.min(
        100,
        ((allTimePipeline - currentTier.threshold) /
          (nextTier.threshold - currentTier.threshold)) *
          100
      )
    : 100

  const remaining = nextTier
    ? Math.max(0, nextTier.threshold - allTimePipeline)
    : 0

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Rewards</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track your pipeline milestones and tier progress
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">
          {/* Main rewards card */}
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div style={{ height: 4, background: currentTier.accentColor }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    Current Status
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {account.business_name || 'Your Business'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {fmt(allTimePipeline)} in total pipeline
                  </p>
                </div>
                <div
                  style={{
                    background: currentTier.bgColor,
                    border: `1.5px solid ${currentTier.borderColor}`,
                    color: currentTier.textColor,
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
                >
                  {currentTier.label}
                </div>
              </div>

              {/* Tier steps */}
              <div className="flex items-center gap-0 mb-6">
                {TIERS.map((tier, i) => {
                  const reached = allTimePipeline >= tier.threshold
                  const isCurrent = i === currentTierIdx
                  return (
                    <div key={tier.label} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: reached ? tier.accentColor : '#f1f5f9',
                            border: `2px solid ${reached ? tier.accentColor : '#e2e8f0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isCurrent ? `0 0 0 4px ${tier.accentColor}22` : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {reached ? (
                            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1' }} />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: isCurrent ? 700 : 500,
                            color: reached ? tier.textColor : '#94a3b8',
                            marginTop: 6,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tier.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: 2 }}>
                          {tier.threshold === 0 ? 'Base' : fmt(tier.threshold)}
                        </span>
                      </div>
                      {i < TIERS.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background: allTimePipeline >= TIERS[i + 1].threshold
                              ? TIERS[i + 1].accentColor
                              : '#e2e8f0',
                            marginBottom: 34,
                            transition: 'background 0.3s',
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              {nextTier ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-600">
                      Progress to {nextTier.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: nextTier.accentColor }}>
                      {fmt(allTimePipeline)} / {fmt(nextTier.threshold)}
                    </span>
                  </div>
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        background: `linear-gradient(90deg, ${currentTier.accentColor}, ${nextTier.accentColor})`,
                        borderRadius: 8,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {fmt(remaining)} more in pipeline to reach{' '}
                    <span style={{ color: nextTier.textColor, fontWeight: 600 }}>{nextTier.label}</span>
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: currentTier.bgColor,
                    border: `1px solid ${currentTier.borderColor}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1l1.85 3.75 4.15.6-3 2.92.7 4.12L8 10.5l-3.7 1.9.7-4.13L2 5.35l4.15-.6L8 1z"
                      fill={currentTier.accentColor}
                      stroke={currentTier.accentColor}
                      strokeWidth="0.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: currentTier.textColor }}>
                    Max tier reached — you&apos;re an Expert!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tier Breakdown</h3>
            <div className="space-y-3">
              {TIERS.map((tier) => {
                const reached = allTimePipeline >= tier.threshold
                return (
                  <div
                    key={tier.label}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                    style={{
                      background: reached ? tier.bgColor : '#fafafa',
                      borderColor: reached ? tier.borderColor : '#e5e7eb',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: tier.accentColor }}
                    />
                    <div className="flex-1">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: reached ? tier.textColor : '#9ca3af' }}
                      >
                        {tier.label}
                      </p>
                      <p className="text-xs text-gray-400">
                        {tier.threshold === 0 ? 'Starting tier' : `Requires ${fmt(tier.threshold)} pipeline`}
                      </p>
                    </div>
                    {reached ? (
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: tier.bgColor, color: tier.textColor, border: `1px solid ${tier.borderColor}` }}
                      >
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">
                        {fmt(Math.max(0, tier.threshold - allTimePipeline))} away
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Plan info if available */}
          {billing?.plan && (
            <div className="bg-white shadow rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Active Plan</h3>
              <p className="text-sm text-gray-500 capitalize">
                {billing.plan.replace('_', ' ')} plan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
