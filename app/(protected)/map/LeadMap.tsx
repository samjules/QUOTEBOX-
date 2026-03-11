'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Lead } from '@/lib/types'
import { createRoot } from 'react-dom/client'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface LeadLocation {
  lead: Lead
  lng: number
  lat: number
  address: string
}

interface RouteResult {
  endCoords: [number, number]
  endAddress: string
  startAddress?: string
  distanceMiles?: number
  durationMinutes?: number
}

function isRouteResult(v: unknown): v is RouteResult {
  return (
    v !== null &&
    typeof v === 'object' &&
    'endCoords' in v &&
    'endAddress' in v &&
    Array.isArray((v as RouteResult).endCoords) &&
    (v as RouteResult).endCoords.length === 2
  )
}

function extractLeadLocations(leads: Lead[]): LeadLocation[] {
  return leads.flatMap((lead) => {
    if (!lead.form_data) return []
    return Object.values(lead.form_data)
      .filter(isRouteResult)
      .map((routeResult) => {
        const [lng, lat] = routeResult.endCoords
        return { lead, lng, lat, address: routeResult.endAddress }
      })
  })
}

function hasLocation(lead: Lead): boolean {
  if (!lead.form_data) return false
  return Object.values(lead.form_data).some(isRouteResult)
}

function statusColor(status: string) {
  switch (status) {
    case 'new': return 'bg-yellow-100 text-yellow-800'
    case 'contacted': return 'bg-blue-100 text-blue-800'
    case 'booked': return 'bg-green-100 text-green-800'
    case 'lost': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getQuote(lead: Lead) {
  const total = lead.form_data?._quote_total
  if (typeof total !== 'number' || total === 0) return null
  const currency = (lead.form_data?._quote_currency as string) ?? '$'
  return { total, currency }
}

function formatQuote(lead: Lead) {
  const q = getQuote(lead)
  if (!q) return null
  return `${q.currency}${q.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export default function LeadMap({ leads }: { leads: Lead[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const locations = extractLeadLocations(leads)
  const noLocationLeads = leads.filter((l) => !hasLocation(l))

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283],
      zoom: 4,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current = map

    map.on('load', () => {
      if (locations.length === 0) return

      const bounds = new mapboxgl.LngLatBounds()

      locations.forEach(({ lead, lng, lat, address }) => {
        bounds.extend([lng, lat])
        const quote = getQuote(lead)

        const popupNode = document.createElement('div')
        const root = createRoot(popupNode)
        root.render(
          <div style={{ padding: '8px', minWidth: '180px', fontFamily: 'sans-serif' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px 0', color: '#111827' }}>
              {lead.name || 'Unnamed Lead'}
            </p>
            {quote && (
              <div style={{
                display: 'inline-block', background: '#16a34a', color: '#fff',
                fontSize: '13px', fontWeight: 700, padding: '2px 8px',
                borderRadius: '4px', marginBottom: '6px'
              }}>
                {quote.currency}{quote.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
            )}
            <div style={{ marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '1px 6px',
                borderRadius: '9999px', background: lead.status === 'booked' ? '#dcfce7' : lead.status === 'new' ? '#fef9c3' : lead.status === 'contacted' ? '#dbeafe' : '#fee2e2',
                color: lead.status === 'booked' ? '#166534' : lead.status === 'new' ? '#854d0e' : lead.status === 'contacted' ? '#1e40af' : '#991b1b',
              }}>
                {lead.status}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px 0' }}>{address}</p>
            <a href="/leads" style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 500, textDecoration: 'none' }}>
              View Lead →
            </a>
          </div>
        )

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupNode)
        new mapboxgl.Marker({ color: '#4f46e5' })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map)
      })

      if (locations.length === 1) {
        map.flyTo({ center: [locations[0].lng, locations[0].lat], zoom: 12 })
      } else {
        map.fitBounds(bounds, { padding: 60 })
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100vh' }}>
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* No-location leads panel */}
      {noLocationLeads.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 w-72">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700">
                Leads without location
                <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {noLocationLeads.length}
                </span>
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${panelOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {panelOpen && (
              <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                {noLocationLeads.map((lead) => {
                  const q = formatQuote(lead)
                  return (
                    <li key={lead.id} className="px-4 py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.name || 'Unnamed Lead'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{lead.email || lead.phone || '—'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {q && (
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            {q}
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${statusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no leads at all */}
      {leads.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-8 py-6 text-center pointer-events-auto">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No leads yet</h3>
            <p className="text-sm text-gray-500">Leads will appear here once you receive them.</p>
          </div>
        </div>
      )}
    </div>
  )
}
