// src/components/layout/Shell.jsx
// Responsive shell: sidebar on md+, bottom nav on mobile.
// Clean hierarchy — no chrome clutter.

import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { SUPABASE_ENABLED } from '../../lib/supabase'

const NAV = [
  { to: '/log',        label: 'Log',        icon: PlusIcon },
  { to: '/dashboard',  label: 'Dashboard',  icon: ChartIcon },
  { to: '/growth',     label: 'Growth',     icon: TrendIcon },
  { to: '/score',      label: 'Score',      icon: StarIcon },
]

export default function Shell({ children }) {
  const profile = useStore(s => s.profile)
  const name = profile?.name

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col bg-[#0C0C10] border-r border-[#23232F] px-4 py-6 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-[#22C55E] flex items-center justify-center">
            <span className="font-mono font-black text-[#0C0C10] text-xs">K2</span>
          </div>
          <span className="font-semibold text-[#F0F0F5] text-sm">K2 Wealth</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <SideLink key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>

        {/* Bottom info */}
        <div className="mt-auto space-y-3">
          {name && (
            <div className="px-2 py-2 rounded-xl bg-[#131318] border border-[#23232F]">
              <p className="text-xs text-[#55556A]">Logged in as</p>
              <p className="text-sm text-[#F0F0F5] font-medium truncate">{name}</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2">
            <div className={`w-1.5 h-1.5 rounded-full ${SUPABASE_ENABLED ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
            <span className="text-[10px] text-[#55556A] font-mono">
              {SUPABASE_ENABLED ? 'Supabase sync' : 'Local storage'}
            </span>
          </div>
        </div>
      </aside>

      {/* Page content */}
      <main className="min-h-screen pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0C10]/95 backdrop-blur-md border-t border-[#23232F]">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <MobileLink key={to} to={to} label={label} Icon={Icon} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function SideLink({ to, label, Icon }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-[#052e16] text-[#22C55E] border border-[#16A34A]/30'
            : 'text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#131318]'
        }`}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </div>
      )}
    </NavLink>
  )
}

function MobileLink({ to, label, Icon }) {
  return (
    <NavLink to={to} className="flex-1">
      {({ isActive }) => (
        <div className="relative flex flex-col items-center py-1.5 gap-0.5">
          {isActive && (
            <motion.div
              layoutId="mobile-nav-bg"
              className="absolute inset-x-1 inset-y-0 bg-[#052e16] rounded-xl border border-[#16A34A]/20"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
            />
          )}
          <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-[#22C55E]' : 'text-[#55556A]'}`} />
          <span className={`text-[10px] font-semibold relative z-10 ${isActive ? 'text-[#22C55E]' : 'text-[#55556A]'}`}>
            {label}
          </span>
        </div>
      )}
    </NavLink>
  )
}

// ── Inline SVG icons (no extra dep) ──────────────────────────────────────────
function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
}
function ChartIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
}
function TrendIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
}
function StarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
}
