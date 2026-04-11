// src/components/ui/index.jsx
// Minimal, intentional primitives. Every component earns its place.

import { motion, AnimatePresence } from 'framer-motion'
import { forwardRef } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`bg-[#131318] border border-[#23232F] rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', loading, className = '', disabled, ...props },
  ref
) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] focus-visible:outline-offset-2'
  const variants = {
    primary:   'bg-[#22C55E] text-[#0C0C10] hover:bg-[#4ADE80] shadow-[0_0_20px_rgba(34,197,94,0.25)]',
    secondary: 'bg-[#1A1A22] border border-[#2D2D3C] text-[#F0F0F5] hover:border-[#3D3D50] hover:bg-[#22222E]',
    ghost:     'text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1A1A22]',
    danger:    'bg-[#4c0519] border border-[#881337] text-[#FB7185] hover:bg-[#881337]/30',
    violet:    'bg-[#4C1D95] border border-[#7C3AED] text-[#A78BFA] hover:bg-[#7C3AED]/30',
  }
  const sizes = {
    sm:   'px-3 py-1.5 text-xs',
    md:   'px-4 py-2.5 text-sm',
    lg:   'px-6 py-3 text-base',
    icon: 'p-2',
  }
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading
        ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" className="opacity-75"/></svg>
        : children}
    </button>
  )
})

// ── Input ─────────────────────────────────────────────────────────────────────
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

// ── Score ring ────────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 100, stroke = 7 }) {
  const r = (size - stroke) / 2
  const circ = r * 2 * Math.PI
  const pct = score != null ? score / 100 : 0
  const color = score == null ? '#23232F' : score >= 70 ? '#22C55E' : score >= 50 ? '#A78BFA' : score >= 30 ? '#F59E0B' : '#F43F5E'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#23232F" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 5px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score != null
          ? <>
              <motion.span
                className="font-mono font-bold text-[#F0F0F5] leading-none"
                style={{ fontSize: size * 0.23 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              >{score}</motion.span>
              <span className="text-[#55556A]" style={{ fontSize: size * 0.1 }}>/100</span>
            </>
          : <span className="text-[#55556A] text-xs text-center px-2">No data</span>
        }
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ toasts }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl text-sm font-medium backdrop-blur-md border shadow-xl ${
              t.type === 'error'   ? 'bg-[#4c0519]/90 border-[#881337] text-[#FB7185]' :
              t.type === 'success' ? 'bg-[#052e16]/90 border-[#16A34A] text-[#4ADE80]' :
                                     'bg-[#1A1A22]/90 border-[#2D2D3C] text-[#F0F0F5]'
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

// ── Empty state ───────────────────────────────────────────────────────────────
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

// ── Inline hook for toasts ────────────────────────────────────────────────────
import { useState, useCallback } from 'react'
export function useToast() {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((message, type = 'info', ms = 3000) => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms)
  }, [])
  return { toasts, toast }
}
