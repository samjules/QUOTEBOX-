const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_BASE = 'https://api.zoom.us/v2'

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value

  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured')
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${accountId}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}` },
  })
  if (!res.ok) {
    throw new Error(`Zoom token request failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return cachedToken.value
}

export interface ZoomMeeting {
  id: string
  joinUrl: string
}

// startTime must be an ISO 8601 UTC instant, e.g. scheduledAt.toISOString()
export async function createZoomMeeting(topic: string, startTime: string): Promise<ZoomMeeting> {
  const token = await getAccessToken()
  const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      type: 2, // scheduled meeting
      start_time: startTime,
      duration: 30,
      timezone: 'UTC',
      settings: {
        join_before_host: true,
        waiting_room: false,
      },
    }),
  })
  if (!res.ok) {
    throw new Error(`Zoom create meeting failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return { id: String(data.id), joinUrl: data.join_url }
}

export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const token = await getAccessToken()
  const res = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  // 404 means it's already gone — treat as success
  if (!res.ok && res.status !== 404) {
    throw new Error(`Zoom delete meeting failed: ${res.status} ${await res.text()}`)
  }
}
