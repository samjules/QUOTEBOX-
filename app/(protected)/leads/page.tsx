import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import type { Lead } from '@/lib/types'
import LeadsTable, { type FieldMap } from './LeadsTable'
import LeadActivityTab from './LeadActivityTab'
import { enrollPendingLeads } from '@/lib/enroll-lead'
import { processDueSteps } from '@/lib/process-automations'

const CARD = 'overflow-hidden rounded-2xl border backdrop-blur-xl'
const CARD_STYLE = {
  background: 'rgba(255,255,255,0.88)',
  borderColor: 'rgba(255,255,255,0.7)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className={CARD} style={CARD_STYLE}>
      <div className="p-5 flex items-center gap-4">
        <div
          className="flex items-center justify-center h-11 w-11 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #5b5bd6 0%, #7c6fe0 100%)' }}
        >
          {icon}
        </div>
        <div>
          <p className="font-semibold tracking-widest uppercase text-[10px]" style={{ color: 'rgba(60,60,67,0.45)' }}>{label}</p>
          <p className="text-[32px] font-extrabold leading-none tracking-tighter tabular-nums" style={{ color: '#111' }}>{value}</p>
        </div>
      </div>
    </div>
  )
}

export default async function LeadsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab === 'activity' ? 'activity' : 'leads'
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) {
    return <div className="p-8 text-red-600">No account found. Please contact support.</div>
  }

  const admin = createAdminClient()

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('*')
    .eq('id', ctx.accountId)
    .single()

  if (!account) {
    return <div className="p-8 text-red-600">No account found. Please contact support.</div>
  }

  await admin
    .from('leads')
    .update({ status: 'new' })
    .eq('account_id', account.id)
    .eq('status', 'held')
    .select('id')

  const { data: allLeads } = await admin
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at, notes')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads: Lead[] = allLeads ?? []

  try {
    const enrolled = await enrollPendingLeads(account.id)
    if (enrolled > 0) {
      await processDueSteps(account.id)
    }
  } catch {
    // silent — automation errors shouldn't break the leads page
  }

  const { data: forms } = await admin
    .from('hosted_forms')
    .select('form_config')
    .eq('account_id', account.id)

  const fieldMap: FieldMap = {}
  for (const form of forms ?? []) {
    for (const field of (form.form_config?.fields ?? [])) {
      fieldMap[field.id] = {
        label: field.label,
        type: field.type,
        options: field.options?.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label })),
      }
    }
  }

  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const bookedLeads = leads.filter((l) => l.status === 'booked').length

  const dashboardBgUrl: string | null = account.dashboard_bg_url ?? null
  const hasBg = !!dashboardBgUrl

  return (
    <div className="relative min-h-screen" style={{ background: '#ededf2' }}>
      {/* Photo zone */}
      {hasBg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, overflow: 'hidden', zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${dashboardBgUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(2px) saturate(0.75)',
            transform: 'scale(1.05)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.78) 100%)',
          }} />
        </div>
      )}

      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className={hasBg ? 'pt-8 pb-6' : 'pt-8 pb-6'}>
            <h1
              className="text-[28px] font-extrabold tracking-tight leading-none"
              style={{ color: hasBg ? '#fff' : '#111' }}
            >
              Leads
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: hasBg ? 'rgba(255,255,255,0.65)' : 'rgba(60,60,67,0.5)' }}>
              {account.business_name ?? 'Your business'}
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <StatCard
              label="Total Leads"
              value={totalLeads}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
            />
            <StatCard
              label="New Leads"
              value={newLeads}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              }
            />
            <StatCard
              label="Booked"
              value={bookedLeads}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Tab nav — Apple pill segmented control */}
          <div className="mb-6">
            <div
              className="inline-flex items-center p-1 gap-0.5"
              style={{
                background: 'rgba(120,120,128,0.16)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Link
                href="/leads"
                className="relative px-4 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-150 outline-none"
                style={activeTab === 'leads' ? {
                  background: 'rgba(255,255,255,0.95)',
                  color: '#111',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)',
                } : {
                  color: 'rgba(60,60,67,0.6)',
                  background: 'transparent',
                }}
              >
                All Leads
              </Link>
              <Link
                href="/leads?tab=activity"
                className="relative px-4 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-150 outline-none"
                style={activeTab === 'activity' ? {
                  background: 'rgba(255,255,255,0.95)',
                  color: '#111',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)',
                } : {
                  color: 'rgba(60,60,67,0.6)',
                  background: 'transparent',
                }}
              >
                Automation Activity
              </Link>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'leads' ? (
            <LeadsTable
              leads={leads}
              stripeConnectAccountId={account.stripe_connect_account_id ?? null}
              agreementTemplateUrl={account.agreement_template_url ?? null}
              fieldMap={fieldMap}
            />
          ) : (
            <LeadActivityTab />
          )}

          <div className="h-10" />
        </div>
      </div>
    </div>
  )
}
