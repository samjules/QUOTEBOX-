/**
 * POST /api/ai/generate-script
 *
 * Generate a teleprompter-friendly VSL script using Claude.
 * Requires valid Supabase JWT.
 *
 * Body:
 *   { business: string, offer: string, audience: string }
 *
 * Response:
 *   { hook: string, lines: string[], cta: string }
 */

import { createClient } from '@/lib/supabase/server'
import { generateScript } from '@/lib/ai/claude'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────────
  let body: { business?: string; offer?: string; audience?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { business, offer, audience } = body
  if (!business?.trim() || !offer?.trim() || !audience?.trim()) {
    return NextResponse.json(
      { error: 'Missing required fields: business, offer, audience' },
      { status: 400 },
    )
  }

  // ── Generate ───────────────────────────────────────────────────
  try {
    const script = await generateScript({ business, offer, audience })
    return NextResponse.json(script)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Script generation failed'
    console.error('[/api/ai/generate-script]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
