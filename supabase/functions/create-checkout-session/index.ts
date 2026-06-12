// Supabase Edge Function: create-checkout-session
// File: supabase/functions/create-checkout-session/index.ts

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, credits, accountId, userId } = await req.json()

    console.log('Creating checkout session:', { amount, credits, accountId, userId })

    // Validate inputs
    if (!amount || !credits || !accountId || !userId) {
      throw new Error('Missing required parameters')
    }

    // Get the origin from request or use a fallback
    const origin = req.headers.get('origin') || 'https://your-domain.com'

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Lead Credits`,
              description: `Purchase ${credits} credits for lead generation`,
              images: ['https://your-logo-url.com/logo.png'], // Optional: Add your logo
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        accountId,
        userId,
        credits: credits.toString(),
        costPerLead: (amount / credits).toString(),
      },
      // Optional: Collect customer email
      customer_email: undefined, // You can pass user email here if available
    })

    console.log('Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})