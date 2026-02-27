import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { useForecast } from '@/lib/hooks/use-analysis'
import { countryFlag, cn, riskColorClass } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { ScoreDisplay } from '@/components/ui/score-display'
import { RISK_COLORS } from '@/lib/constants'
import type { CountryScore } from '@/lib/types'

export function ForecastsPage() {
  const { data: dashboard, isLoading } = useDashboard()
  const [selectedCode, setSelectedCode] = useState<string>('')

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  const sorted = [...dashboard.countries].sort((a, b) => b.riskScore - a.riskScore)
  const active = selectedCode || sorted[0]?.countryCode || ''
  const activeCountry = sorted.find((c) => c.countryCode === active)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: country selector */}
      <div className="w-64 bg-surface-raised border-r border-border flex flex-col flex-shrink-0">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-secondary">
            Select Country
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {sorted.map((c) => (
            <button
              key={c.countryCode}
              onClick={() => setSelectedCode(c.countryCode)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left border-b border-border/50 hover:bg-surface-overlay transition-colors',
                active === c.countryCode && 'bg-accent/10 border-l-2 border-l-accent'
              )}
            >
              <span className="text-sm">{countryFlag(c.countryCode)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-text-primary truncate">{c.country}</div>
                <div className="flex items-center gap-1.5">
                  <ScoreDisplay score={c.riskScore} level={c.riskLevel} size="sm" />
                </div>
              </div>
              <RiskBadge level={c.riskLevel} className="text-[8px] px-1 py-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Right: forecast detail */}
      <div className="flex-1 overflow-auto p-6">
        {activeCountry && (
          <ForecastDetail country={activeCountry} />
        )}
      </div>
    </div>
  )
}

function ForecastDetail({ country }: { country: CountryScore }) {
  const { data: forecast, isLoading } = useForecast(country.country, country.countryCode)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
      </div>
    )
  }

  const chartData = forecast
    ? [
        { name: 'Current', score: forecast.currentScore },
        { name: '30 Days', score: forecast.forecasts.days_30 },
        { name: '60 Days', score: forecast.forecasts.days_60 },
        { name: '90 Days', score: forecast.forecasts.days_90 },
      ]
    : [{ name: 'Current', score: country.riskScore }]

  const color = RISK_COLORS[country.riskLevel] || '#6366f1'

  return (
    <motion.div
      key={country.countryCode}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-3xl">{countryFlag(country.countryCode)}</span>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{country.country}</h2>
            <div className="flex items-center gap-2 mt-1">
              <ScoreDisplay score={country.riskScore} level={country.riskLevel} size="md" />
              <RiskBadge level={country.riskLevel} />
              {forecast && (
                <div className="flex items-center gap-1 ml-2">
                  {forecast.trend === 'ESCALATING' ? (
                    <TrendingUp className="w-4 h-4 text-negative" />
                  ) : forecast.trend === 'DEESCALATING' ? (
                    <TrendingDown className="w-4 h-4 text-positive" />
                  ) : (
                    <Minus className="w-4 h-4 text-text-muted" />
                  )}
                  <span className={cn(
                    'text-[11px] font-mono font-semibold',
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
        {forecast && (
          <div className="text-right">
            <div className="text-[9px] font-mono text-text-muted uppercase">Confidence</div>
            <div className="text-lg font-mono font-bold text-accent tabular-nums">
              {(forecast.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-surface-raised border border-border p-4">
        <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-4">
          LSTM Risk Forecast — 30 / 60 / 90 Day Horizon
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2028" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#5c6170' }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#5c6170' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#181b22',
                  border: '1px solid #2a2d38',
                  borderRadius: 2,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                }}
              />
              <ReferenceLine y={60} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'HIGH', fill: '#f97316', fontSize: 9 }} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'CRITICAL', fill: '#ef4444', fontSize: 9 }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2}
                fill="url(#fg)"
                dot={{ r: 4, fill: color, stroke: '#0d0f14', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast values */}
      {forecast && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '30-Day Forecast', value: forecast.forecasts.days_30 },
            { label: '60-Day Forecast', value: forecast.forecasts.days_60 },
            { label: '90-Day Forecast', value: forecast.forecasts.days_90 },
          ].map((item) => (
            <div key={item.label} className="bg-surface-raised border border-border p-4">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                {item.label}
              </div>
              <ScoreDisplay score={item.value} size="lg" />
              <div className="mt-1">
                <span className={cn(
                  'text-[11px] font-mono tabular-nums',
                  item.value > country.riskScore ? 'text-negative' :
                  item.value < country.riskScore ? 'text-positive' : 'text-text-muted'
                )}>
                  {item.value > country.riskScore ? '+' : ''}{(item.value - country.riskScore).toFixed(1)} from current
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
