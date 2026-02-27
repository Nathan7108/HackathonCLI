import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { GlobeMap } from '@/components/globe/globe-map'
import { IntelPanel } from '@/components/intel/intel-panel'
import { countryFlag, riskColorClass } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { ScoreDisplay } from '@/components/ui/score-display'
import { SectionHeader } from '@/components/ui/section-header'
import { Loader2 } from 'lucide-react'
import type { CountryScore } from '@/lib/types'

export function GlobePage() {
  const { data: dashboard, isLoading } = useDashboard()
  const [selectedCountry, setSelectedCountry] = useState<CountryScore | null>(null)

  const handleSelect = useCallback((country: CountryScore | null) => {
    setSelectedCountry(country)
  }, [])

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar: mini watchlist */}
      <div className="w-56 bg-surface-raised border-r border-border flex flex-col flex-shrink-0">
        <SectionHeader title="Monitored" subtitle={`${dashboard.countries.length}`} />
        <div className="flex-1 overflow-auto">
          {[...dashboard.countries]
            .sort((a, b) => b.riskScore - a.riskScore)
            .map((c) => (
              <button
                key={c.countryCode}
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left border-b border-border/50 hover:bg-surface-overlay transition-colors ${
                  selectedCountry?.countryCode === c.countryCode ? 'bg-accent/10 border-l-2 border-l-accent' : ''
                }`}
              >
                <span className="text-sm">{countryFlag(c.countryCode)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono text-text-primary truncate">{c.country}</div>
                  <div className="flex items-center gap-1.5">
                    <ScoreDisplay score={c.riskScore} level={c.riskLevel} size="sm" />
                    <RiskBadge level={c.riskLevel} className="text-[8px] px-1 py-0" />
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Globe */}
      <div className="flex-1 relative">
        <GlobeMap
          countries={dashboard.countries}
          onSelectCountry={handleSelect}
          selectedCode={selectedCountry?.countryCode || null}
        />
      </div>

      {/* Intel panel */}
      <IntelPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} />
    </div>
  )
}
