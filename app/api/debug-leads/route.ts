import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ACCOUNT_ID = '17bc50ca-ca35-48d2-8f3b-845a3f02698e'
const FORM_ID = '3c54f2d9-5ea9-44f2-99bb-42b9775ec9ab'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: Record<string, unknown> = {}

  // 1. Check lead_automations.email_copy for the account
  const { data: automationConfig, error: automationErr } = await admin
    .from('lead_automations')
    .select('id, email_copy, accent_color, hero_image_url')
    .eq('account_id', ACCOUNT_ID)
    .single()
  results.automation_config = automationConfig
  results.automation_err = automationErr?.message ?? null

  // 2. Try to get triggers via exec_sql RPC
  const { data: triggerData, error: triggerErr } = await admin
    .rpc('exec_sql', {
      sql: "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'leads' ORDER BY trigger_name",
    })
    .maybeSingle()
  results.triggers = triggerData
  results.trigger_err = triggerErr?.message ?? null

  // 3. Try a minimal insert to reproduce the error without form_data
  const { data: minInsert, error: minErr } = await admin
    .from('leads')
    .insert({
      account_id: ACCOUNT_ID,
      hosted_form_id: FORM_ID,
      name: 'DEBUG_ONLY',
      email: 'debug-delete-me@test.invalid',
      phone: null,
      form_type: 'quote',
      status: 'new',
    })
    .select('id')
    .single()
  results.min_insert_id = minInsert?.id ?? null
  results.min_insert_err = minErr ? { code: minErr.code, msg: minErr.message, details: String(minErr.details) } : null

  // If the minimal insert succeeded, delete the test row
  if (minInsert?.id) {
    await admin.from('leads').delete().eq('id', minInsert.id)
  }

  // 4. Try insert WITH form_data containing a newline to see if that's the diff
  if (!minInsert?.id) {
    const { data: withFd, error: withFdErr } = await admin
      .from('leads')
      .insert({
        account_id: ACCOUNT_ID,
        hosted_form_id: FORM_ID,
        name: 'DEBUG_ONLY',
        email: 'debug-delete-me@test.invalid',
        phone: null,
        form_type: 'quote',
        status: 'new',
        form_data: { test: 'line1\nline2' },
      })
      .select('id')
      .single()
    results.with_formdata_id = withFd?.id ?? null
    results.with_formdata_err = withFdErr ? { code: withFdErr.code, msg: withFdErr.message, details: String(withFdErr.details) } : null
    if (withFd?.id) await admin.from('leads').delete().eq('id', withFd.id)
  }

  return NextResponse.json(results)
}
