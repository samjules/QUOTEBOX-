import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: session, error } = await admin
    .from('onboarding_sessions')
    .select('id, account_id, status, step_data, current_step, created_at')
    .eq('token', params.token)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'form_built') {
    return NextResponse.json({ error: 'This onboarding has already been completed and the form has been built.', completed: true }, { status: 410 })
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
    .select('id, status')
    .eq('token', params.token)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'form_built') {
    return NextResponse.json({ error: 'Session is locked' }, { status: 403 })
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
