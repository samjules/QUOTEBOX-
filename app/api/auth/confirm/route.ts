import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = (searchParams.get('type') ?? 'magiclink') as 'magiclink' | 'email'
  const next = searchParams.get('next') ?? '/dashboard'

  if (!token_hash) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    // Token invalid or expired — send to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verified — redirect to the intended page
  return NextResponse.redirect(new URL(next, request.url))
}
