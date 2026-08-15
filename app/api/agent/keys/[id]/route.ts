import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import { NextRequest, NextResponse } from 'next/server'

// Updates (or clears, with webhook_url: null) the new-lead webhook on a key.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { webhook_url }: { webhook_url?: string | null } = await request.json()

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

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('agent_api_keys')
    .select('webhook_secret')
    .eq('id', params.id)
    .eq('account_id', account.accountId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const webhookSecret = webhook_url ? existing.webhook_secret ?? `whsec_${randomBytes(24).toString('hex')}` : null

  const { data: key, error } = await admin
    .from('agent_api_keys')
    .update({ webhook_url: webhook_url || null, webhook_secret: webhookSecret })
    .eq('id', params.id)
    .eq('account_id', account.accountId)
    .select('id, name, key_prefix, scopes, webhook_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ key, webhook_secret: webhookSecret })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccountForUser(supabase, user.id)
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('agent_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('account_id', account.accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
