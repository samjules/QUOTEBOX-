import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('agent_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('account_id', account.accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
