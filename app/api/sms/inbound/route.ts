import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handleInboundConfirmation } from '@/lib/free-trial'
import { handleAgencyLeadsOptOut } from '@/lib/agency-leads'

function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): boolean {
  const sorted = Object.keys(params).sort()
  let data = url
  for (const key of sorted) data += key + params[key]
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((value, key) => { params[key] = String(value) })

  if (authToken) {
    const signature = req.headers.get('x-twilio-signature') ?? ''
    const url = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/inbound`
      : req.url
    const valid = signature && verifyTwilioSignature(url, params, signature, authToken)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  const from = params.From ?? ''
  const bodyText = params.Body ?? ''
  if (from && bodyText) {
    await handleInboundConfirmation(from, bodyText)
    await handleAgencyLeadsOptOut(from, bodyText)
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
