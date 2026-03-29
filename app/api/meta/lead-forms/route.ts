import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET — fetch lead gen forms from the user's Meta page
// Accepts optional ?pageId= query param to avoid needing the DB value
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account, error: accountErr } = await admin
    .from('accounts')
    .select('meta_access_token, meta_page_id, meta_allowed_form_ids')
    .eq('owner_id', user.id)
    .single()

  console.log('[lead-forms] user.id:', user.id)
  console.log('[lead-forms] account lookup error:', accountErr ? JSON.stringify(accountErr) : 'none')
  console.log('[lead-forms] account found:', !!account)
  console.log('[lead-forms] has meta_access_token:', !!account?.meta_access_token)
  console.log('[lead-forms] meta_page_id:', account?.meta_page_id ?? 'null')
  console.log('[lead-forms] SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('[lead-forms] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!account?.meta_access_token) {
    return NextResponse.json({
      error: 'Meta not connected',
      debug: {
        accountFound: !!account,
        accountErr: accountErr?.message ?? null,
        userId: user.id,
        serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    }, { status: 400 })
  }

  // Use query param if provided, fall back to DB value
  const pageId = request.nextUrl.searchParams.get('pageId') || account.meta_page_id
  if (!pageId) {
    return NextResponse.json({ error: 'No page selected' }, { status: 400 })
  }

  // Get page access token
  const pageRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${account.meta_access_token}`
  )
  const pageData = await pageRes.json()
  if (!pageData.access_token) {
    return NextResponse.json({ error: 'Failed to get page token' }, { status: 502 })
  }

  // Fetch lead gen forms
  const formsRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?fields=id,name,status,created_time&limit=100&access_token=${pageData.access_token}`
  )
  const formsData = await formsRes.json()

  if (formsData.error) {
    return NextResponse.json({ error: formsData.error.message || 'Failed to fetch forms' }, { status: 502 })
  }

  return NextResponse.json({
    forms: formsData.data || [],
    allowedFormIds: account.meta_allowed_form_ids || [],
  })
}

// PATCH — save which form IDs the user wants to receive leads from
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  let body: { formIds: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { error } = await admin
    .from('accounts')
    .update({ meta_allowed_form_ids: body.formIds })
    .eq('id', account.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
