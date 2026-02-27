import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-3 py-2 border-b border-border', className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
          {title}
        </h3>
        {subtitle && (
          <span className="text-[10px] font-mono text-text-muted">{subtitle}</span>
        )}
      </div>
      {action}
    </div>
  )
}
