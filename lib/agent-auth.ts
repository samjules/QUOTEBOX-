import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AgentScope =
  | 'analytics:read'
  | 'automations:read'
  | 'automations:write'
  | 'forms:read'
  | 'forms:write'

export interface AgentAuthContext {
  accountId: string
  apiKeyId: string
  scopes: AgentScope[]
}

export function hashAgentKey(plaintext: string) {
  return createHash('sha256').update(plaintext).digest('hex')
}

/**
 * Validates the `Authorization: Bearer <key>` header against agent_api_keys.
 * Returns null (caller should respond 401/403) if missing, unknown, revoked,
 * or lacking the required scope.
 */
export async function verifyAgentApiKey(
  request: NextRequest,
  requiredScope: AgentScope
): Promise<AgentAuthContext | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const plaintext = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!plaintext) return null

  const admin = createAdminClient()
  const { data: key } = await admin
    .from('agent_api_keys')
    .select('id, account_id, scopes, revoked_at')
    .eq('key_hash', hashAgentKey(plaintext))
    .single()

  if (!key || key.revoked_at) return null
  if (!key.scopes.includes(requiredScope)) return null

  admin.from('agent_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id).then()

  return { accountId: key.account_id, apiKeyId: key.id, scopes: key.scopes }
}
