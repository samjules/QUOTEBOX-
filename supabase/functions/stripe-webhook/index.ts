// Supabase Edge Function: stripe-webhook
// Handles Stripe subscription lifecycle events and syncs plan to billing table.

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

// Maps the plan string from checkout session metadata → DB value
const PLAN_MAP: Record<string, 'starter' | 'growth'> = {
  starter: 'starter',
  growth: 'growth',
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing stripe-signature or webhook secret', { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log('Received Stripe event:', event.type)

  try {
    switch (event.type) {
      // ── Subscription created via checkout ─────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const { accountId, plan } = session.metadata ?? {}
        if (!accountId || !plan) {
          console.warn('checkout.session.completed: missing accountId or plan in metadata')
          break
        }

        const mappedPlan = PLAN_MAP[plan]
        if (!mappedPlan) {
          console.warn('checkout.session.completed: unrecognised plan:', plan)
          break
        }

        const { error } = await supabase
          .from('billing')
          .update({
            plan: mappedPlan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('account_id', accountId)

        if (error) throw error
        console.log(`Plan set to '${mappedPlan}' for account ${accountId}`)
        break
      }

      // ── Subscription status changes (e.g. payment failure, renewal) ───────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription

        // Find account by stored stripe_customer_id
        const { data: billing, error: lookupError } = await supabase
          .from('billing')
          .select('account_id, plan')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (lookupError || !billing) {
          console.warn('customer.subscription.updated: no billing row for customer', sub.customer)
          break
        }

        // If the subscription goes past_due or unpaid, clear the plan
        if (['past_due', 'unpaid', 'canceled', 'paused'].includes(sub.status)) {
          const { error } = await supabase
            .from('billing')
            .update({ plan: null, stripe_subscription_id: null })
            .eq('account_id', billing.account_id)
          if (error) throw error
          console.log(`Plan cleared for account ${billing.account_id} — subscription status: ${sub.status}`)
        }
        break
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: billing, error: lookupError } = await supabase
          .from('billing')
          .select('account_id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (lookupError || !billing) {
          console.warn('customer.subscription.deleted: no billing row for customer', sub.customer)
          break
        }

        const { error } = await supabase
          .from('billing')
          .update({ plan: null, stripe_subscription_id: null })
          .eq('account_id', billing.account_id)

        if (error) throw error
        console.log(`Plan cleared for account ${billing.account_id} — subscription deleted`)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }
  } catch (err) {
    console.error('Error processing webhook event:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
