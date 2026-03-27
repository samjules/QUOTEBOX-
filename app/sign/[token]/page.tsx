import { createAdminClient } from '@/lib/supabase/admin'
import SigningPage from './SigningPage'

export default async function SignPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: agreement } = await admin
    .from('agreements')
    .select('id, token, title, document_url, status, signer_name, signer_email, signed_at, accounts(business_name)')
    .eq('token', params.token)
    .single()

  if (!agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Agreement Not Found</h1>
          <p className="text-gray-500">This signing link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  // Mark as viewed if currently 'sent'
  if (agreement.status === 'sent') {
    await admin
      .from('agreements')
      .update({ status: 'viewed' })
      .eq('id', agreement.id)
  }

  const businessName = (agreement as Record<string, unknown>).accounts
    ? ((agreement as Record<string, unknown>).accounts as { business_name: string }).business_name
    : 'Service Provider'

  return (
    <SigningPage
      token={params.token}
      title={agreement.title}
      documentUrl={agreement.document_url}
      signerName={agreement.signer_name || ''}
      signerEmail={agreement.signer_email || ''}
      businessName={businessName}
      alreadySigned={agreement.status === 'signed'}
    />
  )
}
