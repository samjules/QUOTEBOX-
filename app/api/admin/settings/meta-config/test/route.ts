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

export async function POST() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: cfg } = await admin.from('admin_meta_config').select('page_id, page_access_token').eq('id', 1).single()
  if (!cfg?.page_id || !cfg.page_access_token) {
    return NextResponse.json({ ok: false, error: 'Page ID and Page Access Token must be saved first' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${cfg.page_id}?fields=name&access_token=${cfg.page_access_token}`)
    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ ok: false, error: data.error.message ?? 'Graph API error' })
    }
    return NextResponse.json({ ok: true, pageName: data.name })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Request failed' })
  }
}
