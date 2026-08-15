import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import { hashAgentKey, type AgentScope } from '@/lib/agent-auth'
import { NextRequest, NextResponse } from 'next/server'

const VALID_SCOPES: AgentScope[] = [
  'analytics:read',
  'automations:read',
  'automations:write',
  'forms:read',
  'forms:write',
  'leads:read',
]

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()
  const { data: keys } = await admin
    .from('agent_api_keys')
    .select('id, name, key_prefix, scopes, webhook_url, last_used_at, revoked_at, created_at')
    .eq('account_id', account.accountId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys ?? [] })
}

// Mints a new key. The plaintext is returned exactly once — only its hash is stored.
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, scopes, webhook_url }: { name?: string; scopes?: string[]; webhook_url?: string } = await request.json()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const requestedScopes = (scopes ?? []).filter((s): s is AgentScope => VALID_SCOPES.includes(s as AgentScope))
  if (requestedScopes.length === 0) {
    return NextResponse.json({ error: `scopes must include at least one of: ${VALID_SCOPES.join(', ')}` }, { status: 400 })
  }

  if (webhook_url) {
    try {
      const parsed = new URL(webhook_url)
      if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'webhook_url must be an https:// URL' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'webhook_url must be a valid URL' }, { status: 400 })
    }
  }

  const plaintext = `qbk_${randomBytes(24).toString('hex')}`
  const webhookSecret = webhook_url ? `whsec_${randomBytes(24).toString('hex')}` : null

  const admin = createAdminClient()
  const { data: key, error } = await admin
    .from('agent_api_keys')
    .insert({
      account_id: account.accountId,
      name,
      key_hash: hashAgentKey(plaintext),
      key_prefix: plaintext.slice(0, 12),
      scopes: requestedScopes,
      webhook_url: webhook_url || null,
      webhook_secret: webhookSecret,
    })
    .select('id, name, key_prefix, scopes, webhook_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ key, plaintext, webhook_secret: webhookSecret }, { status: 201 })
}
