import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'
import { getZipAggregates } from '@/lib/services/intelligence-repository'

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

  const { searchParams } = request.nextUrl
  const dateFrom = searchParams.get('dateFrom') ?? undefined
  const dateTo = searchParams.get('dateTo') ?? undefined

  const aggregates = await getZipAggregates(supabase, ctx.accountId, { dateFrom, dateTo })

  return NextResponse.json(aggregates)
}
