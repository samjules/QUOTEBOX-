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
  starter: {
    name: 'Starter Plan',
    amount: 2000, // $20.00 in cents
    description: '1 quote form, 10 leads/month, 1 VSL',
  },
  growth: {
    name: 'Growth Plan',
    amount: 3000, // $30.00 in cents
    description: '3 quote forms, 50 leads/month, priority support',
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, accountId, userId } = await req.json()

    if (!plan || !accountId || !userId) {
      throw new Error('Missing required parameters')
    }

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`)
    }

    const origin = req.headers.get('origin') || 'https://quote-box.com'

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
      // 7-day free trial for the Starter plan
      subscription_data: plan === 'starter' ? { trial_period_days: 7 } : undefined,
      success_url: `${origin}/billing?subscription=success&plan=${plan}`,
      cancel_url: `${origin}/billing?canceled=true`,
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
