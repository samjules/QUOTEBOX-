import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('free_trial_leads')
    .select('scheduled_date, scheduled_time')
    .in('status', ['pending_confirmation', 'confirmed'])
    .not('scheduled_date', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const taken = (data ?? []).map((r) => `${r.scheduled_date}|${r.scheduled_time}`)
  return NextResponse.json({ taken })
}
