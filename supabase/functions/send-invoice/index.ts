// Supabase Edge Function: send-invoice
// Creates and sends a Stripe invoice, optionally via a connected account.
// Also sends an SMS with the payment link via Twilio if phone is provided.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, phone, amount, description, stripeConnectAccountId } = await req.json()

    if (!email || !amount) {
      return new Response(
        JSON.stringify({ error: 'email and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestOptions = stripeConnectAccountId
      ? { stripeAccount: stripeConnectAccountId as string }
      : {}

    // Find or create customer
    const existing = await stripe.customers.list({ email, limit: 1 }, requestOptions)
    const customer = existing.data[0]
      ?? await stripe.customers.create({ email, name: name || email }, requestOptions)

    // Create draft invoice first
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 7,
    }, requestOptions)

    // Explicitly attach the line item to this invoice by ID — fixes $0 amount bug
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      description: description || 'Service quote',
    }, requestOptions)

    // Finalize and send
    const sent = await stripe.invoices.sendInvoice(invoice.id, {}, requestOptions)

    // Send SMS if phone provided and Twilio is configured
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER')
    const paymentUrl = sent.hosted_invoice_url

    let smsSent = false
    if (phone && twilioSid && twilioToken && twilioFrom && paymentUrl) {
      try {
        const to = formatPhone(phone)
        const body = `Hi${name ? ` ${name}` : ''}, you have a new invoice` +
          `${description ? ` for "${description}"` : ''}. ` +
          `View and pay here: ${paymentUrl}`

        const smsRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ From: twilioFrom, To: to, Body: body }),
          }
        )
        smsSent = smsRes.ok
      } catch {
        // SMS failure is non-fatal — invoice already sent via email
      }
    }

    return new Response(
      JSON.stringify({ id: sent.id, status: sent.status, smsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
