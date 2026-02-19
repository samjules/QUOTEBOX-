import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/lib/types'

function statusColor(status: string) {
  switch (status) {
    case 'new':
      return 'bg-yellow-100 text-yellow-800'
    case 'contacted':
      return 'bg-blue-100 text-blue-800'
    case 'booked':
      return 'bg-green-100 text-green-800'
    case 'lost':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function LeadsPage() {
  const supabase = createClient()

  // Auth timing fix
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

  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  const leads: Lead[] = allLeads ?? []
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === 'new').length
  const bookedLeads = leads.filter((l) => l.status === 'booked').length
  const recentLeads = leads.slice(0, 10)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5 flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white text-2xl flex-shrink-0">
                  📊
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">
                    Total Leads
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {totalLeads}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5 flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white text-2xl flex-shrink-0">
                  🆕
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">
                    New Leads
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {newLeads}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5 flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white text-2xl flex-shrink-0">
                  ✅
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">
                    Booked Leads
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {bookedLeads}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Leads table */}
          <div className="bg-white shadow rounded-xl">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Leads
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No leads yet. They will appear here once you receive
                        them.
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lead.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(lead.status)}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
