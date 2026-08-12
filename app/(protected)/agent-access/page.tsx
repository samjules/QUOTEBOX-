'use client'

import { useEffect, useState } from 'react'

interface AgentKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

interface AgentProposal {
  id: string
  target: 'automation' | 'form'
  action: 'update' | 'create'
  target_id: string | null
  changes: Record<string, unknown>
  rationale: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  resolved_at: string | null
}

const ALL_SCOPES = ['analytics:read', 'automations:read', 'automations:write', 'forms:read', 'forms:write']

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function AgentAccessPage() {
  const [keys, setKeys] = useState<AgentKey[]>([])
  const [proposals, setProposals] = useState<AgentProposal[]>([])
  const [loading, setLoading] = useState(true)

  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(ALL_SCOPES)
  const [creating, setCreating] = useState(false)
  const [mintedKey, setMintedKey] = useState<string | null>(null)

  const [resolving, setResolving] = useState<string | null>(null)

  async function loadAll() {
    setLoading(true)
    const [keysRes, proposalsRes] = await Promise.all([
      fetch('/api/agent/keys').then((r) => r.json()),
      fetch('/api/agent/proposals').then((r) => r.json()),
    ])
    setKeys(keysRes.keys ?? [])
    setProposals(proposalsRes.proposals ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim() || newKeyScopes.length === 0) return
    setCreating(true)
    const res = await fetch('/api/agent/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim(), scopes: newKeyScopes }),
    })
    const body = await res.json()
    setCreating(false)
    if (res.ok) {
      setMintedKey(body.plaintext)
      setNewKeyName('')
      loadAll()
    } else {
      alert(body.error ?? 'Failed to create key')
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this key? Anything using it will lose access immediately.')) return
    const res = await fetch(`/api/agent/keys/${id}`, { method: 'DELETE' })
    if (res.ok) loadAll()
  }

  async function handleResolve(id: string, decision: 'approved' | 'rejected') {
    setResolving(id)
    const res = await fetch(`/api/agent/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    setResolving(null)
    if (res.ok) loadAll()
    else alert((await res.json()).error ?? 'Failed to update proposal')
  }

  const pendingProposals = proposals.filter((p) => p.status === 'pending')
  const resolvedProposals = proposals.filter((p) => p.status !== 'pending')

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Agent Access</h1>
        <p className="text-sm text-gray-500 mt-1">
          Let an external AI agent (like Tim) read your analytics and propose changes to automations and
          forms. Proposed changes never apply automatically — approve or reject them below.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Pending proposals */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Pending Proposals</h2>
          <p className="text-sm text-gray-500 mb-5">Changes an agent has queued, waiting on your approval.</p>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : pendingProposals.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing pending.</p>
          ) : (
            <div className="space-y-3">
              {pendingProposals.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {p.action === 'create' ? 'Create' : 'Update'} {p.target}
                      </div>
                      {p.rationale && <p className="text-sm text-gray-600 mt-1">&ldquo;{p.rationale}&rdquo;</p>}
                      <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2 overflow-x-auto">
                        {JSON.stringify(p.changes, null, 2)}
                      </pre>
                      <p className="text-xs text-gray-400 mt-2">Proposed {fmtDate(p.created_at)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolve(p.id, 'approved')}
                        disabled={resolving === p.id}
                        className="bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition disabled:opacity-50 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolve(p.id, 'rejected')}
                        disabled={resolving === p.id}
                        className="text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition disabled:opacity-50 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API keys */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">API Keys</h2>
          <p className="text-sm text-gray-500 mb-5">Keys an agent uses to authenticate. Scope each key to only what it needs.</p>

          {mintedKey && (
            <div className="mb-5 border border-amber-200 bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900">Copy this key now — it won&apos;t be shown again.</p>
              <code className="block text-sm bg-white border border-amber-200 rounded px-3 py-2 mt-2 break-all">{mintedKey}</code>
              <button onClick={() => setMintedKey(null)} className="text-xs text-amber-700 hover:text-amber-900 mt-2 font-medium">
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleCreateKey} className="border border-gray-200 rounded-lg p-4 mb-5">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Key name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Tim"
                className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md px-4 py-2 border"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Scopes</label>
              <div className="flex flex-wrap gap-3">
                {ALL_SCOPES.map((scope) => (
                  <label key={scope} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newKeyScopes.includes(scope)}
                      onChange={(e) =>
                        setNewKeyScopes((prev) =>
                          e.target.checked ? [...prev, scope] : prev.filter((s) => s !== scope)
                        )
                      }
                    />
                    {scope}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !newKeyName.trim() || newKeyScopes.length === 0}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-50 text-sm font-medium"
            >
              {creating ? 'Creating…' : 'Create Key'}
            </button>
          </form>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-400">No keys yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {k.name} <span className="text-gray-400 font-normal">{k.key_prefix}…</span>
                      {k.revoked_at && <span className="ml-2 text-xs text-red-500 font-medium">Revoked</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{k.scopes.join(', ')}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Created {fmtDate(k.created_at)} · Last used {fmtDate(k.last_used_at)}
                    </div>
                  </div>
                  {!k.revoked_at && (
                    <button onClick={() => handleRevoke(k.id)} className="text-sm text-red-500 hover:text-red-600 font-medium">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved proposals */}
        {resolvedProposals.length > 0 && (
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">History</h2>
            <div className="space-y-2">
              {resolvedProposals.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                  <span className="text-gray-700">
                    {p.action === 'create' ? 'Create' : 'Update'} {p.target}
                  </span>
                  <span className={p.status === 'approved' ? 'text-brand-600 font-medium' : 'text-gray-400 font-medium'}>
                    {p.status} {fmtDate(p.resolved_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
