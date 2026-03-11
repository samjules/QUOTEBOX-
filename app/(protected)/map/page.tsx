import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import type { Lead } from '@/lib/types'

const LeadMap = dynamic(() => import('./LeadMap'), { ssr: false })

export default async function MapPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!account) redirect('/login')

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <LeadMap leads={(leads as Lead[]) ?? []} />
    </div>
  )
}
