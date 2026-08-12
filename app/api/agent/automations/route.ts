import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAgentApiKey } from '@/lib/agent-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAgentApiKey(request, 'automations:read')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: config } = await admin
    .from('lead_automations')
    .select('is_enabled, discount_percent, updated_at')
    .eq('account_id', auth.accountId)
    .single()

  return NextResponse.json({
    config: config ?? { is_enabled: true, discount_percent: 10 },
  })
}

// Proposes a change to the account's automation config (is_enabled / discount_percent).
// Nothing is applied — the account owner approves/rejects it via
// GET/PATCH /api/agent/proposals in the QuoteBox dashboard.
export async function PATCH(request: NextRequest) {
  const auth = await verifyAgentApiKey(request, 'automations:write')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { is_enabled?: boolean; discount_percent?: number; rationale?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const changes: Record<string, unknown> = {}
  if (typeof body.is_enabled === 'boolean') changes.is_enabled = body.is_enabled
  if (typeof body.discount_percent === 'number') changes.discount_percent = body.discount_percent
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'No valid fields to change' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: proposal, error } = await admin
    .from('agent_proposed_changes')
    .insert({
      account_id: auth.accountId,
      api_key_id: auth.apiKeyId,
      target: 'automation',
      action: 'update',
      target_id: null,
      changes,
      rationale: body.rationale ?? null,
    })
    .select('id, status, changes, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ proposal, message: 'Queued for the account owner to approve in QuoteBox. Not applied yet.' }, { status: 202 })
}
