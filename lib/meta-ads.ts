// Meta Marketing API — ad account spend/performance. Reuses the exact same
// per-account connection every customer already uses (accounts.meta_access_token
// / accounts.meta_ad_account_id, set via the in-app Meta OAuth connect flow —
// see app/api/meta/connect, app/api/meta/callback, and the working query shape
// in app/api/meta/campaigns/route.ts) rather than a separate global credential.
export interface MetaCampaignSpend {
  campaignName: string
  spend: number
  impressions: number
  clicks: number
  leads: number
  cpl: number
}

export interface MetaAdSpendSummary {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalLeads: number
  campaigns: MetaCampaignSpend[]
}

export async function getMetaAdSpend(token: string, adAccountId: string, datePreset: string = 'last_30d'): Promise<MetaAdSpendSummary | null> {
  const fields = `id,name,status,objective,daily_budget,created_time,insights.date_preset(${datePreset}){spend,impressions,clicks,actions}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=${encodeURIComponent(fields)}&access_token=${token}&limit=50`
    )
    const data = await res.json()
    if (!res.ok) {
      console.error('Meta Ads campaigns error:', data.error?.message ?? res.status)
      return null
    }

    const campaigns: MetaCampaignSpend[] = (data.data ?? []).map((c: Record<string, unknown>) => {
      const insightsData = (c.insights as { data?: Array<Record<string, unknown>> } | undefined)?.data?.[0] || {}
      const actions = (insightsData.actions as Array<{ action_type: string; value: string }> | undefined) || []
      const leadAction = actions.find((a) => a.action_type === 'lead')
      const leadCount = leadAction ? parseFloat(leadAction.value) : 0
      const spend = parseFloat((insightsData.spend as string) || '0')
      return {
        campaignName: (c.name as string) ?? 'Unnamed campaign',
        spend,
        impressions: parseInt((insightsData.impressions as string) || '0', 10),
        clicks: parseInt((insightsData.clicks as string) || '0', 10),
        leads: leadCount,
        cpl: leadCount > 0 ? spend / leadCount : 0,
      }
    }).sort((a: MetaCampaignSpend, b: MetaCampaignSpend) => b.spend - a.spend)

    return {
      totalSpend: campaigns.reduce((s, c) => s + c.spend, 0),
      totalImpressions: campaigns.reduce((s, c) => s + c.impressions, 0),
      totalClicks: campaigns.reduce((s, c) => s + c.clicks, 0),
      totalLeads: campaigns.reduce((s, c) => s + c.leads, 0),
      campaigns,
    }
  } catch (err) {
    console.error('Meta Ads campaigns request failed:', err)
    return null
  }
}
