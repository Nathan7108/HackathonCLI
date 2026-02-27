import type { DashboardSummary, AnomalyData, CountryScore, AnalysisResponse, ForecastResponse, TrackRecord, Alert } from '@/lib/types'

export const MOCK_COUNTRIES: CountryScore[] = [
  { countryCode: 'UA', country: 'Ukraine', riskScore: 92.4, riskLevel: 'CRITICAL', riskDelta: 3.1, latitude: 48.38, longitude: 31.17, region: 'Europe' },
  { countryCode: 'SY', country: 'Syria', riskScore: 88.7, riskLevel: 'CRITICAL', riskDelta: 1.8, latitude: 34.80, longitude: 38.99, region: 'Middle East' },
  { countryCode: 'YE', country: 'Yemen', riskScore: 85.2, riskLevel: 'CRITICAL', riskDelta: -0.5, latitude: 15.55, longitude: 48.52, region: 'Middle East' },
  { countryCode: 'SD', country: 'Sudan', riskScore: 83.1, riskLevel: 'CRITICAL', riskDelta: 4.2, latitude: 12.86, longitude: 30.22, region: 'Africa' },
  { countryCode: 'MM', country: 'Myanmar', riskScore: 78.6, riskLevel: 'HIGH', riskDelta: 2.3, latitude: 21.91, longitude: 95.96, region: 'Asia' },
  { countryCode: 'IR', country: 'Iran', riskScore: 74.3, riskLevel: 'HIGH', riskDelta: -1.2, latitude: 32.43, longitude: 53.69, region: 'Middle East' },
  { countryCode: 'KP', country: 'North Korea', riskScore: 71.8, riskLevel: 'HIGH', riskDelta: 0.4, latitude: 40.34, longitude: 127.51, region: 'Asia' },
  { countryCode: 'RU', country: 'Russia', riskScore: 69.5, riskLevel: 'HIGH', riskDelta: 1.7, latitude: 61.52, longitude: 105.32, region: 'Europe' },
  { countryCode: 'TW', country: 'Taiwan', riskScore: 58.2, riskLevel: 'ELEVATED', riskDelta: 5.6, latitude: 23.69, longitude: 120.96, region: 'Asia' },
  { countryCode: 'PK', country: 'Pakistan', riskScore: 55.8, riskLevel: 'ELEVATED', riskDelta: -2.1, latitude: 30.38, longitude: 69.35, region: 'Asia' },
  { countryCode: 'ET', country: 'Ethiopia', riskScore: 52.4, riskLevel: 'ELEVATED', riskDelta: 0.8, latitude: 9.15, longitude: 40.49, region: 'Africa' },
  { countryCode: 'VE', country: 'Venezuela', riskScore: 48.9, riskLevel: 'ELEVATED', riskDelta: -0.3, latitude: 6.42, longitude: -66.59, region: 'South America' },
  { countryCode: 'NG', country: 'Nigeria', riskScore: 44.1, riskLevel: 'ELEVATED', riskDelta: 1.1, latitude: 9.08, longitude: 8.68, region: 'Africa' },
  { countryCode: 'RS', country: 'Serbia', riskScore: 32.5, riskLevel: 'MODERATE', riskDelta: -0.7, latitude: 44.02, longitude: 21.01, region: 'Europe' },
  { countryCode: 'BR', country: 'Brazil', riskScore: 24.3, riskLevel: 'MODERATE', riskDelta: 0.2, latitude: -14.24, longitude: -51.93, region: 'South America' },
]

export const MOCK_DASHBOARD: DashboardSummary = {
  globalThreatIndex: 62.8,
  globalThreatIndexDelta: 2.4,
  activeAnomalies: 6,
  highPlusCountries: 8,
  highPlusCountriesDelta: 1,
  escalationAlerts24h: 14,
  modelHealth: 97.2,
  countries: MOCK_COUNTRIES,
  computedAt: new Date().toISOString(),
}

