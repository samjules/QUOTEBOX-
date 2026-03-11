'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Lead } from '@/lib/types'
import Link from 'next/link'
import { createRoot } from 'react-dom/client'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface LeadLocation {
  lead: Lead
  lng: number
  lat: number
  address: string
}

function extractLeadLocations(leads: Lead[]): LeadLocation[] {
  return leads.flatMap((lead) => {
    if (!lead.form_data) return []
    return Object.values(lead.form_data)
      .filter(
        (v): v is { geometry: { coordinates: number[][] }; endAddress: string } =>
          v !== null &&
          typeof v === 'object' &&
          'geometry' in v &&
          'endAddress' in v &&
          (v as { geometry?: unknown }).geometry !== null &&
          typeof (v as { geometry?: unknown }).geometry === 'object' &&
          'coordinates' in ((v as { geometry: object }).geometry)
      )
      .map((routeResult) => {
        const coords = routeResult.geometry.coordinates
        const [lng, lat] = coords[coords.length - 1]
        return { lead, lng, lat, address: routeResult.endAddress }
      })
  })
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

export default function LeadMap({ leads }: { leads: Lead[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const locations = extractLeadLocations(leads)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // center of US
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

        // Create popup content
        const popupNode = document.createElement('div')
        const root = createRoot(popupNode)
        root.render(
          <div className="p-2 min-w-[200px]">
            <p className="font-semibold text-gray-900 text-sm mb-1">{lead.name || 'Unnamed Lead'}</p>
            {quote && (
              <div className="inline-block bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded mb-2">
                {quote.currency}{quote.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
            )}
            <div className="mb-1">
              <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${statusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{address}</p>
            <a href="/leads" className="text-xs text-indigo-600 font-medium hover:underline">View Lead →</a>
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
      <div ref={mapContainer} className="absolute inset-0" />
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-8 py-6 text-center pointer-events-auto">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No locations yet</h3>
            <p className="text-sm text-gray-500">
              Leads with route fields will appear as pins on this map.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
