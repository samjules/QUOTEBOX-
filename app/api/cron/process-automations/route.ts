import { NextRequest, NextResponse } from 'next/server'
import { processDueSteps } from '@/lib/process-automations'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const processed = await processDueSteps()
  return NextResponse.json({ processed })
}
