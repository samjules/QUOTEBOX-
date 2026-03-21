import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, redirectPath } = await request.json() as { userId: string; redirectPath?: string }
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: targetUserData, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError || !targetUserData?.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const targetPath = redirectPath ?? '/dashboard'
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUserData.user.email,
    options: {
      redirectTo: `${siteUrl}${targetPath}?impersonating=1`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  return NextResponse.json({ url: linkData.properties.action_link })
}
