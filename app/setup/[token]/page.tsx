import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SetupForm from './SetupForm'

export default async function SetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const admin = createAdminClient()
  const { data: lead } = await admin
    .from('sales_leads')
    .select('name, email, tier, monthly_total')
    .eq('setup_token', token)
    .single()

  if (!lead) redirect('/login')

  return (
    <div style={{
      minHeight: '100vh',
      background: '#5b50d6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nautic', sans-serif",
      padding: '40px 20px',
    }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontFamily: "'Nautic', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: 'white', letterSpacing: '0.02em' }}>
          Quote<span style={{ color: '#f4a93c' }}>.</span>Box
        </span>
      </div>

      <div style={{
        background: '#201d3d',
        borderRadius: 16,
        padding: '40px 36px',
        maxWidth: 440,
        width: '100%',
      }}>
        <h1 style={{ fontFamily: "'Nautic', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'white', textAlign: 'center', margin: '0 0 8px' }}>
          Welcome, {lead.name}!
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 8px' }}>
          Set a password to activate your account
        </p>
        <div style={{
          textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)',
          marginBottom: 28, padding: '10px 16px', background: 'rgba(255,229,0,0.06)',
          borderRadius: 8, border: '1px solid rgba(255,229,0,0.1)',
        }}>
          {lead.tier} leads/mo &mdash; <span style={{ color: '#f4a93c', fontWeight: 600 }}>${Number(lead.monthly_total).toLocaleString()}/mo</span>
        </div>

        <SetupForm token={token} email={lead.email} />
      </div>
    </div>
  )
}
