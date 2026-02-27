import { Search } from 'lucide-react'
import { StatusDot } from '@/components/ui/status-dot'
import { useHealth } from '@/lib/hooks/use-dashboard'

export function Header() {
  const { data: health } = useHealth()
  const isOnline = health?.status === 'ok'

  return (
    <header className="flex items-center justify-between h-10 px-4 bg-shell border-b border-border flex-shrink-0">
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-text-primary">
          Sentinel<span className="text-accent">AI</span>
        </span>
        <span className="text-[10px] font-mono text-text-muted">v2.0</span>
        <div className="flex items-center gap-1.5 ml-4">
          <StatusDot status={isOnline ? 'online' : 'error'} pulse={isOnline} />
          <span className="text-[10px] font-mono text-text-muted">
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Center: search */}
      <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-sm max-w-xs w-64">
        <Search className="w-3.5 h-3.5 text-text-muted" />
        <input
          type="text"
          placeholder="Search countries, alerts..."
          className="bg-transparent text-[11px] font-mono text-text-primary placeholder:text-text-muted outline-none w-full"
        />
        <kbd className="text-[9px] font-mono text-text-muted bg-surface-raised px-1 py-0.5 border border-border rounded-sm">
          /
        </kbd>
      </div>

      {/* Right: meta */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-text-muted">
          {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-text-muted">MODEL</span>
          <span className="text-[10px] font-mono text-positive tabular-nums">
            {health?.models ? `${Object.values(health.models).filter(Boolean).length}/4` : '—'}
          </span>
        </div>
      </div>
    </header>
  )
}
