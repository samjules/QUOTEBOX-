import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Lead } from '@/lib/types'
import LeadsTable from './LeadsTable'

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

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!account) {
    return (
      <div className="p-8 text-red-600">
        No account found. Please contact support.
      </div>
    )
  }

  const admin = createAdminClient()
  const { data: billingData } = await admin
    .from('billing')
    .select('plan, trial_ends_at')
    .eq('account_id', account.id)
    .single()

  const plan = billingData?.plan ?? null
  const trialEndsAt = billingData?.trial_ends_at ?? null
  const isOnTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false
  const hasAccess = plan !== null

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
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at, notes')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads: Lead[] = allLeads ?? []
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
          {!hasAccess ? (
            /* No plan — subscribe gate */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to access your leads</h2>
              <p className="text-gray-500 max-w-md mb-8">
                Choose a plan to start receiving and managing leads. The Starter plan includes a 7-day free trial.
              </p>
              <Link
                href="/billing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md"
              >
                View Plans
              </Link>
            </div>
          ) : (
            <>
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
              <LeadsTable leads={leads} stripeConnectAccountId={account.stripe_connect_account_id ?? null} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
