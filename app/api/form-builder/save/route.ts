import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  let body: { formId: string; payload: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify form belongs to this account before updating
  const { data: existing } = await admin
    .from('hosted_forms')
    .select('id')
    .eq('id', body.formId)
    .eq('account_id', account.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  console.log('[form-builder/save] formId:', body.formId, 'payload keys:', Object.keys(body.payload))
  if (body.payload.form_config) {
    const fc = body.payload.form_config as Record<string, unknown>
    console.log('[form-builder/save] form_config.meta_pixel_id:', fc.meta_pixel_id)
  }

  const { error, data: updateResult } = await admin
    .from('hosted_forms')
    .update({ ...body.payload, account_id: account.id })
    .eq('id', body.formId)
    .select('form_config')

  console.log('[form-builder/save] update result:', JSON.stringify(updateResult), 'error:', error)

  if (error) {
    console.error('Form save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
