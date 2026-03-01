'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdCreative {
  id: string
  name: string
  url: string
  isImage: boolean
}

interface AdAccount {
  id: string
  name: string
  account_id: string
}

interface GeneratedCopy {
  campaignName: string
  adSetName: string
  headlines: string[]
  bodyTexts: string[]
  cta: string
  targetingKeywords: string[]
  summary: string
}

interface CreatedCampaign {
  campaignId: string
  adSetId: string
  campaignName: string
  adSetName: string
  adsManagerUrl: string
  status: string
}

interface Questionnaire {
  objective: string
  ageMin: number
  ageMax: number
  gender: string
  location: string
  interests: string
  businessOffer: string
  sellingPoints: string
  tone: string
  dailyBudget: number
  duration: number | 'ongoing'
  vslId: string | null
  vslUrl: string | null
  vslTitle: string | null
}

type PageState = 'disconnected' | 'pick-account' | 'questionnaire' | 'created'
type Step = 1 | 2 | 3 | 4 | 5

const OBJECTIVES = [
  { value: 'OUTCOME_LEADS', label: 'Lead Generation', desc: 'Collect contact info from interested people' },
  { value: 'OUTCOME_TRAFFIC', label: 'Website Traffic', desc: 'Drive people to your website or landing page' },
  { value: 'OUTCOME_AWARENESS', label: 'Brand Awareness', desc: 'Reach people most likely to remember your ad' },
  { value: 'OUTCOME_SALES', label: 'Conversions', desc: 'Drive valuable actions on your website' },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Casual' },
  { value: 'urgent', label: 'Urgent & Direct' },
  { value: 'inspirational', label: 'Inspirational' },
]

const DURATIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 'ongoing' as const, label: 'Ongoing (no end date)' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MetaAdsPage() {
  const supabase = createClient()

  const [pageState, setPageState] = useState<PageState>('disconnected')
  const [loading, setLoading] = useState(true)
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [selectedAdAccount, setSelectedAdAccount] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null)
  const [createdCampaign, setCreatedCampaign] = useState<CreatedCampaign | null>(null)
  const [error, setError] = useState('')
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null)
  const [creatives, setCreatives] = useState<AdCreative[]>([])

  const [questionnaire, setQuestionnaire] = useState<Questionnaire>({
    objective: 'OUTCOME_LEADS',
    ageMin: 25,
    ageMax: 55,
    gender: 'all',
    location: 'US',
    interests: '',
    businessOffer: '',
    sellingPoints: '',
    tone: 'professional',
    dailyBudget: 20,
    duration: 14,
    vslId: null,
    vslUrl: null,
    vslTitle: null,
  })

  // ─── Load account state ──────────────────────────────────────────────────

  useEffect(() => {
    async function loadAccountState() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: account } = await supabase
        .from('accounts')
        .select('meta_access_token, meta_ad_account_id, meta_user_id')
        .eq('owner_id', user.id)
        .single()

      if (!account?.meta_access_token) {
        setPageState('disconnected')
        setLoading(false)
        return
      }

      setMetaAdAccountId(account.meta_ad_account_id || null)

      // Load ad creatives from storage bucket
      const { data: accountRow } = await supabase
        .from('accounts')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      if (accountRow) {
        const { data: files } = await supabase.storage
          .from('vsls')
          .list(accountRow.id, { sortBy: { column: 'created_at', order: 'desc' } })
        const creativeList: AdCreative[] = (files || []).map((file) => {
          const path = `${accountRow.id}/${file.name}`
          const { data: urlData } = supabase.storage.from('vsls').getPublicUrl(path)
          const mime = file.metadata?.mimetype || ''
          return {
            id: file.id || path,
            name: file.name,
            url: urlData.publicUrl,
            isImage: mime.startsWith('image/'),
          }
        })
        setCreatives(creativeList)
      }

      if (!account.meta_ad_account_id) {
        // Fetch ad accounts to let user pick one
        try {
          const res = await fetch(
            `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${account.meta_access_token}`
          )
          const data = await res.json()
          setAdAccounts(data.data || [])
        } catch {
          setAdAccounts([])
        }
        setPageState('pick-account')
      } else {
        setPageState('questionnaire')
      }

      setLoading(false)
    }

    // Check URL params for OAuth result
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/meta-ads')
    }
    const urlError = params.get('error')
    if (urlError) {
      setError(`Connection failed: ${urlError.replace(/_/g, ' ')}`)
      window.history.replaceState({}, '', '/meta-ads')
    }

    loadAccountState()
  }, [supabase])

  // ─── Handlers ────────────────────────────────────────────────────────────

  function handleConnectMeta() {
    window.location.href = '/api/meta/connect'
  }

  async function handleSaveAdAccount() {
    if (!selectedAdAccount) return
    setSavingAccount(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ meta_ad_account_id: selectedAdAccount })
      .eq('owner_id', user.id)

    if (updateError) {
      setError('Failed to save ad account selection')
      setSavingAccount(false)
      return
    }

    setMetaAdAccountId(selectedAdAccount)
    setPageState('questionnaire')
    setSavingAccount(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/meta/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: questionnaire.objective,
          targetAge: { min: questionnaire.ageMin, max: questionnaire.ageMax },
          targetGender: questionnaire.gender,
          targetLocation: questionnaire.location,
          targetInterests: questionnaire.interests,
          businessOffer: questionnaire.businessOffer,
          sellingPoints: questionnaire.sellingPoints,
          tone: questionnaire.tone,
          dailyBudget: questionnaire.dailyBudget,
          duration: questionnaire.duration,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed')
        setGenerating(false)
        return
      }

      setGeneratedCopy(data)
    } catch {
      setError('Failed to generate campaign copy')
    }

    setGenerating(false)
  }

  async function handleCreateCampaign() {
    if (!generatedCopy) return
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/meta/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: generatedCopy.campaignName,
          adSetName: generatedCopy.adSetName,
          objective: questionnaire.objective,
          dailyBudget: questionnaire.dailyBudget,
          duration: questionnaire.duration,
          targetAge: { min: questionnaire.ageMin, max: questionnaire.ageMax },
          targetGender: questionnaire.gender,
          targetLocation: questionnaire.location,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Campaign creation failed')
        setCreating(false)
        return
      }

      setCreatedCampaign(data)
      setPageState('created')
    } catch {
      setError('Failed to create campaign')
    }

    setCreating(false)
  }

  function handleReset() {
    setPageState('questionnaire')
    setStep(1)
    setGeneratedCopy(null)
    setCreatedCampaign(null)
    setError('')
    setQuestionnaire({
      objective: 'OUTCOME_LEADS',
      ageMin: 25,
      ageMax: 55,
      gender: 'all',
      location: 'US',
      interests: '',
      businessOffer: '',
      sellingPoints: '',
      tone: 'professional',
      dailyBudget: 20,
      duration: 14,
      vslId: null,
      vslUrl: null,
      vslTitle: null,
    })
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // ─── State A: Disconnected ────────────────────────────────────────────────

  if (pageState === 'disconnected') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Launch Meta Ads with AI</h1>
          <p className="text-gray-500 text-lg">Connect your Meta Ads account and let AI create your campaign in minutes.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">What you can do:</h2>
          <ul className="space-y-3">
            {[
              'AI generates headlines, body copy, and targeting suggestions',
              'Creates a Campaign + Ad Set in your Meta Ads account',
              'Campaign starts PAUSED — no spend until you activate it',
              'Deep link to Meta Ads Manager to review and launch',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700">
          <strong>Permissions required:</strong> ads_management, ads_read, pages_read_engagement — these allow Quote Box to create and read campaigns on your behalf.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleConnectMeta}
          className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#1568d3] text-white font-semibold py-3.5 px-6 rounded-xl transition text-base"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Connect Meta Account
        </button>
      </div>
    )
  }

  // ─── State B: Pick Ad Account ─────────────────────────────────────────────

  if (pageState === 'pick-account') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Ad Account</h1>
        <p className="text-gray-500 mb-8">Choose which Meta Ad account to use for creating campaigns.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {adAccounts.length === 0 ? (
            <p className="text-gray-500 text-sm">No ad accounts found. Make sure you have an active Meta Ad account.</p>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad Account</label>
              <select
                value={selectedAdAccount}
                onChange={(e) => setSelectedAdAccount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              >
                <option value="">Select an ad account...</option>
                {adAccounts.map((acc) => (
                  <option key={acc.id} value={acc.account_id}>
                    {acc.name} ({acc.account_id})
                  </option>
                ))}
              </select>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleSaveAdAccount}
                disabled={!selectedAdAccount || savingAccount}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition text-sm"
              >
                {savingAccount ? 'Saving...' : 'Continue'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── State D: Campaign Created ────────────────────────────────────────────

  if (pageState === 'created' && createdCampaign) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Campaign Created!</h1>
          <p className="text-gray-500">Your campaign is ready in Meta Ads Manager (PAUSED). Review and activate it when ready.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Campaign Name</p>
            <p className="font-semibold text-gray-900">{createdCampaign.campaignName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Ad Set Name</p>
            <p className="font-semibold text-gray-900">{createdCampaign.adSetName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Status</p>
            <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-sm font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              PAUSED
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Daily Budget</p>
            <p className="font-semibold text-gray-900">${questionnaire.dailyBudget}/day</p>
          </div>
        </div>

        <a
          href={createdCampaign.adsManagerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1568d3] text-white font-semibold py-3 px-6 rounded-xl transition mb-3"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Open in Meta Ads Manager
        </a>

        <button
          onClick={handleReset}
          className="w-full text-gray-600 hover:text-gray-900 font-medium py-3 px-6 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
        >
          Create Another Campaign
        </button>
      </div>
    )
  }

  // ─── State C: Questionnaire ───────────────────────────────────────────────

  const stepTitles = [
    'Campaign Objective',
    'Target Audience',
    'Business Info',
    'Budget & Schedule',
    'AI Preview',
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Create Meta Ad Campaign</h1>
          <span className="text-sm text-gray-400">Step {step} of 5</span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{stepTitles[step - 1]}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        {/* Step 1: Objective */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">What is your campaign goal?</h2>
            <div className="space-y-3">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.value}
                  onClick={() => setQuestionnaire((q) => ({ ...q, objective: obj.value }))}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition ${
                    questionnaire.objective === obj.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium ${questionnaire.objective === obj.value ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {obj.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{obj.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Target Audience */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Who should see your ads?</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={questionnaire.ageMin}
                    onChange={(e) => setQuestionnaire((q) => ({ ...q, ageMin: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={questionnaire.ageMax}
                    onChange={(e) => setQuestionnaire((q) => ({ ...q, ageMax: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={questionnaire.gender}
                  onChange={(e) => setQuestionnaire((q) => ({ ...q, gender: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country / Region</label>
                <input
                  type="text"
                  placeholder="e.g. US, CA, GB"
                  value={questionnaire.location}
                  onChange={(e) => setQuestionnaire((q) => ({ ...q, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. home improvement, real estate, DIY"
                  value={questionnaire.interests}
                  onChange={(e) => setQuestionnaire((q) => ({ ...q, interests: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Business Info */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Tell us about your business</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What do you offer?</label>
                <textarea
                  rows={3}
                  placeholder="e.g. We provide local moving services for residential customers in the Dallas area."
                  value={questionnaire.businessOffer}
                  onChange={(e) => setQuestionnaire((q) => ({ ...q, businessOffer: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key selling points</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Licensed & insured, same-day quotes, no hidden fees, 5-star rated"
                  value={questionnaire.sellingPoints}
                  onChange={(e) => setQuestionnaire((q) => ({ ...q, sellingPoints: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setQuestionnaire((q) => ({ ...q, tone: tone.value }))}
                      className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition ${
                        questionnaire.tone === tone.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad Creative Picker */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach Ad Creative{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Select an image or video to include its URL with your campaign.
                </p>
                {creatives.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    No creatives uploaded yet.{' '}
                    <Link href="/vsls" className="text-indigo-600 hover:underline font-medium">
                      Upload one in Media Library
                    </Link>
                  </div>
                ) : (
                  <select
                    value={questionnaire.vslId || ''}
                    onChange={(e) => {
                      const selected = creatives.find((c) => c.id === e.target.value) || null
                      setQuestionnaire((q) => ({
                        ...q,
                        vslId: selected?.id || null,
                        vslUrl: selected?.url || null,
                        vslTitle: selected?.name || null,
                      }))
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No creative (skip)</option>
                    {creatives.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.isImage ? '🖼 ' : '🎬 '}{c.name}
                      </option>
                    ))}
                  </select>
                )}
                {questionnaire.vslUrl && (
                  <p className="text-xs text-indigo-600 mt-1.5 truncate">
                    Selected: {questionnaire.vslTitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Budget & Schedule */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Budget & Schedule</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Budget (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={questionnaire.dailyBudget}
                    onChange={(e) => setQuestionnaire((q) => ({ ...q, dailyBudget: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Meta minimum is $1/day</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Duration</label>
                <div className="space-y-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={String(dur.value)}
                      onClick={() => setQuestionnaire((q) => ({ ...q, duration: dur.value }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${
                        questionnaire.duration === dur.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: AI Preview */}
        {step === 5 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">AI-Generated Campaign</h2>
            <p className="text-sm text-gray-500 mb-4">Review your AI-generated copy and targeting suggestions.</p>

            {!generatedCopy && !generating && (
              <button
                onClick={handleGenerate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition"
              >
                Generate with AI
              </button>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                <p className="text-sm text-gray-500">Generating your campaign copy...</p>
              </div>
            )}

            {generatedCopy && !generating && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Strategy</p>
                  <p className="text-sm text-gray-700">{generatedCopy.summary}</p>
                </div>

                {questionnaire.vslUrl && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">Attached Creative</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-9 bg-indigo-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {creatives.find((c) => c.id === questionnaire.vslId)?.isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={questionnaire.vslUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-900 truncate">{questionnaire.vslTitle}</p>
                        <p className="text-xs text-indigo-400 truncate">{questionnaire.vslUrl}</p>
                      </div>
                      <a
                        href={questionnaire.vslUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex-shrink-0"
                      >
                        Preview
                      </a>
                    </div>
                    <p className="text-xs text-indigo-500 mt-2">
                      Copy this URL and attach the creative to your ad inside Meta Ads Manager.
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Headlines (pick one in Meta Ads Manager)</p>
                  <div className="space-y-2">
                    {generatedCopy.headlines.map((h, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-900">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Body Copy</p>
                  <div className="space-y-2">
                    {generatedCopy.bodyTexts.map((b, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">
                        {b}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Suggested Targeting Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedCopy.targetingKeywords.map((kw) => (
                      <span key={kw} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setGeneratedCopy(null) }}
                    className="flex-1 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={creating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm"
                  >
                    {creating ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex-1 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                setError('')
                setStep((s) => (s + 1) as Step)
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm"
            >
              {step === 4 ? 'Preview' : 'Next'}
            </button>
          </div>
        )}

        {step === 5 && !generatedCopy && !generating && (
          <button
            onClick={() => setStep(4)}
            className="w-full mt-4 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
          >
            Back
          </button>
        )}
      </div>

      {/* Connected account info */}
      {metaAdAccountId && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Using ad account: {metaAdAccountId}
        </p>
      )}
    </div>
  )
}
