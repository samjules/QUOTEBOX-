import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function GET(_request: NextRequest, { params }: { params: { accountId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: session, error } = await admin
    .from('onboarding_sessions')
    .select('*')
    .eq('account_id', params.accountId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'No onboarding session found' }, { status: 404 })
  }

  return NextResponse.json(session)
}

export async function PATCH(request: NextRequest, { params }: { params: { accountId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await request.json() as { status: string }
  if (status !== 'form_built') {
    return NextResponse.json({ error: 'Only form_built status is allowed' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('onboarding_sessions')
    .update({ status: 'form_built', updated_at: new Date().toISOString() })
    .eq('account_id', params.accountId)
    .eq('status', 'completed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: { accountId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('onboarding_sessions')
    .delete()
    .eq('account_id', params.accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
