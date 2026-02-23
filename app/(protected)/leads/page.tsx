import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/lib/types'
import LeadsTable from './LeadsTable'

const COST_PER_LEAD = 15

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

  const { data: billingData } = await supabase
    .from('billing')
    .select('credit_balance')
    .eq('account_id', account.id)
    .single()

  const creditBalance = billingData?.credit_balance ?? 0

  // Auto-promote held leads to 'new' when the user has enough credits
  if (creditBalance >= COST_PER_LEAD) {
    await supabase
      .from('leads')
      .update({ status: 'new' })
      .eq('account_id', account.id)
      .eq('status', 'held')
  }

  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads: Lead[] = allLeads ?? []
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const bookedLeads = leads.filter((l) => l.status === 'booked').length
  // Held leads are captured but locked until credits are added
  const tableLeads = leads.filter((l) => l.status !== 'held')

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* No-credit locked state */}
          {creditBalance < COST_PER_LEAD ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {/* Lock icon */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {totalLeads > 0
                  ? `${totalLeads} lead${totalLeads !== 1 ? 's' : ''} waiting for you`
                  : 'Your leads are locked'}
              </h2>
              <p className="text-gray-500 max-w-md mb-8">
                {totalLeads > 0
                  ? `You have ${totalLeads} lead${totalLeads !== 1 ? 's' : ''} ready to view. Add at least $${COST_PER_LEAD.toFixed(0)} in credits to unlock them and start managing your pipeline.`
                  : `Add credits to start receiving leads. Each lead costs $${COST_PER_LEAD.toFixed(0)}.`}
              </p>

              {/* Credit breakdown */}
              {totalLeads > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-8 py-5 mb-8 inline-flex gap-8 text-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
                    <p className="text-sm text-gray-500 mt-1">Leads waiting</p>
                  </div>
                  <div className="border-l border-gray-200" />
                  <div>
                    <p className="text-3xl font-bold text-red-600">${(totalLeads * COST_PER_LEAD).toFixed(0)}</p>
                    <p className="text-sm text-gray-500 mt-1">Credits needed</p>
                  </div>
                  <div className="border-l border-gray-200" />
                  <div>
                    <p className="text-3xl font-bold text-gray-400">${creditBalance.toFixed(0)}</p>
                    <p className="text-sm text-gray-500 mt-1">Current balance</p>
                  </div>
                </div>
              )}

              <Link
                href="/billing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                Add Credits Now
              </Link>
            </div>
          ) : (
            <>
              {/* Low balance warning (has some credits but below threshold) — kept for edge cases */}

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

              {/* Leads table with detail panel */}
              <LeadsTable leads={tableLeads} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
