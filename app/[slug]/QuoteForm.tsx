'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FormField, HostedForm } from '@/lib/types'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// ── Types ──────────────────────────────────────────────────────
interface GeocodeSuggestion {
  place_name: string
  center: [number, number]
}

interface RouteResult {
  startAddress: string
  startCoords: [number, number]
  endAddress: string
  endCoords: [number, number]
  distanceMiles: number
  durationMinutes: number
}

interface RouteGeometry {
  type: string
  coordinates: number[][]
}

// ── API helpers ────────────────────────────────────────────────
async function geocode(query: string): Promise<GeocodeSuggestion[]> {
  if (query.length < 3) return []
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place,locality,neighborhood`
    const res = await fetch(url)
    const data = await res.json()
    return (data.features ?? []).map((f: { place_name: string; center: [number, number] }) => ({
      place_name: f.place_name,
      center: f.center,
    }))
  } catch {
    return []
  }
}

async function getDirections(
  start: [number, number],
  end: [number, number]
): Promise<{ distanceMiles: number; durationMinutes: number; geometry: RouteGeometry } | null> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=false&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null
    return {
      distanceMiles: route.distance / 1609.344,
      durationMinutes: route.duration / 60,
      geometry: route.geometry,
    }
  } catch {
    return null
  }
}

// ── Pricing ────────────────────────────────────────────────────
function computeTotal(
  fields: FormField[],
  answers: Record<string, unknown>,
  routeData: Record<string, RouteResult | null>,
): number {
  let total = 0
  for (const f of fields) {
    if (f.type === 'radio' || f.type === 'dropdown') {
      const opt = f.options?.find((o) => o.id === (answers[f.id] as string))
      if (opt) total += opt.price
    } else if (f.type === 'checkbox') {
      for (const oid of (answers[f.id] as string[]) ?? []) {
        const opt = f.options?.find((o) => o.id === oid)
        if (opt) total += opt.price
      }
    } else if (f.type === 'number') {
      total += (Number(answers[f.id]) || 0) * (f.ratePerUnit ?? 0)
    } else if (f.type === 'route') {
      const rd = routeData[f.id]
      if (rd && f.routeChargeType !== 'none') {
        if (f.routeChargeType === 'mileage' || f.routeChargeType === 'both')
          total += rd.distanceMiles * (f.ratePerMile ?? 0)
        if (f.routeChargeType === 'drivetime' || f.routeChargeType === 'both')
          total += rd.durationMinutes * (f.ratePerMinute ?? 0)
      }
    }
  }
  return total
}

// ── AddressInput — module-level so React never remounts it ─────
const addrInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px 11px 30px',
  borderRadius: 8,
  border: '1.5px solid #e5e4e0',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
  fontFamily: 'inherit',
  color: '#1a1a2e',
}

const suggestionBoxStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'white',
  border: '1px solid #e5e4e0',
  borderRadius: 8,
  boxShadow: '0 4px 18px rgba(0,0,0,0.11)',
  zIndex: 30,
  marginTop: 3,
  overflow: 'hidden',
}

function AddressInput({
  placeholder,
  dotColor,
  query,
  setQuery,
  coords,
  setCoords,
  suggestions,
  setSuggestions,
}: {
  placeholder: string
  dotColor: string
  query: string
  setQuery: (v: string) => void
  coords: [number, number] | null
  setCoords: (v: [number, number] | null) => void
  suggestions: GeocodeSuggestion[]
  setSuggestions: (v: GeocodeSuggestion[]) => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        color: dotColor, fontSize: 11, pointerEvents: 'none', zIndex: 1,
      }}>●</span>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value)
          setCoords(null)
          setSuggestions([])
        }}
        style={{ ...addrInputStyle, borderColor: coords ? '#86efac' : '#e5e4e0' }}
      />
      {suggestions.length > 0 && !coords && (
        <div style={suggestionBoxStyle}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#334155',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f5f5f4' : 'none',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'white' }}
              onMouseDown={() => {
                setQuery(s.place_name)
                setCoords(s.center)
                setSuggestions([])
              }}
            >
              {s.place_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── RouteField ─────────────────────────────────────────────────
function RouteField({
  field,
  currency,
  accentColor,
  onRouteChange,
}: {
  field: FormField
  currency: string
  accentColor: string
  onRouteChange: (result: RouteResult | null) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endMarkerRef = useRef<any>(null)
  const onRouteChangeRef = useRef(onRouteChange)
  useEffect(() => { onRouteChangeRef.current = onRouteChange }, [onRouteChange])

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [startQuery, setStartQuery] = useState('')
  const [startSuggestions, setStartSuggestions] = useState<GeocodeSuggestion[]>([])
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null)
  const [endQuery, setEndQuery] = useState('')
  const [endSuggestions, setEndSuggestions] = useState<GeocodeSuggestion[]>([])
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distanceMiles: number; durationMinutes: number } | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Debounced start geocode
  useEffect(() => {
    if (startCoords) return
    const timer = setTimeout(async () => {
      setStartSuggestions(await geocode(startQuery))
    }, 300)
    return () => clearTimeout(timer)
  }, [startQuery, startCoords])

  // Debounced end geocode
  useEffect(() => {
    if (endCoords) return
    const timer = setTimeout(async () => {
      setEndSuggestions(await geocode(endQuery))
    }, 300)
    return () => clearTimeout(timer)
  }, [endQuery, endCoords])

  // Fetch directions when both coords set
  useEffect(() => {
    if (!startCoords || !endCoords) {
      setRouteInfo(null)
      setRouteGeometry(null)
      onRouteChangeRef.current(null)
      return
    }
    setIsLoadingRoute(true)
    getDirections(startCoords, endCoords).then((result) => {
      setIsLoadingRoute(false)
      if (!result) return
      setRouteInfo({ distanceMiles: result.distanceMiles, durationMinutes: result.durationMinutes })
      setRouteGeometry(result.geometry)
      onRouteChangeRef.current({
        startAddress: startQuery,
        startCoords: startCoords!,
        endAddress: endQuery,
        endCoords: endCoords!,
        distanceMiles: result.distanceMiles,
        durationMinutes: result.durationMinutes,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCoords, endCoords])

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (!MAPBOX_TOKEN) { setMapError(true); return }
    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    import('mapbox-gl').then((mod) => {
      if (cancelled || !mapContainerRef.current) return
      try {
        const mapboxgl = mod.default
        mapboxgl.accessToken = MAPBOX_TOKEN
        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-98.5795, 39.8283],
          zoom: 3,
        })
        mapRef.current = mapInstance
        mapInstance.on('load', () => { if (!cancelled) setMapLoaded(true) })
        mapInstance.on('error', () => { if (!cancelled) setMapError(true) })
      } catch {
        if (!cancelled) setMapError(true)
      }
    }).catch(() => { if (!cancelled) setMapError(true) })

    return () => {
      cancelled = true
      if (mapInstance) mapInstance.remove()
      mapRef.current = null
    }
  }, [])

  // Update map markers + route
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    import('mapbox-gl').then((mod) => {
      const mapboxgl = mod.default

      startMarkerRef.current?.remove()
      endMarkerRef.current?.remove()
      startMarkerRef.current = null
      endMarkerRef.current = null

      if (startCoords) {
        const el = document.createElement('div')
        el.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#22c55e;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35)'
        startMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(startCoords).addTo(map)
      }

      if (endCoords) {
        const el = document.createElement('div')
        el.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#ef4444;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35)'
        endMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(endCoords).addTo(map)
      }

      if (routeGeometry) {
        const geojson = {
          type: 'Feature' as const,
          properties: {},
          geometry: routeGeometry as GeoJSON.Geometry,
        }
        if (map.getSource('route')) {
          map.getSource('route').setData(geojson)
        } else {
          map.addSource('route', { type: 'geojson', data: geojson })
          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': accentColor === '#ffe500' ? '#1a1a2e' : accentColor,
              'line-width': 4,
              'line-opacity': 0.85,
            },
          })
        }
        const bounds = new mapboxgl.LngLatBounds()
        ;(routeGeometry.coordinates as [number, number][]).forEach((c) => bounds.extend(c))
        map.fitBounds(bounds, { padding: 52, maxZoom: 14 })
      } else if (startCoords && endCoords) {
        const bounds = new mapboxgl.LngLatBounds()
        bounds.extend(startCoords)
        bounds.extend(endCoords)
        map.fitBounds(bounds, { padding: 60 })
      } else if (startCoords) {
        map.flyTo({ center: startCoords, zoom: 11 })
      }
    })
  }, [mapLoaded, startCoords, endCoords, routeGeometry, accentColor])

  const priceContribution = routeInfo
    ? (() => {
        let p = 0
        if (field.routeChargeType === 'mileage' || field.routeChargeType === 'both')
          p += routeInfo.distanceMiles * (field.ratePerMile ?? 0)
        if (field.routeChargeType === 'drivetime' || field.routeChargeType === 'both')
          p += routeInfo.durationMinutes * (field.ratePerMinute ?? 0)
        return p
      })()
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AddressInput
        placeholder="Starting location…"
        dotColor="#22c55e"
        query={startQuery}
        setQuery={setStartQuery}
        coords={startCoords}
        setCoords={setStartCoords}
        suggestions={startSuggestions}
        setSuggestions={setStartSuggestions}
      />

      <div style={{ paddingLeft: 13, margin: '-2px 0' }}>
        <div style={{ width: 2, height: 10, background: '#cbd5e1', borderRadius: 1 }} />
      </div>

      <AddressInput
        placeholder="Ending location…"
        dotColor="#ef4444"
        query={endQuery}
        setQuery={setEndQuery}
        coords={endCoords}
        setCoords={setEndCoords}
        suggestions={endSuggestions}
        setSuggestions={setEndSuggestions}
      />

      {/* Map container — always rendered so the ref is stable */}
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e4e0', marginTop: 4 }}>
        <div ref={mapContainerRef} style={{ height: 220, width: '100%', background: '#e8ecef', display: mapError ? 'none' : undefined }} />
        {mapError && (
          <div style={{
            height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc', flexDirection: 'column', gap: 6,
          }}>
            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Map unavailable</span>
          </div>
        )}
        {isLoadingRoute && !mapError && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', color: '#64748b', fontWeight: 500,
          }}>
            Calculating route…
          </div>
        )}
      </div>

      {/* Route info strip */}
      {routeInfo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '9px 14px',
          background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
            📍 {routeInfo.distanceMiles.toFixed(1)} mi
          </span>
          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
            ⏱ {Math.round(routeInfo.durationMinutes)} min
          </span>
          {field.routeChargeType !== 'none' && priceContribution > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.88rem', color: '#059669', fontWeight: 700 }}>
              +{currency}{priceContribution.toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── QuoteForm ──────────────────────────────────────────────────
export default function QuoteForm({ form, hasCredits }: { form: HostedForm; hasCredits: boolean }) {
  const config = form.form_config
  const supabase = createClient()

  const isBlue = config.brand_color === 'blue'
  const accentBg = isBlue ? '#1a56ff' : '#ffe500'
  const accentFg = isBlue ? '#ffffff' : '#1a1a2e'
  const currency = config.currency ?? '$'

  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [routeData, setRouteData] = useState<Record<string, RouteResult | null>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const total = useMemo(
    () => computeTotal(config.fields, answers, routeData),
    [config.fields, answers, routeData]
  )

  const minQuote = config.min_quote ?? 0
  const displayTotal = total > 0 ? Math.max(total, minQuote) : total
  const minApplied = total > 0 && minQuote > 0 && displayTotal > total

  const handleRouteChange = useCallback((fieldId: string, result: RouteResult | null) => {
    setRouteData((prev) => ({ ...prev, [fieldId]: result }))
  }, [])

  function canProceedStep0(): boolean {
    for (const f of config.fields) {
      if (!f.required) continue
      if (f.type === 'radio' || f.type === 'dropdown') {
        if (!answers[f.id]) return false
      } else if (f.type === 'checkbox') {
        if (!((answers[f.id] as string[])?.length)) return false
      } else if (f.type === 'number') {
        if (!answers[f.id]) return false
      } else if (f.type === 'textarea') {
        if (!String(answers[f.id] ?? '').trim()) return false
      } else if (f.type === 'route') {
        if (!routeData[f.id]) return false
      }
    }
    return true
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.')
      return
    }
    setFormError('')
    setIsSubmitting(true)

    const formData: Record<string, unknown> = { ...answers }
    for (const [id, rd] of Object.entries(routeData)) {
      if (rd) formData[id] = rd
    }
    if (displayTotal > 0) {
      formData._quote_total = displayTotal
      formData._quote_currency = currency
    }

    const { error } = await supabase.from('leads').insert({
      account_id: form.account_id,
      hosted_form_id: form.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      form_type: form.form_type,
      form_data: formData,
      status: hasCredits ? 'new' : 'held',
    })

    setIsSubmitting(false)
    if (error) {
      setFormError('Something went wrong. Please try again.')
      return
    }
    setStep(2)
  }

  // ── Shared styles ──
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 13px',
    borderRadius: 8,
    border: '1.5px solid #e5e4e0',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#1a1a2e',
    background: 'white',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: 8,
  }

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    background: accentBg,
    color: accentFg,
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  }

  const hasPricing = config.fields.some(
    (f) =>
      ['radio', 'dropdown', 'checkbox'].includes(f.type) ||
      (f.type === 'number' && (f.ratePerUnit ?? 0) > 0) ||
      (f.type === 'route' && f.routeChargeType !== 'none')
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f6f3',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 16px 60px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: 'white',
        borderRadius: 18,
        boxShadow: '0 8px 40px rgba(0,0,0,0.11)',
        overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{ background: accentBg, padding: '28px 28px 24px', color: accentFg }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700,
                  background: i < step
                    ? (isBlue ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,46,0.15)')
                    : i === step
                      ? (isBlue ? 'white' : '#1a1a2e')
                      : (isBlue ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)'),
                  color: i === step
                    ? (isBlue ? '#1a56ff' : '#ffe500')
                    : i < step
                      ? (isBlue ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.5)')
                      : (isBlue ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,46,0.3)'),
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < 2 && (
                  <div style={{ width: 24, height: 2, borderRadius: 1, background: isBlue ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.12)' }} />
                )}
              </div>
            ))}
            <span style={{
              marginLeft: 6, fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', opacity: isBlue ? 0.6 : 0.5,
            }}>
              {step === 0 ? 'Your Quote' : step === 1 ? 'Contact Details' : 'All Done'}
            </span>
          </div>

          {config.hero_image_url && step === 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.hero_image_url}
              alt="Hero"
              style={{ width: 'calc(100% + 56px)', marginLeft: -28, marginTop: -28, marginBottom: 20, height: 140, objectFit: 'cover', display: 'block' }}
            />
          )}

          <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>
            {form.form_name}
          </div>
          {config.description && (
            <div style={{ fontSize: '0.88rem', lineHeight: 1.55, opacity: isBlue ? 0.75 : 0.65 }}>
              {config.description}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '26px 28px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── Step 0: Quote fields ── */}
          {step === 0 && (
            <>
              {config.fields.map((f) => (
                <div key={f.id}>
                  <label style={labelStyle}>
                    {f.required && <span style={{ color: '#ef4444', marginRight: 3 }}>*</span>}
                    {f.label}
                  </label>

                  {/* Radio */}
                  {f.type === 'radio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(f.options ?? []).map((o) => {
                        const sel = answers[f.id] === o.id
                        return (
                          <label key={o.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', borderRadius: 10,
                            border: `1.5px solid ${sel ? accentBg : '#e5e4e0'}`,
                            cursor: 'pointer',
                            background: sel ? (isBlue ? '#eef2ff' : '#fffde7') : 'white',
                            transition: 'all 0.12s',
                          }}
                            onClick={() => setAnswers((p) => ({ ...p, [f.id]: o.id }))}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
                                border: `2px solid ${sel ? accentBg : '#d1d5db'}`,
                                background: sel ? accentBg : 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentFg }} />}
                              </div>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a2e' }}>{o.label}</span>
                            </div>
                            {o.price > 0 && (
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                                +{currency}{o.price}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Dropdown */}
                  {f.type === 'dropdown' && (
                    <select
                      value={(answers[f.id] as string) ?? ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                      style={{
                        ...inputStyle,
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: 36,
                      }}
                    >
                      <option value="">Select an option…</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}{o.price > 0 ? ` (+${currency}${o.price})` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Checkbox */}
                  {f.type === 'checkbox' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(f.options ?? []).map((o) => {
                        const sel = ((answers[f.id] as string[]) ?? []).includes(o.id)
                        return (
                          <label key={o.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', borderRadius: 10,
                            border: `1.5px solid ${sel ? accentBg : '#e5e4e0'}`,
                            cursor: 'pointer',
                            background: sel ? (isBlue ? '#eef2ff' : '#fffde7') : 'white',
                            transition: 'all 0.12s',
                          }}
                            onClick={() => {
                              const prev = (answers[f.id] as string[]) ?? []
                              setAnswers((p) => ({
                                ...p,
                                [f.id]: sel ? prev.filter((id) => id !== o.id) : [...prev, o.id],
                              }))
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                                border: `2px solid ${sel ? accentBg : '#d1d5db'}`,
                                background: sel ? accentBg : 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {sel && <span style={{ color: accentFg, fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                              </div>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a2e' }}>{o.label}</span>
                            </div>
                            {o.price > 0 && (
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                                +{currency}{o.price}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Number */}
                  {f.type === 'number' && (
                    <>
                      <input
                        type="number"
                        min={0}
                        placeholder={f.placeholder ?? '0'}
                        value={(answers[f.id] as number) ?? ''}
                        onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: parseFloat(e.target.value) || 0 }))}
                        style={inputStyle}
                      />
                      {(f.ratePerUnit ?? 0) > 0 && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                          <span>× {currency}{f.ratePerUnit} per unit</span>
                          {answers[f.id] ? (
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              = {currency}{(Number(answers[f.id]) * (f.ratePerUnit ?? 0)).toFixed(2)}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </>
                  )}

                  {/* Textarea */}
                  {f.type === 'textarea' && (
                    <textarea
                      rows={3}
                      placeholder={f.placeholder ?? ''}
                      value={(answers[f.id] as string) ?? ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                    />
                  )}

                  {/* Route */}
                  {f.type === 'route' && (
                    <RouteField
                      field={f}
                      currency={currency}
                      accentColor={accentBg}
                      onRouteChange={(result) => handleRouteChange(f.id, result)}
                    />
                  )}
                </div>
              ))}

              {/* Live total */}
              {hasPricing && config.quote_display === 'live' && displayTotal > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>Estimated Total</span>
                    {minApplied && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Minimum booking fee applies</span>
                    )}
                  </div>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e' }}>
                    {currency}{displayTotal.toFixed(2)}
                  </span>
                </div>
              )}

              <button
                style={{ ...primaryBtn, opacity: canProceedStep0() ? 1 : 0.42, cursor: canProceedStep0() ? 'pointer' : 'not-allowed' }}
                disabled={!canProceedStep0()}
                onClick={() => setStep(1)}
              >
                Next →
              </button>
            </>
          )}

          {/* ── Step 1: Contact ── */}
          {step === 1 && (
            <>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Tell us how to reach you with your quote.
              </p>

              <div>
                <label style={labelStyle}><span style={{ color: '#ef4444', marginRight: 3 }}>*</span>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}><span style={{ color: '#ef4444', marginRight: 3 }}>*</span>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>
                  Phone Number{' '}
                  <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} />
              </div>

              {formError && (
                <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 500 }}>{formError}</div>
              )}

              <button
                style={{ ...primaryBtn, opacity: isSubmitting ? 0.6 : 1 }}
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Submitting…' : (config.submit_label ?? 'Get My Quote →')}
              </button>

              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}
                onClick={() => setStep(0)}
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 2: Confirmation ── */}
          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px', fontSize: 26,
              }}>
                <span style={{ color: accentFg }}>✉</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>
                Your quote is on its way!
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.65 }}>
                We&apos;ve received your details and will email your personalised quote to{' '}
                <strong style={{ color: '#334155' }}>{email}</strong> shortly.
              </div>

              {hasPricing && config.quote_display !== 'hidden' && displayTotal > 0 && (
                <div style={{
                  marginTop: 22, padding: '16px 20px',
                  background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0',
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {config.quote_display === 'after_submit' ? 'Your Estimated Total' : 'Estimated Total'}
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a1a2e' }}>
                    {currency}{displayTotal.toFixed(2)}
                  </div>
                  {minApplied && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                      Minimum booking fee applies
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
