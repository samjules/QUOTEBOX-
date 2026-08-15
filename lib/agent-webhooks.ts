import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Lead } from '@/lib/types'

// Fires the agent-configured webhook(s) for an account when a new lead is
// created, so an external CRM doesn't have to poll GET /api/agent/leads.
// Best-effort: failures are logged, never thrown, and never block lead intake.
export async function notifyLeadWebhooks(accountId: string, lead: Lead) {
  try {
    const admin = createAdminClient()
    const { data: keys } = await admin
      .from('agent_api_keys')
      .select('id, webhook_url, webhook_secret, scopes, revoked_at')
      .eq('account_id', accountId)
      .is('revoked_at', null)
      .not('webhook_url', 'is', null)

    const targets = (keys ?? []).filter((k) => k.scopes.includes('leads:read'))
    if (targets.length === 0) return

    const payload = {
      event: 'lead.created',
      created_at: new Date().toISOString(),
      lead,
    }
    const body = JSON.stringify(payload)

    await Promise.all(
      targets.map(async (key) => {
        const signature = key.webhook_secret
          ? createHmac('sha256', key.webhook_secret).update(body).digest('hex')
          : null

        try {
          const res = await fetch(key.webhook_url as string, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(signature ? { 'X-QuoteBox-Signature': `sha256=${signature}` } : {}),
            },
            body,
          })
          if (!res.ok) {
            console.error(`Agent webhook ${key.id} responded ${res.status}`)
          }
        } catch (err) {
          console.error(`Agent webhook ${key.id} delivery failed:`, err)
        }
      })
    )
  } catch (err) {
    console.error('notifyLeadWebhooks error:', err)
  }
}
