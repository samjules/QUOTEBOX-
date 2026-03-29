import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH: save meta_page_id on the authenticated user's account
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

  let body: { pageId: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { error } = await supabase
    .from('accounts')
    .update({ meta_page_id: body.pageId || null })
    .eq('id', account.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