export const MOCK_ANOMALIES: AnomalyData[] = [
  { countryCode: 'UA', country: 'Ukraine', isAnomaly: true, anomalyScore: 0.94, severity: 'HIGH' },
  { countryCode: 'SD', country: 'Sudan', isAnomaly: true, anomalyScore: 0.87, severity: 'HIGH' },
  { countryCode: 'TW', country: 'Taiwan', isAnomaly: true, anomalyScore: 0.76, severity: 'MEDIUM' },
  { countryCode: 'SY', country: 'Syria', isAnomaly: true, anomalyScore: 0.72, severity: 'HIGH' },
  { countryCode: 'MM', country: 'Myanmar', isAnomaly: true, anomalyScore: 0.68, severity: 'MEDIUM' },
  { countryCode: 'IR', country: 'Iran', isAnomaly: true, anomalyScore: 0.61, severity: 'MEDIUM' },
  { countryCode: 'BR', country: 'Brazil', isAnomaly: false, anomalyScore: 0.12, severity: 'LOW' },
  { countryCode: 'RS', country: 'Serbia', isAnomaly: false, anomalyScore: 0.08, severity: 'LOW' },
]

export const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: 'SCORE_SPIKE', countryCode: 'UA', country: 'Ukraine', severity: 'CRITICAL', message: 'Ukraine risk spike +3.1 to 92.4 — renewed eastern offensive', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), riskScore: 92.4, riskDelta: 3.1 },
  { id: 'a2', type: 'ANOMALY', countryCode: 'TW', country: 'Taiwan', severity: 'HIGH', message: 'Taiwan anomaly detected — military exercise escalation', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), riskScore: 58.2, riskDelta: 5.6 },
  { id: 'a3', type: 'TIER_CHANGE', countryCode: 'SD', country: 'Sudan', severity: 'CRITICAL', message: 'Sudan elevated to CRITICAL — Khartoum offensive resumed', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), riskScore: 83.1, riskDelta: 4.2 },
  { id: 'a4', type: 'SCORE_SPIKE', countryCode: 'MM', country: 'Myanmar', severity: 'HIGH', message: 'Myanmar risk increasing — junta airstrikes in Shan State', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), riskScore: 78.6, riskDelta: 2.3 },
  { id: 'a5', type: 'FORECAST_SHIFT', countryCode: 'RU', country: 'Russia', severity: 'HIGH', message: 'Russia 30d forecast escalating — mobilization signals', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), riskScore: 69.5, riskDelta: 1.7 },
  { id: 'a6', type: 'ANOMALY', countryCode: 'IR', country: 'Iran', severity: 'MEDIUM', message: 'Iran anomaly — unusual GDELT tone shift detected', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), riskScore: 74.3 },
  { id: 'a7', type: 'TIER_CHANGE', countryCode: 'NG', country: 'Nigeria', severity: 'MEDIUM', message: 'Nigeria moved to ELEVATED — Boko Haram resurgence', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), riskScore: 44.1, riskDelta: 1.1 },
]

