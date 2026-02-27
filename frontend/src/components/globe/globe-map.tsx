import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_TOKEN, RISK_COLORS } from '@/lib/constants'
import type { CountryScore } from '@/lib/types'

mapboxgl.accessToken = MAPBOX_TOKEN

interface GlobeMapProps {
  countries: CountryScore[]
  onSelectCountry: (country: CountryScore | null) => void
  selectedCode: string | null
}

export function GlobeMap({ countries, onSelectCountry, selectedCode }: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [is3D, setIs3D] = useState(true)

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [30, 20],
      zoom: 1.8,
      projection: is3D ? 'globe' : 'mercator',
      attributionControl: false,
      logoPosition: 'bottom-right',
    })

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(10, 10, 15)',
        'high-color': 'rgb(20, 20, 35)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(5, 5, 10)',
        'star-intensity': 0.4,
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [is3D])

  useEffect(() => {
    const cleanup = initMap()
    return cleanup
  }, [initMap])

  // Update markers when countries change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    countries.forEach((c) => {
      if (!c.latitude || !c.longitude) return

      const color = RISK_COLORS[c.riskLevel] || '#6366f1'
      const size = c.riskLevel === 'CRITICAL' ? 14 : c.riskLevel === 'HIGH' ? 12 : 10

      const el = document.createElement('div')
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.borderRadius = '50%'
      el.style.backgroundColor = color
      el.style.border = `2px solid ${color}`
      el.style.boxShadow = `0 0 ${size}px ${color}80`
      el.style.cursor = 'pointer'
      el.style.transition = 'transform 0.2s'

      if (c.countryCode === selectedCode) {
        el.style.transform = 'scale(1.5)'
        el.style.boxShadow = `0 0 20px ${color}`
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.4)'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = c.countryCode === selectedCode ? 'scale(1.5)' : 'scale(1)'
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map)

      el.addEventListener('click', () => {
        onSelectCountry(c)
        map.flyTo({
          center: [c.longitude!, c.latitude!],
          zoom: 4,
          duration: 1500,
        })
      })

      markersRef.current.push(marker)
    })
  }, [countries, selectedCode, onSelectCountry])

  const toggleProjection = () => {
    const map = mapRef.current
    if (!map) return
    const next = !is3D
    setIs3D(next)
    map.setProjection(next ? 'globe' : 'mercator')
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button
          onClick={toggleProjection}
          className="px-2 py-1 bg-surface-overlay/90 border border-border text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          {is3D ? '2D' : '3D'}
        </button>
        <button
          onClick={() => {
            mapRef.current?.flyTo({ center: [30, 20], zoom: 1.8, duration: 1000 })
            onSelectCountry(null)
          }}
          className="px-2 py-1 bg-surface-overlay/90 border border-border text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          RESET
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-surface-overlay/90 border border-border px-3 py-2">
        <div className="text-[9px] font-mono text-text-muted mb-1 uppercase tracking-wider">
          Risk Level
        </div>
        <div className="flex items-center gap-3">
          {Object.entries(RISK_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] font-mono text-text-secondary">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
