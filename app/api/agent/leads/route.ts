import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAgentApiKey } from '@/lib/agent-auth'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export async function GET(request: NextRequest) {
  const auth = await verifyAgentApiKey(request, 'leads:read')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const since = searchParams.get('since')
  const limitParam = Number(searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT
  const cursor = searchParams.get('cursor')

  const admin = createAdminClient()
  let query = admin
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at')
    .eq('account_id', auth.accountId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (since) {
    const sinceDate = new Date(since)
    if (Number.isNaN(sinceDate.getTime())) {
      return NextResponse.json({ error: 'since must be a valid ISO timestamp' }, { status: 400 })
    }
    query = query.gte('created_at', sinceDate.toISOString())
  }
  if (cursor) {
    const [cursorCreatedAt, cursorId] = cursor.split('|')
    if (!cursorCreatedAt || !cursorId) {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
    }
    query = query.or(
      `created_at.gt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.gt.${cursorId})`
    )
  }

  const { data: leads, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = leads ?? []
  const last = results[results.length - 1]
  const next_cursor = results.length === limit && last ? `${last.created_at}|${last.id}` : null

  return NextResponse.json({ leads: results, next_cursor })
}
