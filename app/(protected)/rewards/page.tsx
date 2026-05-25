import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309']
const MEDAL_LABELS = ['1st', '2nd', '3rd']

export default async function LeaderboardPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch all accounts that haven't opted out
  const { data: allAccounts } = await admin
    .from('accounts')
    .select('id, business_name, owner_id')
    .or(`leaderboard_hidden.is.null,leaderboard_hidden.eq.false`)

  const accounts = allAccounts ?? []

  // Fetch all leads with form_data
  const { data: allLeads } = await admin
    .from('leads')
    .select('account_id, form_data')

  const leads = allLeads ?? []

  // Sum pipeline per account
  const pipelineByAccount: Record<string, number> = {}
  for (const lead of leads) {
    const qt = (lead.form_data as Record<string, unknown> | null)?._quote_total
    if (typeof qt === 'number' && qt > 0) {
      pipelineByAccount[lead.account_id] = (pipelineByAccount[lead.account_id] ?? 0) + qt
    }
  }

  // Build real ranked list
  const real = accounts
    .map((a) => ({
      id: a.id,
      name: a.business_name || 'Unnamed Business',
      pipeline: pipelineByAccount[a.id] ?? 0,
      isMe: a.owner_id === user.id,
      fake: false,
    }))
    .sort((a, b) => b.pipeline - a.pipeline)

  // Pull Titantuff Moving to the front, inject 2 fakes at 2nd and 3rd
  const titantuffIdx = real.findIndex((r) => r.name.toLowerCase().includes('titantuff'))
  const titantuff = titantuffIdx >= 0 ? real.splice(titantuffIdx, 1)[0] : null
  const topPipeline = titantuff?.pipeline ?? real[0]?.pipeline ?? 100000
  const fakes = [
    { id: '__fake_1__', name: 'Summit Home Services', pipeline: Math.round(topPipeline * 0.82), isMe: false, fake: true },
    { id: '__fake_2__', name: 'BlueLine Contractors', pipeline: Math.round(topPipeline * 0.67), isMe: false, fake: true },
  ]
  const ranked = [
    ...(titantuff ? [titantuff] : []),
    ...fakes,
    ...real,
  ]

  const myEntry = ranked.find((r) => r.isMe)
  const myRank = myEntry ? ranked.indexOf(myEntry) + 1 : null

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Leaderboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          All businesses ranked by total pipeline revenue
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        {/* Your ranking banner */}
        {myEntry && myRank && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
            <div className="text-3xl font-black text-blue-700">#{myRank}</div>
            <div>
              <p className="text-sm font-semibold text-blue-900">{myEntry.name}</p>
              <p className="text-sm text-blue-600">{fmt(myEntry.pipeline)} in pipeline</p>
            </div>
            <span className="ml-auto text-xs font-bold uppercase tracking-widest text-blue-400">
              Your position
            </span>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {ranked.map((entry, idx) => {
              const rank = idx + 1
              const isTop3 = rank <= 3
              const isMe = entry.isMe

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 px-6 py-4"
                  style={{
                    background: isMe ? '#eff6ff' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                >
                  {/* Rank */}
                  <div
                    className="w-10 text-center flex-shrink-0"
                    style={{
                      fontWeight: isTop3 ? 800 : 600,
                      fontSize: isTop3 ? '1.1rem' : '0.95rem',
                      color: isTop3 ? MEDAL_COLORS[rank - 1] : '#9ca3af',
                    }}
                  >
                    {isTop3 ? MEDAL_LABELS[rank - 1] : `#${rank}`}
                  </div>

                  {/* Medal dot for top 3 */}
                  {isTop3 ? (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: MEDAL_COLORS[rank - 1] }}
                    />
                  ) : (
                    <div className="w-2 flex-shrink-0" />
                  )}

                  {/* Business name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isMe ? '#1d4ed8' : '#111827' }}
                    >
                      {entry.name}
                      {isMe && (
                        <span className="ml-2 text-xs font-bold text-blue-400 uppercase tracking-wide">
                          You
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Pipeline */}
                  <div
                    className="text-sm font-bold flex-shrink-0"
                    style={{ color: entry.pipeline > 0 ? '#111827' : '#d1d5db' }}
                  >
                    {entry.pipeline > 0 ? fmt(entry.pipeline) : '—'}
                  </div>
                </div>
              )
            })}

            {ranked.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                No businesses yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
