import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ArrowUpDown } from 'lucide-react'
import { useCountries } from '@/lib/hooks/use-dashboard'
import { countryFlag, cn, riskColorClass } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Sparkline } from '@/components/ui/sparkline'
import { RISK_COLORS } from '@/lib/constants'
import { Loader2 } from 'lucide-react'

type SortField = 'riskScore' | 'country'
type SortDir = 'asc' | 'desc'

export function CountriesPage() {
  const { data: countries, isLoading } = useCountries()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('riskScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  if (isLoading || !countries) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  const filtered = countries
    .filter(
      (c) =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.countryCode.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortField === 'riskScore') return (a.riskScore - b.riskScore) * mul
      return a.country.localeCompare(b.country) * mul
    })

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir(field === 'riskScore' ? 'desc' : 'asc')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-raised">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-secondary">
            Country Rankings
          </span>
          <span className="text-[10px] font-mono text-text-muted">
            {filtered.length} countries
          </span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-surface border border-border rounded-sm w-48">
          <Search className="w-3 h-3 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="bg-transparent text-[11px] font-mono text-text-primary placeholder:text-text-muted outline-none w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] font-mono">
          <thead className="sticky top-0 bg-surface-raised z-10">
            <tr className="text-text-muted text-[9px] uppercase tracking-wider border-b border-border">
              <th className="text-left px-4 py-2 font-medium w-8">#</th>
              <th
                className="text-left px-3 py-2 font-medium cursor-pointer hover:text-text-secondary"
                onClick={() => toggleSort('country')}
              >
                <div className="flex items-center gap-1">
                  Country <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th
                className="text-right px-3 py-2 font-medium cursor-pointer hover:text-text-secondary"
                onClick={() => toggleSort('riskScore')}
              >
                <div className="flex items-center justify-end gap-1">
                  Risk Score <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="text-center px-3 py-2 font-medium">Level</th>
              <th className="text-right px-4 py-2 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <motion.tr
                key={c.countryCode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                onClick={() => navigate(`/country/${c.countryCode}`)}
                className="border-b border-border/30 cursor-pointer hover:bg-surface-overlay transition-colors"
              >
                <td className="px-4 py-2 text-text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{countryFlag(c.countryCode)}</span>
                    <span className="text-text-primary">{c.country}</span>
                    <span className="text-text-muted text-[9px]">{c.countryCode}</span>
                  </div>
                </td>
                <td className="text-right px-3 py-2">
                  <span className={cn('font-bold tabular-nums', riskColorClass(c.riskLevel))}>
                    {c.riskScore.toFixed(1)}
                  </span>
                </td>
                <td className="text-center px-3 py-2">
                  <RiskBadge level={c.riskLevel} />
                </td>
                <td className="text-right px-4 py-2">
                  <Sparkline
                    data={generateTrend(c.riskScore)}
                    color={RISK_COLORS[c.riskLevel]}
                    width={48}
                    height={16}
                    fill
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function generateTrend(score: number): number[] {
  const d: number[] = []
  let v = score + (Math.random() - 0.5) * 10
  for (let i = 0; i < 8; i++) {
    v += (Math.random() - 0.5) * 4
    d.push(Math.max(0, Math.min(100, v)))
  }
  d.push(score)
  return d
}
