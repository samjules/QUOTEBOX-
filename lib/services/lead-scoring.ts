/**
 * Lead Intelligence Scoring Service
 *
 * Score formula (0-100):
 *   40% engagement (time on page, scroll depth, field interactions)
 *   30% zip quality (median income, population density)
 *   30% outcome feedback (close rate, avg job value from outcomes)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

interface SessionEvents {
  time_seconds: number
  max_scroll: number
  field_focuses: number
  form_submitted: boolean
}

interface ZipData {
  median_income: number | null
  population: number | null
}

interface OutcomeStats {
  close_rate: number // 0-1
  avg_value: number
}

function computeEngagement(events: SessionEvents): number {
  // Time: 0-60s → 0-30pts, 60-300s → 30-40pts (diminishing returns)
  const timePts = events.time_seconds <= 60
    ? (events.time_seconds / 60) * 30
    : 30 + Math.min((events.time_seconds - 60) / 240, 1) * 10

  // Scroll: 0-100% → 0-25pts
  const scrollPts = (events.max_scroll / 100) * 25

  // Field focuses: 0-5+ → 0-15pts
  const fieldPts = Math.min(events.field_focuses / 5, 1) * 15

  // Form submit: 10pts
  const submitPts = events.form_submitted ? 10 : 0

  return Math.min(timePts + scrollPts + fieldPts + submitPts, 100)
}

function computeZipQuality(zip: ZipData | null): number {
  if (!zip) return 50 // neutral if no data

  // Income: $30k → 20, $75k → 60, $120k+ → 100
  const incomeScore = zip.median_income
    ? Math.min(Math.max((zip.median_income - 30000) / 90000, 0), 1) * 100
    : 50

  // Population: smaller = less competition, score higher for mid-range
  const popScore = zip.population
    ? zip.population < 5000 ? 40
      : zip.population < 50000 ? 80
      : zip.population < 200000 ? 60
      : 40
    : 50

  return incomeScore * 0.7 + popScore * 0.3
}

function computeOutcomeScore(stats: OutcomeStats | null): number {
  if (!stats || (stats.close_rate === 0 && stats.avg_value === 0)) return 50

  // Close rate: 0 → 0, 0.5+ → 100
  const closePts = Math.min(stats.close_rate / 0.5, 1) * 60

  // Avg value: $0 → 0, $5000+ → 40
  const valuePts = Math.min(stats.avg_value / 5000, 1) * 40

  return closePts + valuePts
}

function qualityLabel(score: number): 'hot' | 'warm' | 'cool' | 'cold' {
  if (score >= 75) return 'hot'
  if (score >= 55) return 'warm'
  if (score >= 35) return 'cool'
  return 'cold'
}

/**
 * Score a single intelligence lead. Call from cron or on-demand.
 */
export async function scoreLead(
  supabase: SupabaseClient,
  leadId: string,
): Promise<{ quality_score: number; quality: string }> {
  // 1. Get lead + session
  const { data: lead } = await supabase
    .from('intelligence_leads')
    .select('id, session_id, postal_code, account_id')
    .eq('id', leadId)
    .single()

  if (!lead) throw new Error(`Lead ${leadId} not found`)

  // 2. Aggregate session events
  let events: SessionEvents = {
    time_seconds: 0,
    max_scroll: 0,
    field_focuses: 0,
    form_submitted: false,
  }

  if (lead.session_id) {
    const { data: rawEvents } = await supabase
      .from('pixel_events')
      .select('event_type, payload')
      .eq('session_id', lead.session_id)

    if (rawEvents) {
      for (const ev of rawEvents) {
        const p = ev.payload as Record<string, any> ?? {}
        switch (ev.event_type) {
          case 'time_on_page':
          case 'session_end':
            events.time_seconds = Math.max(events.time_seconds, p.seconds ?? 0)
            break
          case 'scroll_depth':
            events.max_scroll = Math.max(events.max_scroll, p.depth ?? 0)
            break
          case 'field_focus':
            events.field_focuses++
            break
          case 'form_submit_detected':
            events.form_submitted = true
            break
        }
      }
    }
  }

  // 3. Zip enrichment
  let zipData: ZipData | null = null
  if (lead.postal_code) {
    const { data: zip } = await supabase
      .from('zip_enrichment')
      .select('median_income, population')
      .eq('postal_code', lead.postal_code)
      .single()
    zipData = zip
  }

  // 4. Outcome stats for this zip
  let outcomeStats: OutcomeStats | null = null
  if (lead.postal_code) {
    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('status, actual_value, intelligence_lead_id')
      .in('intelligence_lead_id',
        supabase.from('intelligence_leads')
          .select('id')
          .eq('account_id', lead.account_id)
          .eq('postal_code', lead.postal_code) as any
      )

    if (outcomes && outcomes.length > 0) {
      const won = outcomes.filter(o => o.status === 'won')
      outcomeStats = {
        close_rate: won.length / outcomes.length,
        avg_value: won.length > 0
          ? won.reduce((s, o) => s + (o.actual_value ?? 0), 0) / won.length
          : 0,
      }
    }
  }

  // 5. Compute scores
  const engagementScore = computeEngagement(events)
  const zipQualityScore = computeZipQuality(zipData)
  const outcomeScoreVal = computeOutcomeScore(outcomeStats)

  const qualityScore = engagementScore * 0.4 + zipQualityScore * 0.3 + outcomeScoreVal * 0.3
  const quality = qualityLabel(qualityScore)

  // 6. Update lead
  await supabase
    .from('intelligence_leads')
    .update({
      quality_score: qualityScore,
      quality,
      engagement_score: engagementScore,
      zip_quality_score: zipQualityScore,
      outcome_score: outcomeScoreVal,
      scored_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  return { quality_score: qualityScore, quality }
}
