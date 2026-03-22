import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AWARD_TIERS = [
  { label: 'Diamond', min: 50, color: '#b9f2ff', bg: '#f0fcff', border: '#b9f2ff', text: '#0e7490' },
  { label: 'Gold', min: 25, color: '#fbbf24', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  { label: 'Silver', min: 10, color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
  { label: 'Bronze', min: 1, color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
]

function getAwardTier(booked: number) {
  return AWARD_TIERS.find((t) => booked >= t.min) ?? null
}

export default async function GamesPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!account) {
    return <div className="p-8 text-red-600">No account found. Please contact support.</div>
  }

  // Not enrolled — show CTA
  if (!account.games_enrolled) {
    return (
      <div className="py-6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white shadow rounded-xl p-10">
            <svg className="w-16 h-16 mx-auto text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">QuoteBox Games</h2>
            <p className="text-gray-500 mb-6">
              Compete against other businesses on the leaderboard and earn awards based on your booked leads.
            </p>
            <EnrollButton accountId={account.id} />
          </div>
        </div>
      </div>
    )
  }

  // Enrolled — show leaderboard
  const admin = createAdminClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Get all enrolled accounts
  const { data: enrolledAccounts } = await admin
    .from('accounts')
    .select('id, business_name')
    .eq('games_enrolled', true)

  const enrolled = enrolledAccounts ?? []
  const enrolledIds = enrolled.map((a) => a.id)

  // Get all booked leads this month for enrolled accounts
  const { data: bookedLeads } = await admin
    .from('leads')
    .select('account_id')
    .eq('status', 'booked')
    .gte('created_at', startOfMonth.toISOString())
    .in('account_id', enrolledIds)

  // Count per account
  const counts: Record<string, number> = {}
  for (const l of bookedLeads ?? []) {
    counts[l.account_id] = (counts[l.account_id] ?? 0) + 1
  }

  // Build leaderboard
  const leaderboard = enrolled
    .map((a) => ({
      id: a.id,
      name: a.business_name || 'Unnamed Business',
      booked: counts[a.id] ?? 0,
    }))
    .sort((a, b) => b.booked - a.booked)
    .slice(0, 20)

  // Find user's rank
  const allSorted = enrolled
    .map((a) => ({ id: a.id, booked: counts[a.id] ?? 0 }))
    .sort((a, b) => b.booked - a.booked)
  const userRank = allSorted.findIndex((a) => a.id === account.id) + 1

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">QuoteBox Games</h1>
        <p className="mt-2 text-sm text-gray-600">
          Compete against other businesses — top performers earn awards every month
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">
          {/* User rank card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 shadow rounded-xl p-6 text-white">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-indigo-200">Your Rank</p>
                <p className="text-4xl font-extrabold">#{userRank}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-200">Booked This Month</p>
                <p className="text-4xl font-extrabold">{counts[account.id] ?? 0}</p>
              </div>
              {(() => {
                const tier = getAwardTier(counts[account.id] ?? 0)
                return tier ? (
                  <div className="ml-auto px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: tier.bg, color: tier.text, border: `1.5px solid ${tier.border}` }}>
                    {tier.label}
                  </div>
                ) : null
              })()}
            </div>
          </div>

          {/* Leaderboard table */}
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Leaderboard — Top 20</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Booked Leads</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Award</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, i) => {
                  const tier = getAwardTier(entry.booked)
                  const isUser = entry.id === account.id
                  return (
                    <tr key={entry.id} className={isUser ? 'bg-indigo-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        #{i + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.name}
                        {isUser && <span className="ml-2 text-xs font-semibold text-indigo-600">(You)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {entry.booked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {tier ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-bold" style={{ background: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}>
                            {tier.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                      No data yet this month. Book leads to climb the leaderboard!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Award tiers reference */}
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Award Tiers</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AWARD_TIERS.slice().reverse().map((tier) => (
                <div key={tier.label} className="p-3 rounded-lg border text-center" style={{ background: tier.bg, borderColor: tier.border }}>
                  <p className="text-sm font-bold" style={{ color: tier.text }}>{tier.label}</p>
                  <p className="text-xs text-gray-500">{tier.min}+ booked</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Client component for enroll button
function EnrollButton({ accountId }: { accountId: string }) {
  return (
    <form action={async () => {
      'use server'
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = createClient()
      await supabase.from('accounts').update({ games_enrolled: true }).eq('id', accountId)
      const { redirect } = await import('next/navigation')
      redirect('/games')
    }}>
      <button
        type="submit"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Enroll in QuoteBox Games
      </button>
    </form>
  )
}
