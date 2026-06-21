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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg)', fontFamily: "'Brraelyn', sans-serif" }}>
          Quotebox
        </span>
      </div>
      <PublicWizard totalBookedRevenue={totalBookedRevenue} />
    </div>
  )
}
