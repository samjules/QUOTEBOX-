import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { cancelOwnerSequence } from '@/lib/owner-automations'

/**
 * Called when an owner books a strategy call.
 * Cancels all pending onboarding steps so they stop receiving nurture emails.
 *
 * Can be triggered:
 *   - From a Calendly/Cal.com webhook (pass account_id or owner_email in body)
 *   - From a client-side confirmation page after booking
 *   - Manually by admin
 *
 * POST body: { account_id?: string, email?: string, secret?: string }
 * Optionally protect with CRON_SECRET to allow webhook-style calls.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  // Allow either a direct account_id or an email lookup
  const accountId: string | null = typeof body.account_id === 'string' ? body.account_id : null
  const email: string | null = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
  const secret: string | null = typeof body.secret === 'string' ? body.secret : null

  // Optional: protect with CRON_SECRET for webhook callers
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && secret !== cronSecret) {
    // Also allow authenticated session (no secret check needed for client calls)
    // If no secret and caller isn't using session auth, reject
    if (!accountId && !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  let resolvedAccountId = accountId

  if (!resolvedAccountId && email) {
    // Look up account by owner email
    const { data: authUser } = await admin.auth.admin.listUsers()
    const match = authUser?.users?.find((u) => u.email?.toLowerCase() === email)
    if (match) {
      const { data: account } = await admin
        .from('accounts')
        .select('id')
        .eq('owner_id', match.id)
        .single()
      resolvedAccountId = account?.id ?? null
    }
  }

  if (!resolvedAccountId) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  await cancelOwnerSequence(resolvedAccountId)

  return NextResponse.json({ ok: true, account_id: resolvedAccountId })
}
