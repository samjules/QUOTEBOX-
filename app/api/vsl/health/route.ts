/**
 * GET /api/vsl/health
 * Debug endpoint — shows recent campaigns and their status.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  const admin = createAdminClient()

  const { data: campaigns, error } = await admin
    .from('vsl_campaigns')
    .select('id, account_id, title, status, current_step, raw_video_url, processed_video_url, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'set' : 'MISSING',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'MISSING',
      INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ? 'set' : 'MISSING',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
    },
    campaigns: campaigns ?? [],
    error: error?.message ?? null,
  })
}
