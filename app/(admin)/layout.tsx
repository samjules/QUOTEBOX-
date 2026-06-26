import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  if (!adminEmails.includes((user.email ?? '').toLowerCase())) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f4f6' }}>
      <AdminSidebar />
      <div className="flex-1 overflow-auto flex flex-col">{children}</div>
    </div>
  )
}
