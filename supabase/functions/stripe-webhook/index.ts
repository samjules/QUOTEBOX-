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
const PLAN_MAP: Record<string, 'starter' | 'growth' | 'pay_per_lead' | 'trial'> = {
  starter: 'starter',
  growth: 'growth',
  ppl_onboarding: 'pay_per_lead',
  trial_1: 'trial',
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

        // Handle one-time credit purchases
        if (session.mode === 'payment') {
          const { accountId, credits } = session.metadata ?? {}
          if (!accountId) {
            console.warn('checkout.session.completed (payment): missing accountId in metadata')
            break
          }

          const creditAmount = (session.amount_total ?? 0) / 100

          // Fetch current balance
          const { data: currentBilling } = await supabase
            .from('billing')
            .select('credit_balance')
            .eq('account_id', accountId)
            .single()

          const currentBalance = currentBilling?.credit_balance ?? 0
          const newBalance = currentBalance + creditAmount

          const { error: creditError } = await supabase
            .from('billing')
            .upsert(
              {
                account_id: accountId,
                credit_balance: newBalance,
                stripe_customer_id: session.customer as string,
              },
              { onConflict: 'account_id' }
            )

          if (creditError) throw creditError

          // Log the transaction
          await supabase.from('billing_transactions').insert({
            account_id: accountId,
            type: 'credit_purchase',
            amount: creditAmount,
            balance_after: newBalance,
            description: `Purchased ${credits ?? Math.round(creditAmount / 15)} lead credits`,
          })

          console.log(`Credit purchase: +$${creditAmount} for account ${accountId} (new balance: $${newBalance})`)
          break
        }

        // Handle subscription checkout
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

        // Fetch the subscription to capture trial end date
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const trialEndsAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

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
        console.log(`Plan set to '${mappedPlan}' for account ${accountId}${trialEndsAt ? ` (trial until ${trialEndsAt})` : ''}`)
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
            .update({ plan: null, stripe_subscription_id: null, trial_ends_at: null })
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
          .update({ plan: null, stripe_subscription_id: null, trial_ends_at: null })
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
