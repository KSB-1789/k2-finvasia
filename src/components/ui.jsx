// src/components/ui.jsx
// Shared UI primitives — design system components

import { motion } from 'framer-motion'
import { forwardRef, useState, useCallback } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', glow = false, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : {}}
      className={`
        bg-[#111118] border border-[#1E1E2E] rounded-2xl p-5
        ${glow ? 'shadow-lg shadow-purple-900/20' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}

// ─── Badge pill ───────────────────────────────────────────────────────────────
export function Pill({ children, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-900/30 text-purple-300 border-purple-800/50',
    green: 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50',
    coral: 'bg-rose-900/30 text-rose-300 border-rose-800/50',
    gold: 'bg-amber-900/30 text-amber-300 border-amber-800/50',
    cyan: 'bg-cyan-900/30 text-cyan-300 border-cyan-800/50',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.purple}`}>
      {children}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, className = '' }) {
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40',
    secondary: 'bg-[#1E1E2E] hover:bg-[#252535] text-slate-200 border border-[#2E2E4E]',
    ghost: 'hover:bg-white/5 text-slate-300',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20',
    green: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200 font-body
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </motion.button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input({ label, error, prefix, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-[#8888A0] uppercase tracking-wider">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888A0] text-sm font-mono select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-[#1A1A22] border border-[#23232F] rounded-xl text-[#F0F0F5] text-sm
            px-3 py-2.5 outline-none transition-colors placeholder-[#55556A]
            focus:border-[#22C55E] hover:border-[#2D2D3C]
            ${prefix ? 'pl-8' : ''}
            ${error ? 'border-[#F43F5E]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#F43F5E]">{error}</p>}
    </div>
  )
})

// ─── Score Ring ───────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getColor = (s) => {
    if (s >= 70) return '#10B981'
    if (s >= 50) return '#8B5CF6'
    if (s >= 30) return '#F59E0B'
    return '#F43F5E'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#1E1E2E" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${getColor(score)}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display font-bold text-white"
          style={{ fontSize: size * 0.22 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-slate-500" style={{ fontSize: size * 0.1 }}>/ 100</span>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="font-display font-bold text-white text-lg">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = '#8B5CF6' }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="font-display font-bold text-white text-2xl">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </Card>
  )
}

// ─── Toast notification ───────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  const colors = {
    success: 'border-emerald-500/30 bg-emerald-950/80',
    error: 'border-rose-500/30 bg-rose-950/80',
    info: 'border-purple-500/30 bg-purple-950/80',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border backdrop-blur-md text-sm text-white font-medium shadow-xl ${colors[type]}`}
    >
      {message}
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-[#F0F0F5] mb-1">{title}</h3>
      <p className="text-sm text-[#8888A0] mb-5 max-w-xs">{body}</p>
      {action}
    </div>
  )
}

// ─── Inline hook for toasts ───────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((message, type = 'info', ms = 3000) => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms)
  }, [])
  return { toasts, toast }
}
