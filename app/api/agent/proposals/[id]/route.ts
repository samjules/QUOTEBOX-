import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { decision }: { decision?: 'approved' | 'rejected' } = await request.json()
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be "approved" or "rejected"' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: proposal } = await admin
    .from('agent_proposed_changes')
    .select('id, target, action, target_id, changes, status')
    .eq('account_id', account.accountId)
    .eq('id', params.id)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (proposal.status !== 'pending') {
    return NextResponse.json({ error: `Already ${proposal.status}` }, { status: 409 })
  }

  if (decision === 'approved') {
    const changes = proposal.changes as Record<string, unknown>

    if (proposal.target === 'automation') {
      const { error } = await admin
        .from('lead_automations')
        .upsert({ account_id: account.accountId, ...changes }, { onConflict: 'account_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (proposal.target === 'form' && proposal.action === 'create') {
      const { error } = await admin.from('hosted_forms').insert({ account_id: account.accountId, ...changes })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (proposal.target === 'form' && proposal.action === 'update') {
      const { error } = await admin
        .from('hosted_forms')
        .update(changes)
        .eq('id', proposal.target_id)
        .eq('account_id', account.accountId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: resolved, error } = await admin
    .from('agent_proposed_changes')
    .update({ status: decision, resolved_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, status, resolved_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ proposal: resolved })
}
