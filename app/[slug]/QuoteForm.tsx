'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
      if (opt) total += opt.price
    } else if (f.type === 'checkbox') {
      for (const oid of (answers[f.id] as string[]) ?? []) {
        const opt = f.options?.find((o) => o.id === oid)
        if (opt) total += opt.price
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
        if (f.routeChargeType === 'mileage' || f.routeChargeType === 'both')
          total += rd.distanceMiles * effectiveMileRate
        if (f.routeChargeType === 'drivetime' || f.routeChargeType === 'both')
          total += rd.durationMinutes * effectiveMinRate
      }
    } else if (f.type === 'draw_area') {
      total += (drawAreaData[f.id] ?? 0) * (f.ratePerSqFt ?? 0)
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
}: {
  field: FormField
  currency: string
  accentColor: string
  onAreaChange: (sqFt: number | null) => void
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
          {(field.ratePerSqFt ?? 0) > 0 && (
            <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: 700 }}>
              +{currency}{price.toFixed(2)}
            </span>
          )}
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
  subStep,
  onStartCoordsChange,
  onEndCoordsChange,
}: {
  field: FormField
  currency: string
  accentColor: string
  onRouteChange: (result: RouteResult | null) => void
  subStep: number
  onStartCoordsChange: (coords: [number, number] | null) => void
  onEndCoordsChange: (coords: [number, number] | null) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
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
  const [startQuery, setStartQuery] = useState(field.baseAddress ?? '')
  const [startSuggestions, setStartSuggestions] = useState<GeocodeSuggestion[]>([])
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null)
  const [endQuery, setEndQuery] = useState('')
  const [endSuggestions, setEndSuggestions] = useState<GeocodeSuggestion[]>([])
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distanceMiles: number; durationMinutes: number } | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null)
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

  // Auto-geocode base address on mount
  useEffect(() => {
    if (!field.baseAddress) return
    geocode(field.baseAddress).then((results) => {
      if (results[0]) {
        setStartCoords(results[0].center)
        onStartCoordsChangeRef.current(results[0].center)
      }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Sub-step 0: Starting location (only when no base address) ── */}
      {subStep === 0 && !field.baseAddress && (
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

      {/* ── Sub-step 1: Destination ── */}
      {subStep === 1 && (
        <>
          {/* Start address context pill */}
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
              <span style={{ fontSize: '0.72rem', opacity: 0.6, flexShrink: 0 }}>
                {field.baseAddress ? 'Base' : 'Start'}
              </span>
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
          {/* Address summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
              background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10,
              fontSize: '0.83rem', color: '#166534',
            }}>
              <span style={{ fontSize: 9, color: '#22c55e', lineHeight: 1 }}>●</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {startQuery || 'Starting location'}
              </span>
              {field.baseAddress && (
                <span style={{ fontSize: '0.72rem', opacity: 0.6, flexShrink: 0 }}>Base</span>
              )}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
              background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10,
              fontSize: '0.83rem', color: '#991b1b',
            }}>
              <span style={{ fontSize: 9, color: '#ef4444', lineHeight: 1 }}>●</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {endQuery || 'Destination'}
              </span>
            </div>
          </div>

          {/* Route info strip (shown once calculated) */}
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
export default function QuoteForm({ form, hasCredits }: { form: HostedForm; hasCredits: boolean }) {
  const config = form.form_config
  const supabase = createClient()

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
        if (!field.baseAddress) result.push({ field, routeSubStep: 0 })
        result.push({ field, routeSubStep: 1 })
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
      if (currentRouteSubStep === 0) return !f.required || !!(routeCoords[f.id]?.start)
      if (currentRouteSubStep === 1) return !f.required || !!(routeCoords[f.id]?.end)
      return !f.required || !!routeData[f.id]
    }
    if (!f.required) return true
    if (f.type === 'radio' || f.type === 'dropdown') return !!answers[f.id]
    if (f.type === 'checkbox') return ((answers[f.id] as string[])?.length ?? 0) > 0
    if (f.type === 'number') return !!(answers[f.id] as number)
    if (f.type === 'textarea') return !!String(answers[f.id] ?? '').trim()
    if (f.type === 'draw_area') return drawAreaData[f.id] != null
    return true
  }

  function handleNext() { setStep((s) => s + 1) }
  function handleBack() { if (step > 0) setStep((s) => s - 1) }

  // Auto-advance for radio — show selection briefly then move on
  function selectRadio(fieldId: string, optId: string) {
    setAnswers((p) => ({ ...p, [fieldId]: optId }))
    setTimeout(() => setStep((s) => s + 1), 300)
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

    const submitRes = await fetch('/api/leads/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: form.account_id,
        hosted_form_id: form.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
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

    // Build line items for the quote email
    const lineItems: Array<{ label: string; value: string; price: number }> = []
    for (const f of config.fields) {
      if (f.type === 'radio' || f.type === 'dropdown') {
        const opt = f.options?.find((o) => o.id === answers[f.id])
        if (opt) lineItems.push({ label: f.label, value: opt.label, price: opt.price })
      } else if (f.type === 'checkbox') {
        const selectedIds = (answers[f.id] as string[]) ?? []
        for (const o of (f.options ?? []).filter((o) => selectedIds.includes(o.id))) {
          lineItems.push({ label: f.label, value: o.label, price: o.price })
        }
      } else if (f.type === 'number') {
        const val = Number(answers[f.id]) || 0
        if (val > 0) lineItems.push({ label: f.label, value: String(val), price: val * (f.ratePerUnit ?? 0) })
      } else if (f.type === 'textarea') {
        const val = String(answers[f.id] ?? '').trim()
        if (val) lineItems.push({ label: f.label, value: val, price: 0 })
      } else if (f.type === 'route') {
        const rd = routeData[f.id]
        if (rd) {
          let routePrice = 0
          if (f.routeChargeType === 'mileage' || f.routeChargeType === 'both')
            routePrice += rd.distanceMiles * (f.ratePerMile ?? 0)
          if (f.routeChargeType === 'drivetime' || f.routeChargeType === 'both')
            routePrice += rd.durationMinutes * (f.ratePerMinute ?? 0)
          lineItems.push({
            label: f.label,
            value: `${rd.distanceMiles.toFixed(1)} mi — ${rd.startAddress} → ${rd.endAddress}`,
            price: routePrice,
          })
        }
      } else if (f.type === 'draw_area') {
        const sqFt = drawAreaData[f.id]
        if (sqFt != null) {
          lineItems.push({
            label: f.label,
            value: `${sqFt.toLocaleString()} sq ft`,
            price: sqFt * (f.ratePerSqFt ?? 0),
          })
        }
      }
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
      }),
    }).catch(() => { /* silently ignore email errors */ })

    setStep(confirmStep)
  }

  const hasPricing = config.fields.some(
    (f) =>
      ['radio', 'dropdown', 'checkbox'].includes(f.type) ||
      (f.type === 'number' && (f.ratePerUnit ?? 0) > 0) ||
      (f.type === 'route' && f.routeChargeType !== 'none') ||
      (f.type === 'draw_area' && (f.ratePerSqFt ?? 0) > 0)
  )

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
      padding: '28px 16px 60px',
    }}>
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
              {hasPricing && config.quote_display === 'live' && displayTotal > 0 && !isConfirmStep && (
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
                    {currentRouteSubStep === 0 ? 'Enter your starting address' : currentRouteSubStep === 1 ? 'Now enter your destination' : 'Review and confirm your route'}
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
                        {currentField.showPrices !== false && o.price > 0 && (
                          <span style={{
                            fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, marginLeft: 10,
                            background: sel ? accentBg : '#f1f5f9',
                            color: sel ? accentFg : '#475569',
                            padding: '3px 11px', borderRadius: 8, transition: 'all 0.12s',
                          }}>
                            +{currency}{o.price}
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
                        {o.label}{currentField.showPrices !== false && o.price > 0 ? ` (+${currency}${o.price})` : ''}
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
                          {currentField.showPrices !== false && o.price > 0 && (
                            <span style={{
                              fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, marginLeft: 10,
                              background: sel ? accentBg : '#f1f5f9',
                              color: sel ? 'white' : '#475569',
                              padding: '3px 11px', borderRadius: 8, transition: 'all 0.12s',
                            }}>
                              +{currency}{o.price}
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
                  {(currentField.ratePerUnit ?? 0) > 0 && (
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
                  />
                  <button onClick={handleNext} disabled={!canAdvance()}
                    style={{ ...continueBtn, opacity: canAdvance() ? 1 : 0.35, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
                    {currentRouteSubStep < 2 ? 'Continue →' : 'Confirm Route →'}
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
                    Phone <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} autoComplete="tel" />
                </div>
              </div>

              {/* Quote total preview */}
              {hasPricing && config.quote_display !== 'hidden' && displayTotal > 0 && (
                <div style={{
                  marginTop: 22, padding: '15px 18px',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: 14, border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {config.quote_display === 'live' ? 'Your Estimate' : 'Quote Total'}
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

              {hasPricing && config.quote_display !== 'hidden' && displayTotal > 0 && (
                <div style={{
                  marginTop: 28, padding: '22px',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: 16, border: '1px solid #e2e8f0',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {config.quote_display === 'after_submit' ? 'Your Estimated Quote' : 'Estimated Total'}
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                    {currency}{displayTotal.toFixed(2)}
                  </div>
                  {minApplied && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5 }}>
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
