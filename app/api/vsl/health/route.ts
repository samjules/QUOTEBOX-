/**
 * GET /api/vsl/health
 *
 * Health check endpoint — tests each dependency (Supabase, Claude)
 * without requiring auth. For debugging only.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

export async function GET() {
  const results: Record<string, string> = {}

  // Check env vars
  results.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? 'set' : 'MISSING'
  results.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING'
  results.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'

  // Test Supabase connection
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('vsl_campaigns')
      .select('*', { count: 'exact', head: true })
    if (error) {
      results.supabase = `ERROR: ${error.message}`
    } else {
      results.supabase = `OK (${count} campaigns)`
    }
  } catch (err) {
    results.supabase = `EXCEPTION: ${err instanceof Error ? err.message : String(err)}`
  }

  // Test Claude API
  try {
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await claude.messages.create({
      model: 'claude-sonnet-4-5-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    })
    const block = message.content[0]
    results.claude = `OK: ${block.type === 'text' ? block.text : block.type}`
  } catch (err) {
    results.claude = `EXCEPTION: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`
  }

  const allOk = results.supabase?.startsWith('OK') && results.claude?.startsWith('OK')

  return NextResponse.json({ status: allOk ? 'healthy' : 'unhealthy', ...results })
}
