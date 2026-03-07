'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState, useCallback } from 'react'
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

interface HostedFormOption {
  id: string
  form_name: string
  slug: string
  pixelId?: string
}

interface FacebookPage {
  id: string
  name: string
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
  adIds: string[]
  campaignName: string
  adSetName: string
  adsManagerUrl: string
  status: string
}

interface CustomConversion {
  id: string
  name: string
  custom_event_type: string
  pixel_id: string
  rule?: string
  creation_time?: string
}

interface CampaignWithInsights {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | string
  objective: string
  daily_budget: string
  created_time: string
  insights: {
    spend: number
    impressions: number
    clicks: number
    leads: number
    cpl: number
  }
}

interface Suggestions {
  suggestions: string[]
  topPerformer: string
  actionItems: string[]
}

interface Questionnaire {
  objective: string
  ageMin: number
  ageMax: number
  gender: string
  locationType: 'country' | 'postal'
  location: string
  postalCodes: string[]
  postalCountry: string
  interests: string
  businessOffer: string
  sellingPoints: string
  tone: string
  dailyBudget: number
  duration: number | 'ongoing'
  vslId: string | null
  vslUrl: string | null
  vslTitle: string | null
  destinationType: 'form' | 'custom'
  destinationUrl: string
  selectedFormId: string | null
  pageId: string
  customConversionId: string | null
  pixelId: string | null
}

type PageState = 'disconnected' | 'pick-account' | 'questionnaire' | 'created'
type Step = 1 | 2 | 3 | 4 | 5
type ActiveTab = 'analytics' | 'campaigns' | 'create'

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

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },
]

const POSTAL_COUNTRIES = [
  { code: 'US', label: 'US' },
  { code: 'CA', label: 'CA' },
  { code: 'GB', label: 'GB' },
  { code: 'AU', label: 'AU' },
  { code: 'DE', label: 'DE' },
  { code: 'FR', label: 'FR' },
  { code: 'NL', label: 'NL' },
]

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// ─── ZipCodeMap ───────────────────────────────────────────────────────────────

interface PostalSuggestion {
  text: string
  place_name: string
  center: [number, number]
}

