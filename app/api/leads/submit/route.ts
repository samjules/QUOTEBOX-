import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Use service role key to bypass RLS — FK constraint check on hosted_form_id
  // fails for anon users when hosted_forms has RLS enabled.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let body: {
    account_id: string
    hosted_form_id: string
    name: string
    email: string
    phone: string | null
    form_type: string
    form_data: Record<string, unknown>
    status: 'new' | 'held'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate the hosted form actually exists and is active
  const { data: form, error: formError } = await supabaseAdmin
    .from('hosted_forms')
    .select('id, is_active')
    .eq('id', body.hosted_form_id)
    .single()

  if (formError || !form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  if (!form.is_active) {
    return NextResponse.json({ error: 'This form is no longer active' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('leads').insert({
    account_id: body.account_id,
    hosted_form_id: body.hosted_form_id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    form_type: body.form_type,
    form_data: body.form_data,
    status: body.status,
  })

  if (error) {
    console.error('Lead insert error:', error)
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
