import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Shield, Zap } from 'lucide-react'
import { cn, countryFlag, timeAgo } from '@/lib/utils'
import { SectionHeader } from '@/components/ui/section-header'
import type { Alert } from '@/lib/types'

const iconMap = {
  TIER_CHANGE: TrendingUp,
  SCORE_SPIKE: Zap,
  ANOMALY: Shield,
  FORECAST_SHIFT: AlertTriangle,
}

const severityColor = {
  LOW: 'text-text-muted border-border',
  MEDIUM: 'text-warning border-warning/30',
  HIGH: 'text-risk-high border-risk-high/30',
  CRITICAL: 'text-risk-critical border-risk-critical/30',
}

interface AlertFeedProps {
  alerts: Alert[]
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="bg-surface-raised border border-border h-full flex flex-col">
      <SectionHeader
        title="Alert Feed"
        subtitle={`${alerts.length} alerts`}
        action={
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-live-pulse" />
            <span className="text-[9px] font-mono text-text-muted">LIVE</span>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {alerts.map((alert, i) => {
          const Icon = iconMap[alert.type] || AlertTriangle
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'flex items-start gap-2 px-2 py-1.5 border-l-2 bg-surface/50',
                severityColor[alert.severity]
              )}
            >
              <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{countryFlag(alert.countryCode)}</span>
                  <span className="text-[11px] font-mono text-text-primary truncate">
                    {alert.message}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-text-muted">
                  {timeAgo(alert.timestamp)}
                </span>
              </div>
              {alert.riskScore !== undefined && (
                <span className="text-[10px] font-mono font-bold tabular-nums text-text-secondary">
                  {alert.riskScore.toFixed(1)}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
