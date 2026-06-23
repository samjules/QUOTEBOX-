import { createAdminClient } from '@/lib/supabase/admin'
import PublicWizard from './PublicWizard'

export const metadata = {
  title: 'Build Your Quote Form — Quotebox',
  description: 'Build a free instant-quote form for your moving or junk removal business in under 5 minutes.',
}

export const revalidate = 3600 // refresh the global stat hourly

export default async function BuildPage() {
  const admin = createAdminClient()

  // Sum _quote_total across all booked leads globally
  const { data: bookedLeads } = await admin
    .from('leads')
    .select('form_data')
    .eq('status', 'booked')
    .not('form_data', 'is', null)

  const totalBookedRevenue = (bookedLeads ?? []).reduce((sum, l) => {
    const qt = (l.form_data as Record<string, unknown> | null)?._quote_total
    return sum + (typeof qt === 'number' ? qt : 0)
  }, 0)

  return (
    <div className="maze-light" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="maze-dark" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#0e0020' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFE500', fontFamily: "'Nautic', sans-serif" }}>
          Quotebox
        </span>
      </div>
      <PublicWizard totalBookedRevenue={totalBookedRevenue} />
    </div>
  )
}
