import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('admin_meta_config').select('page_id, page_access_token, allowed_form_ids').eq('id', 1).single()
  return NextResponse.json({
    page_id: data?.page_id ?? '',
    allowed_form_ids: data?.allowed_form_ids ?? [],
    has_token: !!data?.page_access_token,
  })
}

export async function PUT(request: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const admin = createAdminClient()

  const patch: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() }
  if ('page_id' in body) patch.page_id = body.page_id || null
  if ('allowed_form_ids' in body) patch.allowed_form_ids = body.allowed_form_ids ?? []
  if (typeof body.page_access_token === 'string' && body.page_access_token.trim()) {
    patch.page_access_token = body.page_access_token.trim()
  }

  const { data, error } = await admin.from('admin_meta_config').upsert(patch, { onConflict: 'id' }).select('page_id, page_access_token, allowed_form_ids').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    page_id: data.page_id ?? '',
    allowed_form_ids: data.allowed_form_ids ?? [],
    has_token: !!data.page_access_token,
  })
}
