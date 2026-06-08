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

  return NextResponse.json(data ?? { account_id: accountId, is_enabled: true, discount_percent: 10 })
}

export async function PUT(request: NextRequest) {
  const accountId = await getAccountId()
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  const { data } = await admin
    .from('lead_automations')
    .upsert(
      {
        account_id: accountId,
        is_enabled: Boolean(body.is_enabled),
        discount_percent: Math.min(100, Math.max(0, Number(body.discount_percent) || 10)),
        hero_image_url: body.hero_image_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_id' }
    )
    .select()
    .single()

  return NextResponse.json(data)
}
