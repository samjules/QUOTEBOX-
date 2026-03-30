import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import type { Lead } from '@/lib/types'
import LeadsTable, { type FieldMap } from './LeadsTable'

export default async function LeadsPage() {
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

  const { data: billingData } = await admin
    .from('billing')
    .select('plan, trial_ends_at, blessed')
    .eq('account_id', account.id)
    .single()

  const plan = billingData?.plan ?? null
  const trialEndsAt = billingData?.trial_ends_at ?? null
  const isOnTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false
  const blessed = billingData?.blessed === true
  const hasAccess = blessed || plan !== null

  // Auto-promote held leads to 'new' when account has an active plan
  if (hasAccess) {
    await admin
      .from('leads')
      .update({ status: 'new' })
      .eq('account_id', account.id)
      .eq('status', 'held')
  }

  const { data: allLeads } = await admin
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, source, status, created_at, notes')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads: Lead[] = allLeads ?? []

  // Build field lookup map from all hosted forms — resolves field IDs → labels/options
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

  // Compute trial days remaining for banner
  const trialDaysLeft = isOnTrial
    ? Math.ceil((new Date(trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
            {/* No plan banner */}
            {!hasAccess && (
              <div className="mb-6 rounded-lg p-4 flex items-center justify-between bg-yellow-50 border border-yellow-300">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-500 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-sm text-yellow-800">No active subscription</p>
                    <p className="text-sm text-yellow-700">Subscribe to a plan to start receiving new leads.</p>
                  </div>
                </div>
                <Link href="/billing" className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition">
                  View Plans
                </Link>
              </div>
            )}

              {/* Trial banner */}
              {isOnTrial && (
                <div className="mb-6 rounded-lg p-4 flex items-center justify-between bg-indigo-50 border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-500 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-indigo-800">
                      Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                  <Link href="/billing" className="text-xs font-semibold text-indigo-600 hover:underline">
                    Manage plan
                  </Link>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-xl">
                  <div className="p-5 flex items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
                      <dd className="text-3xl font-semibold text-gray-900">{totalLeads}</dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-xl">
                  <div className="p-5 flex items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">New Leads</dt>
                      <dd className="text-3xl font-semibold text-gray-900">{newLeads}</dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-xl">
                  <div className="p-5 flex items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500">Booked Leads</dt>
                      <dd className="text-3xl font-semibold text-gray-900">{bookedLeads}</dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leads table */}
              <LeadsTable leads={leads} stripeConnectAccountId={account.stripe_connect_account_id ?? null} agreementTemplateUrl={account.agreement_template_url ?? null} fieldMap={fieldMap} />
        </div>
      </div>
    </div>
  )
}