export function mockAnalysis(countryCode: string): AnalysisResponse {
  const country = MOCK_COUNTRIES.find(c => c.countryCode === countryCode) || MOCK_COUNTRIES[0]
  return {
    riskScore: country.riskScore,
    riskLevel: country.riskLevel,
    summary: `${country.country} presents a ${country.riskLevel.toLowerCase()}-level geopolitical risk environment. Multiple indicators from GDELT event monitoring, ACLED conflict tracking, and FinBERT sentiment analysis converge on sustained instability. Key drivers include escalating military activity, deteriorating economic indicators, and increasingly negative media sentiment. Pacific Ridge Industries maintains $${(Math.random() * 800 + 200).toFixed(0)}M in exposed assets across ${Math.floor(Math.random() * 5 + 2)} facilities in the region.`,
    keyFactors: [
      'Sustained military escalation along contested borders with 40% increase in event frequency',
      'GDP growth trending negative at -2.3% with inflation exceeding 15% annually',
      'FinBERT media sentiment index at 0.78 negative — highest in 90-day window',
      'Civilian displacement accelerating — ACLED reports 34% increase in civilian targeting events',
      'Regional alliance deterioration reducing diplomatic de-escalation pathways',
    ],
    industries: ['Logistics & Shipping', 'Energy Infrastructure', 'Financial Services', 'Manufacturing'],
    watchList: [
      'Monitor UNSC emergency session scheduled for next week',
      'Track naval movements in contested maritime zones',
      'Watch for sanctions escalation from EU/US coalition',
      'Assess supply chain rerouting costs for Pacific Ridge facilities',
    ],
    causalChain: [
      { step: 1, event: 'Border military buildup detected via satellite and GDELT event surge', probability: 92 },
      { step: 2, event: 'Diplomatic channels fail — ambassador recalled, negotiations suspended', probability: 78 },
      { step: 3, event: 'Limited military incursion into contested territory', probability: 64 },
      { step: 4, event: 'International sanctions imposed — trade routes disrupted', probability: 58 },
      { step: 5, event: 'Regional allies drawn in — conflict zone expands', probability: 41 },
      { step: 6, event: 'Humanitarian corridor collapse — civilian crisis escalates', probability: 35 },
      { step: 7, event: 'Full economic decoupling — Pacific Ridge forced to divest regional assets', probability: 22 },
    ],
    headlines: [
      { title: `${country.country} military forces advance on contested border region`, source: 'Reuters', sentiment: 'negative' },
      { title: `UN Security Council calls emergency session on ${country.country} crisis`, source: 'AP News', sentiment: 'negative' },
      { title: `Global shipping routes disrupted as ${country.country} tensions escalate`, source: 'Bloomberg', sentiment: 'negative' },
      { title: `${country.country} central bank intervenes as currency drops 8%`, source: 'Financial Times', sentiment: 'negative' },
      { title: `Diplomatic efforts resume between regional powers over ${country.country}`, source: 'Al Jazeera', sentiment: 'neutral' },
    ],
    mlMetadata: {
      risk_score: country.riskScore,
      confidence: 0.87 + Math.random() * 0.1,
      risk_level: country.riskLevel,
      anomaly_flag: country.riskScore > 70,
      anomaly_score: country.riskScore > 70 ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2,
      sentiment_negative: 0.55 + Math.random() * 0.35,
      sentiment_positive: 0.05 + Math.random() * 0.15,
      topDrivers: [
        { feature: 'acled_fatalities_30d', importance: 0.18 + Math.random() * 0.05 },
        { feature: 'goldstein_mean', importance: 0.15 + Math.random() * 0.04 },
        { feature: 'finbert_negative_score', importance: 0.13 + Math.random() * 0.04 },
        { feature: 'conflict_composite', importance: 0.11 + Math.random() * 0.03 },
        { feature: 'event_acceleration', importance: 0.09 + Math.random() * 0.03 },
        { feature: 'gdp_growth_trend', importance: 0.07 + Math.random() * 0.02 },
      ],
    },
  }
}

export function mockForecast(countryCode: string): ForecastResponse {
  const country = MOCK_COUNTRIES.find(c => c.countryCode === countryCode) || MOCK_COUNTRIES[0]
  const delta30 = (Math.random() - 0.3) * 8
  const delta60 = delta30 + (Math.random() - 0.4) * 6
  const delta90 = delta60 + (Math.random() - 0.45) * 5
  const trend = delta90 > 3 ? 'ESCALATING' as const : delta90 < -3 ? 'DEESCALATING' as const : 'STABLE' as const
  return {
    countryCode: country.countryCode,
    country: country.country,
    currentScore: country.riskScore,
    forecasts: {
      days_30: Math.max(0, Math.min(100, country.riskScore + delta30)),
      days_60: Math.max(0, Math.min(100, country.riskScore + delta60)),
      days_90: Math.max(0, Math.min(100, country.riskScore + delta90)),
    },
    trend,
    confidence: 0.82 + Math.random() * 0.12,
  }
}

export const MOCK_TRACK_RECORD: TrackRecord = {
  predictions: MOCK_COUNTRIES.map((c, i) => ({
    id: i + 1,
    country_code: c.countryCode,
    predicted_level: c.riskLevel,
    predicted_score: c.riskScore,
    confidence: 0.85 + Math.random() * 0.12,
    timestamp: new Date(Date.now() - i * 3600000 * 2).toISOString(),
  })),
  accuracy: {
    total_predictions: 1247,
    accuracy_90d: 0.943,
    avg_confidence: 0.891,
  },
}
