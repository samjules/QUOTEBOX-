// Meta Marketing API — ad account spend/performance. Separate credential from
// the Conversions API token (that one only needs ads_management/leads
// permission to send events; this needs ads_read on the ad account).
const API_VERSION = 'v25.0'

export interface MetaCampaignSpend {
  campaignName: string
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
}

export interface MetaAdSpendSummary {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  campaigns: MetaCampaignSpend[]
  datePreset: string
}

export async function getMetaAdSpend(datePreset: string = 'last_30d'): Promise<MetaAdSpendSummary | null> {
  const token = process.env.META_MARKETING_ACCESS_TOKEN
  const adAccountId = process.env.META_AD_ACCOUNT_ID
  if (!token || !adAccountId) return null

  const acct = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
  const fields = 'campaign_name,spend,impressions,clicks,cpc,ctr'
  const url = `https://graph.facebook.com/${API_VERSION}/${acct}/insights?level=campaign&fields=${fields}&date_preset=${datePreset}&limit=100&access_token=${token}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error('Meta Ads Insights error:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    const rows: Array<Record<string, string>> = data.data ?? []
    const campaigns: MetaCampaignSpend[] = rows.map((r) => ({
      campaignName: r.campaign_name ?? 'Unknown campaign',
      spend: parseFloat(r.spend ?? '0'),
      impressions: parseInt(r.impressions ?? '0', 10),
      clicks: parseInt(r.clicks ?? '0', 10),
      cpc: parseFloat(r.cpc ?? '0'),
      ctr: parseFloat(r.ctr ?? '0'),
    })).sort((a, b) => b.spend - a.spend)

    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)

    return { totalSpend, totalImpressions, totalClicks, campaigns, datePreset }
  } catch (err) {
    console.error('Meta Ads Insights request failed:', err)
    return null
  }
}
