import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useDashboard, useAnomalies } from '@/lib/hooks/use-dashboard'
import { KpiStrip } from '@/components/dashboard/kpi-strip'
import { WatchlistTable } from '@/components/dashboard/watchlist-table'
import { RiskDistribution } from '@/components/dashboard/risk-distribution'
import { AnomalyPanel } from '@/components/dashboard/anomaly-panel'
import { AlertFeed } from '@/components/dashboard/alert-feed'
import { MOCK_ALERTS } from '@/data/mock'

export function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard()
  const { data: anomalies } = useAnomalies()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="text-[11px] font-mono text-text-muted">
            LOADING INTELLIGENCE DATA...
          </span>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-mono text-negative">
            BACKEND OFFLINE — Ensure FastAPI is running on :8000
          </span>
          <span className="text-[10px] font-mono text-text-muted">
            {error?.message || 'No data available'}
          </span>
        </div>
      </div>
    )
  }

  const alerts = MOCK_ALERTS

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-raised border-b border-border">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
            Pacific Ridge Industries — Global Operations Dashboard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-text-muted">
            Last update: {new Date(dashboard.computedAt).toLocaleTimeString()}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-positive animate-live-pulse" />
            <span className="text-[9px] font-mono text-positive">LIVE FEED</span>
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <KpiStrip data={dashboard} />

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 grid-rows-2 gap-px bg-border min-h-0">
        {/* Watchlist — spans 7 cols, 2 rows */}
        <div className="col-span-7 row-span-2">
          <WatchlistTable countries={dashboard.countries} />
        </div>

        {/* Right column */}
        <div className="col-span-5 row-span-1">
          <div className="grid grid-cols-2 gap-px bg-border h-full">
            <RiskDistribution countries={dashboard.countries} />
            <AnomalyPanel anomalies={anomalies || []} />
          </div>
        </div>

        <div className="col-span-5 row-span-1">
          <AlertFeed alerts={alerts} />
        </div>
      </div>
    </motion.div>
  )
}
