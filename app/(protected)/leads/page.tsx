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

  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads: Lead[] = allLeads ?? []
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const bookedLeads = leads.filter((l) => l.status === 'booked').length

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Low balance banner */}
          {creditBalance < COST_PER_LEAD && (
            <div className={`mb-6 rounded-lg p-4 flex items-center justify-between ${creditBalance <= 0 ? 'bg-red-50 border border-red-300' : 'bg-yellow-50 border border-yellow-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{creditBalance <= 0 ? '🚨' : '⚠️'}</span>
                <div>
                  <p className={`font-semibold text-sm ${creditBalance <= 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                    {creditBalance <= 0 ? 'No credits remaining' : 'Low credit balance'}
                  </p>
                  <p className={`text-sm ${creditBalance <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {creditBalance <= 0
                      ? 'New leads are paused. Add credits to continue receiving leads.'
                      : `Your balance ($${creditBalance.toFixed(2)}) is below $${COST_PER_LEAD.toFixed(2)}. Top up to keep receiving leads.`}
                  </p>
                </div>
              </div>
              <Link
                href="/billing"
                className={`ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition ${creditBalance <= 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
              >
                Add Credits
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5 flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white text-2xl flex-shrink-0">
                  📊
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{totalLeads}</dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5 flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white text-2xl flex-shrink-0">
                  🆕
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">New Leads</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{newLeads}</dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5 flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white text-2xl flex-shrink-0">
                  ✅
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">Booked Leads</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{bookedLeads}</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Leads table with detail panel */}
          <LeadsTable leads={leads} />
        </div>
      </div>
    </div>
  )
}
