// Supabase Edge Function: send-invoice
// Called from the web app to create and send a Stripe invoice to a customer.
// Supports Stripe Connect — pass stripeConnectAccountId to invoice via a connected account.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, amount, description, stripeConnectAccountId } = await req.json()

    if (!email || !amount) {
      return new Response(
        JSON.stringify({ error: 'email and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // When a connected account is provided, all API calls are scoped to that account
    const requestOptions = stripeConnectAccountId
      ? { stripeAccount: stripeConnectAccountId as string }
      : {}

    // Find or create Stripe customer (within the connected account if provided)
    const existing = await stripe.customers.list({ email, limit: 1 }, requestOptions)
    const customer = existing.data[0]
      ?? await stripe.customers.create({ email, name: name || email }, requestOptions)

    // Add invoice line item
    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      description: description || 'Service quote',
    }, requestOptions)

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 7,
    }, requestOptions)

    // Send invoice
    const sent = await stripe.invoices.sendInvoice(invoice.id, {}, requestOptions)

    return new Response(
      JSON.stringify({ id: sent.id, status: sent.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
