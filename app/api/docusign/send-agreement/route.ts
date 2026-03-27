import { NextRequest, NextResponse } from 'next/server'
import { createEnvelope, refreshAccessToken } from '@/lib/docusign/auth'
import { buildAgreementHtml, type AgreementData } from '@/lib/docusign/agreement-template'
import { createClient } from '@/lib/supabase/server'

interface SendAgreementPayload {
  leadId: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  pickupAddress?: string | null
  deliveryAddress?: string | null
  moveDate?: string | null
  quoteAmount?: number | null
  currency?: string
  serviceDescription?: string | null
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: SendAgreementPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { leadId, customerName, customerEmail } = payload
  if (!leadId || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'leadId, customerName, and customerEmail are required' }, { status: 400 })
  }

  // Get account with DocuSign credentials
  const { data: account } = await supabase
    .from('accounts')
    .select('id, docusign_access_token, docusign_refresh_token, docusign_account_id, docusign_base_path')
    .eq('owner_id', user.id)
    .single()
  if (!account) {
    return NextResponse.json({ error: 'No account found' }, { status: 403 })
  }

  if (!account.docusign_access_token || !account.docusign_account_id) {
    return NextResponse.json({ error: 'DocuSign not connected. Go to Settings to connect your DocuSign account.' }, { status: 400 })
  }

  // Verify lead ownership
  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .eq('account_id', account.id)
    .single()
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 })
  }

  try {
    // Build agreement HTML
    const todayDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const agreementData: AgreementData = {
      customerName,
      customerEmail,
      customerPhone: payload.customerPhone ?? null,
      pickupAddress: payload.pickupAddress ?? null,
      deliveryAddress: payload.deliveryAddress ?? null,
      moveDate: payload.moveDate ?? null,
      quoteAmount: payload.quoteAmount ?? null,
      currency: payload.currency ?? '$',
      serviceDescription: payload.serviceDescription ?? null,
      todayDate,
    }
    const html = buildAgreementHtml(agreementData)

    const docuSignAccountId = account.docusign_account_id
    const basePath = account.docusign_base_path || 'https://demo.docusign.net/restapi'

    const envelopeBody = {
      emailSubject: `Moving Agreement from Titan Tuff Moving — ${todayDate}`,
      emailBlurb: `Hi ${customerName}, please review and sign the attached moving service agreement.`,
      status: 'sent',
      documents: [
        {
          documentBase64: Buffer.from(html).toString('base64'),
          name: 'Moving Service Agreement',
          fileExtension: 'html',
          documentId: '1',
        },
      ],
      recipients: {
        signers: [
          {
            email: customerEmail,
            name: customerName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [
                { anchorString: '/sn1/', anchorUnits: 'pixels', anchorXOffset: '0', anchorYOffset: '0' },
              ],
              dateSignedTabs: [
                { anchorString: '/ds1/', anchorUnits: 'pixels', anchorXOffset: '0', anchorYOffset: '0' },
              ],
            },
          },
        ],
      },
    }

    // Attempt with current token
    let result: { envelopeId: string; status: string }
    let accessToken = account.docusign_access_token
    try {
      result = await createEnvelope(basePath, docuSignAccountId, accessToken, envelopeBody)
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 401 && account.docusign_refresh_token) {
        // Token expired — refresh and retry
        const refreshed = await refreshAccessToken(account.docusign_refresh_token)
        accessToken = refreshed.accessToken

        await supabase
          .from('accounts')
          .update({
            docusign_access_token: refreshed.accessToken,
            docusign_refresh_token: refreshed.refreshToken,
          })
          .eq('id', account.id)

        result = await createEnvelope(basePath, docuSignAccountId, refreshed.accessToken, envelopeBody)
      } else {
        throw err
      }
    }

    // Track on lead record
    await supabase
      .from('leads')
      .update({
        agreement_envelope_id: result.envelopeId,
        agreement_status: result.status,
        agreement_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    return NextResponse.json({
      envelopeId: result.envelopeId,
      status: result.status,
    })
  } catch (err) {
    console.error('DocuSign send error:', err)
    const message = err instanceof Error ? err.message : 'Failed to send agreement'
    if (message.includes('consent') || message.includes('AUTHORIZATION')) {
      return NextResponse.json(
        { error: 'DocuSign authorization expired. Please reconnect in Settings.' },
        { status: 401 },
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
