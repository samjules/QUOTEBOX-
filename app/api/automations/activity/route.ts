import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('accounts').select('id').eq('owner_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: steps } = await admin
    .from('automation_steps')
    .select('id, step, status, scheduled_at, sent_at, lead_id, leads(name, email, phone)')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(steps ?? [])
}
