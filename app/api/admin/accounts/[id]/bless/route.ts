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

  const { blessed } = await request.json() as { blessed: boolean }
  if (typeof blessed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('billing')
    .update({ blessed, updated_at: new Date().toISOString() })
    .eq('account_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ blessed })
}
