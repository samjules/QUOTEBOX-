import { NextResponse } from 'next/server'
import { processDueAgencyLeadSteps } from '@/lib/agency-leads'

export const dynamic = 'force-dynamic'

// Called daily by Vercel Cron (configured in vercel.json) — Vercel Hobby plan
// caps cron jobs to once/day regardless of schedule expression. Day 0 email
// still fires instantly at enrollment; everything else, including the 10-min
// SMS, goes out on the next daily pass.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processDueAgencyLeadSteps()
  return NextResponse.json(result)
}
