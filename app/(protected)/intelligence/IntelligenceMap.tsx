'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ZipAggregate } from '@/lib/services/intelligence-repository'

interface Props {
  token: string
  zipAggregates: ZipAggregate[]
  onZipClick: (postalCode: string) => void
}

const QUALITY_COLORS: Record<string, string> = {
  hot: '#ef4444',
  warm: '#f97316',
  cool: '#3b82f6',
  cold: '#9ca3af',
}

export default function IntelligenceMap({ token, zipAggregates, onZipClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || !token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 4,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [token])

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Wait for map to load
    function addMarkers() {
      // Remove existing markers
      document.querySelectorAll('.qb-map-marker').forEach(el => el.remove())

      for (const zip of zipAggregates) {
        if (!zip.latitude || !zip.longitude) continue

        const size = Math.min(Math.max(zip.lead_count * 8, 20), 60)
        const color = QUALITY_COLORS[zip.top_quality] ?? QUALITY_COLORS.cold

        const el = document.createElement('div')
        el.className = 'qb-map-marker'
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.7;
          border: 2px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.15s;
        `
        el.textContent = String(zip.lead_count)
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
          el.style.opacity = '1'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
          el.style.opacity = '0.7'
        })

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setHTML(`
            <div style="font-family: system-ui; padding: 4px;">
              <strong>${zip.city}, ${zip.region}</strong><br/>
              <span style="color: #6b7280; font-size: 12px;">${zip.postal_code}</span><br/>
              <span style="font-size: 12px;">Leads: <strong>${zip.lead_count}</strong></span><br/>
              <span style="font-size: 12px;">Avg Score: <strong>${zip.avg_quality_score.toFixed(1)}</strong></span>
            </div>
          `)

        new mapboxgl.Marker({ element: el })
          .setLngLat([zip.longitude, zip.latitude])
          .setPopup(popup)
          .addTo(map!)

        el.addEventListener('click', () => onZipClick(zip.postal_code))
      }

      // Fit bounds if we have data
      if (zipAggregates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        for (const zip of zipAggregates) {
          if (zip.latitude && zip.longitude) {
            bounds.extend([zip.longitude, zip.latitude])
          }
        }
        map!.fitBounds(bounds, { padding: 60, maxZoom: 12 })
      }
    }

    if (map.loaded()) {
      addMarkers()
    } else {
      map.on('load', addMarkers)
    }
  }, [zipAggregates, onZipClick])

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  )
}
