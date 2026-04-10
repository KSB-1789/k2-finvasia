// src/components/Nav.jsx
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Spend' },
  { to: '/growth', icon: '📈', label: 'Grow' },
  { to: '/milestones', icon: '🏅', label: 'Goals' },
  { to: '/nudges', icon: '💬', label: 'Nudges' },
]

export default function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-[#1E1E2E]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-purple-900/30 rounded-xl border border-purple-700/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="text-xl relative z-10">{icon}</span>
                <span className={`text-[10px] font-semibold font-body relative z-10 ${isActive ? 'text-purple-300' : 'text-slate-500'}`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Top header bar
export function TopBar({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-[#1E1E2E] px-5 py-3.5">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-base leading-tight">{title}</h1>
          {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
        </div>
        <span className="font-display font-black text-xs text-purple-500/60 tracking-widest">K2</span>
      </div>
    </header>
  )
}
