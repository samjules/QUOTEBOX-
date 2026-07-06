import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

// Every table keyed by account_id (or, for `accounts` itself, by id) that we
// know of as of this writing. One missing/renamed table shouldn't kill the
// whole export, so each is queried independently and skipped on error.
const ACCOUNT_TABLES: Array<{ table: string; column: string }> = [
  { table: 'accounts', column: 'id' },
  { table: 'billing', column: 'account_id' },
  { table: 'billing_transactions', column: 'account_id' },
  { table: 'leads', column: 'account_id' },
  { table: 'hosted_forms', column: 'account_id' },
  { table: 'form_visits', column: 'account_id' },
  { table: 'onboarding_sessions', column: 'account_id' },
  { table: 'account_members', column: 'account_id' },
  { table: 'time_entries', column: 'account_id' },
  { table: 'agreements', column: 'account_id' },
  { table: 'automation_steps', column: 'account_id' },
  { table: 'automation_events', column: 'account_id' },
  { table: 'lead_automations', column: 'account_id' },
  { table: 'owner_onboarding_steps', column: 'account_id' },
  { table: 'vsls', column: 'account_id' },
  { table: 'vsl_campaigns', column: 'account_id' },
  { table: 'meta_campaigns', column: 'account_id' },
]

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Array.from(rows.reduce((set, row) => { Object.keys(row).forEach((k) => set.add(k)); return set }, new Set<string>()))
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const accountId = params.id

  const { data: account } = await admin.from('accounts').select('business_name').eq('id', accountId).single()
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const zip = new JSZip()
  const manifest: Record<string, { rows: number } | { error: string }> = {}

  await Promise.all(
    ACCOUNT_TABLES.map(async ({ table, column }) => {
      try {
        const { data, error } = await admin.from(table).select('*').eq(column, accountId)
        if (error) { manifest[table] = { error: error.message }; return }
        const rows = data ?? []
        manifest[table] = { rows: rows.length }
        zip.file(`${table}.json`, JSON.stringify(rows, null, 2))
        if (rows.length > 0) zip.file(`${table}.csv`, toCsv(rows as Record<string, unknown>[]))
      } catch (e) {
        manifest[table] = { error: e instanceof Error ? e.message : 'Unknown error' }
      }
    })
  )

  zip.file('_manifest.json', JSON.stringify({ account_id: accountId, business_name: account.business_name, exported_at: new Date().toISOString(), tables: manifest }, null, 2))

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const slug = (account.business_name || 'account').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const filename = `${slug || 'account'}-${accountId.slice(0, 8)}-export.zip`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
