export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export const RISK_LEVELS = ['CRITICAL', 'HIGH', 'ELEVATED', 'MODERATE', 'LOW'] as const

export const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  ELEVATED: '#eab308',
  MODERATE: '#3b82f6',
  LOW: '#22c55e',
}

export const WATCHED_COUNTRIES = [
  { code: 'UA', name: 'Ukraine', lat: 48.38, lng: 31.17 },
  { code: 'TW', name: 'Taiwan', lat: 23.69, lng: 120.96 },
  { code: 'IR', name: 'Iran', lat: 32.43, lng: 53.69 },
  { code: 'VE', name: 'Venezuela', lat: 6.42, lng: -66.59 },
  { code: 'PK', name: 'Pakistan', lat: 30.38, lng: 69.35 },
  { code: 'ET', name: 'Ethiopia', lat: 9.15, lng: 40.49 },
  { code: 'RS', name: 'Serbia', lat: 44.02, lng: 21.01 },
  { code: 'BR', name: 'Brazil', lat: -14.24, lng: -51.93 },
  { code: 'RU', name: 'Russia', lat: 61.52, lng: 105.32 },
  { code: 'KP', name: 'North Korea', lat: 40.34, lng: 127.51 },
  { code: 'MM', name: 'Myanmar', lat: 21.91, lng: 95.96 },
  { code: 'SD', name: 'Sudan', lat: 12.86, lng: 30.22 },
  { code: 'SY', name: 'Syria', lat: 34.80, lng: 38.99 },
  { code: 'YE', name: 'Yemen', lat: 15.55, lng: 48.52 },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lng: 8.68 },
]
