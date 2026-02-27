import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Globe2,
  BarChart3,
  TrendingUp,
  Shield,
  Settings,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/ui/status-dot'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/globe', icon: Globe2, label: 'Globe' },
  { to: '/countries', icon: BarChart3, label: 'Countries' },
  { to: '/forecasts', icon: TrendingUp, label: 'Forecasts' },
  { to: '/track-record', icon: Shield, label: 'Track Record' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="flex flex-col w-14 h-screen bg-shell border-r border-border flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center justify-center h-12 border-b border-border">
        <Activity className="w-5 h-5 text-accent" />
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 pt-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center w-10 h-10 rounded-sm transition-colors group relative',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised'
              )
            }
            title={label}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <div className="flex items-center gap-1.5" title="System Online">
          <StatusDot status="online" pulse />
        </div>
      </div>
    </aside>
  )
}
