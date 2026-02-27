import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'online' | 'warning' | 'error' | 'neutral'
  pulse?: boolean
  className?: string
}

const statusColors = {
  online: 'bg-positive',
  warning: 'bg-warning',
  error: 'bg-negative',
  neutral: 'bg-text-muted',
}

export function StatusDot({ status, pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            statusColors[status]
          )}
        />
      )}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', statusColors[status])} />
    </span>
  )
}
