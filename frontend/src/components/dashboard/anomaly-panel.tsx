import { motion } from 'framer-motion'
import { AlertOctagon } from 'lucide-react'
import { countryFlag } from '@/lib/utils'
import { SectionHeader } from '@/components/ui/section-header'
import type { AnomalyData } from '@/lib/types'

interface AnomalyPanelProps {
  anomalies: AnomalyData[]
}

export function AnomalyPanel({ anomalies }: AnomalyPanelProps) {
  const active = anomalies.filter((a) => a.isAnomaly).sort((a, b) => b.anomalyScore - a.anomalyScore)

  return (
    <div className="bg-surface-raised border border-border h-full flex flex-col">
      <SectionHeader
        title="Anomaly Detection"
        subtitle={`${active.length} active`}
        action={
          active.length > 0 ? (
            <span className="flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-anomaly" />
              <span className="text-[9px] font-mono text-anomaly">ALERT</span>
            </span>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {active.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[11px] font-mono text-text-muted">
            No anomalies detected
          </div>
        ) : (
          active.map((a, i) => (
            <motion.div
              key={a.countryCode}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-2 py-1.5 rounded-sm bg-anomaly/5 border border-anomaly/20"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{countryFlag(a.countryCode)}</span>
                <div>
                  <span className="text-[11px] font-mono text-text-primary">
                    {a.country || a.countryCode}
                  </span>
                  <span className="ml-2 text-[9px] font-mono text-anomaly uppercase">
                    {a.severity}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-anomaly tabular-nums">
                {(a.anomalyScore * 100).toFixed(0)}%
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
