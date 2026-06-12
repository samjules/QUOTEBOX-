import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await supabase
    .from('accounts')
    .select('meta_access_token, meta_ad_account_id')
    .eq('owner_id', user.id)
    .single()

  if (!account?.meta_access_token || !account?.meta_ad_account_id) {
    return NextResponse.json({ error: 'Meta not connected' }, { status: 400 })
  }

  const { meta_access_token: token, meta_ad_account_id: adAccountId } = account

  const dateRange = request.nextUrl.searchParams.get('dateRange') || '30'
  const datePreset = dateRange === '7' ? 'last_7d' : dateRange === '14' ? 'last_14d' : 'last_30d'

  const fields = `id,name,status,objective,daily_budget,created_time,insights.date_preset(${datePreset}){spend,impressions,clicks,actions}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=${encodeURIComponent(fields)}&access_token=${token}&limit=50`
    )
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch campaigns' },
        { status: 400 }
      )
    }

    const campaigns = (data.data || []).map((c: Record<string, unknown>) => {
      const insightsData = (c.insights as { data?: Array<Record<string, unknown>> } | undefined)?.data?.[0] || {}
      const actions = (insightsData.actions as Array<{ action_type: string; value: string }> | undefined) || []
      const leadAction = actions.find((a) => a.action_type === 'lead')
      const leadCount = leadAction ? parseFloat(leadAction.value) : 0
      const spend = parseFloat((insightsData.spend as string) || '0')
      const cpl = leadCount > 0 ? spend / leadCount : 0

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        daily_budget: c.daily_budget,
        created_time: c.created_time,
        insights: {
          spend,
          impressions: parseInt((insightsData.impressions as string) || '0', 10),
          clicks: parseInt((insightsData.clicks as string) || '0', 10),
          leads: leadCount,
          cpl,
        },
      }
    })

    return NextResponse.json({ campaigns })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}
