import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn, countryFlag, riskColorClass, formatDelta } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Sparkline } from '@/components/ui/sparkline'
import { SectionHeader } from '@/components/ui/section-header'
import { RISK_COLORS } from '@/lib/constants'
import type { CountryScore } from '@/lib/types'

interface WatchlistTableProps {
  countries: CountryScore[]
}

export function WatchlistTable({ countries }: WatchlistTableProps) {
  const navigate = useNavigate()
  const sorted = [...countries].sort((a, b) => b.riskScore - a.riskScore)

  return (
    <div className="bg-surface-raised border border-border flex flex-col h-full">
      <SectionHeader
        title="Watchlist"
        subtitle={`${sorted.length} monitored`}
        action={
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-negative animate-live-pulse" />
            <span className="text-[9px] font-mono text-text-muted">LIVE</span>
          </div>
        }
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="text-text-muted text-[9px] uppercase tracking-wider">
              <th className="text-left px-3 py-1.5 font-medium">Country</th>
              <th className="text-right px-2 py-1.5 font-medium">Score</th>
              <th className="text-center px-2 py-1.5 font-medium">Level</th>
              <th className="text-right px-2 py-1.5 font-medium">Delta</th>
              <th className="text-right px-3 py-1.5 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <motion.tr
                key={c.countryCode}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/country/${c.countryCode}`)}
                className="border-t border-border/50 cursor-pointer hover:bg-surface-overlay transition-colors group"
              >
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{countryFlag(c.countryCode)}</span>
                    <span className="text-text-primary">{c.country}</span>
                    <span className="text-text-muted text-[9px]">{c.countryCode}</span>
                  </div>
                </td>
                <td className="text-right px-2 py-1.5">
                  <span className={cn('font-bold tabular-nums', riskColorClass(c.riskLevel))}>
                    {c.riskScore.toFixed(1)}
                  </span>
                </td>
                <td className="text-center px-2 py-1.5">
                  <RiskBadge level={c.riskLevel} />
                </td>
                <td className="text-right px-2 py-1.5">
                  <span
                    className={cn(
                      'tabular-nums text-[10px]',
                      (c.riskDelta ?? 0) > 0 ? 'text-negative' : (c.riskDelta ?? 0) < 0 ? 'text-positive' : 'text-text-muted'
                    )}
                  >
                    {formatDelta(c.riskDelta ?? 0)}
                  </span>
                </td>
                <td className="text-right px-3 py-1.5">
                  <div className="flex items-center justify-end gap-1">
                    <Sparkline
                      data={generateCountryTrend(c.riskScore)}
                      color={RISK_COLORS[c.riskLevel] || '#6366f1'}
                      width={40}
                      height={14}
                    />
                    <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function generateCountryTrend(score: number): number[] {
  const data: number[] = []
  let val = score + (Math.random() - 0.5) * 10
  for (let i = 0; i < 8; i++) {
    val += (Math.random() - 0.5) * 5
    data.push(Math.max(0, Math.min(100, val)))
  }
  data.push(score)
  return data
}
