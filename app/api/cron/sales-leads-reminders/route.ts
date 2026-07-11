import { NextResponse } from 'next/server'
import { processSalesLeadReminders } from '@/lib/sales-lead-notify'

export const dynamic = 'force-dynamic'

// Called daily by Vercel Cron (configured in vercel.json)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processSalesLeadReminders()
  return NextResponse.json(result)
}
