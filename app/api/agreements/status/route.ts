import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadId = request.nextUrl.searchParams.get('leadId')
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 })

  const { data: agreement } = await supabase
    .from('agreements')
    .select('id, status, created_at, signed_at, signer_name')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ agreement: agreement || null })
}
