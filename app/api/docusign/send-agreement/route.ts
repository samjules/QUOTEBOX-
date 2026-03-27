import { NextRequest, NextResponse } from 'next/server'
import docusign from 'docusign-esign'
import { buildDocuSignClient, refreshAccessToken } from '@/lib/docusign/auth'
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

    // Try sending with current token, refresh if expired
    let accessToken = account.docusign_access_token
    let envelopesApi: docusign.EnvelopesApi
    let docuSignAccountId = account.docusign_account_id
    const basePath = account.docusign_base_path || 'https://demo.docusign.net/restapi'

    const buildEnvelope = () => {
      const envDef = new docusign.EnvelopeDefinition()
      envDef.emailSubject = `Moving Agreement from Titan Tuff Moving — ${todayDate}`
      envDef.emailBlurb = `Hi ${customerName}, please review and sign the attached moving service agreement.`
      envDef.status = 'sent'

      const doc = new docusign.Document()
      doc.documentBase64 = Buffer.from(html).toString('base64')
      doc.name = 'Moving Service Agreement'
      doc.fileExtension = 'html'
      doc.documentId = '1'
      envDef.documents = [doc]

      const signer = new docusign.Signer()
      signer.email = customerEmail
      signer.name = customerName
      signer.recipientId = '1'
      signer.routingOrder = '1'

      const signHere = new docusign.SignHere()
      signHere.anchorString = '/sn1/'
      signHere.anchorUnits = 'pixels'
      signHere.anchorXOffset = '0'
      signHere.anchorYOffset = '0'

      const dateSigned = new docusign.DateSigned()
      dateSigned.anchorString = '/ds1/'
      dateSigned.anchorUnits = 'pixels'
      dateSigned.anchorXOffset = '0'
      dateSigned.anchorYOffset = '0'

      const tabs = new docusign.Tabs()
      tabs.signHereTabs = [signHere]
      tabs.dateSignedTabs = [dateSigned]
      signer.tabs = tabs

      envDef.recipients = new docusign.Recipients()
      envDef.recipients.signers = [signer]
      return envDef
    }

    // Attempt with current token
    let result: { envelopeId: string; status: string }
    try {
      const client = buildDocuSignClient({ accessToken, refreshToken: account.docusign_refresh_token, accountId: docuSignAccountId, basePath })
      envelopesApi = client.envelopesApi
      result = await envelopesApi.createEnvelope(docuSignAccountId, { envelopeDefinition: buildEnvelope() })
    } catch (err: unknown) {
      // If 401, try refreshing the token
      const status = (err as { status?: number })?.status
      if (status === 401 && account.docusign_refresh_token) {
        const refreshed = await refreshAccessToken(account.docusign_refresh_token)
        accessToken = refreshed.accessToken

        // Save new tokens
        await supabase
          .from('accounts')
          .update({
            docusign_access_token: refreshed.accessToken,
            docusign_refresh_token: refreshed.refreshToken,
          })
          .eq('id', account.id)

        const client = buildDocuSignClient({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken, accountId: docuSignAccountId, basePath })
        result = await client.envelopesApi.createEnvelope(docuSignAccountId, { envelopeDefinition: buildEnvelope() })
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
