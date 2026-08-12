import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAgentApiKey } from '@/lib/agent-auth'
import type { FormConfig } from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAgentApiKey(request, 'forms:read')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: form } = await admin
    .from('hosted_forms')
    .select('id, form_name, form_type, form_config, is_active, created_at, updated_at')
    .eq('account_id', auth.accountId)
    .eq('id', params.id)
    .single()

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ form })
}

// Proposes an edit to an existing hosted form (name, active state, or config).
// Nothing is applied until the account owner approves it via
// GET/PATCH /api/agent/proposals.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAgentApiKey(request, 'forms:write')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('hosted_forms')
    .select('id')
    .eq('account_id', auth.accountId)
    .eq('id', params.id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { form_name?: string; is_active?: boolean; form_config?: FormConfig; rationale?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const changes: Record<string, unknown> = {}
  if (typeof body.form_name === 'string') changes.form_name = body.form_name
  if (typeof body.is_active === 'boolean') changes.is_active = body.is_active
  if (body.form_config) changes.form_config = body.form_config
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'No valid fields to change' }, { status: 400 })
  }

  const { data: proposal, error } = await admin
    .from('agent_proposed_changes')
    .insert({
      account_id: auth.accountId,
      api_key_id: auth.apiKeyId,
      target: 'form',
      action: 'update',
      target_id: params.id,
      changes,
      rationale: body.rationale ?? null,
    })
    .select('id, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ proposal, message: 'Queued for the account owner to approve in QuoteBox. Not applied yet.' }, { status: 202 })
}
