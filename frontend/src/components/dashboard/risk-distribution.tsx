import { SectionHeader } from '@/components/ui/section-header'
import { RISK_COLORS } from '@/lib/constants'
import type { CountryScore } from '@/lib/types'

interface RiskDistributionProps {
  countries: CountryScore[]
}

export function RiskDistribution({ countries }: RiskDistributionProps) {
  const counts = {
    CRITICAL: countries.filter((c) => c.riskLevel === 'CRITICAL').length,
    HIGH: countries.filter((c) => c.riskLevel === 'HIGH').length,
    ELEVATED: countries.filter((c) => c.riskLevel === 'ELEVATED').length,
    MODERATE: countries.filter((c) => c.riskLevel === 'MODERATE').length,
    LOW: countries.filter((c) => c.riskLevel === 'LOW').length,
  }
  const total = countries.length || 1

  return (
    <div className="bg-surface-raised border border-border h-full">
      <SectionHeader title="Risk Distribution" subtitle={`${total} countries`} />
      <div className="p-3 space-y-2">
        {Object.entries(counts).map(([level, count]) => (
          <div key={level} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-secondary">{level}</span>
              <span className="text-[10px] font-mono text-text-muted tabular-nums">
                {count} ({((count / total) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: RISK_COLORS[level],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
