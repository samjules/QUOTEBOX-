import { createHash } from 'crypto'

// Meta Conversions API — CRM lead-stage events for the admin sales pipeline
// (sales_leads). Same Dataset ID as the site-wide Meta Pixel in app/layout.tsx,
// since this feeds the same ad account's Events Manager, just server-side.
const DATASET_ID = '614817694167232'
const API_VERSION = 'v25.0'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function hashedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const e164 = digits.length === 10 ? `1${digits}` : digits
  return sha256(e164)
}

export interface MetaCapiLeadEvent {
  eventName: string // e.g. 'New', 'Contacted', 'Closed', 'Lost' — your own CRM stage names
  email?: string | null
  phone?: string | null
  leadId?: string | null // Meta-generated lead_id, when the lead came from a Meta Lead Ad
  eventTime?: number // unix seconds, defaults to now
}

// Fire-and-forget — never throws, just logs. A missing access token (not yet
// configured) or a Meta-side error should never break the admin action that
// triggered it (saving a status change, etc).
export async function sendMetaCapiEvent(opts: MetaCapiLeadEvent): Promise<void> {
  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (!token) return

  const userData: Record<string, unknown> = {}
  if (opts.email) userData.em = [sha256(opts.email)]
  if (opts.phone) userData.ph = [hashedPhone(opts.phone)]
  if (opts.leadId) userData.lead_id = opts.leadId

  if (!userData.em && !userData.ph && !userData.lead_id) return

  // Set META_CAPI_TEST_EVENT_CODE (from Events Manager -> your dataset -> Test
  // Events tab) to route events into the Test Events view instead of live data —
  // useful for verifying the connection. Remove it once confirmed working.
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE

  const payload = {
    data: [{
      action_source: 'system_generated',
      event_name: opts.eventName,
      event_time: opts.eventTime ?? Math.floor(Date.now() / 1000),
      custom_data: { event_source: 'crm', lead_event_source: 'Quotebox' },
      user_data: userData,
    }],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${DATASET_ID}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.error('Meta CAPI error:', res.status, await res.text())
  } catch (err) {
    console.error('Meta CAPI request failed:', err)
  }
}

// Maps sales_leads.status values to CRM stage event names sent to Meta.
export const SALES_LEAD_STATUS_EVENT_NAMES: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
  lost: 'Lost',
}
