// Supabase Edge Function: delete-account
// Cancels any active Stripe subscription, deletes all user data, and removes the auth user.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Caller passes the user's access token in the body for verification
    const { userToken } = await req.json()
    if (!userToken) throw new Error('Missing userToken')

    // Verify the token and get the user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Look up account
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!account) throw new Error('Account not found')

    // Look up billing to find Stripe subscription/customer
    const { data: billing } = await supabaseAdmin
      .from('billing')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('account_id', account.id)
      .single()

    // Cancel Stripe subscription immediately if one exists
    if (billing?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(billing.stripe_subscription_id)
      } catch (stripeErr) {
        // Log but don't block account deletion — subscription may already be cancelled
        console.error('Stripe cancellation error (non-fatal):', stripeErr)
      }
    }

    // Delete all data (FK-safe order)
    await supabaseAdmin.from('billing_transactions').delete().eq('account_id', account.id)
    await supabaseAdmin.from('billing').delete().eq('account_id', account.id)
    await supabaseAdmin.from('leads').delete().eq('account_id', account.id)
    await supabaseAdmin.from('hosted_forms').delete().eq('account_id', account.id)
    await supabaseAdmin.from('accounts').delete().eq('id', account.id)

    // Delete the auth user last
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteUserError) throw new Error(`Failed to delete auth user: ${deleteUserError.message}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('Error in delete-account:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
