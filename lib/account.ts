import type { SupabaseClient } from '@supabase/supabase-js'

export interface AccountContext {
  accountId: string
  userId: string
  role: 'owner' | 'employee'
}

/**
 * Resolve the account for the current user.
 * Checks accounts.owner_id first, then account_members.user_id.
 */
export async function getAccountForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountContext | null> {
  console.log('DEBUG [getAccountForUser] called with userId:', userId)

  // Check if user is an account owner
  const { data: ownedAccount, error: ownedError } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', userId)
    .single()
  console.log('DEBUG [getAccountForUser] owned account query result:', JSON.stringify(ownedAccount), '| error:', ownedError?.message, '| error code:', ownedError?.code)

  if (ownedAccount) {
    console.log('DEBUG [getAccountForUser] returning owned account:', ownedAccount.id)
    return { accountId: ownedAccount.id, userId, role: 'owner' }
  }

  // Check if user is an employee (member of an account)
  const { data: membership, error: memberError } = await supabase
    .from('account_members')
    .select('account_id, role')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .limit(1)
    .single()
  console.log('DEBUG [getAccountForUser] membership query result:', JSON.stringify(membership), '| error:', memberError?.message)

  if (membership) {
    console.log('DEBUG [getAccountForUser] returning member account:', membership.account_id)
    return {
      accountId: membership.account_id,
      userId,
      role: membership.role as 'owner' | 'employee',
    }
  }

  console.log('DEBUG [getAccountForUser] NO account found for user', userId)
  return null
}
