import { createAdminClient } from '@/lib/supabase/admin'
import type { DemoVariant } from '@/lib/demo-variant'

export const dynamic = 'force-dynamic'

const VARIANT_LABELS: Record<DemoVariant, string> = {
  quote_form: 'A — Instant Quote Form',
  ios_app: 'B — iOS App / Push Alerts',
}

export default async function SplitTestPage() {
  const admin = createAdminClient()

  const { data: events } = await admin
    .from('demo_variant_events')
    .select('variant, event_type, created_at')

  const rows = events ?? []
  const variants: DemoVariant[] = ['quote_form', 'ios_app']

  const stats = variants.map((variant) => {
    const views = rows.filter((r) => r.variant === variant && r.event_type === 'view').length
    const booked = rows.filter((r) => r.variant === variant && r.event_type === 'booked').length
    const rate = views > 0 ? (booked / views) * 100 : 0
    return { variant, views, booked, rate }
  })

  const totalViews = stats.reduce((sum, s) => sum + s.views, 0)

  return (
    <div className="p-8" style={{ background: '#f4f4f6', minHeight: '100%' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#0e0020' }}>/demo split test</h1>
      <p className="text-sm text-gray-500 mb-6">
        50/50 traffic split on the /demo landing page, sticky per visitor. Both variants lead into the same booking calendar.
      </p>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.variant} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-semibold mb-3" style={{ color: '#0e0020' }}>{VARIANT_LABELS[s.variant]}</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{s.views}</div>
                <div className="text-xs text-gray-500">views</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#0e0020' }}>{s.booked}</div>
                <div className="text-xs text-gray-500">booked</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{s.rate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">conversion</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        {totalViews} total views tracked. Variant is assigned by a cookie set in middleware on first visit to /demo and persists for 180 days.
      </p>
    </div>
  )
}
