import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyOwner(admin: ReturnType<typeof createAdminClient>, accountId: string | null) {
  if (!accountId) return false
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: account } = await admin.from('accounts').select('owner_id').eq('id', accountId).single()
  return account?.owner_id === user.id
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: session, error } = await admin
    .from('onboarding_sessions')
    .select('id, account_id, status, step_data, current_step, created_at, paid_at, lead_email')
    .eq('token', params.token)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'form_built') {
    return NextResponse.json({ error: 'This onboarding has already been completed and the form has been built.', completed: true }, { status: 410 })
  }

  // Sessions from the old admin flow (no lead_email) predate the login/payment
  // gates — leave their token-only access as it always was.
  const isLegacySession = !session.lead_email
  if (!isLegacySession && !(await verifyOwner(admin, session.account_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch business name for display
  const { data: account } = await admin
    .from('accounts')
    .select('business_name')
    .eq('id', session.account_id)
    .single()

  return NextResponse.json({
    ...session,
    business_name: account?.business_name ?? '',
  })
}

export async function PUT(request: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('onboarding_sessions')
    .select('id, status, account_id, paid_at, lead_email')
    .eq('token', params.token)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'form_built') {
    return NextResponse.json({ error: 'Session is locked' }, { status: 403 })
  }

  // Sessions from the old admin flow (no lead_email) predate the login/payment
  // gates — leave their token-only access as it always was.
  const isLegacySession = !session.lead_email

  if (!isLegacySession && !session.paid_at) {
    return NextResponse.json({ error: 'Payment required before continuing' }, { status: 402 })
  }

  if (!isLegacySession && !(await verifyOwner(admin, session.account_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { step: number; data: Record<string, unknown>; submit?: boolean }
  const { step, data, submit } = body

  if (!step || !data) {
    return NextResponse.json({ error: 'step and data required' }, { status: 400 })
  }

  // Merge step data
  const { data: current } = await admin
    .from('onboarding_sessions')
    .select('step_data')
    .eq('id', session.id)
    .single()

  const stepData = { ...(current?.step_data ?? {}), [step]: data }
  const newStatus = submit ? 'completed' : 'in_progress'
  const newStep = submit ? step : Math.max(step, step + 1)

  const { error } = await admin
    .from('onboarding_sessions')
    .update({
      step_data: stepData,
      current_step: submit ? step : newStep,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, status: newStatus })
}
