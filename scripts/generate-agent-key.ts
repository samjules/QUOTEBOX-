// Mints an agent API key directly against Supabase using the service role
// key — for when you need a key before there's a UI for it (e.g. bootstrapping
// Tim's access). Prints the plaintext once; only its hash is ever stored.
//
// Usage:
//   npx tsx scripts/generate-agent-key.ts <account-owner-email> <key-name> <scope1,scope2,...>
//
// Example:
//   npx tsx scripts/generate-agent-key.ts sam@quote-box.com "Tim" analytics:read,automations:read,automations:write,forms:read,forms:write

import { randomBytes, createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const VALID_SCOPES = ['analytics:read', 'automations:read', 'automations:write', 'forms:read', 'forms:write']

async function main() {
  const [email, name, scopesArg] = process.argv.slice(2)
  if (!email || !name || !scopesArg) {
    console.error('Usage: npx tsx scripts/generate-agent-key.ts <account-owner-email> <key-name> <scope1,scope2,...>')
    console.error(`Valid scopes: ${VALID_SCOPES.join(', ')}`)
    process.exit(1)
  }

  const scopes = scopesArg.split(',').map((s) => s.trim())
  const invalid = scopes.filter((s) => !VALID_SCOPES.includes(s))
  if (invalid.length > 0) {
    console.error(`Invalid scopes: ${invalid.join(', ')}`)
    process.exit(1)
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: authUser, error: userError } = await admin.auth.admin.listUsers()
  if (userError) throw userError
  const user = authUser.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error(`No auth user found for ${email}`)
    process.exit(1)
  }

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (accountError || !account) {
    console.error(`No account found owned by ${email}`)
    process.exit(1)
  }

  const plaintext = `qbk_${randomBytes(24).toString('hex')}`
  const keyHash = createHash('sha256').update(plaintext).digest('hex')

  const { error } = await admin.from('agent_api_keys').insert({
    account_id: account.id,
    name,
    key_hash: keyHash,
    key_prefix: plaintext.slice(0, 12),
    scopes,
  })
  if (error) throw error

  console.log(`Key created for ${email} (account ${account.id})`)
  console.log(`Scopes: ${scopes.join(', ')}`)
  console.log(`\n${plaintext}\n`)
  console.log('This is shown once. Store it now — QuoteBox never stores the plaintext.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
