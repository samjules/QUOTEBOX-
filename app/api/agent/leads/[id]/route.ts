import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAgentApiKey } from '@/lib/agent-auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAgentApiKey(request, 'leads:read')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: lead, error } = await admin
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at')
    .eq('id', params.id)
    .eq('account_id', auth.accountId)
    .single()

  if (error || !lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ lead })
}
