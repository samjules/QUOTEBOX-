import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, mode } = await request.json() as { amount: number; mode: 'add' | 'set' }
  if (typeof amount !== 'number') {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: billing, error: fetchError } = await admin
    .from('billing')
    .select('credit_balance')
    .eq('account_id', params.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const newBalance = mode === 'set' ? amount : (billing?.credit_balance ?? 0) + amount

  const { error } = await admin
    .from('billing')
    .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('account_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log the transaction
  await admin.from('billing_transactions').insert({
    account_id: params.id,
    type: 'credit_purchase',
    amount: mode === 'set' ? newBalance - (billing?.credit_balance ?? 0) : amount,
    balance_after: newBalance,
    description: `Admin adjustment by ${user.email}`,
  })

  return NextResponse.json({ credit_balance: newBalance })
}
