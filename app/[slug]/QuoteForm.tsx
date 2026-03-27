'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FormField, HostedForm } from '@/lib/types'
import area from '@turf/area'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}

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

interface LegInfo { distanceMiles: number; durationMinutes: number }

async function getWaypointRoute(
  coords: [number, number][]
): Promise<{ legs: LegInfo[]; totalMiles: number; totalMinutes: number; geometry: RouteGeometry } | null> {
  const waypoints = coords.map((c) => `${c[0]},${c[1]}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?steps=false&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legs: LegInfo[] = route.legs.map((leg: any) => ({
      distanceMiles: leg.distance / 1609.344,
      durationMinutes: leg.duration / 60,
    }))
    return {
      legs,
      totalMiles: route.distance / 1609.344,
      totalMinutes: route.duration / 60,
      geometry: route.geometry,
    }
  } catch {
    return null
  }
}

// ── Pricing ────────────────────────────────────────────────────
// Returns the conditional rate if ALL conditions in a rule match (AND logic).
// First fully-matching rule wins.
function applyConditionalRate(
  rules: FormField['conditionalRules'],
  baseRate: number,
  fields: FormField[],
  answers: Record<string, unknown>,
): number {
  if (!rules?.length) return baseRate
  for (const rule of rules) {
    if (!rule.conditions?.length) continue
    const allMatch = rule.conditions.every((cond) => {
      if (!cond.whenFieldId || !cond.whenValue) return false
      const watchField = fields.find((f) => f.id === cond.whenFieldId)
      if (!watchField) return false
      const watchAnswer = answers[cond.whenFieldId]
      if (watchField.type === 'radio' || watchField.type === 'dropdown') {
        return watchAnswer === cond.whenValue
      } else if (watchField.type === 'checkbox') {
        return ((watchAnswer as string[]) ?? []).includes(cond.whenValue)
      }
      return String(watchAnswer ?? '') === cond.whenValue
    })
    if (allMatch) return rule.rate
  }
  return baseRate
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function computeTotal(
  fields: FormField[],
  answers: Record<string, unknown>,
  routeData: Record<string, RouteResult | null>,
  drawAreaData: Record<string, number | null> = {},
): number {
  // Collect active rate overrides from all selected options
  const activeRateOverrides: Record<string, number> = {}
  const activeRouteOverrides: Record<string, { mile?: number; min?: number }> = {}

  for (const f of fields) {
    if (f.type === 'radio' || f.type === 'dropdown') {
      const selId = answers[f.id] as string
      const selOpt = f.options?.find((o) => o.id === selId)
      if (selOpt?.rateOverrides) Object.assign(activeRateOverrides, selOpt.rateOverrides)
      if (selOpt?.routeOverrides) Object.assign(activeRouteOverrides, selOpt.routeOverrides)
    } else if (f.type === 'checkbox') {
      for (const oid of (answers[f.id] as string[]) ?? []) {
        const selOpt = f.options?.find((o) => o.id === oid)
        if (selOpt?.rateOverrides) Object.assign(activeRateOverrides, selOpt.rateOverrides)
        if (selOpt?.routeOverrides) Object.assign(activeRouteOverrides, selOpt.routeOverrides)
      }
    }
  }

  let total = 0
  for (const f of fields) {
    if (f.type === 'radio' || f.type === 'dropdown') {
      const opt = f.options?.find((o) => o.id === (answers[f.id] as string))
      if (opt) total += opt.hours ? opt.price * opt.hours : opt.price
    } else if (f.type === 'checkbox') {
      for (const oid of (answers[f.id] as string[]) ?? []) {
        const opt = f.options?.find((o) => o.id === oid)
        if (opt) total += opt.hours ? opt.price * opt.hours : opt.price
      }
    } else if (f.type === 'number') {
      const effectiveRate = activeRateOverrides[f.id] !== undefined
        ? activeRateOverrides[f.id]
        : applyConditionalRate(f.conditionalRules, f.ratePerUnit ?? 0, fields, answers)
      total += (Number(answers[f.id]) || 0) * effectiveRate
    } else if (f.type === 'route') {
      const rd = routeData[f.id]
      if (rd && f.routeChargeType !== 'none') {
        const routeOvr = activeRouteOverrides[f.id]
        const effectiveMileRate = routeOvr?.mile !== undefined
          ? routeOvr.mile
          : applyConditionalRate(f.conditionalRules, f.ratePerMile ?? 0, fields, answers)
        const effectiveMinRate = routeOvr?.min !== undefined
          ? routeOvr.min
          : applyConditionalRate(f.conditionalRules, f.ratePerMinute ?? 0, fields, answers)
        if (f.routeChargeType === 'mileage' || f.routeChargeType === 'both') {
          const billableMiles = Math.max(0, rd.distanceMiles - (f.freeMiles ?? 0))
          total += billableMiles * effectiveMileRate
        }
        if (f.routeChargeType === 'drivetime' || f.routeChargeType === 'both') {
          const billableMinutes = Math.max(0, rd.durationMinutes - (f.freeMinutes ?? 0))
          total += billableMinutes * effectiveMinRate
        }
      }
    } else if (f.type === 'draw_area') {
      const effectiveRate = activeRateOverrides[f.id] !== undefined
        ? activeRateOverrides[f.id]
        : (f.ratePerSqFt ?? 0)
      total += (drawAreaData[f.id] ?? 0) * effectiveRate
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

// ── DrawAreaField ──────────────────────────────────────────────
function DrawAreaField({
  field,
  currency,
  accentColor,
  onAreaChange,
  hidePrices,
}: {
  field: FormField
  currency: string
  accentColor: string
  onAreaChange: (sqFt: number | null) => void
  hidePrices?: boolean
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawRef = useRef<any>(null)
  const onAreaChangeRef = useRef(onAreaChange)
  useEffect(() => { onAreaChangeRef.current = onAreaChange }, [onAreaChange])

  const [mapError, setMapError] = useState(false)
  const [sqFt, setSqFt] = useState<number | null>(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ place_name: string; center: [number, number] }[]>([])

  // Debounced geocode for address search
  useEffect(() => {
    if (addressQuery.length < 3) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place`)
        const data = await res.json()
        setSuggestions((data.features ?? []).map((f: { place_name: string; center: [number, number] }) => ({ place_name: f.place_name, center: f.center })))
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(t)
  }, [addressQuery])

  function flyTo(center: [number, number]) {
    setSuggestions([])
    if (mapRef.current) mapRef.current.flyTo({ center, zoom: 19 })
  }

  // Init map + draw plugin
  useEffect(() => {
    console.log('[DrawAreaField] useEffect start — token:', MAPBOX_TOKEN ? MAPBOX_TOKEN.slice(0, 20) + '…' : 'MISSING', '| containerRef:', !!mapContainerRef.current)
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      console.error('[DrawAreaField] Aborting — missing container or token. container:', !!mapContainerRef.current, 'token:', !!MAPBOX_TOKEN)
      setMapError(true)
      return
    }
    let cancelled = false
    let mapHasLoaded = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    Promise.all([import('mapbox-gl'), import('@mapbox/mapbox-gl-draw')]).then(([mod, drawMod]) => {
      console.log('[DrawAreaField] imports resolved — cancelled:', cancelled, 'container still mounted:', !!mapContainerRef.current)
      if (cancelled || !mapContainerRef.current) return
      try {
        const mapboxgl = mod.default
        // Handle both ESM (.default) and CJS/UMD (module.exports = ...) export patterns
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MapboxDraw = (drawMod as any).default ?? drawMod
        console.log('[DrawAreaField] mapboxgl type:', typeof mapboxgl, '| Map:', typeof mapboxgl?.Map, '| MapboxDraw type:', typeof MapboxDraw)
        mapboxgl.accessToken = MAPBOX_TOKEN

        console.log('[DrawAreaField] creating mapboxgl.Map...')
        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [-98.5795, 39.8283],
          zoom: 3,
          accessToken: MAPBOX_TOKEN,
        })
        mapRef.current = mapInstance
        console.log('[DrawAreaField] Map instance created OK')

        // Only treat errors as fatal if they occur before the map has loaded.
        // Post-load errors (e.g. individual tile failures) are non-fatal and
        // should not hide the satellite view.
        mapInstance.on('error', (e: unknown) => {
          console.error('[DrawAreaField] map error event (hasLoaded=' + mapHasLoaded + '):', e)
          if (!cancelled && !mapHasLoaded) setMapError(true)
        })

        mapInstance.on('load', () => {
          console.log('[DrawAreaField] map load event fired — cancelled:', cancelled)
          if (cancelled) return
          mapHasLoaded = true
          // Attempt to add draw controls. If this fails for any reason (e.g.
          // a version incompatibility) we leave the satellite view visible so
          // the user can at least see the map.
          try {
            console.log('[DrawAreaField] adding MapboxDraw control...')
            const draw = new MapboxDraw({
              displayControlsDefault: false,
              controls: { polygon: true, trash: true },
              defaultMode: 'simple_select',
            })
            drawRef.current = draw
            mapInstance.addControl(draw)
            console.log('[DrawAreaField] MapboxDraw control added OK')

            const recalculate = () => {
              const data = draw.getAll()
              if (!data.features.length) {
                setSqFt(null)
                onAreaChangeRef.current(null)
                return
              }
              // Sum all drawn polygons
              let totalSqM = 0
              for (const feature of data.features) {
                totalSqM += area(feature as Parameters<typeof area>[0])
              }
              const totalSqFt = Math.round(totalSqM * 10.7639)
              console.log('[DrawAreaField] area recalculated:', totalSqFt, 'sq ft')
              setSqFt(totalSqFt)
              onAreaChangeRef.current(totalSqFt)
            }

            mapInstance.on('draw.create', recalculate)
            mapInstance.on('draw.update', recalculate)
            mapInstance.on('draw.delete', recalculate)
          } catch (err) {
            // Draw controls failed — map is still usable as a reference view
            console.warn('[DrawAreaField] MapboxDraw addControl failed:', err)
          }
        })
      } catch (err) {
        console.error('[DrawAreaField] outer try/catch — setting mapError:', err)
        if (!cancelled) setMapError(true)
      }
    }).catch((err) => {
      console.error('[DrawAreaField] dynamic import failed:', err)
      if (!cancelled) setMapError(true)
    })

    return () => {
      cancelled = true
      if (mapInstance) mapInstance.remove()
      mapRef.current = null
      drawRef.current = null
    }
  }, [])

  const price = sqFt != null ? sqFt * (field.ratePerSqFt ?? 0) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Address search */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search your address to zoom in…"
          value={addressQuery}
          autoComplete="off"
          onChange={(e) => setAddressQuery(e.target.value)}
          style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '1.5px solid #e5e4e0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a1a2e', background: 'white' }}
        />
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e4e0', borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.11)', zIndex: 30, marginTop: 3, overflow: 'hidden' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.85rem', color: '#334155', borderBottom: i < suggestions.length - 1 ? '1px solid #f5f5f4' : 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'white' }}
                onMouseDown={() => { setAddressQuery(s.place_name); flyTo(s.center) }}
              >
                {s.place_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
        Zoom in then click <strong style={{ color: accentColor === '#ffe500' ? '#1a1a2e' : accentColor }}>✎ draw</strong> to trace the area. Click each corner of the lawn or roof — double-click to close.
      </div>

      {/* Map */}
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e4e0' }}>
        <div ref={mapContainerRef} style={{ height: 280, width: '100%', background: '#1a3a1a', display: mapError ? 'none' : undefined }} />
        {mapError && (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Satellite map unavailable</span>
          </div>
        )}
      </div>

      {/* Result strip */}
      {sqFt != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
            ⬡ {sqFt.toLocaleString()} sq ft
          </span>
          {!hidePrices && (field.ratePerSqFt ?? 0) > 0 && (
            <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: 700 }}>
              +{currency}{price.toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Route timeline sub-components ──────────────────────────────
function RouteStop({ dotColor, bg, border, textColor, label, tag }: {
  dotColor: string; bg: string; border: string; textColor: string; label: string; tag: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px',
      background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
      fontSize: '0.8rem', color: textColor,
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'block' }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
        {label}
      </span>
      {tag && <span style={{ fontSize: '0.68rem', opacity: 0.6, flexShrink: 0 }}>{tag}</span>}
    </div>
  )
}

function RouteLeg({ leg, isTravel }: { leg: LegInfo | undefined; isTravel: boolean }) {
  if (!leg) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingLeft: 15 }}>
      {/* Vertical connector line */}
      <div style={{ width: 2, height: 28, background: isTravel ? '#a5b4fc' : '#86efac', flexShrink: 0, marginLeft: 3, borderRadius: 1 }} />
      {/* Distance badge */}
      <div style={{
        marginLeft: 10, display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 99,
        background: isTravel ? '#ede9fe' : '#f0fdf4',
        border: `1px solid ${isTravel ? '#c4b5fd' : '#bbf7d0'}`,
        fontSize: '0.72rem', fontWeight: 600,
        color: isTravel ? '#6d28d9' : '#15803d',
      }}>
        <span>{leg.distanceMiles.toFixed(1)} mi</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{Math.round(leg.durationMinutes)} min</span>
        {isTravel && <span style={{ opacity: 0.55, fontSize: '0.65rem', fontWeight: 500 }}>travel</span>}
      </div>
    </div>
  )
}

