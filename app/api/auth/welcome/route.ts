import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { scheduleOwnerOnboarding, processDueOwnerSteps } from '@/lib/owner-automations'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  // Accept account_id directly — called client-side right after signUp()
  // when the session cookie isn't established yet on the server.
  const accountId = typeof body.account_id === 'string' ? body.account_id : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null

  if (!accountId) return NextResponse.json({ error: 'account_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Verify account exists
  const { data: account } = await admin
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  if (phone) {
    await admin.from('accounts').update({ phone }).eq('id', accountId)
  }

  await scheduleOwnerOnboarding(accountId)
  await processDueOwnerSteps()

  return NextResponse.json({ ok: true })
}
