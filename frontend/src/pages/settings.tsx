import { useHealth } from '@/lib/hooks/use-dashboard'
import { StatusDot } from '@/components/ui/status-dot'

export function SettingsPage() {
  const { data: health } = useHealth()

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-text-primary mb-6">System Configuration</h2>

      <div className="space-y-4">
        {/* API Status */}
        <div className="bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            Backend Status
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={health?.status === 'ok' ? 'online' : 'error'} pulse />
            <span className="text-[12px] font-mono text-text-primary">
              {health?.status === 'ok' ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-[10px] font-mono text-text-muted ml-auto">
              v{health?.version || '—'}
            </span>
          </div>
        </div>

        {/* Model Status */}
        <div className="bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            ML Models
          </div>
          <div className="space-y-2">
            {health?.models &&
              Object.entries(health.models).map(([name, loaded]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-secondary">{name}</span>
                  <div className="flex items-center gap-2">
                    <StatusDot status={loaded ? 'online' : 'error'} />
                    <span className="text-[10px] font-mono text-text-muted">
                      {loaded ? 'LOADED' : 'NOT LOADED'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Environment */}
        <div className="bg-surface-raised border border-border p-4">
          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">
            Environment
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[11px] font-mono text-text-secondary">API URL</span>
              <span className="text-[11px] font-mono text-text-muted">
                {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] font-mono text-text-secondary">Mapbox</span>
              <span className="text-[11px] font-mono text-text-muted">
                {import.meta.env.VITE_MAPBOX_TOKEN ? 'Configured' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
