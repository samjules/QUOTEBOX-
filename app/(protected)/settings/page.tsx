'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdAccount {
  id: string
  name: string
  account_id: string
}

export default function SettingsPage() {
  const supabase = createClient()

  const [accountId, setAccountId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Meta connection state
  const [metaConnected, setMetaConnected] = useState(false)
  const [metaUserId, setMetaUserId] = useState<string | null>(null)
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null)
  const [metaAccessToken, setMetaAccessToken] = useState<string | null>(null)
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [selectedAdAccount, setSelectedAdAccount] = useState('')
  const [loadingAdAccounts, setLoadingAdAccounts] = useState(false)
  const [savingAdAccount, setSavingAdAccount] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (account) {
        setAccountId(account.id)
        setBusinessName(account.business_name ?? '')
        if (account.meta_access_token) {
          setMetaConnected(true)
          setMetaUserId(account.meta_user_id ?? null)
          setMetaAdAccountId(account.meta_ad_account_id ?? null)
          setMetaAccessToken(account.meta_access_token)
          setSelectedAdAccount(account.meta_ad_account_id ?? '')
        }
      }
    }
    load()
  }, [supabase])

  async function handleUpdateBusinessName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('accounts')
      .update({ business_name: businessName })
      .eq('id', accountId)

    setSaving(false)
    setMessage(error ? `Error: ${error.message}` : 'Business name updated successfully!')
  }

  async function handleLoadAdAccounts() {
    if (!metaAccessToken) return
    setLoadingAdAccounts(true)
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${metaAccessToken}`
      )
      const data = await res.json()
      setAdAccounts(data.data || [])
    } catch {
      setMessage('Error: Failed to load ad accounts')
    }
    setLoadingAdAccounts(false)
  }

  async function handleSaveAdAccount() {
    if (!selectedAdAccount || !accountId) return
    setSavingAdAccount(true)
    setMessage('')
    const { error } = await supabase
      .from('accounts')
      .update({ meta_ad_account_id: selectedAdAccount })
      .eq('id', accountId)
    setSavingAdAccount(false)
    if (error) {
      setMessage('Error: Failed to save ad account')
    } else {
      setMetaAdAccountId(selectedAdAccount)
      setMessage('Ad account updated!')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  async function handleDisconnectMeta() {
    if (!accountId) return
    setDisconnecting(true)
    setMessage('')
    const { error } = await supabase
      .from('accounts')
      .update({
        meta_access_token: null,
        meta_user_id: null,
        meta_ad_account_id: null,
      })
      .eq('id', accountId)
    setDisconnecting(false)
    if (error) {
      setMessage('Error: Failed to disconnect Meta account')
    } else {
      setMetaConnected(false)
      setMetaUserId(null)
      setMetaAdAccountId(null)
      setMetaAccessToken(null)
      setAdAccounts([])
      setSelectedAdAccount('')
      setMessage('Meta account disconnected.')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setMessage(`${label} copied to clipboard!`)
    setTimeout(() => setMessage(''), 2000)
  }

  const embedScript = `<div id="quoteflow-form"></div>
<script src="https://yourdomain.github.io/embed.js"><\/script>
<script>
  QuoteFlow.init({
    accountId: '${accountId}',
    targetElement: 'quoteflow-form'
  });
<\/script>`

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 space-y-6">
          {/* Business Information */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Business Information
            </h2>
            <form onSubmit={handleUpdateBusinessName}>
              <div className="mb-4">
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-4 py-2 border"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update Business Name'}
              </button>
            </form>
          </div>

          {/* Meta Ads Integration */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-1">Meta Ads Integration</h2>
            <p className="text-sm text-gray-500 mb-5">Manage your connected Facebook account and ad account.</p>

            {!metaConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-500">No Meta account connected</span>
                </div>
                <a
                  href="/api/meta/connect"
                  className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1568d3] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Connect Meta Account
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Connected status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-gray-700">Connected</span>
                    {metaUserId && (
                      <span className="text-xs text-gray-400">· User ID: {metaUserId}</span>
                    )}
                  </div>
                  <a
                    href="/api/meta/connect"
                    className="text-sm text-[#1877F2] hover:underline font-medium"
                  >
                    Switch Facebook account
                  </a>
                </div>

                {/* Current ad account */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Ad Account</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {metaAdAccountId ? `Currently using: ${metaAdAccountId}` : 'No ad account selected'}
                  </p>

                  {adAccounts.length === 0 ? (
                    <button
                      onClick={handleLoadAdAccounts}
                      disabled={loadingAdAccounts}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                    >
                      {loadingAdAccounts ? 'Loading…' : 'Change ad account →'}
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedAdAccount}
                        onChange={(e) => setSelectedAdAccount(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select an ad account…</option>
                        {adAccounts.map((acc) => (
                          <option key={acc.id} value={acc.account_id}>
                            {acc.name} ({acc.account_id})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveAdAccount}
                        disabled={!selectedAdAccount || savingAdAccount}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
                      >
                        {savingAdAccount ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Disconnect */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={handleDisconnectMeta}
                    disabled={disconnecting}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    {disconnecting ? 'Disconnecting…' : 'Disconnect Meta account'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account ID */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Account ID
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              Use this ID in your embed code
            </p>
            <div className="flex items-center">
              <input
                type="text"
                value={accountId}
                readOnly
                className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md px-4 py-2 bg-gray-50 border"
              />
              <button
                onClick={() => copyToClipboard(accountId, 'Account ID')}
                className="ml-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition whitespace-nowrap"
              >
                Copy ID
              </button>
            </div>
          </div>

          {/* Embed Script */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Embed Script
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Copy this script and add it to your website&apos;s HTML
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                {embedScript}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(embedScript, 'Embed script')}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            >
              Copy Embed Script
            </button>
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`rounded-md p-4 ${message.startsWith('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
            >
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
