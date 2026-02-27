import { cn, riskBgClass } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border',
        riskBgClass(level),
        className
      )}
    >
      {level}
    </span>
  )
}
