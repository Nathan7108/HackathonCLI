import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAnalysis, useForecast } from '@/lib/hooks/use-analysis'
import { countryFlag, cn, riskColorClass } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { ScoreDisplay } from '@/components/ui/score-display'
import { ForecastMiniChart } from '@/components/forecast/forecast-mini-chart'
import { WATCHED_COUNTRIES } from '@/lib/constants'

export function CountryDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const countryInfo = WATCHED_COUNTRIES.find((c) => c.code === code)
  const countryName = countryInfo?.name || code || ''

  const { data: analysis, isLoading } = useAnalysis(countryName, code || '')
  const { data: forecast } = useForecast(countryName, code || '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="text-[11px] font-mono text-text-muted">
            GENERATING INTELLIGENCE BRIEF FOR {code}...
          </span>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[11px] font-mono text-text-muted">No data for {code}</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-raised sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-2xl">{countryFlag(code || '')}</span>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{countryName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <ScoreDisplay score={analysis.riskScore} level={analysis.riskLevel} size="sm" />
            <RiskBadge level={analysis.riskLevel} />
            {forecast && (
              <div className="flex items-center gap-1 ml-2">
                {forecast.trend === 'ESCALATING' && <TrendingUp className="w-3 h-3 text-negative" />}
                {forecast.trend === 'DEESCALATING' && <TrendingDown className="w-3 h-3 text-positive" />}
                {forecast.trend === 'STABLE' && <Minus className="w-3 h-3 text-text-muted" />}
                <span className={cn(
                  'text-[10px] font-mono',
                  forecast.trend === 'ESCALATING' ? 'text-negative' :
                  forecast.trend === 'DEESCALATING' ? 'text-positive' : 'text-text-muted'
                )}>
                  {forecast.trend}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-4 p-6">
        {/* Intel Summary */}
        <div className="col-span-2 bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            Intelligence Summary
          </div>
          <p className="text-[13px] leading-relaxed text-text-secondary">{analysis.summary}</p>
        </div>

        {/* ML Metadata */}
        <div className="bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            ML Model Output
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] font-mono text-text-muted">Risk Score</div>
              <ScoreDisplay score={analysis.mlMetadata.risk_score} level={analysis.mlMetadata.risk_level} size="lg" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-text-muted">Confidence</div>
              <span className="text-xl font-mono font-bold text-accent tabular-nums">
                {(analysis.mlMetadata.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <div className="text-[9px] font-mono text-text-muted">Anomaly</div>
              <span className={cn(
                'text-sm font-mono font-bold',
                analysis.mlMetadata.anomaly_flag ? 'text-anomaly' : 'text-positive'
              )}>
                {analysis.mlMetadata.anomaly_flag ? 'DETECTED' : 'NORMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Key Factors */}
        <div className="bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            Key Risk Factors
          </div>
          <ul className="space-y-2">
            {analysis.keyFactors?.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-accent font-bold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-text-secondary">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Drivers */}
        <div className="bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            Top ML Risk Drivers
          </div>
          <div className="space-y-2">
            {analysis.mlMetadata.topDrivers?.slice(0, 6).map((d, i) => (
              <div key={i}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] font-mono text-text-secondary">{d.feature}</span>
                  <span className="text-[10px] font-mono text-text-muted tabular-nums">
                    {(d.importance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-sm"
                    style={{ width: `${d.importance * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast */}
        {forecast && (
          <div className="bg-surface-raised border border-border p-4">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
              Risk Forecast
            </div>
            <ForecastMiniChart
              currentScore={forecast.currentScore}
              forecasts={forecast.forecasts}
            />
          </div>
        )}

        {/* Causal Chain */}
        {analysis.causalChain && analysis.causalChain.length > 0 && (
          <div className="col-span-3 bg-surface-raised border border-border p-4">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
              Escalation Pathway
            </div>
            <div className="flex items-start gap-4 overflow-x-auto pb-2">
              {analysis.causalChain.map((step, i) => (
                <div key={i} className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-sm font-mono font-bold text-accent">
                      {step.step}
                    </div>
                    <p className="text-[11px] text-text-secondary text-center mt-2 max-w-[140px]">
                      {step.event}
                    </p>
                    {step.probability !== undefined && (
                      <span className="text-[9px] font-mono text-text-muted mt-1">
                        P={step.probability}%
                      </span>
                    )}
                  </div>
                  {i < analysis.causalChain.length - 1 && (
                    <div className="w-8 h-px bg-border-bright mt-[-20px]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Headlines */}
        {analysis.headlines && analysis.headlines.length > 0 && (
          <div className="col-span-3 bg-surface-raised border border-border p-4">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
              Recent Headlines
            </div>
            <div className="grid grid-cols-2 gap-3">
              {analysis.headlines.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                    h.sentiment === 'negative' ? 'bg-negative' :
                    h.sentiment === 'positive' ? 'bg-positive' : 'bg-text-muted'
                  )} />
                  <div>
                    <p className="text-[11px] text-text-secondary leading-snug">{h.title}</p>
                    <span className="text-[9px] font-mono text-text-muted">{h.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
