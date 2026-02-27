import { cn, riskColor } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface ScoreDisplayProps {
  score: number
  level?: RiskLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreDisplay({ score, level, size = 'md', className }: ScoreDisplayProps) {
  const color = level ? riskColor(level) : riskColor(scoreToLevel(score))

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <span
      className={cn('font-mono font-bold tabular-nums', sizeClasses[size], className)}
      style={{ color }}
    >
      {score.toFixed(1)}
    </span>
  )
}

function scoreToLevel(score: number): string {
  if (score >= 81) return 'CRITICAL'
  if (score >= 61) return 'HIGH'
  if (score >= 41) return 'ELEVATED'
  if (score >= 21) return 'MODERATE'
  return 'LOW'
}
