import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PATCH: save a pixel ID into the form_config of a hosted form (JSONB merge, not full overwrite)
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  let body: { pixelId: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get all active forms for this account
  const { data: forms } = await admin
    .from('hosted_forms')
    .select('id, form_config')
    .eq('account_id', account.id)
    .eq('is_active', true)

  if (!forms || forms.length === 0) {
    return NextResponse.json({ error: 'No forms found' }, { status: 404 })
  }

  const results = []
  for (const f of forms) {
    const cfg = (f.form_config || {}) as Record<string, unknown>
    cfg.meta_pixel_id = body.pixelId || null

    const { error } = await admin
      .from('hosted_forms')
      .update({ form_config: cfg })
      .eq('id', f.id)

    results.push({ formId: f.id, error: error?.message ?? null })
  }

  return NextResponse.json({ success: true, results })
}
