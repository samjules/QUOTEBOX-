import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const STEP_KEYS = ['initial_contact', 'day1_followup', 'discount_offer', 'mark_lost'] as const

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('accounts').select('id').eq('owner_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [stepsRes, eventsRes] = await Promise.all([
    admin
      .from('automation_steps')
      .select('step, status')
      .eq('account_id', account.id),
    admin
      .from('automation_events')
      .select('step, event_type, lead_id')
      .eq('account_id', account.id),
  ])

  const steps = stepsRes.data ?? []
  const events = eventsRes.data ?? []

  const stats = Object.fromEntries(
    STEP_KEYS.map((key) => {
      const sent = steps.filter((s) => s.step === key && s.status === 'sent').length
      const stepEvents = events.filter((e) => e.step === key)
      const opens = new Set(stepEvents.filter((e) => e.event_type === 'email_open').map((e) => e.lead_id)).size
      const clicks = new Set(stepEvents.filter((e) => e.event_type === 'link_click').map((e) => e.lead_id)).size
      return [key, { sent, opens, clicks }]
    })
  )

  return NextResponse.json(stats)
}
