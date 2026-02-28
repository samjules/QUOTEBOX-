import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// TEMPORARY: one-time fix to set plan for users whose Stripe webhook was missed.
// Uses service-role client to bypass RLS. Auth check ensures only logged-in user affects their own account.
export async function POST() {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await admin
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'No account found' }, { status: 404 })

  const { data: billing } = await admin
    .from('billing')
    .select('plan')
    .eq('account_id', account.id)
    .single()

  if (billing?.plan) {
    return NextResponse.json({ message: `Plan already set to: ${billing.plan}` })
  }

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin
    .from('billing')
    .upsert(
      { account_id: account.id, plan: 'starter', trial_ends_at: trialEndsAt },
      { onConflict: 'account_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, plan: 'starter', trial_ends_at: trialEndsAt })
}
