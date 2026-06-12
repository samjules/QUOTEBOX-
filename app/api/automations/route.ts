import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function getAccountId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('accounts').select('id').eq('owner_id', user.id).single()
  return data?.id ?? null
}

export async function GET() {
  const accountId = await getAccountId()
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('lead_automations')
    .select('*')
    .eq('account_id', accountId)
    .single()

  return NextResponse.json(data ?? { account_id: accountId, is_enabled: true, discount_percent: 10, default_lead_value: null })
}

export async function PUT(request: NextRequest) {
  const accountId = await getAccountId()
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // Build only the fields present in the request body so partial saves don't clobber other fields
  const patch: Record<string, unknown> = { account_id: accountId, updated_at: new Date().toISOString() }
  if ('is_enabled' in body) patch.is_enabled = Boolean(body.is_enabled)
  if ('discount_percent' in body) patch.discount_percent = Math.min(100, Math.max(0, Number(body.discount_percent) || 10))
  if ('hero_image_url' in body) patch.hero_image_url = body.hero_image_url ?? null
  if ('default_lead_value' in body) patch.default_lead_value = body.default_lead_value != null ? Math.max(0, Number(body.default_lead_value)) : null

  const { data } = await admin
    .from('lead_automations')
    .upsert(patch, { onConflict: 'account_id' })
    .select()
    .single()

  return NextResponse.json(data)
}
