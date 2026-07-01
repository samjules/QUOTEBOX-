import { NextResponse } from 'next/server'
import { processFreeTrialReminders } from '@/lib/free-trial'

export const dynamic = 'force-dynamic'

// Called hourly by Vercel Cron (configured in vercel.json)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processFreeTrialReminders()
  return NextResponse.json(result)
}
