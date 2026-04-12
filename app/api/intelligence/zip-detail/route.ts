import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'
import { getZipDetail } from '@/lib/services/intelligence-repository'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No account found' }, { status: 404 })
  }

  const postalCode = request.nextUrl.searchParams.get('postalCode')
  if (!postalCode) {
    return NextResponse.json({ error: 'postalCode required' }, { status: 400 })
  }

  const detail = await getZipDetail(supabase, ctx.accountId, postalCode)

  return NextResponse.json(detail)
}
