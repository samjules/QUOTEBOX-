export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
}> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY!
  const secretKey = process.env.DOCUSIGN_SECRET_KEY!
  const authServer = process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com'

  const basicAuth = Buffer.from(`${integrationKey}:${secretKey}`).toString('base64')
  const res = await fetch(`https://${authServer}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const data = await res.json()
  if (!data.access_token) {
    throw new Error(data.error || 'Failed to refresh DocuSign token')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}

/**
 * Send an envelope via DocuSign REST API (no SDK needed).
 */
export async function createEnvelope(
  basePath: string,
  accountId: string,
  accessToken: string,
  envelopeBody: Record<string, unknown>,
): Promise<{ envelopeId: string; status: string }> {
  const res = await fetch(
    `${basePath}/v2.1/accounts/${accountId}/envelopes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(envelopeBody),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const error = new Error(err.message || err.errorCode || `DocuSign API error ${res.status}`)
    ;(error as unknown as Record<string, number>).status = res.status
    throw error
  }

  const data = await res.json()
  return { envelopeId: data.envelopeId, status: data.status }
}
