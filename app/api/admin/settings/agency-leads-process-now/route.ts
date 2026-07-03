import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { processDueAgencyLeadSteps } from '@/lib/agency-leads'

export const dynamic = 'force-dynamic'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

export async function POST() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await processDueAgencyLeadSteps()
  return NextResponse.json(result)
}
