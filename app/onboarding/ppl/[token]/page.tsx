import { createAdminClient } from '@/lib/supabase/admin'
import PPLWizard from './PPLWizard'

export default async function PPLOnboardingPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('onboarding_sessions')
    .select('id, account_id, status, step_data, current_step, created_at')
    .eq('token', params.token)
    .single()

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>Link not found</div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>This onboarding link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (session.status === 'form_built') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, background: 'white', borderRadius: 20, padding: '40px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '1.6rem', color: '#16a34a' }}>✓</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>All done!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your form has already been built. You&apos;ll receive a notification when it&apos;s live.</p>
        </div>
      </div>
    )
  }

  const { data: account } = await admin
    .from('accounts')
    .select('business_name')
    .eq('id', session.account_id)
    .single()

  return (
    <PPLWizard
      token={params.token}
      initialStep={session.current_step}
      initialData={session.step_data ?? {}}
      businessName={account?.business_name ?? ''}
      isCompleted={session.status === 'completed'}
    />
  )
}
