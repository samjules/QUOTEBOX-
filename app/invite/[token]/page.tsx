import { createAdminClient } from '@/lib/supabase/admin'
import InviteAcceptForm from './InviteAcceptForm'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: member } = await admin
    .from('account_members')
    .select('id, email, accepted_at, accounts(business_name)')
    .eq('invite_token', params.token)
    .single()

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-500">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (member.accepted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-gray-500 mb-4">This invite has already been accepted.</p>
          <a href="/login" className="text-indigo-600 hover:underline font-medium">Go to Login</a>
        </div>
      </div>
    )
  }

  const businessName = (member as Record<string, unknown>).accounts
    ? ((member as Record<string, unknown>).accounts as { business_name: string }).business_name
    : 'the team'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Join {businessName}</h1>
          <p className="text-gray-500 mt-2">Create your account to accept the invitation</p>
        </div>
        <InviteAcceptForm token={params.token} email={member.email} businessName={businessName} />
      </div>
    </div>
  )
}
