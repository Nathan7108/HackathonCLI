// ── Backend API response types matching HackathonML endpoints ──

export interface CountryScore {
  countryCode: string
  country: string
  riskScore: number
  riskLevel: RiskLevel
  riskDelta?: number
  anomalyScore?: number
  isAnomaly?: boolean
  latitude?: number
  longitude?: number
  region?: string
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'

export interface DashboardSummary {
  globalThreatIndex: number
  globalThreatIndexDelta: number
  activeAnomalies: number
  highPlusCountries: number
  highPlusCountriesDelta: number
  escalationAlerts24h: number
  modelHealth: number
  countries: CountryScore[]
  computedAt: string
}

export interface AnomalyData {
  countryCode: string
  country?: string
  isAnomaly: boolean
  anomalyScore: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface AnalysisRequest {
  country: string
  countryCode: string
}

export interface RiskDriver {
  feature: string
  importance: number
  value?: number
  direction?: 'increasing' | 'decreasing' | 'stable'
}

export interface CausalStep {
  step: number
  event: string
  probability?: number
}

export interface AnalysisResponse {
  riskScore: number
  riskLevel: RiskLevel
  summary: string
  keyFactors: string[]
  industries: string[]
  watchList: string[]
  causalChain: CausalStep[]
  headlines?: Headline[]
  mlMetadata: {
    risk_score: number
    confidence: number
    risk_level: RiskLevel
    anomaly_flag: boolean
    anomaly_score: number
    sentiment_negative: number
    sentiment_positive: number
    topDrivers: RiskDriver[]
  }
}

export interface Headline {
  title: string
  source: string
  url?: string
  publishedAt?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface RiskPrediction {
  risk_score: number
  risk_level: RiskLevel
  confidence: number
  top_drivers: RiskDriver[]
  anomaly_flag: boolean
  anomaly_score: number
}

export interface ForecastResponse {
  countryCode: string
  country: string
  currentScore: number
  forecasts: {
    days_30: number
    days_60: number
    days_90: number
  }
  trend: 'ESCALATING' | 'STABLE' | 'DEESCALATING'
  confidence: number
}

export interface TrackRecord {
  predictions: PredictionEntry[]
  accuracy: AccuracyMetrics
}

export interface PredictionEntry {
  id: number
  country_code: string
  predicted_level: RiskLevel
  predicted_score: number
  confidence: number
  timestamp: string
}

export interface AccuracyMetrics {
  total_predictions: number
  accuracy_90d: number
  avg_confidence: number
}

export interface Alert {
  id: string
  type: 'TIER_CHANGE' | 'SCORE_SPIKE' | 'ANOMALY' | 'FORECAST_SHIFT'
  countryCode: string
  country: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  timestamp: string
  riskScore?: number
  riskDelta?: number
}

export interface HealthResponse {
  status: string
  models: {
    risk_scorer: boolean
    anomaly_detector: boolean
    forecaster: boolean
    sentiment: boolean
  }
  version: string
}
