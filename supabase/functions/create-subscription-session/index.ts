// Supabase Edge Function: create-subscription-session
// File: supabase/functions/create-subscription-session/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PLANS = {
  pro: {
    name: 'Pro Plan',
    amount: 35000, // $350.00 in cents
    description: 'Unlimited quote forms, unlimited leads, full platform access',
  },
  ppl_onboarding: {
    name: 'Pay Per Lead — Onboarding',
    amount: 75000, // $750.00 in cents
    description: 'Pay Per Lead plan setup — monthly subscription',
  },
}

const TRIAL_1_COUPON_ID = 'trial-1-dollar-1mo'

async function ensureTrialCoupon(): Promise<string> {
  try {
    await stripe.coupons.retrieve(TRIAL_1_COUPON_ID)
  } catch (_) {
    await stripe.coupons.create({
      id: TRIAL_1_COUPON_ID,
      amount_off: 3300, // $34.00 - $1.00 = $33.00 off, in cents
      currency: 'usd',
      duration: 'repeating',
      duration_in_months: 1,
      name: '$1 Trial — first month',
    })
  }
  return TRIAL_1_COUPON_ID
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, accountId, userId, trialDays, upsell, successUrl, cancelUrl } = await req.json()

    if (!plan || !accountId || !userId) {
      throw new Error('Missing required parameters')
    }

    const origin = req.headers.get('origin') || 'https://quote-box.com'

    // $1 trial: $34/mo recurring, discounted to $1 for the first month via a repeating coupon,
    // plus an optional one-time $297 "done for you" setup line in the same checkout session.
    if (plan === 'trial_1') {
      const couponId = await ensureTrialCoupon()

      const lineItems: Array<Record<string, unknown>> = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Quotebox — Monthly',
              description: '$1 for your first month, then $34/mo',
            },
            unit_amount: 3400,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ]

      if (upsell === true) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Done-For-You Setup',
              description: 'One-time setup — SMS/email sequence, CRM pipeline, pricing rules, walkthrough call',
            },
            unit_amount: 29700,
          },
          quantity: 1,
        })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems as Stripe.Checkout.SessionCreateParams.LineItem[],
        mode: 'subscription',
        discounts: [{ coupon: couponId }],
        success_url: successUrl || `${origin}/build/confirm?session_id={CHECKOUT_SESSION_ID}&account_id=${accountId}`,
        cancel_url: cancelUrl || `${origin}/dashboard?checkout=cancelled`,
        metadata: {
          accountId,
          userId,
          plan,
          upsell: upsell === true ? 'yes' : 'no',
        },
      })

      console.log('Trial checkout session created:', session.id, 'upsell:', upsell === true)

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`)
    }

    const resolvedTrialDays: number | undefined =
      typeof trialDays === 'number' ? trialDays : undefined

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: resolvedTrialDays ? { trial_period_days: resolvedTrialDays } : undefined,
      success_url: successUrl || `${origin}/billing?subscription=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/billing?canceled=true`,
      metadata: {
        accountId,
        userId,
        plan,
      },
    })

    console.log('Subscription checkout session created:', session.id, 'plan:', plan)

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating subscription session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
