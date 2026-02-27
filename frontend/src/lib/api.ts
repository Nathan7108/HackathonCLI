import type {
  DashboardSummary,
  CountryScore,
  AnomalyData,
  AnalysisResponse,
  ForecastResponse,
  TrackRecord,
  HealthResponse,
} from './types'
import {
  MOCK_DASHBOARD,
  MOCK_COUNTRIES,
  MOCK_ANOMALIES,
  MOCK_TRACK_RECORD,
  mockAnalysis,
  mockForecast,
} from '@/data/mock'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

async function fetchWithFallback<T>(path: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    return await fetchJSON<T>(path, options)
  } catch {
    return fallback
  }
}

// ── Dashboard endpoints (pre-computed, fast) ──

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchWithFallback('/api/dashboard/summary', MOCK_DASHBOARD)
}

export async function getCountries(): Promise<CountryScore[]> {
  return fetchWithFallback('/api/countries', MOCK_COUNTRIES)
}

export async function getAnomalies(): Promise<AnomalyData[]> {
  return fetchWithFallback('/api/anomalies', MOCK_ANOMALIES)
}

// ── Analysis endpoints (on-demand) ──

export async function analyzeCountry(
  country: string,
  countryCode: string
): Promise<AnalysisResponse> {
  return fetchWithFallback(
    '/api/analyze',
    mockAnalysis(countryCode),
    { method: 'POST', body: JSON.stringify({ country, countryCode }) }
  )
}

export async function getRiskScore(
  country: string,
  countryCode: string
) {
  return fetchJSON('/api/risk-score', {
    method: 'POST',
    body: JSON.stringify({ country, countryCode }),
  })
}

export async function getForecast(
  country: string,
  countryCode: string
): Promise<ForecastResponse> {
  return fetchWithFallback(
    '/api/forecast',
    mockForecast(countryCode),
    { method: 'POST', body: JSON.stringify({ country, countryCode }) }
  )
}

// ── Tracking ──

export async function getTrackRecord(): Promise<TrackRecord> {
  return fetchWithFallback('/api/track-record', MOCK_TRACK_RECORD)
}

// ── Health ──

export async function getHealth(): Promise<HealthResponse> {
  return fetchWithFallback('/health', {
    status: 'mock',
    models: { risk_scorer: true, anomaly_detector: true, forecaster: true, sentiment: true },
    version: '2.0.0-mock',
  })
}
