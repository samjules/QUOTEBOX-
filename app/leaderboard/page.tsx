import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const AWARD_TIERS = [
  { label: 'Diamond', min: 50, color: '#b9f2ff', bg: '#f0fcff', border: '#b9f2ff', text: '#0e7490' },
  { label: 'Gold', min: 25, color: '#fbbf24', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  { label: 'Silver', min: 10, color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
  { label: 'Bronze', min: 1, color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
]

function getAwardTier(booked: number) {
  return AWARD_TIERS.find((t) => booked >= t.min) ?? null
}

export default async function PublicGamesPage() {
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
  const { data: bookedLeads } = enrolledIds.length > 0
    ? await admin
        .from('leads')
        .select('account_id')
        .eq('status', 'booked')
        .gte('created_at', startOfMonth.toISOString())
        .in('account_id', enrolledIds)
    : { data: [] }

  // Count per account
  const counts: Record<string, number> = {}
  for (const l of bookedLeads ?? []) {
    counts[l.account_id] = (counts[l.account_id] ?? 0) + 1
  }

  // Build leaderboard — top 50
  const leaderboard = enrolled
    .map((a) => ({
      id: a.id,
      name: a.business_name || 'Unnamed Business',
      booked: counts[a.id] ?? 0,
    }))
    .sort((a, b) => b.booked - a.booked)
    .slice(0, 50)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '48px 24px', width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0e0020', marginBottom: 8 }}>
            QuoteBox Games
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: 500, margin: '0 auto' }}>
            See which businesses are closing the most deals this month. Compete, earn awards, and rise to the top.
          </p>
        </div>

        {/* Award tiers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 32,
        }}>
          {AWARD_TIERS.slice().reverse().map((tier) => (
            <div key={tier.label} style={{
              padding: '12px 8px',
              borderRadius: 10,
              border: `1.5px solid ${tier.border}`,
              background: tier.bg,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: tier.text }}>{tier.label}</div>
              <div style={{ fontSize: '0.72rem', color: '#999' }}>{tier.min}+ booked</div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #eee',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0e0020', margin: 0 }}>
              Leaderboard — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rank</th>
                <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business</th>
                <th style={{ padding: '10px 24px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booked</th>
                <th style={{ padding: '10px 24px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Award</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const tier = getAwardTier(entry.booked)
                return (
                  <tr key={entry.id} style={{ borderTop: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700, color: '#0e0020' }}>
                      #{i + 1}
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: '0.9rem', color: '#333' }}>
                      {entry.name}
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, color: '#0e0020', textAlign: 'right' }}>
                      {entry.booked}
                    </td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      {tier ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: tier.bg,
                          color: tier.text,
                          border: `1px solid ${tier.border}`,
                        }}>
                          {tier.label}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                    No competitors yet this month. Be the first!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0e0020', marginBottom: 12 }}>
            Want to compete?
          </p>
          <Link href="/signup" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#0e0020',
            color: '#FFE500',
            borderRadius: 8,
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Sign up now
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
