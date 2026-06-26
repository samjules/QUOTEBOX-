import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { scheduleOwnerOnboarding, processDueOwnerSteps } from '@/lib/owner-automations'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null

  const admin = createAdminClient()

  const { data: account } = await admin
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  if (phone) {
    await admin.from('accounts').update({ phone }).eq('id', account.id)
  }

  await scheduleOwnerOnboarding(account.id)

  // Fire welcome step immediately in the background (don't await in prod for speed)
  processDueOwnerSteps().catch(console.error)

  return NextResponse.json({ ok: true })
}
