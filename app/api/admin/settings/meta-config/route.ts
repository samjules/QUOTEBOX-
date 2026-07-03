import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

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
  const { data } = await admin
    .from('admin_meta_config')
    .select('meta_access_token, meta_user_id, meta_page_id, meta_allowed_form_ids')
    .eq('id', 1)
    .single()

  const connected = !!data?.meta_access_token
  let pages: Array<{ id: string; name: string }> = []
  if (connected) {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${data!.meta_access_token}`)
      const d = await res.json()
      pages = d.data || []
    } catch {
      // pages will just be empty
    }
  }

  return NextResponse.json({
    connected,
    meta_user_id: data?.meta_user_id ?? null,
    meta_page_id: data?.meta_page_id ?? '',
    meta_allowed_form_ids: data?.meta_allowed_form_ids ?? [],
    pages,
  })
}

export async function DELETE() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { error } = await admin.from('admin_meta_config').update({
    meta_access_token: null,
    meta_user_id: null,
    meta_page_id: null,
    meta_allowed_form_ids: [],
    meta_connected_at: null,
  }).eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
