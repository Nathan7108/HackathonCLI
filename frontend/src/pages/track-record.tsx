import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, Target } from 'lucide-react'
import { useTrackRecord } from '@/lib/hooks/use-analysis'
import { countryFlag, cn, riskColorClass, timeAgo } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'

export function TrackRecordPage() {
  const { data, isLoading } = useTrackRecord()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[11px] font-mono text-text-muted">No track record data available</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border bg-surface-raised">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-secondary">
          Model Track Record
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-raised p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">
              90-Day Accuracy
            </span>
          </div>
          <span className="text-3xl font-mono font-bold text-accent tabular-nums">
            {(data.accuracy.accuracy_90d * 100).toFixed(1)}%
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface-raised p-4"
        >
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">
            Total Predictions
          </div>
          <span className="text-3xl font-mono font-bold text-text-primary tabular-nums">
            {data.accuracy.total_predictions}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-raised p-4"
        >
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">
            Avg Confidence
          </div>
          <span className="text-3xl font-mono font-bold text-positive tabular-nums">
            {(data.accuracy.avg_confidence * 100).toFixed(1)}%
          </span>
        </motion.div>
      </div>

      {/* Prediction log */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] font-mono">
          <thead className="sticky top-0 bg-surface-raised z-10">
            <tr className="text-text-muted text-[9px] uppercase tracking-wider border-b border-border">
              <th className="text-left px-4 py-2 font-medium">Country</th>
              <th className="text-right px-3 py-2 font-medium">Score</th>
              <th className="text-center px-3 py-2 font-medium">Level</th>
              <th className="text-right px-3 py-2 font-medium">Confidence</th>
              <th className="text-right px-4 py-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.predictions.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-border/30"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{countryFlag(p.country_code)}</span>
                    <span className="text-text-primary">{p.country_code}</span>
                  </div>
                </td>
                <td className="text-right px-3 py-2">
                  <span className={cn('font-bold tabular-nums', riskColorClass(p.predicted_level))}>
                    {p.predicted_score.toFixed(1)}
                  </span>
                </td>
                <td className="text-center px-3 py-2">
                  <RiskBadge level={p.predicted_level} />
                </td>
                <td className="text-right px-3 py-2 text-text-secondary tabular-nums">
                  {(p.confidence * 100).toFixed(0)}%
                </td>
                <td className="text-right px-4 py-2 text-text-muted">
                  {timeAgo(p.timestamp)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
