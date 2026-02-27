import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import { RISK_COLORS } from '@/lib/constants'

interface ForecastMiniChartProps {
  currentScore: number
  forecasts: {
    days_30: number
    days_60: number
    days_90: number
  }
}

export function ForecastMiniChart({ currentScore, forecasts }: ForecastMiniChartProps) {
  const data = [
    { name: 'Now', score: currentScore },
    { name: '30d', score: forecasts.days_30 },
    { name: '60d', score: forecasts.days_60 },
    { name: '90d', score: forecasts.days_90 },
  ]

  const maxScore = Math.max(...data.map((d) => d.score))
  const color =
    maxScore >= 81
      ? RISK_COLORS.CRITICAL
      : maxScore >= 61
        ? RISK_COLORS.HIGH
        : maxScore >= 41
          ? RISK_COLORS.ELEVATED
          : maxScore >= 21
            ? RISK_COLORS.MODERATE
            : RISK_COLORS.LOW

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#5c6170' }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#5c6170' }}
          />
          <ReferenceLine y={60} stroke="#2a2d38" strokeDasharray="3 3" />
          <ReferenceLine y={80} stroke="#2a2d38" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill="url(#forecastGradient)"
            dot={{ r: 3, fill: color, stroke: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
