import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAgentApiKey } from '@/lib/agent-auth'
import type { FormConfig } from '@/lib/types'

export async function GET(request: NextRequest) {
  const auth = await verifyAgentApiKey(request, 'forms:read')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: forms } = await admin
    .from('hosted_forms')
    .select('id, form_name, form_type, form_config, is_active, created_at, updated_at')
    .eq('account_id', auth.accountId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ forms: forms ?? [] })
}

// Proposes a brand-new hosted form. Nothing is created until the account
// owner approves it via GET/PATCH /api/agent/proposals.
export async function POST(request: NextRequest) {
  const auth = await verifyAgentApiKey(request, 'forms:write')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { form_name?: string; form_type?: string; form_config?: FormConfig; rationale?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.form_name || !body.form_type || !body.form_config) {
    return NextResponse.json({ error: 'form_name, form_type, and form_config are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: proposal, error } = await admin
    .from('agent_proposed_changes')
    .insert({
      account_id: auth.accountId,
      api_key_id: auth.apiKeyId,
      target: 'form',
      action: 'create',
      target_id: null,
      changes: {
        form_name: body.form_name,
        form_type: body.form_type,
        form_config: body.form_config,
      },
      rationale: body.rationale ?? null,
    })
    .select('id, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ proposal, message: 'Queued for the account owner to approve in QuoteBox. Not created yet.' }, { status: 202 })
}
