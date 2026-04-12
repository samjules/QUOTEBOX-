import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreLead } from '@/lib/services/lead-scoring'

/**
 * POST /api/cron/score-leads
 * Nightly cron job to re-score all intelligence leads.
 * Protected by CRON_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all unscored or stale leads (scored > 24h ago or never)
  const oneDayAgo = new Date(Date.now() - 86400_000).toISOString()

  const { data: leads } = await supabase
    .from('intelligence_leads')
    .select('id')
    .or(`scored_at.is.null,scored_at.lt.${oneDayAgo}`)
    .limit(500) // batch size

  if (!leads || leads.length === 0) {
    return NextResponse.json({ scored: 0 })
  }

  let scored = 0
  let errors = 0

  for (const lead of leads) {
    try {
      await scoreLead(supabase, lead.id)
      scored++
    } catch (err) {
      console.error(`[cron/score-leads] Failed to score ${lead.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ scored, errors, total: leads.length })
}

// Also support GET for Vercel cron
export async function GET(request: NextRequest) {
  return POST(request)
}
