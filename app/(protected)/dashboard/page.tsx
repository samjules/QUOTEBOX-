import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import DealNotificationBanner from '@/components/DealNotificationBanner'
import TimeframeBar from '@/components/TimeframeBar'
import AppDownloadBanner from '@/components/AppDownloadBanner'
import LtvDefaultValueInput from './LtvDefaultValueInput'
import type { ReactNode } from 'react'

const PLAN_LIMITS: Record<string, number> = { starter: 10, growth: 50, trial: 10 }

type Timeframe = 'today' | 'week' | 'month' | 'year' | 'all'

function getStartDate(timeframe: Timeframe): Date | null {
  const now = new Date()
  if (timeframe === 'today') {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (timeframe === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (timeframe === 'month') {
    const d = new Date(now)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (timeframe === 'year') {
    const d = new Date(now)
    d.setMonth(0, 1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  return null // all time
}

function timeframeLabel(tf: Timeframe): string {
  if (tf === 'today') return 'Today'
  if (tf === 'week') return 'This Week'
  if (tf === 'month') return 'This Month'
  if (tf === 'year') return 'This Year'
  return 'All Time'
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { timeframe?: string }
}) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) {
    return (
      <div className="p-8 text-red-600">
        No account found. Please contact support.
      </div>
    )
  }

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('accounts')
    .select('*')
    .eq('id', ctx.accountId)
    .single()

  if (!account) {
    return (
      <div className="p-8 text-red-600">
        No account found. Please contact support.
      </div>
    )
  }

  // Billing + automation config (parallel)
  const [{ data: billingRaw }, { data: automationConfig }] = await Promise.all([
    admin.from('billing').select('*').eq('account_id', account.id).single(),
    admin.from('lead_automations').select('default_lead_value').eq('account_id', account.id).single(),
  ])
  let billing = billingRaw

  if (!billing) {
    const { data: newBilling } = await admin
      .from('billing')
      .insert([{ account_id: account.id, credit_balance: 0, total_spent: 0 }])
      .select()
      .single()
    billing = newBilling
  }

  // Timeframe
  const raw = searchParams?.timeframe
  const timeframe: Timeframe =
    raw === 'today' || raw === 'week' || raw === 'month' || raw === 'year' || raw === 'all'
      ? raw
      : 'month'

  const startOfPeriod = getStartDate(timeframe)
  const periodLabel = timeframeLabel(timeframe)

  // Date boundaries
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayDateStr = startOfToday.toISOString().slice(0, 10)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const fromIso = startOfPeriod?.toISOString() ?? null
  const monthIso = startOfMonth.toISOString()
  const todayIso = startOfToday.toISOString()

  // DB-level count queries — accurate regardless of row volume
  function countLeads(status?: string, from?: string | null) {
    let q = admin.from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
    if (from) q = q.gte('created_at', from)
    if (status) q = q.eq('status', status)
    return q
  }

  const txnQuery = admin
    .from('billing_transactions')
    .select('*')
    .eq('account_id', account.id)
    .eq('type', 'lead_charge')

  const [
    { count: totalLeadsCount },
    { count: newLeadsCount },
    { count: bookedLeadsCount },
    { count: contactedLeadsCount },
    { count: lostLeadsCount },
    { count: monthlyLeadsCount },
    { data: todayLeadsData },
    { data: todayAllData },
    { data: pipelineData },
    { data: periodTxns },
    { data: vsls },
    { data: forms },
    { data: campaigns },
    { data: metaLeadsData },
  ] = await Promise.all([
    countLeads(undefined, fromIso),
    countLeads('new', fromIso),
    countLeads('booked', fromIso),
    countLeads('contacted', fromIso),
    countLeads('lost', fromIso),
    countLeads(undefined, monthIso),
    // Today's leads rows for DailyView display
    admin.from('leads')
      .select('id, name, email, phone, status, created_at, form_data')
      .eq('account_id', account.id)
      .gte('created_at', todayIso)
      .order('created_at', { ascending: false })
      .limit(20),
    // All today's rows for appointment filtering (booking_date check)
    admin.from('leads')
      .select('id, name, email, phone, status, created_at, form_data')
      .eq('account_id', account.id)
      .gte('created_at', todayIso)
      .order('created_at', { ascending: false }),
    // Pipeline: only rows with form_data for the period (include status for Hormozi metrics)
    admin.from('leads')
      .select('form_data, status')
      .eq('account_id', account.id)
      .gte('created_at', fromIso ?? '1970-01-01T00:00:00Z')
      .not('form_data', 'is', null)
      .limit(5000),
    // Period billing transactions
    fromIso
      ? txnQuery.gte('created_at', fromIso)
      : txnQuery,
    // Onboarding checklist
    admin.from('vsls').select('id').eq('account_id', account.id).limit(1),
    admin.from('hosted_forms').select('id, form_config').eq('account_id', account.id).limit(1),
    admin.from('meta_campaigns').select('id').eq('account_id', account.id).limit(1),
    admin.from('leads').select('id').eq('account_id', account.id).eq('form_type', 'meta_lead_form').limit(1),
  ])

  const totalLeads = totalLeadsCount ?? 0
  const newLeads = newLeadsCount ?? 0
  const bookedLeads = bookedLeadsCount ?? 0
  const contactedLeads = contactedLeadsCount ?? 0
  const lostLeads = lostLeadsCount ?? 0
  const monthlyLeads = monthlyLeadsCount ?? 0
  const todayLeads = todayLeadsData ?? []
  const todayAppointments = (todayAllData ?? []).filter((l) => {
    const fd = l.form_data as Record<string, unknown> | null
    return fd?._booking_date === todayDateStr
  })
  const periodPipeline = (pipelineData ?? []).reduce((sum, l) => {
    const qt = (l.form_data as Record<string, unknown> | null)?._quote_total
    return sum + (typeof qt === 'number' ? qt : 0)
  }, 0)
  const defaultLeadValue = automationConfig?.default_lead_value ?? null
  // Only booked leads that have a real numeric _quote_total
  const bookedLeadsWithQuote = (pipelineData ?? []).filter(l => {
    if (l.status !== 'booked') return false
    const qt = (l.form_data as Record<string, unknown> | null)?._quote_total
    return typeof qt === 'number'
  })
  const bookedPipelineFromQuotes = bookedLeadsWithQuote.reduce((sum, l) => {
    return sum + ((l.form_data as Record<string, unknown>)._quote_total as number)
  }, 0)
  // Apply fallback to every booked lead that doesn't have a real quote
  const bookedLeadsWithoutQuote = Math.max(0, bookedLeads - bookedLeadsWithQuote.length)
  const bookedPipeline = bookedPipelineFromQuotes + (defaultLeadValue ?? 0) * bookedLeadsWithoutQuote
  const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0'
  const periodSpending = (periodTxns ?? [])
    .reduce((sum: number, tx: { amount: number }) => sum + Math.abs(tx.amount), 0)
  const plan = billing?.plan ?? null

  // QuoteBox Games ranking (only if enrolled — always monthly)
  let gamesRank: number | null = null
  let gamesBookedThisMonth = 0
  if (account.games_enrolled) {
    const { count: myBooked } = await admin.from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('status', 'booked')
      .gte('created_at', monthIso)
    gamesBookedThisMonth = myBooked ?? 0

    const { data: enrolledAccounts } = await admin
      .from('accounts').select('id').eq('games_enrolled', true)
    const enrolledIds = (enrolledAccounts ?? []).map((a: { id: string }) => a.id)

    const { data: allBookedLeads } = await admin
      .from('leads').select('account_id')
      .eq('status', 'booked')
      .gte('created_at', monthIso)
      .in('account_id', enrolledIds)

    const counts: Record<string, number> = {}
    for (const l of allBookedLeads ?? []) {
      counts[l.account_id] = (counts[l.account_id] ?? 0) + 1
    }
    const ahead = enrolledIds.filter(
      (id: string) => id !== account.id && (counts[id] ?? 0) > gamesBookedThisMonth
    ).length
    gamesRank = ahead + 1
  }

  // Meta ad spend — pulled directly from the Graph API if connected
  const META_DATE_PRESET: Record<Timeframe, string> = {
    today: 'today', week: 'last_7d', month: 'this_month', year: 'this_year', all: 'maximum',
  }
  let metaAdSpend: number | null = null
  if (account.meta_access_token && account.meta_ad_account_id) {
    try {
      const spendRes = await fetch(
        `https://graph.facebook.com/v18.0/act_${account.meta_ad_account_id}/insights` +
        `?fields=spend&date_preset=${META_DATE_PRESET[timeframe]}&level=account` +
        `&access_token=${account.meta_access_token}`,
        { next: { revalidate: 300 } }
      )
      if (spendRes.ok) {
        const spendJson = await spendRes.json()
        const raw = spendJson.data?.[0]?.spend
        if (raw != null) metaAdSpend = parseFloat(raw)
      }
    } catch { /* Meta unavailable — omit the card */ }
  }

  // Hormozi LTV metrics (computed after metaAdSpend is resolved)
  const avgDealValue = bookedLeads > 0 ? bookedPipeline / bookedLeads : 0
  const valuePerLead = totalLeads > 0 ? bookedPipeline / totalLeads : 0
  const costPerLead = metaAdSpend !== null && totalLeads > 0 ? metaAdSpend / totalLeads : null
  const costPerClient = metaAdSpend !== null && bookedLeads > 0 ? metaAdSpend / bookedLeads : null
  const roas = metaAdSpend !== null && metaAdSpend > 0 ? bookedPipeline / metaAdSpend : null
  const profitPerLead = costPerLead !== null ? valuePerLead - costPerLead : null
  const bookingRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0
  const showHormoziCard = bookedLeads > 0 || (metaAdSpend !== null && metaAdSpend > 0)

  const blessed = billing?.blessed === true
  const metaConnected = !!account.meta_access_token
  const hasBillingPlan = !!billing?.plan
  const hasCreatives = (vsls?.length ?? 0) > 0
  const hasForm = (forms?.length ?? 0) > 0
  const firstFormSlug = hasForm ? ((forms![0].form_config as Record<string, unknown> | null)?.slug as string | null) ?? null : null
  const hasCampaign = (campaigns?.length ?? 0) > 0
  const hasMetaLead = (metaLeadsData?.length ?? 0) > 0
  const onboardingComplete = hasMetaLead
  // Accounts that haven't uploaded their own dashboard photo get a branded
  // QuoteBox purple scrim over the map texture instead of a washed-out one —
  // uploaded photos keep the darker scrim since that's what keeps text legible.
  const hasCustomBg = !!account.dashboard_bg_url
  const dashboardBgUrl = (account.dashboard_bg_url as string | null) ?? '/map-tiles/map_1_tile.svg'

  const hasBg = !!dashboardBgUrl

  return (
    <div className="min-h-full relative" style={{ background: '#f5f5f7' }}>

      {/* ── Photo zone: top 340px, blurred + scrimmed ── */}
      {hasBg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340, overflow: 'hidden', zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${dashboardBgUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(2px) saturate(0.75)',
            transform: 'scale(1.05)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: hasCustomBg
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.78) 100%)'
              : 'linear-gradient(135deg, rgba(76,29,149,0.94) 0%, rgba(126,34,206,0.90) 55%, rgba(76,29,149,0.94) 100%)',
          }} />
        </div>
      )}

      <div className="relative" style={{ zIndex: 10 }}>
        <DealNotificationBanner position="top" />

        {/* ── Page header ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1
                className="font-extrabold tracking-tight"
                style={{
                  fontFamily: "'Nautic', sans-serif",
                  fontSize: 28,
                  letterSpacing: '-0.03em',
                  color: hasBg ? '#fff' : '#111',
                }}
              >
                Dashboard
              </h1>
              <p style={{ fontSize: 13, color: hasBg ? 'rgba(255,255,255,0.45)' : '#9ca3af', marginTop: 2 }}>
                {periodLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TimeframeBar active={timeframe} />
            </div>
          </div>
        </div>

        {/* ── Hero: Pipeline Value ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {hasBg ? (
            <div className="py-7">
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                Pipeline Value · {totalLeads} lead{totalLeads !== 1 ? 's' : ''}
              </p>
              <p
                className="tabular-nums"
                style={{ fontSize: 60, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}
              >
                ${periodPipeline.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ) : (
            <div className="py-4">
              <div className={CARD} style={{ ...CARD_STYLE, padding: '24px 28px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>
                  Pipeline Value · {periodLabel}
                </p>
                <p className="tabular-nums" style={{ fontSize: 48, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  ${periodPipeline.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>{totalLeads} total leads</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Main content (below photo zone) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-10 space-y-5" style={{ marginTop: hasBg ? 0 : 8 }}>

          {/* Pledge banner — invites owners toward the $297 Consultation & Ad Setup,
              same offer the pledge-path email/SMS sequence pitches. Hidden once bought. */}
          {!account.upsell_purchased_at && <PledgeBanner pledgeCount={account.monthly_booking_goal ?? null} />}

          {/* Slim Meta ads strip — discreet, always shown until Meta connected */}
          {!metaConnected && <MetaAdStrip />}

          {/* Form preview card — always shown when a form exists */}
          {hasForm && firstFormSlug && (
            <FormPreviewCard slug={firstFormSlug} />
          )}

          {/* Onboarding checklist — single consolidated card */}
          {!onboardingComplete && (
            <LaunchRunway
              hasForm={hasForm}
              metaConnected={metaConnected}
              hasCreatives={hasCreatives}
              hasCampaign={hasCampaign}
            />
          )}

          {/* Lead usage banner — only shown when on a paid plan */}
          {!blessed && plan && <LeadUsageBanner plan={plan} monthlyLeads={monthlyLeads} />}

          {/* Today at a Glance */}
          <DailyView todayLeads={todayLeads} todayAppointments={todayAppointments} />

          {/* Stat grid — Total dominant, secondary pair, Meta tertiary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Leads — dominant */}
            <div className={`${CARD} lg:col-span-1`} style={CARD_STYLE}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>Total Leads</p>
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400" style={{ background: '#f3f4f6' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  </div>
                </div>
                <p className="tabular-nums" style={{ fontSize: 42, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>{totalLeads}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, letterSpacing: '0.04em' }}>{periodLabel}</p>
              </div>
            </div>

            {/* New Leads */}
            <StatCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
              iconBg="#5b5bd6"
              label="New Leads"
              value={newLeads}
              sub={periodLabel}
            />

            {/* Booked Leads */}
            <StatCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="#7c6fe0"
              label="Booked"
              value={bookedLeads}
              sub={periodLabel}
            />

            {/* Meta Ad Spend — tertiary, shown when connected */}
            {metaAdSpend !== null ? (
              <StatCard
                icon={<svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                iconBg="#1877F2"
                label="Meta Ad Spend"
                value={`$${metaAdSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sub={periodLabel}
              />
            ) : (
              /* Conversion rate fills the 4th slot when Meta not connected */
              <StatCard
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
                iconBg="#5b5bd6"
                label="Conversion"
                value={`${conversionRate}%`}
                sub={periodLabel}
              />
            )}
          </div>

          {/* LTV Calculator — frosted glass, continuous with page */}
          {showHormoziCard && (
            <div className={CARD} style={CARD_STYLE}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400" style={{ background: '#f3f4f6' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 15 }}>LTV Calculator</h3>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, letterSpacing: '0.03em' }}>
                      {periodLabel} · {bookedLeads} booked lead{bookedLeads !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  <HormoziStat label="Avg Deal" value={avgDealValue > 0 ? `$${avgDealValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'} />
                  <HormoziStat label="Value / Lead" value={valuePerLead > 0 ? `$${valuePerLead.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'} />
                  <HormoziStat label="Booking Rate" value={`${bookingRate.toFixed(1)}%`} />
                  {costPerLead !== null && <HormoziStat label="Cost / Lead" value={`$${costPerLead.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />}
                  {costPerClient !== null && <HormoziStat label="Cost / Client" value={`$${costPerClient.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />}
                  {roas !== null && <HormoziStat label="ROAS" value={`${roas.toFixed(2)}x`} highlight={roas >= 1 ? 'green' : undefined} large />}
                  {profitPerLead !== null && <HormoziStat label="Profit / Lead" value={`$${profitPerLead.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} highlight={profitPerLead >= 0 ? 'green' : undefined} />}
                </div>
                <LtvDefaultValueInput initial={defaultLeadValue} />
              </div>
            </div>
          )}

          {/* Secondary stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MiniStat
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5" style={{ color: '#5b5bd6' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>}
              iconBg="rgba(91,91,214,0.1)"
              label="Contacted"
              value={contactedLeads}
            />
            <MiniStat
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
              iconBg="rgba(0,0,0,0.05)"
              label="Lost"
              value={lostLeads}
            />
            {metaAdSpend !== null && (
              <MiniStat
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5" style={{ color: '#5b5bd6' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
                iconBg="rgba(91,91,214,0.1)"
                label="Conversion Rate"
                value={`${conversionRate}%`}
              />
            )}
          </div>

          {/* QuoteBox Games */}
          {account.games_enrolled && gamesRank !== null && (
            <div className="overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e8ec', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>QuoteBox Games</p>
                    <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 15 }}>Monthly leaderboard</h3>
                  </div>
                  <Link href="/games" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#f9fafb' }}>
                    View →
                  </Link>
                </div>
                <div className="flex items-baseline gap-6">
                  <div>
                    <p className="tabular-nums font-extrabold text-gray-900" style={{ fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>#{gamesRank}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, letterSpacing: '0.04em' }}>Your rank</p>
                  </div>
                  <div>
                    <p className="tabular-nums font-extrabold text-gray-900" style={{ fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>{gamesBookedThisMonth}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, letterSpacing: '0.04em' }}>Booked this month</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`${CARD} p-6`} style={CARD_STYLE}>
            <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 15 }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction href="/leads" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} title="View All Leads" desc="Manage your leads" />
              <QuickAction href="/hosted-forms" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} title="Hosted Forms" desc="Manage your forms" />
              <QuickAction href="/billing" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>} title="Billing" desc="Manage credits" />
              <QuickAction href="/rewards" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>} title="Rewards" desc="View your pipeline tier" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Components ────────────────────────────────────────────────

const CARD = 'overflow-hidden rounded-2xl border'
const CARD_STYLE = {
  background: '#fff',
  borderColor: '#e8e8ec',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className={CARD} style={CARD_STYLE}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>{label}</p>
          <div className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 ml-2 text-gray-400" style={{ background: '#f3f4f6' }}>
            {icon}
          </div>
        </div>
        <p className="tabular-nums font-bold text-gray-900 leading-none" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, letterSpacing: '0.04em' }}>{sub}</p>}
      </div>
    </div>
  )
}

