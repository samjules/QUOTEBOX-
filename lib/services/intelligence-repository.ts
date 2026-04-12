/**
 * Intelligence data access layer.
 * All queries scoped by accountId for row-level isolation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ZipAggregate {
  postal_code: string
  city: string
  region: string
  latitude: number
  longitude: number
  lead_count: number
  avg_quality_score: number
  top_quality: string
}

export interface LeadRow {
  id: string
  postal_code: string | null
  city: string | null
  region: string | null
  quality: string
  quality_score: number
  created_at: string
  outcome_status: string | null
  actual_value: number | null
}

export interface ZipDetail {
  postal_code: string
  city: string
  state: string
  latitude: number
  longitude: number
  median_income: number | null
  population: number | null
  lead_count: number
  avg_quality_score: number
  close_rate: number
  avg_job_value: number
}

export interface OutcomeSummary {
  total_leads: number
  scored_leads: number
  won: number
  lost: number
  close_rate: number
  avg_job_value: number
  total_revenue: number
}

export async function getZipAggregates(
  supabase: SupabaseClient,
  accountId: string,
  filters?: { dateFrom?: string; dateTo?: string }
): Promise<ZipAggregate[]> {
  // Use RPC or raw query via admin client
  // For now, fetch leads and aggregate in JS
  let query = supabase
    .from('intelligence_leads')
    .select('postal_code, city, region, latitude, longitude, quality, quality_score')
    .eq('account_id', accountId)
    .not('postal_code', 'is', null)

  if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)

  const { data: leads } = await query

  if (!leads || leads.length === 0) return []

  const byZip = new Map<string, typeof leads>()
  for (const lead of leads) {
    const key = lead.postal_code!
    if (!byZip.has(key)) byZip.set(key, [])
    byZip.get(key)!.push(lead)
  }

  return Array.from(byZip.entries()).map(([postal_code, zipLeads]) => {
    const first = zipLeads[0]!
    const avgScore = zipLeads.reduce((s, l) => s + (l.quality_score ?? 0), 0) / zipLeads.length
    const qualities = zipLeads.map(l => l.quality).filter(Boolean)
    const topQuality = qualities.includes('hot') ? 'hot'
      : qualities.includes('warm') ? 'warm'
      : qualities.includes('cool') ? 'cool'
      : 'cold'

    return {
      postal_code,
      city: first.city ?? '',
      region: first.region ?? '',
      latitude: first.latitude ?? 0,
      longitude: first.longitude ?? 0,
      lead_count: zipLeads.length,
      avg_quality_score: Math.round(avgScore * 100) / 100,
      top_quality: topQuality,
    }
  })
}

export async function getLeadsForTable(
  supabase: SupabaseClient,
  accountId: string,
  filters?: { postalCode?: string; quality?: string; dateFrom?: string; dateTo?: string }
): Promise<LeadRow[]> {
  let query = supabase
    .from('intelligence_leads')
    .select(`
      id, postal_code, city, region, quality, quality_score, created_at,
      outcomes(status, actual_value)
    `)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (filters?.postalCode) query = query.eq('postal_code', filters.postalCode)
  if (filters?.quality) query = query.eq('quality', filters.quality)
  if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)

  const { data } = await query
  if (!data) return []

  return data.map((row: any) => ({
    id: row.id,
    postal_code: row.postal_code,
    city: row.city,
    region: row.region,
    quality: row.quality,
    quality_score: row.quality_score,
    created_at: row.created_at,
    outcome_status: row.outcomes?.[0]?.status ?? null,
    actual_value: row.outcomes?.[0]?.actual_value ?? null,
  }))
}

export async function getZipDetail(
  supabase: SupabaseClient,
  accountId: string,
  postalCode: string,
): Promise<ZipDetail | null> {
  // Get enrichment data
  const { data: enrichment } = await supabase
    .from('zip_enrichment')
    .select('*')
    .eq('postal_code', postalCode)
    .single()

  // Get leads for this zip
  const { data: leads } = await supabase
    .from('intelligence_leads')
    .select('id, quality_score, city')
    .eq('account_id', accountId)
    .eq('postal_code', postalCode)

  // Get outcomes
  const leadIds = leads?.map(l => l.id) ?? []
  let wonCount = 0
  let lostCount = 0
  let totalValue = 0

  if (leadIds.length > 0) {
    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('status, actual_value')
      .in('intelligence_lead_id', leadIds)

    if (outcomes) {
      for (const o of outcomes) {
        if (o.status === 'won') {
          wonCount++
          totalValue += o.actual_value ?? 0
        } else {
          lostCount++
        }
      }
    }
  }

  const totalOutcomes = wonCount + lostCount

  return {
    postal_code: postalCode,
    city: enrichment?.city ?? leads?.[0]?.city ?? '',
    state: enrichment?.state ?? '',
    latitude: enrichment?.latitude ?? 0,
    longitude: enrichment?.longitude ?? 0,
    median_income: enrichment?.median_income ?? null,
    population: enrichment?.population ?? null,
    lead_count: leads?.length ?? 0,
    avg_quality_score: leads && leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + (l.quality_score ?? 0), 0) / leads.length * 100) / 100
      : 0,
    close_rate: totalOutcomes > 0 ? wonCount / totalOutcomes : 0,
    avg_job_value: wonCount > 0 ? totalValue / wonCount : 0,
  }
}

export async function getOutcomeSummary(
  supabase: SupabaseClient,
  accountId: string,
): Promise<OutcomeSummary> {
  const { data: leads } = await supabase
    .from('intelligence_leads')
    .select('id, scored_at')
    .eq('account_id', accountId)

  const totalLeads = leads?.length ?? 0
  const scoredLeads = leads?.filter(l => l.scored_at).length ?? 0

  const leadIds = leads?.map(l => l.id) ?? []
  let won = 0
  let lost = 0
  let totalRevenue = 0

  if (leadIds.length > 0) {
    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('status, actual_value')
      .in('intelligence_lead_id', leadIds)

    if (outcomes) {
      for (const o of outcomes) {
        if (o.status === 'won') {
          won++
          totalRevenue += o.actual_value ?? 0
        } else {
          lost++
        }
      }
    }
  }

  return {
    total_leads: totalLeads,
    scored_leads: scoredLeads,
    won,
    lost,
    close_rate: (won + lost) > 0 ? won / (won + lost) : 0,
    avg_job_value: won > 0 ? totalRevenue / won : 0,
    total_revenue: totalRevenue,
  }
}
