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
  // Check if user is an account owner
  const { data: ownedAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (ownedAccount) {
    return { accountId: ownedAccount.id, userId, role: 'owner' }
  }

  // Check if user is an employee (member of an account)
  const { data: membership } = await supabase
    .from('account_members')
    .select('account_id, role')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .limit(1)
    .single()

  if (membership) {
    return {
      accountId: membership.account_id,
      userId,
      role: membership.role as 'owner' | 'employee',
    }
  }

  return null
}
