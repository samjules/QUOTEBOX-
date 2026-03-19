/**
 * lib/vsl/auth.ts
 * Shared auth helper for VSL API routes.
 * Validates a Supabase JWT Bearer token from the iOS app.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface VslAuthResult {
  user: { id: string; email?: string } | null
  account: { id: string } | null
  error: string | null
}

/**
 * Extract and validate a Bearer token from the request.
 * Returns the authenticated user and their account, or an error string.
 */
export async function authenticateVslRequest(request: NextRequest): Promise<VslAuthResult> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader) {
    console.error('[vsl-auth] No Authorization header present')
    return { user: null, account: null, error: 'Missing Authorization header' }
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token || token === authHeader) {
    console.error('[vsl-auth] Malformed Authorization header:', authHeader.slice(0, 20) + '...')
    return { user: null, account: null, error: 'Invalid Authorization header format — expected "Bearer <token>"' }
  }

  const admin = createAdminClient()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) {
    console.error('[vsl-auth] auth.getUser failed:', authError?.message ?? 'no user returned')
    return { user: null, account: null, error: 'Invalid or expired token' }
  }

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (accountError || !account) {
    console.error('[vsl-auth] account lookup failed for user', user.id, accountError?.message)
    return { user: { id: user.id, email: user.email }, account: null, error: 'Account not found for this user' }
  }

  return { user: { id: user.id, email: user.email }, account, error: null }
}

/**
 * Convenience: returns a 401/404 NextResponse if auth fails, or the account if it succeeds.
 */
export async function requireVslAuth(request: NextRequest) {
  const { user, account, error } = await authenticateVslRequest(request)

  if (!user) {
    return { account: null, response: NextResponse.json({ error }, { status: 401 }) }
  }
  if (!account) {
    return { account: null, response: NextResponse.json({ error }, { status: 404 }) }
  }

  return { account, response: null }
}