function MiniStat({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string | number
}) {
  return (
    <div className={CARD} style={CARD_STYLE}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 rounded-xl p-2.5 text-gray-400" style={{ background: '#f3f4f6' }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>{label}</p>
            <p className="tabular-nums font-bold text-gray-900" style={{ fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 2 }}>{value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HormoziStat({
  label,
  value,
  highlight,
  large,
}: {
  label: string
  value: string
  highlight?: 'green'
  large?: boolean
}) {
  const valueColor = highlight === 'green' ? '#34d399' : '#111827'
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>{label}</p>
      <p className="tabular-nums font-bold leading-none" style={{ fontSize: large ? 26 : 18, color: valueColor, letterSpacing: '-0.01em' }}>{value}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 active:scale-95"
    >
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function PledgeBanner({ pledgeCount }: { pledgeCount: number | null }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #5b50d6, #453bc2)',
      borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 4px 16px rgba(91,80,214,0.25)', flexWrap: 'wrap' as const,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/delivery-truck.png" alt=""
        style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 10, background: '#fff', padding: 5, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem', marginBottom: 3 }}>
          {pledgeCount ? `You pledged ${pledgeCount} jobs this month.` : 'Want more booked jobs this month?'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.79rem', lineHeight: 1.4 }}>
          Our $297 Consultation &amp; Ad Setup builds and launches your ad account so the rest come faster.
        </div>
      </div>
      <a
        href="https://quote-box.com/get-started"
        style={{
          flexShrink: 0, background: '#f4a93c', color: '#201d3d', fontWeight: 800, fontSize: '0.8rem',
          padding: '10px 18px', borderRadius: 9, textDecoration: 'none', whiteSpace: 'nowrap' as const,
        }}
      >
        Book my $297 setup →
      </a>
    </div>
  )
}

// ── Guaranteed Results Banner ────────────────────────────────

function MetaAdStrip() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e8ec',
      borderRadius: 10,
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ flexShrink: 0 }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l7 3v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <div style={{ flex: 1, fontSize: '0.78rem', color: '#6b7280', lineHeight: 1 }}>
        <span style={{ color: '#111', fontWeight: 600 }}>Guaranteed results</span>
        {' '}— we run your Meta ads from $50/day and deliver leads straight to this dashboard.
      </div>
      <a
        href="mailto:sales@quote-box.com"
        style={{
          flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: '#374151',
          textDecoration: 'none', whiteSpace: 'nowrap' as const,
          padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 7,
          background: '#f9fafb',
        }}
      >
        Book a call →
      </a>
    </div>
  )
}

function FormPreviewCard({ slug }: { slug: string }) {
  const url = `https://quote-box.com/${slug}`

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
      {/* Green top bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />

      <div style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
        {/* Pulse dot + text */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 240 }}>
          <div style={{ marginTop: 4, flexShrink: 0, position: 'relative' as const, width: 12, height: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
            <div style={{
              position: 'absolute' as const, inset: -3,
              borderRadius: '50%', border: '2px solid #22c55e', opacity: 0.4,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111', marginBottom: 6, lineHeight: 1.2 }}>
              Your quote form is live!
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', maxWidth: 360 }}>
              <span style={{ flex: 1, fontSize: '0.78rem', fontFamily: 'monospace', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                quote-box.com/{slug}
              </span>
            </div>
          </div>
        </div>

        {/* App Store card */}
        <AppDownloadBanner />

        {/* Test lead button */}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 22px',
            background: '#111', color: '#fff',
            fontWeight: 700, fontSize: '0.88rem', borderRadius: 10,
            textDecoration: 'none', whiteSpace: 'nowrap' as const,
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path d="M15 3h6v6" /><path d="M10 14L21 3" />
          </svg>
          Submit a test lead
        </a>
      </div>

      <style>{`@keyframes ping { 75%,100% { transform: scale(1.8); opacity: 0; } }`}</style>
    </div>
  )
}

// ── Welcome Gift Banner ───────────────────────────────────────

// ── Launch Runway ─────────────────────────────────────────────

function IconCheck() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 16 16" stroke="#0e0020" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3 3 7-7" />
    </svg>
  )
}

function IconTruck({ color }: { color: string }) {
  return (
    <svg width="18" height="16" viewBox="0 0 26 18" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="14" height="11" rx="1.5" />
      <path d="M15 4h5l4 5v5h-9V4z" />
      <circle cx="5" cy="15.5" r="2.5" />
      <circle cx="19" cy="15.5" r="2.5" />
    </svg>
  )
}

function IconSignal({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 8.5C4 5.5 7.8 3.5 12 3.5s8 2 10.5 5" />
      <path d="M4.5 11.5C6.5 9.3 9.1 8 12 8s5.5 1.3 7.5 3.5" />
      <path d="M7.5 14.5C9 12.8 10.4 12 12 12s3 .8 4.5 2.5" />
      <circle cx="12" cy="18" r="1.2" fill={color} stroke="none" />
    </svg>
  )
}

function LaunchRunway({
  hasForm,
  metaConnected,
  hasCreatives,
  hasCampaign,
}: {
  hasForm: boolean
  metaConnected: boolean
  hasCreatives: boolean
  hasCampaign: boolean
}) {
  type Milestone = {
    key: string
    label: string
    done: boolean
    isGoal?: boolean
    cta?: { label: string; href: string; desc: string }
  }

  const milestones: Milestone[] = [
    { key: 'account', label: 'Account\nOpen', done: true },
    {
      key: 'form', label: 'Quote\nForm', done: hasForm,
      cta: {
        label: 'Build your form',
        href: '/form-builder',
        desc: 'Build the form homeowners fill out. No form, no leads — it\'s that simple.',
      },
    },
    {
      key: 'meta', label: 'Meta\nConnected', done: metaConnected,
      cta: {
        label: 'Connect Meta',
        href: '/settings',
        desc: 'Link your Facebook Business account. That\'s where the jobs are.',
      },
    },
    {
      key: 'creatives', label: 'Creatives\nUploaded', done: hasCreatives,
      cta: {
        label: 'Upload creatives',
        href: '/vsls',
        desc: 'Show your truck, your crew, a before/after. Real photos beat stock every time.',
      },
    },
    {
      key: 'campaign', label: 'Campaign\nLive', done: hasCampaign,
      cta: {
        label: 'Launch campaign',
        href: '/lead-machine',
        desc: 'Truck\'s loaded, route\'s set. Hit launch and the calls start coming in.',
      },
    },
    {
      key: 'consult', label: 'Book a\nConsultation', done: false,
      cta: {
        label: 'Book a call',
        href: '/get-started',
        desc: 'Hop on a free 15-min call with us — we\'ll set up your ads and get leads flowing.',
      },
    },
    { key: 'lead', label: 'First Job\nRequest', done: false, isGoal: true },
  ]

  const doneCount = milestones.filter((m) => m.done).length
  const nextStep = milestones.find((m) => !m.done && !m.isGoal)
  const waitingForLead = doneCount === milestones.length - 1

  const headlines = [
    "Truck's parked in the yard. Time to get it rolling.",
    "Form built. Now let's get it in front of homeowners.",
    "Meta connected. Upload your truck photos and job videos.",
    "Creatives loaded up. One step from rolling out.",
    "Truck's on the road. First job request is incoming.",
  ]
  const headline = headlines[Math.min(doneCount - 1, headlines.length - 1)]

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9ca3af', marginBottom: 4 }}>
            Checklist to start getting leads
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111', lineHeight: 1.3 }}>
            {waitingForLead ? 'Ads are running — first lead is on the way.' : headline}
          </div>
        </div>
        <div style={{ flexShrink: 0, background: '#f3f4f6', borderRadius: 8, padding: '6px 12px', textAlign: 'center' as const }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111', lineHeight: 1 }}>{doneCount}</div>
          <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginTop: 2 }}>of {milestones.length}</div>
        </div>
      </div>

      {/* Step list */}
      <div style={{ padding: '8px 0' }}>
        {milestones.filter(m => !m.isGoal).map((m) => {
          const isNext = !m.done && milestones.find(x => !x.done && !x.isGoal) === m
          return (
            <div key={m.key} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 22px',
              background: isNext ? '#f9fafb' : 'transparent',
              borderLeft: isNext ? '2px solid #111' : '2px solid transparent',
            }}>
              {/* Check / ring */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: m.done ? '#111' : '#f3f4f6',
                border: m.done ? 'none' : isNext ? '2px solid #d1d5db' : '2px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.done && (
                  <svg width="11" height="11" fill="none" viewBox="0 0 16 16" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l3 3 7-7" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: m.done ? 500 : isNext ? 700 : 500, color: m.done ? '#9ca3af' : '#111', textDecoration: m.done ? 'line-through' : 'none' }}>
                  {m.label.replace('\n', ' ')}
                </div>
                {isNext && m.cta && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>{m.cta.desc}</div>
                )}
              </div>
              {isNext && m.cta && (
                <Link href={m.cta.href} style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 8,
                  background: '#111', color: '#fff',
                  fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {m.cta.label} →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Waiting for lead — ads running state */}
      {waitingForLead && (
        <div style={{ margin: '0 16px 16px' }}>
          <div style={{
            background: '#f9fafb', border: '1px solid #e8e8ec',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flexShrink: 0 }}>
              <IconSignal color="#9ca3af" />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111', marginBottom: 3 }}>
                Ads are live — leads incoming
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.5 }}>
                Your ad is targeting homeowners in your area. This disappears the moment your first Meta lead lands.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Daily View ────────────────────────────────────────────────

type LeadRow = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  status: string
  created_at: string
  form_data: Record<string, unknown> | null
}

function initials(name: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

function DailyView({
  todayLeads,
  todayAppointments,
}: {
  todayLeads: LeadRow[]
  todayAppointments: LeadRow[]
}) {
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className={`${CARD} overflow-hidden`} style={CARD_STYLE}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Nautic', sans-serif", fontSize: 15 }}>Today</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{dateLabel}</p>
        </div>
        <div className="flex gap-5 text-right">
          <div>
            <p className="tabular-nums font-bold" style={{ fontSize: 22, color: '#5b5bd6', lineHeight: 1 }}>{todayLeads.length}</p>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 3 }}>New leads</p>
          </div>
          <div style={{ borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 20 }}>
            <p className="tabular-nums font-bold" style={{ fontSize: 22, color: todayAppointments.length > 0 ? '#5b5bd6' : '#9ca3af', lineHeight: 1 }}>{todayAppointments.length}</p>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 3 }}>Appts</p>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div>
        {todayLeads.length === 0 && todayAppointments.length === 0 && (
          <p className="px-6 py-5 text-sm text-gray-400">No leads or appointments today yet.</p>
        )}

        {todayLeads.slice(0, 5).map((lead) => (
          <Link
            key={lead.id}
            href="/leads"
            className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-black/[0.02]"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: '#5b5bd6' }}
            >
              {initials(lead.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{lead.name ?? 'Unknown'}</p>
              <p className="text-xs text-gray-400 truncate">{lead.phone ?? lead.email ?? 'No contact info'}</p>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
              {new Date(lead.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </Link>
        ))}

        {todayLeads.length > 5 && (
          <div className="px-6 py-2.5 text-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <Link href="/leads" className="text-xs font-semibold hover:underline" style={{ color: '#5b5bd6' }}>
              +{todayLeads.length - 5} more leads today
            </Link>
          </div>
        )}

        {todayAppointments.map((lead) => {
          const fd = lead.form_data ?? {}
          const amount = fd._amount as string | undefined
          return (
            <Link
              key={`appt-${lead.id}`}
              href="/calendar"
              className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-black/[0.02]"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#7c6fe0' }}
              >
                {initials(lead.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{lead.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-400 truncate">Appointment · {lead.phone ?? lead.email ?? 'No contact'}</p>
              </div>
              {amount && (
                <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(91,91,214,0.1)', color: '#5b5bd6' }}>
                  ${amount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Lead Usage Banner ─────────────────────────────────────────

function LeadUsageBanner({
  plan,
  monthlyLeads,
}: {
  plan: string
  monthlyLeads: number
}) {
  if (plan === 'fully_managed' || plan === 'pay_per_lead') {
    const accrued = monthlyLeads * 15
    const label = plan === 'pay_per_lead' ? 'Retainer' : 'Fully Managed'
    return (
      <div className="rounded-lg p-5 flex items-center justify-between bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">{label} — {monthlyLeads} lead{monthlyLeads !== 1 ? 's' : ''} this month</p>
            <p className="text-sm text-gray-400">${accrued.toFixed(2)} accrued at $15.00/lead</p>
          </div>
        </div>
        <Link href="/billing" className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition">
          Billing
        </Link>
      </div>
    )
  }

  const limit = PLAN_LIMITS[plan] ?? 10
  const pct = Math.min(100, Math.round((monthlyLeads / limit) * 100))
  const isOver = monthlyLeads >= limit
  const isNearing = !isOver && pct >= 80
  const planLabel = plan === 'growth' ? 'Growth' : plan === 'trial' ? 'Trial' : 'Starter'

  if (isOver) {
    return (
      <div className="rounded-lg p-5 flex items-center justify-between bg-red-50 border border-red-300">
        <div className="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-semibold text-sm text-red-800">Monthly lead limit reached ({limit}/{limit})</p>
            <p className="text-sm text-red-600">
              {plan === 'starter'
                ? 'Upgrade to Growth for 50 leads/month.'
                : 'New leads are paused until next month or you upgrade to Fully Managed.'}
            </p>
          </div>
        </div>
        <Link href="/billing" className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition">
          Upgrade
        </Link>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-5 border ${isNearing ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 flex-shrink-0 ${isNearing ? 'text-yellow-500' : ''}`} style={isNearing ? {} : { color: '#5b5bd6' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span className={`font-semibold text-sm ${isNearing ? 'text-yellow-800' : 'text-gray-800'}`}>
            {planLabel} plan — {monthlyLeads} / {limit} leads this month
          </span>
        </div>
        <span className={`text-xs font-bold ${isNearing ? 'text-yellow-600' : ''}`} style={isNearing ? {} : { color: '#5b5bd6' }}>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearing ? 'bg-yellow-400' : ''}`}
          style={{ width: `${pct}%`, ...(isNearing ? {} : { background: '#5b5bd6' }) }}
        />
      </div>
      {isNearing && (
        <p className="text-xs text-yellow-700 mt-2">
          Nearing your monthly limit — <Link href="/billing" className="underline font-medium">upgrade your plan</Link> to avoid interruptions.
        </p>
      )}
    </div>
  )
}
