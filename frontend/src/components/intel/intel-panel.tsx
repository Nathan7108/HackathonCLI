import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { countryFlag, cn, riskColorClass } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { ScoreDisplay } from '@/components/ui/score-display'
import { SectionHeader } from '@/components/ui/section-header'
import { useAnalysis, useForecast } from '@/lib/hooks/use-analysis'
import { ForecastMiniChart } from '@/components/forecast/forecast-mini-chart'
import type { CountryScore } from '@/lib/types'

interface IntelPanelProps {
  country: CountryScore | null
  onClose: () => void
}

export function IntelPanel({ country, onClose }: IntelPanelProps) {
  const { data: analysis, isLoading: analysisLoading } = useAnalysis(
    country?.country || '',
    country?.countryCode || ''
  )
  const { data: forecast } = useForecast(
    country?.country || '',
    country?.countryCode || ''
  )

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-[420px] h-full bg-surface-raised border-l border-border flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-overlay">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{countryFlag(country.countryCode)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{country.country}</span>
                  <span className="text-[10px] font-mono text-text-muted">{country.countryCode}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <ScoreDisplay score={country.riskScore} level={country.riskLevel} size="sm" />
                  <RiskBadge level={country.riskLevel} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-[11px] font-mono text-text-muted">
                  GENERATING INTELLIGENCE BRIEF...
                </span>
              </div>
            ) : analysis ? (
              <div className="space-y-0">
                {/* Summary */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                    Intelligence Summary
                  </div>
                  <p className="text-[12px] leading-relaxed text-text-secondary">
                    {analysis.summary}
                  </p>
                </div>

                {/* Key Factors */}
                {analysis.keyFactors && analysis.keyFactors.length > 0 && (
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                      Key Risk Factors
                    </div>
                    <ul className="space-y-1.5">
                      {analysis.keyFactors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-accent mt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[11px] text-text-secondary">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Drivers */}
                {analysis.mlMetadata?.topDrivers && (
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                      ML Risk Drivers
                    </div>
                    <div className="space-y-1.5">
                      {analysis.mlMetadata.topDrivers.slice(0, 5).map((driver, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-text-secondary">
                              {driver.feature}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted tabular-nums">
                              {(driver.importance * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1 bg-border rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-sm"
                              style={{ width: `${driver.importance * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Causal Chain */}
                {analysis.causalChain && analysis.causalChain.length > 0 && (
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                      Escalation Pathway
                    </div>
                    <div className="space-y-2">
                      {analysis.causalChain.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="flex flex-col items-center">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-[9px] font-mono font-bold text-accent">
                              {step.step}
                            </span>
                            {i < analysis.causalChain.length - 1 && (
                              <div className="w-px h-4 bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <span className="text-[11px] text-text-secondary">{step.event}</span>
                            {step.probability !== undefined && (
                              <span className="ml-2 text-[9px] font-mono text-text-muted">
                                P={step.probability.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Forecast mini-chart */}
                {forecast && (
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest">
                        Risk Forecast
                      </div>
                      <div className="flex items-center gap-1">
                        {forecast.trend === 'ESCALATING' ? (
                          <TrendingUp className="w-3 h-3 text-negative" />
                        ) : forecast.trend === 'DEESCALATING' ? (
                          <TrendingDown className="w-3 h-3 text-positive" />
                        ) : (
                          <Minus className="w-3 h-3 text-text-muted" />
                        )}
                        <span className={cn(
                          'text-[9px] font-mono',
                          forecast.trend === 'ESCALATING' ? 'text-negative' :
                          forecast.trend === 'DEESCALATING' ? 'text-positive' : 'text-text-muted'
                        )}>
                          {forecast.trend}
                        </span>
                      </div>
                    </div>
                    <ForecastMiniChart
                      currentScore={forecast.currentScore}
                      forecasts={forecast.forecasts}
                    />
                  </div>
                )}

                {/* Headlines */}
                {analysis.headlines && analysis.headlines.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                      Recent Headlines
                    </div>
                    <div className="space-y-2">
                      {analysis.headlines.slice(0, 5).map((headline, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                              headline.sentiment === 'negative' ? 'bg-negative' :
                              headline.sentiment === 'positive' ? 'bg-positive' : 'bg-text-muted'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-text-secondary leading-snug">
                              {headline.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-text-muted">
                                {headline.source}
                              </span>
                              {headline.url && (
                                <a
                                  href={headline.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-text-muted hover:text-accent"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ML Metadata footer */}
                <div className="px-4 py-2 bg-surface border-t border-border">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[8px] font-mono text-text-muted uppercase">Confidence</div>
                      <div className="text-[11px] font-mono text-text-primary tabular-nums">
                        {(analysis.mlMetadata.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-text-muted uppercase">Anomaly</div>
                      <div className={cn(
                        'text-[11px] font-mono tabular-nums',
                        analysis.mlMetadata.anomaly_flag ? 'text-anomaly' : 'text-text-primary'
                      )}>
                        {analysis.mlMetadata.anomaly_flag ? 'DETECTED' : 'NORMAL'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-text-muted uppercase">Sentiment</div>
                      <div className="text-[11px] font-mono text-text-primary tabular-nums">
                        {(analysis.mlMetadata.sentiment_negative * 100).toFixed(0)}% NEG
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-[11px] font-mono text-text-muted">
                No analysis data available
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
