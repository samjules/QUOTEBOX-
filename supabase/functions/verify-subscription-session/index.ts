// Supabase Edge Function: verify-subscription-session
// Called after a successful Stripe checkout redirect.
// Verifies the session directly with Stripe and updates billing — no webhook dependency.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PLAN_MAP: Record<string, 'pro'> = {
  pro: 'pro',
}

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
    const { sessionId, accountId } = await req.json()

    if (!sessionId || !accountId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId or accountId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Retrieve and verify the session directly from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ error: 'Session not completed or unpaid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the accountId in metadata matches what was passed in (prevents spoofing)
    if (session.metadata?.accountId !== accountId) {
      return new Response(JSON.stringify({ error: 'Account ID mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const plan = session.metadata?.plan
    const mappedPlan = plan ? PLAN_MAP[plan] : null
    if (!mappedPlan) {
      return new Response(JSON.stringify({ error: `Unrecognised plan: ${plan}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get trial end date from subscription
    let trialEndsAt: string | null = null
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        trialEndsAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null
      } catch (_) {
        // Subscription may have been deleted — use 7 days from now as fallback
        trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    const { error } = await supabase
      .from('billing')
      .upsert(
        {
          account_id: accountId,
          plan: mappedPlan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          trial_ends_at: trialEndsAt,
        },
        { onConflict: 'account_id' }
      )

    if (error) throw error

    console.log(`Billing updated for account ${accountId} — plan: ${mappedPlan}`)

    return new Response(
      JSON.stringify({ success: true, plan: mappedPlan, trial_ends_at: trialEndsAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error verifying session:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
