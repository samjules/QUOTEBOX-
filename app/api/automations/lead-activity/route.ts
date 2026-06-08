import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function getAccountId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('accounts').select('id').eq('owner_id', user.id).single()
  return data?.id ?? null
}

export async function GET(request: NextRequest) {
  const accountId = await getAccountId()
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadId = request.nextUrl.searchParams.get('lead_id')
  if (leadId) return getLeadActivity(accountId, leadId)

  const admin = createAdminClient()

  // Get all leads that have automation steps
  const { data: steps } = await admin
    .from('automation_steps')
    .select('lead_id, step, status, scheduled_at, sent_at')
    .eq('account_id', accountId)
    .order('scheduled_at', { ascending: true })

  if (!steps?.length) return NextResponse.json([])

  const leadIds = Array.from(new Set(steps.map((s) => s.lead_id)))

  const [{ data: leads }, { data: events }] = await Promise.all([
    admin
      .from('leads')
      .select('id, name, email, phone, form_type, created_at')
      .in('id', leadIds)
      .order('created_at', { ascending: false }),
    admin
      .from('automation_events')
      .select('lead_id, step, event_type, created_at')
      .eq('account_id', accountId)
      .in('lead_id', leadIds)
      .order('created_at', { ascending: true }),
  ])

  const stepOrder = ['initial_contact', 'day1_followup', 'discount_offer', 'mark_lost']

  const result = (leads ?? []).map((lead) => {
    const leadSteps = (steps ?? []).filter((s) => s.lead_id === lead.id)
    const leadEvents = (events ?? []).filter((e) => e.lead_id === lead.id)

    const stepsWithEvents = stepOrder
      .map((stepKey) => {
        const s = leadSteps.find((ls) => ls.step === stepKey)
        if (!s) return null
        return {
          step: stepKey,
          status: s.status,
          scheduled_at: s.scheduled_at,
          sent_at: s.sent_at,
          events: leadEvents.filter((e) => e.step === stepKey),
        }
      })
      .filter(Boolean)

    // form_submit events may have a different step than the one that triggered — include separately
    const formSubmitEvents = leadEvents.filter((e) => e.event_type === 'form_submit')

    return {
      lead,
      steps: stepsWithEvents,
      converted: formSubmitEvents.length > 0,
      convertedAt: formSubmitEvents[0]?.created_at ?? null,
    }
  })

  return NextResponse.json(result)
}

async function getLeadActivity(accountId: string, leadId: string) {
  const admin = createAdminClient()

  const stepOrder = ['initial_contact', 'day1_followup', 'discount_offer', 'mark_lost']

  const [{ data: steps }, { data: events }] = await Promise.all([
    admin
      .from('automation_steps')
      .select('step, status, scheduled_at, sent_at')
      .eq('account_id', accountId)
      .eq('lead_id', leadId)
      .order('scheduled_at', { ascending: true }),
    admin
      .from('automation_events')
      .select('step, event_type, created_at')
      .eq('account_id', accountId)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true }),
  ])

  if (!steps?.length) return NextResponse.json(null)

  const stepsWithEvents = stepOrder
    .map((stepKey) => {
      const s = (steps ?? []).find((ls) => ls.step === stepKey)
      if (!s) return null
      return {
        step: stepKey,
        status: s.status,
        scheduled_at: s.scheduled_at,
        sent_at: s.sent_at,
        events: (events ?? []).filter((e) => e.step === stepKey),
      }
    })
    .filter(Boolean)

  const formSubmitEvents = (events ?? []).filter((e) => e.event_type === 'form_submit')

  return NextResponse.json({
    steps: stepsWithEvents,
    converted: formSubmitEvents.length > 0,
    convertedAt: formSubmitEvents[0]?.created_at ?? null,
  })
}
