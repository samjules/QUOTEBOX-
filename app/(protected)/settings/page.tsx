'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const supabase = createClient()

  const [accountId, setAccountId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