function ZipCodeMap({
  postalCodes,
  postalCountry,
  onAdd,
  onRemove,
  onCountryChange,
}: {
  postalCodes: string[]
  postalCountry: string
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onCountryChange: (country: string) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [geocodeCache, setGeocodeCache] = useState<Record<string, [number, number] | null>>({})
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [suggestions, setSuggestions] = useState<PostalSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestTimer = useRef<any>(null)

  // AI zip suggest state
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<string[]>([])
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return
    let cancelled = false
    import('mapbox-gl').then((mod) => {
      if (cancelled || !mapContainerRef.current) return
      const mapboxgl = mod.default
      mapboxgl.accessToken = MAPBOX_TOKEN
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-95.7, 37.1],
        zoom: 3,
      })
      mapRef.current = map
      map.on('load', () => { if (!cancelled) setMapLoaded(true) })
    }).catch(() => {})
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    import('mapbox-gl').then((mod) => {
      const mapboxgl = mod.default
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      const validCoords: [number, number][] = []
      postalCodes.forEach((code) => {
        const coords = geocodeCache[code]
        if (coords) {
          validCoords.push(coords)
          const el = document.createElement('div')
          el.style.cssText =
            'width:12px;height:12px;border-radius:50%;background:#4f46e5;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.3)'
          markersRef.current.push(
            new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(mapRef.current)
          )
        }
      })

      if (validCoords.length === 1) {
        mapRef.current.flyTo({ center: validCoords[0], zoom: 10 })
      } else if (validCoords.length > 1) {
        const bounds = new mapboxgl.LngLatBounds()
        validCoords.forEach((c) => bounds.extend(c))
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 12 })
      }
    })
  }, [postalCodes, geocodeCache, mapLoaded])

  async function fetchSuggestions(query: string) {
    if (!MAPBOX_TOKEN || query.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=postcode&country=${postalCountry.toLowerCase()}&limit=5`
      const res = await fetch(url)
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sugs: PostalSuggestion[] = (data.features || []).map((f: any) => ({
        text: f.text as string,
        place_name: f.place_name as string,
        center: f.center as [number, number],
      }))
      setSuggestions(sugs)
      setShowSuggestions(sugs.length > 0)
    } catch {
      setSuggestions([])
    }
  }

  function selectSuggestion(sug: PostalSuggestion) {
    const code = `${postalCountry}:${sug.text.toUpperCase()}`
    setInputVal('')
    setSuggestions([])
    setShowSuggestions(false)
    if (!postalCodes.includes(code)) {
      onAdd(code)
      setGeocodeCache((prev) => ({ ...prev, [code]: sug.center }))
    }
  }

  async function geocode(code: string) {
    if (!MAPBOX_TOKEN) return
    setIsGeocoding(true)
    try {
      const parts = code.split(':')
      const rawCode = parts.length === 2 ? parts[1] : code
      const country = parts.length === 2 ? parts[0].toLowerCase() : postalCountry.toLowerCase()
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rawCode)}.json?access_token=${MAPBOX_TOKEN}&types=postcode&country=${country}&limit=1`
      const res = await fetch(url)
      const data = await res.json()
      const coords = (data.features?.[0]?.center ?? null) as [number, number] | null
      setGeocodeCache((prev) => ({ ...prev, [code]: coords }))
    } catch {
      setGeocodeCache((prev) => ({ ...prev, [code]: null }))
    }
    setIsGeocoding(false)
  }

  function handleAdd() {
    const raw = inputVal.trim().toUpperCase()
    if (!raw) return
    const code = `${postalCountry}:${raw}`
    if (postalCodes.includes(code)) return
    setInputVal('')
    setSuggestions([])
    setShowSuggestions(false)
    onAdd(code)
    geocode(code)
  }

  async function handleAiSuggest() {
    if (!aiDescription.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResults([])
    try {
      const res = await fetch('/api/meta/zip-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription, country: postalCountry }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Failed to generate zip codes')
      } else {
        setAiResults(data.postalCodes || [])
      }
    } catch {
      setAiError('Failed to reach AI service')
    }
    setAiLoading(false)
  }

  function addAllAiResults() {
    aiResults.forEach((code) => {
      if (!postalCodes.includes(code)) {
        onAdd(code)
        geocode(code)
      }
    })
    setShowAiPanel(false)
    setAiDescription('')
    setAiResults([])
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <select
          value={postalCountry}
          onChange={(e) => { onCountryChange(e.target.value); setSuggestions([]) }}
          className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ minWidth: 72 }}
        >
          {POSTAL_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type to search zip / postal code…"
            value={inputVal}
            onChange={(e) => {
              const val = e.target.value
              setInputVal(val)
              if (suggestTimer.current) clearTimeout(suggestTimer.current)
              suggestTimer.current = setTimeout(() => fetchSuggestions(val), 250)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); if (suggestions.length > 0) selectSuggestion(suggestions[0]); else handleAdd() }
              if (e.key === 'Escape') { setSuggestions([]); setShowSuggestions(false) }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((sug) => (
                <button
                  key={sug.text}
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(sug) }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 border-b border-gray-100 last:border-0 flex items-center justify-between gap-2"
                >
                  <span className="text-gray-700 truncate">{sug.place_name}</span>
                  <span className="font-mono text-xs font-semibold text-indigo-600 shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {postalCountry}:{sug.text.toUpperCase()}
                  </span>
                </button>
              ))}
              <p className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50">Meta targeting format: {postalCountry}:CODE</p>
            </div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!inputVal.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Add
        </button>
        {/* AI Suggest button */}
        <button
          onClick={() => { setShowAiPanel((v) => !v); setAiResults([]); setAiError(''); setAiDescription('') }}
          title="Describe your service area and let AI generate zip codes"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition ${
            showAiPanel
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-white border-gray-200 text-violet-600 hover:border-violet-400 hover:bg-violet-50'
          }`}
        >
          <img src="/icons/logo-1772578089154.jpg" alt="AI" className="w-5 h-5 rounded-full object-cover" />
          AI
        </button>
      </div>

      {/* AI Service Area Panel */}
      {showAiPanel && (
        <div className="mb-3 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <img src="/icons/logo-1772578089154.jpg" alt="AI" className="w-9 h-9 rounded-full object-cover border-2 border-violet-300" />
            <div>
              <p className="text-sm font-semibold text-violet-900">AI Zip Code Generator</p>
              <p className="text-xs text-violet-600">Describe your service area in plain English</p>
            </div>
          </div>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. Within 25 miles of Austin, TX — or — All of Orange County, California — or — Downtown Chicago and surrounding suburbs"
            rows={3}
            className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAiSuggest}
              disabled={aiLoading || !aiDescription.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              {aiLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"/>
                  </svg>
                  Generate Zip Codes
                </>
              )}
            </button>
            <button
              onClick={() => setShowAiPanel(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-white transition"
            >
              Cancel
            </button>
          </div>

          {aiError && (
            <p className="mt-2 text-xs text-red-600">{aiError}</p>
          )}

          {aiResults.length > 0 && (
            <div className="mt-3 pt-3 border-t border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-violet-800">{aiResults.length} zip codes generated</p>
                <button
                  onClick={addAllAiResults}
                  className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                >
                  Add All to Targeting
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {aiResults.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 bg-white text-violet-700 text-xs font-mono font-medium px-2 py-0.5 rounded-full border border-violet-200"
                  >
                    {code}
                    <button
                      onClick={() => {
                        if (!postalCodes.includes(code)) { onAdd(code); geocode(code) }
                        setAiResults((prev) => prev.filter((c) => c !== code))
                      }}
                      className="hover:text-violet-900 leading-none ml-0.5 text-violet-400 hover:text-violet-700"
                      title="Add this code"
                    >+</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {postalCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {postalCodes.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-100"
              title="Meta targeting format"
            >
              <span className="font-mono">{code}</span>
              <button onClick={() => onRemove(code)} className="ml-0.5 hover:text-indigo-900 leading-none">✕</button>
            </span>
          ))}
          {isGeocoding && (
            <span className="text-xs text-gray-400 self-center italic">Locating on map…</span>
          )}
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e4e0', background: '#eef2f7' }}
      />
      {postalCodes.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Add zip codes above — they&apos;ll appear as pins on the map
        </p>
      )}
    </div>
  )
}

// ─── CTA label map ────────────────────────────────────────────────────────────
const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Learn More',
  GET_QUOTE: 'Get Quote',
  CONTACT_US: 'Contact Us',
  SIGN_UP: 'Sign Up',
  BOOK_NOW: 'Book Now',
  SHOP_NOW: 'Shop Now',
  APPLY_NOW: 'Apply Now',
  GET_OFFER: 'Get Offer',
  SUBSCRIBE: 'Subscribe',
}

// ─── FacebookAdPreview ────────────────────────────────────────────────────────
function FacebookAdPreview({
  pageName,
  bodyText,
  headline,
  destinationUrl,
  vslUrl,
  isImage,
  cta,
}: {
  pageName: string
  bodyText: string
  headline: string
  destinationUrl: string
  vslUrl: string | null
  isImage: boolean
  cta: string
}) {
  let domain = 'quote-box.com'
  try {
    if (destinationUrl) domain = new URL(destinationUrl).hostname.replace(/^www\./, '')
  } catch { /* keep default */ }

  const pageInitial = (pageName || 'P').charAt(0).toUpperCase()
  const ctaLabel = CTA_LABELS[cta] ?? 'Learn More'

  return (
    <div style={{ background: '#f0f2f5', borderRadius: 12, padding: '12px 0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <p style={{ fontSize: 11, color: '#65676b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 12px 6px' }}>
        Ad Preview — Facebook Feed
      </p>
      <div style={{ background: 'white', border: '1px solid #dddfe2', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {pageInitial}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#050505', lineHeight: 1.3 }}>{pageName || 'Your Page'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#65676b', lineHeight: 1.3 }}>
                <span>Sponsored</span>
                <span style={{ fontSize: 10 }}>·</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#65676b"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#65676b' }} />)}
          </div>
        </div>
        <div style={{ padding: '0 16px 10px', fontSize: 14, color: '#050505', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {bodyText || <span style={{ color: '#bcc0c4', fontStyle: 'italic' }}>Your ad body copy will appear here…</span>}
        </div>
        {vslUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vslUrl} alt="Ad creative" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
        ) : vslUrl && !isImage ? (
          <div style={{ width: '100%', height: 240, background: '#1c1c1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Video Ad</span>
          </div>
        ) : (
          <div style={{ width: '100%', height: 240, background: 'linear-gradient(135deg, #e8ecf4 0%, #d0d8eb 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#bcc0c4"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            <span style={{ fontSize: 12, color: '#bcc0c4', fontWeight: 500 }}>Your Ad Image</span>
          </div>
        )}
        <div style={{ background: '#f0f2f5', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#65676b', textTransform: 'uppercase', fontWeight: 500, marginBottom: 2, letterSpacing: '0.03em' }}>{domain}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#050505', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {headline || <span style={{ color: '#bcc0c4', fontWeight: 400, fontStyle: 'italic' }}>Headline will appear here</span>}
            </div>
          </div>
          <div style={{ flexShrink: 0, background: '#e4e6eb', borderRadius: 6, padding: '7px 14px', fontSize: 14, fontWeight: 600, color: '#050505', whiteSpace: 'nowrap', cursor: 'default' }}>
            {ctaLabel}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e4e6eb', display: 'flex', padding: '2px 0' }}>
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65676b" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>, label: 'Like' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65676b" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>, label: 'Comment' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65676b" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>, label: 'Share' },
          ].map(({ icon, label }) => (
            <button key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 4px', background: 'none', border: 'none', cursor: 'default', color: '#65676b', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-50', dot: 'bg-green-500', text: 'text-green-700', label: 'Active' },
    PAUSED: { bg: 'bg-yellow-50', dot: 'bg-yellow-500', text: 'text-yellow-700', label: 'Paused' },
    DELETED: { bg: 'bg-red-50', dot: 'bg-red-400', text: 'text-red-700', label: 'Deleted' },
  }
  const s = map[status] || { bg: 'bg-gray-50', dot: 'bg-gray-400', text: 'text-gray-600', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 ${s.bg} ${s.text} text-xs font-medium px-2 py-0.5 rounded-full`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadMachinePage() {
  const supabase = createClient()

  // Page-level state
  const [pageState, setPageState] = useState<PageState>('disconnected')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tokenExpired, setTokenExpired] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('analytics')

  // Meta account state
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [selectedAdAccount, setSelectedAdAccount] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null)

  // Campaign wizard state
  const [step, setStep] = useState<Step>(1)
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null)
  const [createdCampaign, setCreatedCampaign] = useState<CreatedCampaign | null>(null)
  const [creatives, setCreatives] = useState<AdCreative[]>([])
  const [hostedForms, setHostedForms] = useState<HostedFormOption[]>([])
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [customConversions, setCustomConversions] = useState<CustomConversion[]>([])
  const [conversionsLoading, setConversionsLoading] = useState(false)
  const [creatingConversion, setCreatingConversion] = useState(false)
  const [step1Tab, setStep1Tab] = useState<'setup' | 'conversions'>('setup')

  // Analytics/campaigns state
  const [campaigns, setCampaigns] = useState<CampaignWithInsights[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [dateRange, setDateRange] = useState(30)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)

  const [questionnaire, setQuestionnaire] = useState<Questionnaire>({
    objective: 'OUTCOME_LEADS',
    ageMin: 25,
    ageMax: 55,
    gender: 'all',
    locationType: 'postal',
    location: 'US',
    postalCodes: [],
    postalCountry: 'US',
    interests: '',
    businessOffer: '',
    sellingPoints: '',
    tone: 'professional',
    dailyBudget: 20,
    duration: 14,
    vslId: null,
    vslUrl: null,
    vslTitle: null,
    destinationType: 'form',
    destinationUrl: '',
    selectedFormId: null,
    pageId: '',
    customConversionId: null,
    pixelId: null,
  })

  // ─── Load campaigns ────────────────────────────────────────────────────────

  const loadCampaigns = useCallback(async (range: number) => {
    setCampaignsLoading(true)
    try {
      const res = await fetch(`/api/meta/campaigns?dateRange=${range}`)
      const data = await res.json()
      if (res.ok) {
        setCampaigns(data.campaigns || [])
        // Auto-fetch AI suggestions after campaigns load
        if (data.campaigns?.length >= 0) {
          setSuggestionsLoading(true)
          fetch('/api/meta/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaigns: data.campaigns }),
          })
            .then((r) => r.json())
            .then((s) => { if (s.suggestions) setSuggestions(s) })
            .catch(() => {})
            .finally(() => setSuggestionsLoading(false))
        }
      }
    } catch { /* non-fatal */ }
    setCampaignsLoading(false)
  }, [])

  // ─── Load account state ────────────────────────────────────────────────────

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

        const { data: formsData } = await supabase
          .from('hosted_forms')
          .select('id, form_name, form_config')
          .eq('account_id', accountRow.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        const formOptions: HostedFormOption[] = (formsData || []).map((f) => ({
          id: f.id,
          form_name: f.form_name,
          slug: f.form_config?.slug || '',
          pixelId: f.form_config?.meta_pixel_id || undefined,
        }))
        setHostedForms(formOptions)

        if (formOptions.length > 0) {
          const first = formOptions[0]
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
          setQuestionnaire((q) => ({
            ...q,
            selectedFormId: first.id,
            destinationUrl: `${siteUrl}/${first.slug}`,
          }))
        }
      }

      if (account.meta_access_token) {
        await Promise.allSettled([
          fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${account.meta_access_token}`)
            .then((r) => r.json())
            .then((pagesData) => {
              const pageList: FacebookPage[] = pagesData.data || []
              setPages(pageList)
              if (pageList.length === 1) {
                setQuestionnaire((q) => ({ ...q, pageId: pageList[0].id }))
              }
            }),
          (async () => {
            setConversionsLoading(true)
            try {
              const cvRes = await fetch('/api/meta/conversions')
              const cvData = await cvRes.json()
              setCustomConversions(cvData.conversions || [])
            } catch { /* non-fatal */ }
            setConversionsLoading(false)
          })(),
        ])
      }

      if (!account.meta_ad_account_id) {
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
        // Load campaign data in the background
        loadCampaigns(30)
      }

      setLoading(false)
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/lead-machine')
    }
    const urlError = params.get('error')
    if (urlError) {
      setError(`Connection failed: ${urlError.replace(/_/g, ' ')}`)
      window.history.replaceState({}, '', '/lead-machine')
    }

    loadAccountState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when dateRange changes
  useEffect(() => {
    if (pageState === 'questionnaire' || pageState === 'created') {
      loadCampaigns(dateRange)
    }
  }, [dateRange, loadCampaigns, pageState])

  // ─── Handlers ─────────────────────────────────────────────────────────────

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
    loadCampaigns(dateRange)
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
    setTokenExpired(false)

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
          targetLocation: questionnaire.locationType === 'country' ? questionnaire.location : undefined,
          targetPostalCodes: questionnaire.locationType === 'postal' && questionnaire.postalCodes.length > 0
            ? questionnaire.postalCodes
            : undefined,
          destinationUrl: questionnaire.destinationUrl,
          pageId: questionnaire.pageId,
          cta: generatedCopy.cta,
          customConversionId: questionnaire.customConversionId || undefined,
          pixelId: questionnaire.pixelId || undefined,
          splitTest: true,
          headlines: generatedCopy.headlines,
          bodyTexts: generatedCopy.bodyTexts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.meta_error?.type === 'OAuthException') {
          setTokenExpired(true)
          setError('Your Meta connection has expired. Please reconnect your account to continue.')
        } else {
          setError(data.error || 'Campaign creation failed')
        }
        setCreating(false)
        return
      }

      setCreatedCampaign(data)
      setPageState('created')
      setActiveTab('create')
      // Refresh campaigns list
      loadCampaigns(dateRange)
    } catch {
      setError('Failed to create campaign')
    }

    setCreating(false)
  }

  async function handleCreateQuoteBoxConversion(pixelId: string) {
    if (!pixelId) return
    setCreatingConversion(true)
    setError('')
    try {
      const res = await fetch('/api/meta/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'QuoteBox — Lead Form Submission',
          pixel_id: pixelId,
          custom_event_type: 'LEAD',
          url_contains: 'quote-box.com',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create conversion'); return }
      const newConv: CustomConversion = { id: data.id, name: data.name, custom_event_type: data.custom_event_type, pixel_id: pixelId }
      setCustomConversions((prev) => [newConv, ...prev])
      setQuestionnaire((q) => ({ ...q, customConversionId: data.id, pixelId }))
    } catch {
      setError('Failed to create conversion')
    }
    setCreatingConversion(false)
  }

  function handleReset() {
    setPageState('questionnaire')
    setStep(1)
    setGeneratedCopy(null)
    setCreatedCampaign(null)
    setError('')
    setTokenExpired(false)
    setQuestionnaire({
      objective: 'OUTCOME_LEADS',
      ageMin: 25,
      ageMax: 55,
      gender: 'all',
      locationType: 'postal',
      location: 'US',
      postalCodes: [],
      postalCountry: 'US',
      interests: '',
      businessOffer: '',
      sellingPoints: '',
      tone: 'professional',
      dailyBudget: 20,
      duration: 14,
      vslId: null,
      vslUrl: null,
      vslTitle: null,
      destinationType: 'form',
      destinationUrl: hostedForms[0] ? `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/${hostedForms[0].slug}` : '',
      selectedFormId: hostedForms[0]?.id || null,
      pageId: pages.length === 1 ? pages[0].id : '',
      customConversionId: null,
      pixelId: null,
    })
    setStep1Tab('setup')
  }

  // ─── Render: Loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // ─── Render: Disconnected ──────────────────────────────────────────────────

  if (pageState === 'disconnected') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Machine</h1>
          <p className="text-gray-500 text-lg">Connect your Meta Ads account to create AI-powered campaigns, view live analytics, and get smart suggestions.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">What you get:</h2>
          <ul className="space-y-3">
            {[
              'Live analytics — spend, leads, CPL across all campaigns',
              'AI creates headlines, body copy, and targeting in seconds',
              'Auto split test — 3 ad variants created automatically',
              'AI-powered suggestions to optimize your campaigns',
              'Campaign starts PAUSED — no spend until you activate it',
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
          <strong>Permissions required:</strong> ads_management, ads_read, pages_read_engagement
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">{error}</div>
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

  // ─── Render: Pick Ad Account ───────────────────────────────────────────────

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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
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

  // ─── Render: Connected (Tab Interface) ────────────────────────────────────

  // Compute summary metrics for analytics tab
  const totalSpend = campaigns.reduce((s, c) => s + c.insights.spend, 0)
  const totalLeads = campaigns.reduce((s, c) => s + c.insights.leads, 0)
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length

  const stepTitles = ['Campaign Objective', 'Target Audience', 'Business Info', 'Budget & Schedule', 'AI Preview & Split Test']

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lead Machine</h1>
        <p className="text-sm text-gray-400 mt-0.5">Powered by Meta Ads + AI</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
        {([
          { id: 'analytics', label: 'Analytics' },
          { id: 'campaigns', label: 'Campaigns' },
          { id: 'create', label: 'Create Campaign' },
        ] as { id: ActiveTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Date range + refresh */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    dateRange === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            {campaignsLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500" />
                Loading…
              </div>
            )}
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Spend', value: `$${totalSpend.toFixed(2)}`, icon: '💰' },
              { label: 'Total Leads', value: totalLeads.toFixed(0), icon: '👥' },
              { label: 'Avg CPL', value: avgCpl > 0 ? `$${avgCpl.toFixed(2)}` : '—', icon: '📊' },
              { label: 'Active Campaigns', value: String(activeCampaigns), icon: '🚀' },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xl mb-1">{m.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Campaign table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Campaign Performance</h2>
            </div>
            {campaigns.length === 0 ? (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">
                {campaignsLoading ? 'Loading campaigns…' : 'No campaigns found for this period.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Campaign</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Impressions</th>
                      <th className="text-right px-4 py-3 font-medium">Clicks</th>
                      <th className="text-right px-4 py-3 font-medium">Spend</th>
                      <th className="text-right px-4 py-3 font-medium">Leads</th>
                      <th className="text-right px-4 py-3 font-medium">CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{c.name}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-right text-gray-600">{c.insights.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{c.insights.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-600">${c.insights.spend.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{c.insights.leads.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {c.insights.cpl > 0 ? `$${c.insights.cpl.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {campaigns.length > 0 && metaAdAccountId && (
              <div className="px-4 py-3 border-t border-gray-100">
                <a
                  href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaAdAccountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Open in Meta Ads Manager →
                </a>
              </div>
            )}
          </div>

          {/* AI Suggestions panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setSuggestionsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">AI Suggestions</span>
                {suggestionsLoading && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500" />
                )}
                {suggestions && !suggestionsLoading && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {suggestions.actionItems.length} actions
                  </span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${suggestionsOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {suggestionsOpen && (
              <div className="px-4 py-4">
                {suggestionsLoading && !suggestions && (
                  <p className="text-sm text-gray-400 text-center py-4">Analyzing your campaigns with AI…</p>
                )}
                {!suggestionsLoading && !suggestions && (
                  <p className="text-sm text-gray-400 text-center py-4">No suggestions available yet.</p>
                )}
                {suggestions && (
                  <div className="space-y-5">
                    {suggestions.topPerformer && (
                      <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                        <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-0.5">Top Performer</p>
                        <p className="text-sm text-green-900 font-medium">{suggestions.topPerformer}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Insights</p>
                      <ul className="space-y-2">
                        {suggestions.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Action Items</p>
                      <ul className="space-y-2">
                        {suggestions.actionItems.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Campaigns Tab ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">All Campaigns</h2>
            <button
              onClick={() => setActiveTab('create')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Create Campaign
            </button>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">📢</div>
              <p className="font-medium text-gray-900 mb-1">No campaigns yet</p>
              <p className="text-sm text-gray-400 mb-4">Create your first campaign to start generating leads.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {c.objective.replace('OUTCOME_', '')} · Budget: ${(parseInt(c.daily_budget || '0') / 100).toFixed(0)}/day ·
                        Created {new Date(c.created_time).toLocaleDateString()}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Spend</span>
                          <p className="font-medium text-gray-900">${c.insights.spend.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Leads</span>
                          <p className="font-medium text-gray-900">{c.insights.leads.toFixed(0)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">CPL</span>
                          <p className="font-medium text-gray-900">{c.insights.cpl > 0 ? `$${c.insights.cpl.toFixed(2)}` : '—'}</p>
                        </div>
                      </div>
                    </div>
                    {metaAdAccountId && (
                      <a
                        href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaAdAccountId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-xs text-[#1877F2] hover:underline font-medium"
                      >
                        Open in Ads Manager →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Create Campaign Tab ── */}
      {activeTab === 'create' && (
        <div>
          {/* Success screen */}
          {pageState === 'created' && createdCampaign && (
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Split Test Launched!</h2>
                <p className="text-gray-500">
                  {createdCampaign.adIds.length} ad variants created in Meta Ads Manager (PAUSED). Review and activate when ready.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Campaign Name</p>
                  <p className="font-semibold text-gray-900">{createdCampaign.campaignName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <StatusBadge status="PAUSED" />
                </div>
                {createdCampaign.adIds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Ad IDs (Split Test Variants)</p>
                    <div className="space-y-1.5">
                      {createdCampaign.adIds.map((adId, i) => (
                        <div key={adId} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="font-mono text-xs text-gray-600 truncate">{adId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
          )}

          {/* Wizard */}
          {pageState === 'questionnaire' && (
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Create Campaign</h2>
                  <span className="text-sm text-gray-400">Step {step} of 5</span>
                </div>
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
                  <p>{error}</p>
                  {tokenExpired && (
                    <button
                      onClick={handleConnectMeta}
                      className="mt-3 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Reconnect Meta Account
                    </button>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                {/* Step 1: Objective */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                      {(['setup', 'conversions'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStep1Tab(tab)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                            step1Tab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab === 'setup' ? 'Campaign Setup' : 'Conversions'}
                          {tab === 'conversions' && questionnaire.customConversionId && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {step1Tab === 'setup' && (
                      <div className="space-y-6">
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

                        <div className="border-t border-gray-100 pt-5">
                          <label className="block text-sm font-medium text-gray-700 mb-3">Where should the ad send people?</label>
                          <div className="flex gap-3 mb-3">
                            <button
                              onClick={() => setQuestionnaire((q) => ({ ...q, destinationType: 'form' }))}
                              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                questionnaire.destinationType === 'form'
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              QuoteBox Form
                            </button>
                            <button
                              onClick={() => setQuestionnaire((q) => ({ ...q, destinationType: 'custom' }))}
                              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                questionnaire.destinationType === 'custom'
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              Custom URL
                            </button>
                          </div>

                          {questionnaire.destinationType === 'form' ? (
                            hostedForms.length === 0 ? (
                              <div className="text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 flex items-center gap-2">
                                No active forms found.{' '}
                                <Link href="/hosted-forms" className="text-indigo-600 hover:underline font-medium">Create one</Link>
                              </div>
                            ) : (
                              <select
                                value={questionnaire.selectedFormId || ''}
                                onChange={(e) => {
                                  const form = hostedForms.find((f) => f.id === e.target.value)
                                  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
                                  setQuestionnaire((q) => ({
                                    ...q,
                                    selectedFormId: form?.id || null,
                                    destinationUrl: form ? `${siteUrl}/${form.slug}` : '',
                                  }))
                                }}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select a form...</option>
                                {hostedForms.map((f) => (
                                  <option key={f.id} value={f.id}>{f.form_name}</option>
                                ))}
                              </select>
                            )
                          ) : (
                            <input
                              type="url"
                              placeholder="https://yourwebsite.com/landing-page"
                              value={questionnaire.destinationType === 'custom' ? questionnaire.destinationUrl : ''}
                              onChange={(e) => setQuestionnaire((q) => ({ ...q, destinationUrl: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                          {questionnaire.destinationUrl && (
                            <p className="text-xs text-indigo-600 mt-1.5 truncate">↗ {questionnaire.destinationUrl}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {step1Tab === 'conversions' && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-semibold text-gray-900 mb-1">Custom Conversions</h2>
                          <p className="text-sm text-gray-500 mb-4">Select an existing custom conversion or create a QuoteBox one instantly.</p>

                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-indigo-900 text-sm">Create QuoteBox Lead Conversion</p>
                                <p className="text-xs text-indigo-700 mt-0.5 mb-3">
                                  Fires when a visitor submits your QuoteBox form (tracks the Meta Pixel <code className="bg-indigo-100 px-1 rounded">Lead</code> event on quote-box.com).
                                </p>
                                {hostedForms.some((f) => f.slug) ? (
                                  <div className="flex gap-2">
                                    <select
                                      value={questionnaire.pixelId || ''}
                                      onChange={(e) => setQuestionnaire((q) => ({ ...q, pixelId: e.target.value || null }))}
                                      className="flex-1 border border-indigo-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                      <option value="">Select a pixel…</option>
                                      {Array.from(new Set(
                                        hostedForms
                                          .filter((f) => f.pixelId)
                                          .map((f) => f.pixelId!)
                                      )).map((pid) => (
                                        <option key={pid} value={pid}>{pid}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => questionnaire.pixelId && handleCreateQuoteBoxConversion(questionnaire.pixelId)}
                                      disabled={!questionnaire.pixelId || creatingConversion}
                                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                                    >
                                      {creatingConversion ? 'Creating…' : 'Create'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-indigo-700 bg-indigo-100 rounded-lg px-3 py-2">
                                    Add a Meta Pixel ID to one of your quote forms first.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {conversionsLoading ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500" />
                              Loading conversions…
                            </div>
                          ) : customConversions.length === 0 ? (
                            <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">No custom conversions found.</p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Existing Conversions</p>
                              <button
                                onClick={() => setQuestionnaire((q) => ({ ...q, customConversionId: null }))}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl border-2 text-sm transition ${
                                  !questionnaire.customConversionId ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className={!questionnaire.customConversionId ? 'text-indigo-700 font-medium' : 'text-gray-500'}>
                                  None — don&apos;t use a custom conversion
                                </span>
                              </button>
                              {customConversions.map((cv) => (
                                <button
                                  key={cv.id}
                                  onClick={() => setQuestionnaire((q) => ({ ...q, customConversionId: cv.id, pixelId: cv.pixel_id }))}
                                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border-2 transition ${
                                    questionnaire.customConversionId === cv.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <p className={`font-medium text-sm ${questionnaire.customConversionId === cv.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                                    {cv.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">Event: {cv.custom_event_type} · Pixel: {cv.pixel_id}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                          <input type="number" min={18} max={65} value={questionnaire.ageMin}
                            onChange={(e) => setQuestionnaire((q) => ({ ...q, ageMin: Number(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                          <input type="number" min={18} max={65} value={questionnaire.ageMax}
                            onChange={(e) => setQuestionnaire((q) => ({ ...q, ageMax: Number(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select value={questionnaire.gender}
                          onChange={(e) => setQuestionnaire((q) => ({ ...q, gender: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="all">All Genders</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location Targeting</label>
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => setQuestionnaire((q) => ({ ...q, locationType: 'postal' }))}
                            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                              questionnaire.locationType === 'postal'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            📍 Zip Codes
                          </button>
                          <button
                            onClick={() => setQuestionnaire((q) => ({ ...q, locationType: 'country' }))}
                            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                              questionnaire.locationType === 'country'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            🌐 Country
                          </button>
                        </div>

                        {questionnaire.locationType === 'country' ? (
                          <select value={questionnaire.location}
                            onChange={(e) => setQuestionnaire((q) => ({ ...q, location: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                            ))}
                          </select>
                        ) : (
                          <ZipCodeMap
                            postalCodes={questionnaire.postalCodes}
                            postalCountry={questionnaire.postalCountry}
                            onAdd={(code) => setQuestionnaire((q) => ({ ...q, postalCodes: [...q.postalCodes, code] }))}
                            onRemove={(code) => setQuestionnaire((q) => ({ ...q, postalCodes: q.postalCodes.filter((z) => z !== code) }))}
                            onCountryChange={(country) => setQuestionnaire((q) => ({ ...q, postalCountry: country, postalCodes: [] }))}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interests (optional)</label>
                        <input type="text" placeholder="e.g. home improvement, real estate, DIY"
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
                        <textarea rows={3} placeholder="e.g. We provide local moving services for residential customers in the Dallas area."
                          value={questionnaire.businessOffer}
                          onChange={(e) => setQuestionnaire((q) => ({ ...q, businessOffer: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key selling points</label>
                        <textarea rows={3} placeholder="e.g. Licensed & insured, same-day quotes, no hidden fees, 5-star rated"
                          value={questionnaire.sellingPoints}
                          onChange={(e) => setQuestionnaire((q) => ({ ...q, sellingPoints: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Tone</label>
                        <div className="grid grid-cols-2 gap-2">
                          {TONES.map((tone) => (
                            <button key={tone.value}
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

                      <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Attach Ad Creative <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        {creatives.length === 0 ? (
                          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
                            No creatives uploaded yet.{' '}
                            <Link href="/vsls" className="text-indigo-600 hover:underline font-medium">Upload in Media Library</Link>
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
                              <option key={c.id} value={c.id}>{c.isImage ? '🖼 ' : '🎬 '}{c.name}</option>
                            ))}
                          </select>
                        )}
                        {questionnaire.vslUrl && (
                          <p className="text-xs text-indigo-600 mt-1.5 truncate">Selected: {questionnaire.vslTitle}</p>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget (USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                          <input type="number" min={1} step={1} value={questionnaire.dailyBudget}
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
                            <button key={String(dur.value)}
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

                {/* Step 5: AI Preview + Split Test */}
                {step === 5 && (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1">AI-Generated Split Test</h2>
                    <p className="text-sm text-gray-500 mb-4">3 ad variants will be created automatically — let Meta find the winner.</p>

                    {!generatedCopy && !generating && (
                      <button onClick={handleGenerate}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition"
                      >
                        Generate with AI
                      </button>
                    )}

                    {generating && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        <p className="text-sm text-gray-500">Generating your split test variants…</p>
                      </div>
                    )}

                    {generatedCopy && !generating && (
                      <div className="space-y-6">
                        {/* Strategy */}
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-400 uppercase tracking-wider select-none list-none">
                            <span>AI Strategy</span>
                            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{generatedCopy.summary}</p>
                        </details>

                        {/* Split Test Variants A/B/C */}
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Split Test Variants</p>
                          <div className="space-y-4">
                            {generatedCopy.headlines.map((headline, i) => (
                              <div key={i} className="border-2 border-gray-100 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-600">Variant {String.fromCharCode(65 + i)}</span>
                                </div>
                                <div className="p-3">
                                  <FacebookAdPreview
                                    pageName={pages.find((p) => p.id === questionnaire.pageId)?.name ?? ''}
                                    bodyText={generatedCopy.bodyTexts[i] || ''}
                                    headline={headline}
                                    destinationUrl={questionnaire.destinationUrl}
                                    vslUrl={questionnaire.vslUrl}
                                    isImage={creatives.find((c) => c.id === questionnaire.vslId)?.isImage ?? false}
                                    cta={generatedCopy.cta}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Targeting keywords */}
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Suggested Targeting Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {generatedCopy.targetingKeywords.map((kw) => (
                              <span key={kw} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-100">{kw}</span>
                            ))}
                          </div>
                        </div>

                        {/* Facebook page selector */}
                        {pages.length > 1 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Facebook Page</label>
                            <select value={questionnaire.pageId}
                              onChange={(e) => setQuestionnaire((q) => ({ ...q, pageId: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select a page...</option>
                              {pages.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {pages.length === 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 text-xs text-yellow-700">
                            No Facebook Pages found on your account. You need a Page to create ads.
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => { setGeneratedCopy(null) }}
                            className="flex-1 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={handleCreateCampaign}
                            disabled={creating || !questionnaire.pageId || !questionnaire.destinationUrl}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm"
                          >
                            {creating ? 'Creating...' : 'Launch Split Test'}
                          </button>
                        </div>
                        {!questionnaire.pageId && (
                          <p className="text-xs text-gray-400 text-center -mt-2">Select a Facebook Page above to continue</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {step < 5 && (
                  <div className="flex gap-3 mt-6">
                    {step > 1 && (
                      <button onClick={() => setStep((s) => (s - 1) as Step)}
                        className="flex-1 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
                      >
                        Back
                      </button>
                    )}
                    <button
                      onClick={() => { setError(''); setStep((s) => (s + 1) as Step) }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm"
                    >
                      {step === 4 ? 'Preview' : 'Next'}
                    </button>
                  </div>
                )}

                {step === 5 && !generatedCopy && !generating && (
                  <button onClick={() => setStep(4)}
                    className="w-full mt-4 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
                  >
                    Back
                  </button>
                )}
              </div>

              {metaAdAccountId && (
                <p className="text-xs text-gray-400 text-center mt-4">Using ad account: {metaAdAccountId}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
