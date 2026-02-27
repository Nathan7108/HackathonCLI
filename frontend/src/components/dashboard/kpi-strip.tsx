import { motion } from 'framer-motion'
import { AlertTriangle, Shield, Activity, Cpu, TrendingUp } from 'lucide-react'
import { cn, formatDelta } from '@/lib/utils'
import { Sparkline } from '@/components/ui/sparkline'
import type { DashboardSummary } from '@/lib/types'

interface KpiStripProps {
  data: DashboardSummary
}

export function KpiStrip({ data }: KpiStripProps) {
  const kpis = [
    {
      label: 'GLOBAL THREAT INDEX',
      value: data.globalThreatIndex.toFixed(1),
      delta: data.globalThreatIndexDelta,
      icon: Activity,
      color: data.globalThreatIndex >= 60 ? 'var(--color-risk-high)' : 'var(--color-risk-elevated)',
      sparkData: generateTrend(data.globalThreatIndex, 12),
    },
    {
      label: 'HIGH+ COUNTRIES',
      value: data.highPlusCountries.toString(),
      delta: data.highPlusCountriesDelta,
      icon: AlertTriangle,
      color: 'var(--color-risk-high)',
      sparkData: generateTrend(data.highPlusCountries, 12),
    },
    {
      label: 'ACTIVE ANOMALIES',
      value: data.activeAnomalies.toString(),
      delta: null,
      icon: Shield,
      color: 'var(--color-anomaly)',
      sparkData: generateTrend(data.activeAnomalies, 12),
    },
    {
      label: 'ESCALATION ALERTS (24H)',
      value: data.escalationAlerts24h.toString(),
      delta: null,
      icon: TrendingUp,
      color: 'var(--color-warning)',
      sparkData: generateTrend(data.escalationAlerts24h, 12),
    },
    {
      label: 'MODEL HEALTH',
      value: `${data.modelHealth.toFixed(0)}%`,
      delta: null,
      icon: Cpu,
      color: data.modelHealth >= 90 ? 'var(--color-positive)' : 'var(--color-warning)',
      sparkData: generateTrend(data.modelHealth, 12),
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-px bg-border">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-surface-raised px-3 py-2.5"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-medium tracking-widest text-text-muted">
              {kpi.label}
            </span>
            <kpi.icon className="w-3 h-3 text-text-muted" />
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-mono font-bold tabular-nums"
                style={{ color: kpi.color }}
              >
                {kpi.value}
              </span>
              {kpi.delta !== null && (
                <span
                  className={cn(
                    'text-[11px] font-mono tabular-nums',
                    kpi.delta > 0 ? 'text-negative' : kpi.delta < 0 ? 'text-positive' : 'text-text-muted'
                  )}
                >
                  {formatDelta(kpi.delta)}
                </span>
              )}
            </div>
            <Sparkline data={kpi.sparkData} color={kpi.color} width={48} height={16} fill />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function generateTrend(current: number, points: number): number[] {
  const data: number[] = []
  let val = current * 0.85
  for (let i = 0; i < points; i++) {
    val += (current - val) * 0.2 + (Math.random() - 0.5) * current * 0.1
    data.push(Math.max(0, val))
  }
  data.push(current)
  return data
}
