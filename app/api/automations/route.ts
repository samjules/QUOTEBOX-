import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function getAccount(): Promise<{ id: string; business_name: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('accounts').select('id, business_name').eq('owner_id', user.id).single()
  return data ?? null
}

export async function GET() {
  const account = await getAccount()
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('lead_automations')
    .select('*')
    .eq('account_id', account.id)
    .single()

  return NextResponse.json({
    ...(data ?? { account_id: account.id, is_enabled: true, discount_percent: 10, default_lead_value: null }),
    business_name: account.business_name,
  })
}

export async function PUT(request: NextRequest) {
  const account = await getAccount()
  const accountId = account?.id
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // Build only the fields present in the request body so partial saves don't clobber other fields
  const patch: Record<string, unknown> = { account_id: accountId, updated_at: new Date().toISOString() }
  if ('is_enabled' in body) patch.is_enabled = Boolean(body.is_enabled)
  if ('discount_percent' in body) patch.discount_percent = Math.min(100, Math.max(0, Number(body.discount_percent) || 10))
  if ('hero_image_url' in body) patch.hero_image_url = body.hero_image_url ?? null
  if ('default_lead_value' in body) patch.default_lead_value = body.default_lead_value != null ? Math.max(0, Number(body.default_lead_value)) : null
  if ('accent_color' in body) patch.accent_color = typeof body.accent_color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.accent_color) ? body.accent_color : '#5b50d6'

  const { data } = await admin
    .from('lead_automations')
    .upsert(patch, { onConflict: 'account_id' })
    .select()
    .single()

  return NextResponse.json(data)
}
