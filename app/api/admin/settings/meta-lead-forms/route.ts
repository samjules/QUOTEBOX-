import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase()) ? user : null
}

// GET — fetch lead gen forms from the admin's connected Meta page
export async function GET(request: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: cfg } = await admin
    .from('admin_meta_config')
    .select('meta_access_token, meta_page_id, meta_allowed_form_ids')
    .eq('id', 1)
    .single()

  if (!cfg?.meta_access_token) {
    return NextResponse.json({ error: 'Meta not connected' }, { status: 400 })
  }

  const pageId = request.nextUrl.searchParams.get('pageId') || cfg.meta_page_id
  if (!pageId) {
    return NextResponse.json({ error: 'No page selected' }, { status: 400 })
  }

  const pageRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${cfg.meta_access_token}`
  )
  const pageData = await pageRes.json()
  if (pageData.error || !pageData.access_token) {
    return NextResponse.json({ error: 'Failed to get page token' }, { status: 502 })
  }

  const formsRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?fields=id,name,status,created_time&limit=100&access_token=${pageData.access_token}`
  )
  const formsData = await formsRes.json()

  if (formsData.error) {
    if (formsData.error.code === 200) {
      return NextResponse.json({ error: 'permission_required', message: formsData.error.message }, { status: 403 })
    }
    return NextResponse.json({ error: formsData.error.message || 'Failed to fetch forms' }, { status: 502 })
  }

  return NextResponse.json({
    forms: formsData.data || [],
    allowedFormIds: cfg.meta_allowed_form_ids || [],
  })
}

// PATCH — save which form IDs should send leads into sales_leads
export async function PATCH(request: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { formIds: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('admin_meta_config')
    .update({ meta_allowed_form_ids: body.formIds })
    .eq('id', 1)

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json({ success: true })
}
