import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()
  const { data: proposals } = await admin
    .from('agent_proposed_changes')
    .select('id, target, action, target_id, changes, rationale, status, created_at, resolved_at')
    .eq('account_id', account.accountId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ proposals: proposals ?? [] })
}