// ── RouteField ─────────────────────────────────────────────────
function RouteField({
  field,
  currency,
  accentColor,
  onRouteChange,
  subStep,
  onStartCoordsChange,
  onEndCoordsChange,
  hidePrices,
}: {
  field: FormField
  currency: string
  accentColor: string
  onRouteChange: (result: RouteResult | null) => void
  subStep: number
  onStartCoordsChange: (coords: [number, number] | null) => void
  onEndCoordsChange: (coords: [number, number] | null) => void
  hidePrices?: boolean
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endMarkerRef = useRef<any>(null)
  const onRouteChangeRef = useRef(onRouteChange)
  const onStartCoordsChangeRef = useRef(onStartCoordsChange)
  const onEndCoordsChangeRef = useRef(onEndCoordsChange)
  useEffect(() => { onRouteChangeRef.current = onRouteChange }, [onRouteChange])
  useEffect(() => { onStartCoordsChangeRef.current = onStartCoordsChange }, [onStartCoordsChange])
  useEffect(() => { onEndCoordsChangeRef.current = onEndCoordsChange }, [onEndCoordsChange])

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [baseCoords, setBaseCoords] = useState<[number, number] | null>(null)
  const [startQuery, setStartQuery] = useState('')
  const [startSuggestions, setStartSuggestions] = useState<GeocodeSuggestion[]>([])
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null)
  const [endQuery, setEndQuery] = useState('')
  const [endSuggestions, setEndSuggestions] = useState<GeocodeSuggestion[]>([])
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null)
  const [legInfos, setLegInfos] = useState<LegInfo[] | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distanceMiles: number; durationMinutes: number } | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null)
  const [baseGeometry, setBaseGeometry] = useState<RouteGeometry | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Notify parent of individual coord changes so it can gate canAdvance()
  useEffect(() => { onStartCoordsChangeRef.current(startCoords) }, [startCoords])
  useEffect(() => { onEndCoordsChangeRef.current(endCoords) }, [endCoords])

  // Resize map when sub-step 2 becomes visible
  useEffect(() => {
    if (subStep === 2 && mapRef.current && mapLoaded) {
      setTimeout(() => { mapRef.current?.resize() }, 60)
    }
  }, [subStep, mapLoaded])

  // Auto-geocode base address into baseCoords (separate from customer start)
  useEffect(() => {
    if (!field.baseAddress) { setBaseCoords(null); return }
    geocode(field.baseAddress).then((results) => {
      if (results[0]) setBaseCoords(results[0].center)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.baseAddress])

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

  // Fetch directions when coords ready
  useEffect(() => {
    // ── Single location mode: customer enters one address ──
    if (field.locationMode === 'single') {
      if (!endCoords) {
        setRouteInfo(null); setRouteGeometry(null); setBaseGeometry(null); setLegInfos(null)
        onRouteChangeRef.current(null)
        return
      }
      if (!baseCoords) {
        // No base address set — record the address with zero distance
        setRouteInfo({ distanceMiles: 0, durationMinutes: 0 })
        setRouteGeometry(null)
        setBaseGeometry(null)
        setLegInfos(null)
        onRouteChangeRef.current({
          startAddress: '',
          startCoords: endCoords,
          endAddress: endQuery,
          endCoords,
          distanceMiles: 0,
          durationMinutes: 0,
        })
        return
      }
      setIsLoadingRoute(true)
      getDirections(baseCoords, endCoords).then((result) => {
        setIsLoadingRoute(false)
        if (!result) return
        setRouteInfo({ distanceMiles: result.distanceMiles, durationMinutes: result.durationMinutes })
        // Single mode: the whole route is the base line (business → customer)
        setBaseGeometry(result.geometry)
        setRouteGeometry(null)
        setLegInfos(null)
        onRouteChangeRef.current({
          startAddress: field.baseAddress ?? '',
          startCoords: baseCoords,
          endAddress: endQuery,
          endCoords: endCoords!,
          distanceMiles: result.distanceMiles,
          durationMinutes: result.durationMinutes,
        })
      })
      return
    }

    // ── Point-to-point mode ──
    if (!startCoords || !endCoords) {
      setRouteInfo(null); setRouteGeometry(null); setBaseGeometry(null); setLegInfos(null)
      onRouteChangeRef.current(null)
      return
    }
    setIsLoadingRoute(true)
    if (field.baseAddress && baseCoords) {
      // Fetch base→start and start→end as separate legs for distinct coloring
      Promise.all([
        getDirections(baseCoords, startCoords),  // base leg (gray)
        getDirections(startCoords, endCoords),   // customer route (accent)
      ]).then(([baseResult, customerResult]) => {
        setIsLoadingRoute(false)
        if (!baseResult || !customerResult) return
        const leg0 = { distanceMiles: baseResult.distanceMiles, durationMinutes: baseResult.durationMinutes }
        const leg1 = { distanceMiles: customerResult.distanceMiles, durationMinutes: customerResult.durationMinutes }
        // Mirror: return trip retraces leg0 (end → start → base = same roads reversed)
        const mirroredLegs = [leg0, leg1, leg0]
        const totalMiles = leg0.distanceMiles * 2 + leg1.distanceMiles
        const totalMinutes = leg0.durationMinutes * 2 + leg1.durationMinutes
        setRouteInfo({ distanceMiles: totalMiles, durationMinutes: totalMinutes })
        setBaseGeometry(baseResult.geometry)       // base leg in gray
        setRouteGeometry(customerResult.geometry)  // customer route in accent color
        setLegInfos(mirroredLegs)
        onRouteChangeRef.current({
          startAddress: startQuery,
          startCoords: startCoords!,
          endAddress: endQuery,
          endCoords: endCoords!,
          distanceMiles: totalMiles,
          durationMinutes: totalMinutes,
        })
      })
    } else {
      getDirections(startCoords, endCoords).then((result) => {
        setIsLoadingRoute(false)
        if (!result) return
        setRouteInfo({ distanceMiles: result.distanceMiles, durationMinutes: result.durationMinutes })
        setBaseGeometry(null)
        setRouteGeometry(result.geometry)
        setLegInfos(null)
        onRouteChangeRef.current({
          startAddress: startQuery,
          startCoords: startCoords!,
          endAddress: endQuery,
          endCoords: endCoords!,
          distanceMiles: result.distanceMiles,
          durationMinutes: result.durationMinutes,
        })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCoords, endCoords, baseCoords])

  // Init map — always mounts so the ref stays stable across sub-steps
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

      // ── Base leg (gray dashed) ──
      if (baseGeometry) {
        const baseGeoJson = { type: 'Feature' as const, properties: {}, geometry: baseGeometry as GeoJSON.Geometry }
        if (map.getSource('route-base')) {
          map.getSource('route-base').setData(baseGeoJson)
        } else {
          map.addSource('route-base', { type: 'geojson', data: baseGeoJson })
          map.addLayer({
            id: 'route-base',
            type: 'line',
            source: 'route-base',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#94a3b8',
              'line-width': 3,
              'line-opacity': 0.7,
              'line-dasharray': [5, 3],
            },
          })
        }
      } else if (map.getSource('route-base')) {
        map.getSource('route-base').setData({ type: 'FeatureCollection', features: [] })
      }

      // ── Customer route (accent color) ──
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
      } else if (map.getSource('route')) {
        map.getSource('route').setData({ type: 'FeatureCollection', features: [] })
      }

      // Fit bounds to all visible route geometry
      const allCoords: [number, number][] = [
        ...(baseGeometry ? (baseGeometry.coordinates as [number, number][]) : []),
        ...(routeGeometry ? (routeGeometry.coordinates as [number, number][]) : []),
      ]
      if (allCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        allCoords.forEach((c) => bounds.extend(c))
        map.fitBounds(bounds, { padding: 52, maxZoom: 14 })
      } else if (startCoords && endCoords) {
        const bounds = new mapboxgl.LngLatBounds()
        if (baseCoords) bounds.extend(baseCoords)
        bounds.extend(startCoords)
        bounds.extend(endCoords)
        map.fitBounds(bounds, { padding: 60 })
      } else if (startCoords) {
        map.flyTo({ center: startCoords, zoom: 11 })
      } else if (baseCoords) {
        map.flyTo({ center: baseCoords, zoom: 11 })
      }
    })
  }, [mapLoaded, baseCoords, startCoords, endCoords, routeGeometry, baseGeometry, accentColor])

  const priceContribution = routeInfo
    ? (() => {
        let p = 0
        if (field.routeChargeType === 'mileage' || field.routeChargeType === 'both') {
          const billableMiles = Math.max(0, routeInfo.distanceMiles - (field.freeMiles ?? 0))
          p += billableMiles * (field.ratePerMile ?? 0)
        }
        if (field.routeChargeType === 'drivetime' || field.routeChargeType === 'both') {
          const billableMinutes = Math.max(0, routeInfo.durationMinutes - (field.freeMinutes ?? 0))
          p += billableMinutes * (field.ratePerMinute ?? 0)
        }
        return p
      })()
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Sub-step 0: Starting location (or single location) ── */}
      {subStep === 0 && (
        <>
          {field.locationMode === 'single' ? (
            <AddressInput
              placeholder="e.g. 123 Oak Ave, Chicago, IL"
              dotColor="#ef4444"
              query={endQuery}
              setQuery={setEndQuery}
              coords={endCoords}
              setCoords={setEndCoords}
              suggestions={endSuggestions}
              setSuggestions={setEndSuggestions}
            />
          ) : (
            <AddressInput
              placeholder="e.g. 123 Main St, Chicago, IL"
              dotColor="#22c55e"
              query={startQuery}
              setQuery={setStartQuery}
              coords={startCoords}
              setCoords={setStartCoords}
              suggestions={startSuggestions}
              setSuggestions={setStartSuggestions}
            />
          )}
        </>
      )}

      {/* ── Sub-step 1: Destination ── */}
      {subStep === 1 && (
        <>
          {startQuery && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 13px', borderRadius: 10,
              background: '#f0fdf4', border: '1.5px solid #bbf7d0',
              fontSize: '0.83rem', color: '#166534',
            }}>
              <span style={{ fontSize: 9, color: '#22c55e', lineHeight: 1 }}>●</span>
              <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {startQuery}
              </span>
              <span style={{ fontSize: '0.72rem', opacity: 0.6, flexShrink: 0 }}>Start</span>
            </div>
          )}
          <AddressInput
            placeholder="e.g. 456 Oak Ave, Chicago, IL"
            dotColor="#ef4444"
            query={endQuery}
            setQuery={setEndQuery}
            coords={endCoords}
            setCoords={setEndCoords}
            suggestions={endSuggestions}
            setSuggestions={setEndSuggestions}
          />
        </>
      )}

      {/* ── Sub-step 2: Map view ── */}
      {subStep === 2 && (
        <>
          {/* ── Single location summary ── */}
          {field.locationMode === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <RouteStop dotColor="#ef4444" bg="#fef2f2" border="#fecaca" textColor="#991b1b"
                label={endQuery || 'Your location'} tag="Service address" />
              {routeInfo && field.baseAddress && field.routeChargeType !== 'none' && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 4,
                  padding: '9px 12px', borderRadius: 9,
                  background: '#fefce8', border: '1.5px solid #fde68a',
                }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1.2, flexShrink: 0 }}>🚗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#78350f' }}>
                      Travel fee included
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#92400e', marginTop: 2, lineHeight: 1.4 }}>
                      {routeInfo.distanceMiles.toFixed(1)} mi · {Math.round(routeInfo.durationMinutes)} min to reach your location
                    </div>
                  </div>
                  {!hidePrices && priceContribution > 0 && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', flexShrink: 0 }}>
                      +{currency}{priceContribution.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Point-to-point Route summary ── */}
          {field.locationMode !== 'single' && legInfos && field.baseAddress ? (() => {
            const travelMiles = (legInfos[0]?.distanceMiles ?? 0) + (legInfos[2]?.distanceMiles ?? 0)
            const travelMins  = (legInfos[0]?.durationMinutes ?? 0) + (legInfos[2]?.durationMinutes ?? 0)
            const jobLeg      = legInfos[1]
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {/* Start / End pills */}
                <RouteStop dotColor="#22c55e" bg="#f0fdf4" border="#bbf7d0" textColor="#166534"
                  label={startQuery || 'Start'} tag="" />
                <RouteLeg leg={jobLeg} isTravel={false} />
                <RouteStop dotColor="#ef4444" bg="#fef2f2" border="#fecaca" textColor="#991b1b"
                  label={endQuery || 'End'} tag="" />

                {/* Travel fee callout */}
                {!hidePrices && travelMiles > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 4,
                    padding: '9px 12px', borderRadius: 9,
                    background: '#fefce8', border: '1.5px solid #fde68a',
                  }}>
                    <span style={{ fontSize: '1rem', lineHeight: 1.2, flexShrink: 0 }}>🚗</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#78350f' }}>
                        Travel fee included
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#92400e', marginTop: 2, lineHeight: 1.4 }}>
                        {travelMiles.toFixed(1)} mi · {Math.round(travelMins)} min driving to and from your location
                      </div>
                    </div>
                    {field.routeChargeType !== 'none' && routeInfo && (() => {
                      let travelCost = 0
                      if (field.routeChargeType === 'mileage' || field.routeChargeType === 'both') {
                        const billable = Math.max(0, travelMiles - (field.freeMiles ?? 0))
                        travelCost += billable * (field.ratePerMile ?? 0)
                      }
                      if (field.routeChargeType === 'drivetime' || field.routeChargeType === 'both') {
                        const billable = Math.max(0, travelMins - (field.freeMinutes ?? 0))
                        travelCost += billable * (field.ratePerMinute ?? 0)
                      }
                      return !hidePrices && travelCost > 0 ? (
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', flexShrink: 0 }}>
                          +{currency}{travelCost.toFixed(2)}
                        </span>
                      ) : null
                    })()}
                  </div>
                )}

                {/* Total */}
                {routeInfo && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, border: '1px solid #cbd5e1',
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>Total distance</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700 }}>
                        {routeInfo.distanceMiles.toFixed(1)} mi · {Math.round(routeInfo.durationMinutes)} min
                      </span>
                      {!hidePrices && field.routeChargeType !== 'none' && priceContribution > 0 && (
                        <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                          +{currency}{priceContribution.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })() : field.locationMode !== 'single' ? (
            /* No base — simple two-point summary */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <RouteStop dotColor="#22c55e" bg="#f0fdf4" border="#bbf7d0" textColor="#166534"
                  label={startQuery || 'Starting location'} tag="" />
                <RouteStop dotColor="#ef4444" bg="#fef2f2" border="#fecaca" textColor="#991b1b"
                  label={endQuery || 'Destination'} tag="" />
              </div>
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
                  {!hidePrices && field.routeChargeType !== 'none' && priceContribution > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.88rem', color: '#059669', fontWeight: 700 }}>
                      +{currency}{priceContribution.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Map container — single element, always in DOM for stable Mapbox ref */}
      <div style={{
        display: subStep === 2 ? 'block' : 'none',
        position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e4e0',
      }}>
        <div ref={mapContainerRef} style={{ height: 220, width: '100%', background: '#e8ecef', display: mapError ? 'none' : undefined }} />
        {mapError && (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: 6 }}>
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
    </div>
  )
}

// ── QuoteForm ──────────────────────────────────────────────────
export default function QuoteForm({ form, hasCredits, businessName = '' }: { form: HostedForm; hasCredits: boolean; businessName?: string }) {
  const config = form.form_config
  const router = useRouter()
  const supabase = createClient()

  // Fire-and-forget page view tracking
  useEffect(() => {
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hosted_form_id: form.id, account_id: form.account_id }),
    }).catch(() => {/* silently ignore */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Test mode banner state
  const [isTestMode, setIsTestMode] = useState(false)
  const [pixelReady, setPixelReady] = useState(false)
  const [leadEventFired, setLeadEventFired] = useState(false)

  useEffect(() => {
    setIsTestMode(new URLSearchParams(window.location.search).get('pixel_test') === '1')
  }, [])

  // Load Meta Pixel and fire PageView
  useEffect(() => {
    const pixelId = config.meta_pixel_id
    if (!pixelId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.fbq) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(script)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const n: any = function(...args: unknown[]) { n.callMethod ? n.callMethod(...args) : n.queue.push(args) }
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
      w.fbq = n; w._fbq = n
    }
    w.fbq('init', pixelId)
    w.fbq('track', 'PageView')
    setPixelReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const legacyColorMap: Record<string, string> = { yellow: '#FFE500', blue: '#1A56FF' }
  const accentBg = legacyColorMap[config.brand_color] ?? config.brand_color ?? '#FFE500'
  const isDark = isColorDark(accentBg)
  const accentFg = isDark ? '#ffffff' : '#1a1a2e'
  const accentTint = accentBg + '18'
  const currency = config.currency ?? '$'

  const fields = config.fields

  // Expand route fields into 3 real steps (start / end / map) so normal
  // step+1 / step-1 navigation works without any special-casing.
  interface ExpandedStep {
    field: FormField
    routeSubStep?: 0 | 1 | 2
  }
  const expandedSteps = useMemo<ExpandedStep[]>(() => {
    const result: ExpandedStep[] = []
    for (const field of fields) {
      if (field.type === 'route') {
        result.push({ field, routeSubStep: 0 })
        if (field.locationMode !== 'single') result.push({ field, routeSubStep: 1 })
        result.push({ field, routeSubStep: 2 })
      } else {
        result.push({ field })
      }
    }
    return result
  }, [fields])

  const totalFieldSteps = expandedSteps.length
  const contactStep = totalFieldSteps
  const confirmStep = totalFieldSteps + 1

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [routeData, setRouteData] = useState<Record<string, RouteResult | null>>({})
  const [drawAreaData, setDrawAreaData] = useState<Record<string, number | null>>({})
  const [routeCoords, setRouteCoords] = useState<Record<string, { start: [number, number] | null; end: [number, number] | null }>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const total = useMemo(
    () => computeTotal(config.fields, answers, routeData, drawAreaData),
    [config.fields, answers, routeData, drawAreaData]
  )

  const minQuote = config.min_quote ?? 0
  const displayTotal = minQuote > 0 ? Math.max(total, minQuote) : total
  const minApplied = minQuote > 0 && total < minQuote

  const lineItems = useMemo(() => {
    const items: Array<{ label: string; value: string; price: number }> = []
    for (const f of config.fields) {
      if (f.type === 'radio' || f.type === 'dropdown') {
        const opt = f.options?.find((o) => o.id === answers[f.id])
        if (opt) items.push({ label: f.label, value: opt.label, price: opt.price })
      } else if (f.type === 'checkbox') {
        const selectedIds = (answers[f.id] as string[]) ?? []
        for (const o of (f.options ?? []).filter((o) => selectedIds.includes(o.id))) {
          items.push({ label: f.label, value: o.label, price: o.price })
        }
      } else if (f.type === 'number') {
        const val = Number(answers[f.id]) || 0
        if (val > 0) items.push({ label: f.label, value: String(val), price: val * (f.ratePerUnit ?? 0) })
      } else if (f.type === 'textarea') {
        const val = String(answers[f.id] ?? '').trim()
        if (val) items.push({ label: f.label, value: val, price: 0 })
      } else if (f.type === 'route') {
        const rd = routeData[f.id]
        if (rd) {
          let routePrice = 0
          if (f.routeChargeType === 'mileage' || f.routeChargeType === 'both') {
            const billable = Math.max(0, rd.distanceMiles - (f.freeMiles ?? 0))
            routePrice += billable * (f.ratePerMile ?? 0)
          }
          if (f.routeChargeType === 'drivetime' || f.routeChargeType === 'both') {
            const billable = Math.max(0, rd.durationMinutes - (f.freeMinutes ?? 0))
            routePrice += billable * (f.ratePerMinute ?? 0)
          }
          items.push({
            label: f.label,
            value: `${rd.distanceMiles.toFixed(1)} mi — ${rd.startAddress} → ${rd.endAddress}`,
            price: routePrice,
          })
        }
      } else if (f.type === 'draw_area') {
        const sqFt = drawAreaData[f.id]
        if (sqFt != null) {
          items.push({
            label: f.label,
            value: `${sqFt.toLocaleString()} sq ft`,
            price: sqFt * (f.ratePerSqFt ?? 0),
          })
        }
      } else if (f.type === 'booking') {
        const val = answers[f.id] as string
        if (val) items.push({ label: f.label, value: formatDate(val), price: 0 })
      }
    }
    return items
  }, [config.fields, answers, routeData, drawAreaData])

  const handleRouteChange = useCallback((fieldId: string, result: RouteResult | null) => {
    setRouteData((prev) => ({ ...prev, [fieldId]: result }))
  }, [])

  const handleDrawAreaChange = useCallback((fieldId: string, sqFt: number | null) => {
    setDrawAreaData((prev) => ({ ...prev, [fieldId]: sqFt }))
  }, [])

  const handleStartCoordsChange = useCallback((fieldId: string, coords: [number, number] | null) => {
    setRouteCoords((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], start: coords } }))
  }, [])

  const handleEndCoordsChange = useCallback((fieldId: string, coords: [number, number] | null) => {
    setRouteCoords((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], end: coords } }))
  }, [])

  const isFieldStep = step < totalFieldSteps
  const isContactStep = step === contactStep
  const isConfirmStep = step === confirmStep
  const currentExpanded = isFieldStep ? expandedSteps[step] : null
  const currentField = currentExpanded?.field ?? null
  const currentRouteSubStep = currentExpanded?.routeSubStep ?? 0
  const progressPercent = Math.round((step / (totalFieldSteps + 1)) * 100)

  function canAdvance(): boolean {
    if (!isFieldStep || !currentField) return true
    const f = currentField
    if (f.type === 'route') {
      if (currentRouteSubStep === 0) {
        if (f.locationMode === 'single') return !f.required || !!(routeCoords[f.id]?.end)
        return !f.required || !!(routeCoords[f.id]?.start)
      }
      if (currentRouteSubStep === 1) return !f.required || !!(routeCoords[f.id]?.end)
      return !f.required || !!routeData[f.id]
    }
    if (!f.required) return true
    if (f.type === 'radio' || f.type === 'dropdown') return !!answers[f.id]
    if (f.type === 'checkbox') return ((answers[f.id] as string[])?.length ?? 0) > 0
    if (f.type === 'number') return !!(answers[f.id] as number)
    if (f.type === 'textarea') return !!String(answers[f.id] ?? '').trim()
    if (f.type === 'draw_area') return drawAreaData[f.id] != null
    if (f.type === 'booking') return !f.required || !!answers[f.id]
    return true
  }

  function handleNext() { setStep((s) => s + 1) }
  function handleBack() { if (step > 0) setStep((s) => s - 1) }

  // Auto-advance for radio — show selection briefly then move on
  function selectRadio(fieldId: string, optId: string) {
    setAnswers((p) => ({ ...p, [fieldId]: optId }))
    setTimeout(() => setStep((s) => s + 1), 300)
  }

  function isValidPhone(p: string): boolean {
    // Strip all non-digit characters and check for 10–15 digits (E.164 range)
    const digits = p.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.')
      return
    }
    if (!phone.trim()) {
      setFormError('Phone number is required.')
      return
    }
    if (!isValidPhone(phone)) {
      setFormError('Please enter a valid phone number (e.g. +1 555 000 0000).')
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
    const bookingField = config.fields.find(f => f.type === 'booking')
    if (bookingField && answers[bookingField.id]) {
      formData._booking_date = answers[bookingField.id]
    }

    const submitRes = await fetch('/api/leads/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: form.account_id,
        hosted_form_id: form.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        form_type: form.form_type,
        form_data: formData,
        status: hasCredits ? 'new' : 'held',
      }),
    })

    setIsSubmitting(false)
    if (!submitRes.ok) {
      const errData = await submitRes.json().catch(() => ({}))
      setFormError(errData.error || 'Something went wrong. Please try again.')
      return
    }

    fetch('/api/leads/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name.trim(),
        customerEmail: email.trim(),
        formName: form.form_name,
        currency,
        total: displayTotal,
        minApplied,
        lineItems,
        businessName: businessName || undefined,
        emailSubject: config.email_template?.subject || undefined,
        emailIntro: config.email_template?.intro || undefined,
        emailOutro: config.email_template?.outro || undefined,
        emailHeaderImage: config.email_template?.header_image || undefined,
        emailAccentColor: config.email_template?.accent_color || undefined,
      }),
    }).catch(() => { /* silently ignore email errors */ })

    // Navigate to dedicated thank-you page — pixel fires there and triggers the custom conversion
    const qs = new URLSearchParams({ email })
    if (name) qs.set('name', name)
    if (displayTotal > 0) qs.set('total', displayTotal.toFixed(2))
    router.push(`/${config.slug}/thank-you?${qs.toString()}`)
  }

  const hasPricing = config.fields.some(
    (f) =>
      ['radio', 'dropdown', 'checkbox'].includes(f.type) ||
      (f.type === 'number' && (f.ratePerUnit ?? 0) > 0) ||
      (f.type === 'route' && f.routeChargeType !== 'none') ||
      (f.type === 'draw_area' && (f.ratePerSqFt ?? 0) > 0)
  )
  // Hide all inline prices when quote_display is 'after_submit' or 'hidden'
  // Also respect legacy show_total=false for forms saved before quote_display existed
  const effectiveDisplay = config.quote_display ?? (config.show_total === false ? 'hidden' : 'live')
  const hidePrices = effectiveDisplay === 'after_submit' || effectiveDisplay === 'hidden'
  // DEBUG — remove after verifying
  if (typeof window !== 'undefined') {
    console.log('[QuoteForm] quote_display:', config.quote_display, '| show_total:', config.show_total, '| effectiveDisplay:', effectiveDisplay, '| hidePrices:', hidePrices)
  }

  // ── Shared styles ──
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#0f172a',
    background: 'white',
    transition: 'border-color 0.15s',
  }

  const continueBtn: React.CSSProperties = {
    width: '100%',
    padding: '17px',
    borderRadius: 14,
    border: 'none',
    background: accentBg,
    color: accentFg,
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
    marginTop: 20,
  }

  const backBtn: React.CSSProperties = {
    display: 'block',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '10px 0 0',
    fontFamily: 'inherit',
    fontWeight: 500,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 60%, #f0f4ff 100%)'
        : `linear-gradient(135deg, ${accentBg}22 0%, ${accentBg}18 60%, ${accentBg}22 100%)`,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: isTestMode ? '72px 16px 60px' : '28px 16px 60px',
    }}>
      {/* ── Pixel test banner ── */}
      {isTestMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: leadEventFired ? '#14532d' : pixelReady ? '#1e3a5f' : '#1c1917',
          color: 'white',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          fontSize: 13, fontFamily: 'system-ui, sans-serif',
          transition: 'background 0.4s',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: '50%',
              background: pixelReady ? '#22c55e' : '#6b7280', fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>
              {pixelReady ? '✓' : '…'}
            </span>
            Pixel {config.meta_pixel_id} — {pixelReady ? 'loaded · PageView fired' : 'loading…'}
          </span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: '50%',
              background: leadEventFired ? '#22c55e' : '#6b7280', fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>
              {leadEventFired ? '✓' : '·'}
            </span>
            Lead event — {leadEventFired ? 'fired ✓' : 'waiting for submit'}
          </span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ opacity: 0.55, fontSize: 11 }}>Test mode — not visible to visitors</span>
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: 520,
        background: 'white',
        borderRadius: 22,
        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.13)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ background: accentBg }}>
          {/* Progress bar */}
          {!isConfirmStep && (
            <div style={{ height: 4, background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(26,26,46,0.1)' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(26,26,46,0.45)',
                borderRadius: '0 2px 2px 0',
                transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          )}

          {/* Hero image on step 0 */}
          {config.hero_image_url && step === 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.hero_image_url}
              alt="Hero"
              style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
            />
          )}

          <div style={{ padding: '20px 26px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.45)',
              }}>
                {isConfirmStep ? 'All Done! 🎉' : isContactStep ? 'Almost There' : step === 0 ? 'Get Your Quote' : `Step ${step + 1} of ${totalFieldSteps + 1}`}
              </span>
              {/* Live running total pill */}
              {hasPricing && !hidePrices && displayTotal > 0 && !isConfirmStep && (
                <span style={{
                  fontSize: '0.88rem', fontWeight: 800,
                  background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(26,26,46,0.12)',
                  color: accentFg,
                  padding: '5px 13px', borderRadius: 99,
                  transition: 'all 0.2s',
                }}>
                  {currency}{displayTotal.toFixed(2)}
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: accentFg, lineHeight: 1.25 }}>
              {form.form_name}
            </div>
            {config.description && step === 0 && (
              <div style={{ fontSize: '0.84rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.58)', marginTop: 5, lineHeight: 1.55 }}>
                {config.description}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '30px 26px 36px' }}>

          {/* ── Field step: one question at a time ── */}
          {isFieldStep && currentField && (
            <div>
              {/* Question heading */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                  {currentField.label}
                  {currentField.required && (
                    <span style={{ color: accentBg, fontSize: '1rem', marginLeft: 4 }}> *</span>
                  )}
                </h2>
                {currentField.type === 'checkbox' && (
                  <p style={{ margin: '7px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Select all that apply</p>
                )}
                {currentField.type === 'route' && (
                  <p style={{ margin: '7px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    {currentField.locationMode === 'single'
                      ? (currentRouteSubStep === 0 ? 'Enter your service address' : 'Review your location')
                      : (currentRouteSubStep === 0 ? 'Enter your starting address' : currentRouteSubStep === 1 ? 'Now enter your destination' : 'Review and confirm your route')
                    }
                  </p>
                )}
              </div>

              {/* ── Radio: big tap targets + auto-advance ── */}
              {currentField.type === 'radio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(currentField.options ?? []).map((o) => {
                    const sel = answers[currentField.id] === o.id
                    return (
                      <button
                        key={o.id}
                        onClick={() => selectRadio(currentField.id, o.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px 18px', borderRadius: 14,
                          border: `2px solid ${sel ? accentBg : '#e2e8f0'}`,
                          cursor: 'pointer', background: sel ? accentTint : 'white',
                          textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.12s', width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            border: `2.5px solid ${sel ? accentBg : '#cbd5e1'}`,
                            background: sel ? accentBg : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.12s',
                          }}>
                            {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: accentFg }} />}
                          </div>
                          <span style={{ fontSize: '0.97rem', fontWeight: sel ? 700 : 500, color: sel ? (isDark ? '#1e3a8a' : '#78350f') : '#0f172a' }}>
                            {o.label}
                          </span>
                        </div>
                        {!hidePrices && currentField.showPrices !== false && o.price > 0 && (
                          <span style={{
                            fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, marginLeft: 10,
                            background: sel ? accentBg : '#f1f5f9',
                            color: sel ? accentFg : '#475569',
                            padding: '3px 11px', borderRadius: 8, transition: 'all 0.12s',
                          }}>
                            {o.hours ? `${currency}${o.price}/hr × ${o.hours}h` : `+${currency}${o.price}`}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {/* Skip required badge — if not required show next anyway */}
                  {!currentField.required && (
                    <button onClick={handleNext} style={{ ...backBtn, paddingTop: 14, color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
                      Skip →
                    </button>
                  )}
                </div>
              )}

              {/* ── Dropdown ── */}
              {currentField.type === 'dropdown' && (
                <>
                  <select
                    value={(answers[currentField.id] as string) ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [currentField.id]: e.target.value }))}
                    style={{
                      ...inputStyle,
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 44,
                    }}
                  >
                    <option value="">Choose an option…</option>
                    {(currentField.options ?? []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}{!hidePrices && currentField.showPrices !== false && o.price > 0 ? (o.hours ? ` (${currency}${o.price}/hr × ${o.hours}h)` : ` (+${currency}${o.price})`) : ''}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    Continue →
                  </button>
                </>
              )}

              {/* ── Checkbox ── */}
              {currentField.type === 'checkbox' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(currentField.options ?? []).map((o) => {
                      const sel = ((answers[currentField.id] as string[]) ?? []).includes(o.id)
                      return (
                        <button
                          key={o.id}
                          onClick={() => {
                            const prev = (answers[currentField.id] as string[]) ?? []
                            setAnswers((p) => ({
                              ...p,
                              [currentField.id]: sel ? prev.filter((id) => id !== o.id) : [...prev, o.id],
                            }))
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 18px', borderRadius: 14,
                            border: `2px solid ${sel ? accentBg : '#e2e8f0'}`,
                            cursor: 'pointer', background: sel ? accentTint : 'white',
                            textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.12s', width: '100%',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                              border: `2.5px solid ${sel ? accentBg : '#cbd5e1'}`,
                              background: sel ? accentBg : 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.12s',
                            }}>
                              {sel && <span style={{ color: accentFg, fontSize: 13, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '0.97rem', fontWeight: sel ? 700 : 500, color: sel ? (isDark ? '#1e3a8a' : '#78350f') : '#0f172a' }}>
                              {o.label}
                            </span>
                          </div>
                          {!hidePrices && currentField.showPrices !== false && o.price > 0 && (
                            <span style={{
                              fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, marginLeft: 10,
                              background: sel ? accentBg : '#f1f5f9',
                              color: sel ? 'white' : '#475569',
                              padding: '3px 11px', borderRadius: 8, transition: 'all 0.12s',
                            }}>
                              {o.hours ? `${currency}${o.price}/hr × ${o.hours}h` : `+${currency}${o.price}`}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    Continue →
                  </button>
                </>
              )}

              {/* ── Number ── */}
              {currentField.type === 'number' && (
                <>
                  <input
                    type="number" min={0}
                    placeholder={currentField.placeholder ?? '0'}
                    value={(answers[currentField.id] as number) ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [currentField.id]: parseFloat(e.target.value) || 0 }))}
                    style={inputStyle}
                  />
                  {!hidePrices && (currentField.ratePerUnit ?? 0) > 0 && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 9, display: 'flex', justifyContent: 'space-between' }}>
                      <span>× {currency}{currentField.ratePerUnit} per unit</span>
                      {answers[currentField.id] ? (
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          = {currency}{(Number(answers[currentField.id]) * (currentField.ratePerUnit ?? 0)).toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    Continue →
                  </button>
                </>
              )}

              {/* ── Textarea ── */}
              {currentField.type === 'textarea' && (
                <>
                  <textarea
                    rows={4}
                    placeholder={currentField.placeholder ?? ''}
                    value={(answers[currentField.id] as string) ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [currentField.id]: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
                  />
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    Continue →
                  </button>
                </>
              )}

              {/* ── Booking Date ── */}
              {currentField.type === 'booking' && (
                <>
                  <input
                    type="date"
                    value={String(answers[currentField.id] ?? '')}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentField.id]: e.target.value }))}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `2px solid ${accentBg}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    Continue →
                  </button>
                </>
              )}

              {/* ── Route ── */}
              {currentField.type === 'route' && (
                <>
                  <RouteField
                    key={currentField.id}
                    field={currentField}
                    currency={currency}
                    accentColor={accentBg}
                    onRouteChange={(result) => handleRouteChange(currentField.id, result)}
                    subStep={currentRouteSubStep}
                    onStartCoordsChange={(coords) => handleStartCoordsChange(currentField.id, coords)}
                    onEndCoordsChange={(coords) => handleEndCoordsChange(currentField.id, coords)}
                    hidePrices={hidePrices}
                  />
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    {currentRouteSubStep < 2 ? 'Continue →' : currentField.locationMode === 'single' ? 'Confirm Location →' : 'Confirm Route →'}
                  </button>
                </>
              )}

              {/* ── Draw Area ── */}
              {currentField.type === 'draw_area' && (
                <>
                  <DrawAreaField
                    field={currentField}
                    currency={currency}
                    accentColor={accentBg}
                    onAreaChange={(sqFt) => handleDrawAreaChange(currentField.id, sqFt)}
                    hidePrices={hidePrices}
                  />
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    Continue →
                  </button>
                </>
              )}

              {/* ── Image ── */}
              {currentField.type === 'image' && currentField.imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentField.imageUrl}
                    alt={currentField.label}
                    style={{ width: '100%', borderRadius: 14, display: 'block', maxHeight: 300, objectFit: 'cover', marginBottom: 4 }}
                  />
                  <button onClick={handleNext} style={continueBtn}>Continue →</button>
                </>
              )}

              {/* Back link */}
              {step > 0 && (
                <button onClick={handleBack} style={backBtn}>← Back</button>
              )}
            </div>
          )}

          {/* ── Contact step ── */}
          {isContactStep && (
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                Almost done — how should we reach you?
              </h2>
              <p style={{ margin: '0 0 26px', fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6 }}>
                We&apos;ll send your personalised quote straight to your inbox.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Full Name *
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} autoComplete="name" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Email Address *
                  </label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" style={inputStyle} autoComplete="email" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Phone *
                  </label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} autoComplete="tel" />
                </div>
              </div>

              {/* Quote total preview — only in live mode (after_submit reveals on confirm page) */}
              {hasPricing && !hidePrices && displayTotal > 0 && (
                <div style={{
                  marginTop: 22, padding: '15px 18px',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: 14, border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {effectiveDisplay === 'live' ? 'Your Estimate' : 'Quote Total'}
                    </div>
                    {minApplied && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Min. fee applies</div>}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                    {currency}{displayTotal.toFixed(2)}
                  </div>
                </div>
              )}

              {formError && (
                <div style={{ marginTop: 14, fontSize: '0.85rem', color: '#ef4444', fontWeight: 500 }}>{formError}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ ...continueBtn, opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? 'Submitting…' : (config.submit_label ?? 'Get My Quote →')}
              </button>
              <button onClick={handleBack} style={backBtn}>← Back</button>
            </div>
          )}

          {/* ── Confirmation ── */}
          {isConfirmStep && (
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%', background: accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 22px', fontSize: 32,
                boxShadow: `0 8px 24px ${`${accentBg}4D`}`,
              }}>
                <span style={{ color: accentFg }}>✓</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                Your quote is on its way!
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
                We&apos;ve received your details and will email your personalised quote to{' '}
                <strong style={{ color: '#334155' }}>{email}</strong> shortly.
              </div>

              {hasPricing && effectiveDisplay !== 'hidden' && (displayTotal > 0 || effectiveDisplay === 'after_submit') && (
                <div style={{
                  marginTop: 28, padding: '20px 22px',
                  background: effectiveDisplay === 'after_submit'
                    ? `linear-gradient(135deg, ${accentBg}12, ${accentBg}08)`
                    : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: 16,
                  border: effectiveDisplay === 'after_submit'
                    ? `1.5px solid ${accentBg}40`
                    : '1px solid #e2e8f0',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {effectiveDisplay === 'after_submit' ? 'Your Estimated Quote' : 'Estimated Total'}
                  </div>

                  {/* Line-item breakdown */}
                  {lineItems.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      {lineItems.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          gap: 12, paddingTop: i === 0 ? 0 : 10, paddingBottom: 10,
                          borderBottom: i < lineItems.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', lineHeight: 1.3 }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.value}
                            </div>
                          </div>
                          {item.price > 0 && (
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                              {currency}{item.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: lineItems.length > 0 ? 12 : 0,
                    borderTop: lineItems.length > 0 ? '2px solid rgba(0,0,0,0.08)' : 'none',
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Total
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                        {displayTotal > 0 ? `${currency}${displayTotal.toFixed(2)}` : 'Free'}
                      </div>
                      {minApplied && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                          Minimum booking fee applies
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
