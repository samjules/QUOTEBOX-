import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import PPLWizard from './PPLWizard'
import CreateAccountStep from './CreateAccountStep'
import LoginGate from './LoginGate'
import PaymentStep from './PaymentStep'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quotebox — Onboarding',
  description: 'Quotebox, Instant Estimates, Better Leads.',
  openGraph: {
    title: 'Quotebox — Onboarding',
    description: 'Quotebox, Instant Estimates, Better Leads.',
    images: [{ url: 'https://www.quote-box.com/quotebox-share.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quotebox — Onboarding',
    description: 'Quotebox, Instant Estimates, Better Leads.',
    images: ['https://www.quote-box.com/quotebox-share.png'],
  },
}

export default async function PPLOnboardingPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { session_id?: string }
}) {
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('onboarding_sessions')
    .select('id, account_id, status, step_data, current_step, created_at, lead_name, lead_email, paid_at')
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

  // Step 1: no account yet — customer sets a password to create it
  if (!session.account_id) {
    return <CreateAccountStep token={params.token} businessName={session.lead_name ?? ''} email={session.lead_email ?? ''} />
  }

  const { data: account } = await admin
    .from('accounts')
    .select('business_name, owner_id')
    .eq('id', session.account_id)
    .single()

  // Sessions created by the old admin flow (pre-dating lead-based invites) were
  // tied to an account admin already provisioned, with no password/payment step
  // and no login requirement. Grandfather them in unchanged so accounts already
  // mid-wizard don't suddenly get locked out or asked to pay $750/mo.
  const isLegacySession = !session.lead_email

  if (!isLegacySession) {
    // The account exists — make sure the browser is logged in as its owner
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== account?.owner_id) {
      return <LoginGate email={session.lead_email ?? ''} />
    }
  }

  // Step 2: account exists but the $750/mo subscription hasn't been confirmed yet
  if (!isLegacySession && !session.paid_at) {
    return (
      <PaymentStep
        token={params.token}
        businessName={account?.business_name ?? ''}
        initialSessionId={searchParams.session_id ?? null}
      />
    )
  }

  // Step 3+: the existing business-details wizard
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
