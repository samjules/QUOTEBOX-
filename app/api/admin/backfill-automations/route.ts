import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrollLead } from '@/lib/enroll-lead'
import { processDueSteps } from '@/lib/process-automations'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const since = body.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + 'T00:00:00.000Z'

  const admin = createAdminClient()

  const { data: leads, error } = await admin
    .from('leads')
    .select('id, account_id, email')
    .gte('created_at', since)
    .not('status', 'in', '("booked","lost")')
    .not('email', 'is', null)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads?.length) return NextResponse.json({ processed: 0, skipped: 0, message: 'No leads found' })

  let processed = 0
  let skipped = 0
  const accountsProcessed: string[] = []

  for (const lead of leads) {
    try {
      // Cancel any existing pending steps first (re-enrollment)
      await admin
        .from('automation_steps')
        .update({ status: 'skipped', sent_at: new Date().toISOString() })
        .eq('lead_id', lead.id)
        .eq('status', 'pending')

      const enrolled = await enrollLead(lead.id, lead.account_id)
      if (enrolled) {
        if (!accountsProcessed.includes(lead.account_id)) {
          accountsProcessed.push(lead.account_id)
        }
        processed++
      } else {
        skipped++
      }
    } catch (err) {
      console.error(`Automation backfill error for lead ${lead.id}:`, err)
      skipped++
    }
  }

  // Process all due steps for affected accounts
  for (const accountId of accountsProcessed) {
    await processDueSteps(accountId)
  }

  return NextResponse.json({ processed, skipped, since })
}
