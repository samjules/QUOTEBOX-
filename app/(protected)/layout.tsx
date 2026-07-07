import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import MobileAppPrompt from '@/components/MobileAppPrompt'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Auth timing fix: getSession() populates from cookie first, then
  // getUser() validates the JWT against the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f4f6' }}>
      <Suspense>
        <ImpersonationBanner />
      </Suspense>
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col pt-14 lg:pt-0">
        <MobileAppPrompt />
        {children}
      </div>
    </div>
  )
}
