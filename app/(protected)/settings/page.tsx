'use client'

// MIGRATION REQUIRED — run once in the Supabase SQL editor before logo saving works:
//   ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DELETE_ACCOUNT_FUNCTION_URL = process.env.NEXT_PUBLIC_DELETE_ACCOUNT_FUNCTION_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface AdAccount {
  id: string
  name: string
  account_id: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [accountId, setAccountId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

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

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

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
        setLogoUrl(account.logo_url ?? null)
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

  async function handleLogoUpload(file: File) {
    if (!accountId) return
    setLogoUploading(true)
    setMessage('')
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `logos/${accountId}/logo-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('vsls').upload(path, file, { upsert: true })
    if (uploadErr) {
      setMessage('Error: Failed to upload logo')
      setLogoUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('vsls').getPublicUrl(path)
    const { error: saveErr } = await supabase
      .from('accounts')
      .update({ logo_url: publicUrl } as Record<string, string>)
      .eq('id', accountId)
    if (saveErr) {
      setMessage('Error: Failed to save logo')
    } else {
      setLogoUrl(publicUrl)
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logoUrl: publicUrl } }))
      setMessage('Logo updated!')
      setTimeout(() => setMessage(''), 2000)
    }
    setLogoUploading(false)
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(DELETE_ACCOUNT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userToken: session.access_token }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete account')

      await supabase.auth.signOut()
      router.replace('/login')
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Failed to delete account'}`)
      setDeleting(false)
      setShowDeleteModal(false)
    }
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
          {/* Logo */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-1">Logo</h2>
            <p className="text-sm text-gray-500 mb-5">Upload your business logo. It will appear at the bottom of your sidebar.</p>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium"
                >
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button
                    onClick={async () => {
                      await supabase.from('accounts').update({ logo_url: null } as Record<string, null>).eq('id', accountId)
                      setLogoUrl(null)
                      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logoUrl: null } }))
                      setMessage('Logo removed.')
                      setTimeout(() => setMessage(''), 2000)
                    }}
                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove logo
                  </button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG, SVG — max 2 MB</p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

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

          {/* Danger Zone */}
          <div className="bg-white shadow rounded-xl p-6 border border-red-200">
            <h2 className="text-lg font-medium text-red-600 mb-1">Danger Zone</h2>
            <p className="text-sm text-gray-500 mb-5">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText('') }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={() => !deleting && setShowDeleteModal(false)}
            />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete your account?</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-5 pl-4 list-disc">
                <li>All your leads and hosted forms</li>
                <li>All billing records and transactions</li>
                <li>Your active subscription (cancelled immediately)</li>
                <li>Your account and login access</li>
              </ul>

              <p className="text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
