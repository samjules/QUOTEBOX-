import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const [leadsResult, formsResult] = await Promise.all([
    admin
      .from('leads')
      .select('id, name, email, phone, status, created_at, form_data')
      .eq('account_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('hosted_forms')
      .select('id, form_name, form_type, is_active, created_at, form_config')
      .eq('account_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    leads: leadsResult.data ?? [],
    forms: formsResult.data ?? [],
  })
}
