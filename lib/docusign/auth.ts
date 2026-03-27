import docusign from 'docusign-esign'

interface DocuSignCredentials {
  accessToken: string
  refreshToken: string
  accountId: string
  basePath: string
}

/**
 * Refresh a DocuSign access token using the refresh token.
 * Returns the new access token + refresh token pair.
 */
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
 * Build a DocuSign API client using per-user OAuth credentials.
 */
export function buildDocuSignClient(creds: DocuSignCredentials): {
  envelopesApi: docusign.EnvelopesApi
  accountId: string
} {
  const apiClient = new docusign.ApiClient()
  apiClient.setBasePath(creds.basePath)
  apiClient.addDefaultHeader('Authorization', `Bearer ${creds.accessToken}`)

  return {
    envelopesApi: new docusign.EnvelopesApi(apiClient),
    accountId: creds.accountId,
  }
}
