// src/pages/Growth.jsx
// Cashback → Investment converter.
// Defaults to user's actual cashback estimate from real spending.
// Slider max scales with estimated cashback (floor ₹10K, cap ₹50K); custom field accepts any amount.
// Chart is always personalized to the user's context.

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useStore } from '../store'
import { sipFV, fdFV, growthData, inr } from '../utils/finance'
import { Card, Button } from '../components/ui/index.jsx'
import { useNavigate } from 'react-router-dom'

const CHART_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1A22] border border-[#2D2D3C] rounded-xl px-3 py-2 text-xs space-y-1">
      <p className="text-[#8888A0] font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[#8888A0]">{p.name}:</span>
          <span className="text-[#F0F0F5] font-mono font-bold">{inr(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Growth() {
  const navigate = useNavigate()
  const expenses = useStore(s => s.expenses)

  const byCategory = useMemo(() => {
    const bc = {}
    for (const e of expenses) {
      bc[e.category] = (bc[e.category] || 0) + e.amount
    }
    return bc
  }, [expenses])

  const totalSpent  = Object.values(byCategory).reduce((s, v) => s + v, 0)

  // Estimate typical 1.5% cashback on total spend
  const estimatedCashback = Math.max(50, Math.round(totalSpent * 0.015))
  // Slider range: never cap the UX at ₹2K when spend is low; custom input still allows any value.
  const sliderMax = Math.min(50000, Math.max(10000, estimatedCashback * 8))

  const [monthly, setMonthly] = useState(estimatedCashback)
  const [years, setYears]     = useState(5)
  const [graphType, setGraphType] = useState('sip')
  const [customAmount, setCustomAmount] = useState('')

  const finalMonthly = customAmount ? parseFloat(customAmount) : monthly
  const chart = useMemo(() => growthData(finalMonthly, years), [finalMonthly, years])

  const sipVal  = sipFV(finalMonthly, years)
  const cbVal   = finalMonthly * 12 * years
  const fdVal   = fdFV(finalMonthly, years)
  const delta   = graphType === 'fd' ? fdVal - cbVal : sipVal - cbVal
  const deltaPct = cbVal > 0 ? ((delta / cbVal) * 100).toFixed(0) : 0

  const hasSpending = totalSpent > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#F0F0F5]">Growth Visualizer</h1>
        <p className="text-sm text-[#8888A0] mt-0.5">What if you invested instead of collecting cashback?</p>
      </div>

      {/* Personalized context banner */}
      {hasSpending ? (
        <div className="bg-[#2e1065]/40 border border-[#4C1D95]/40 rounded-2xl p-4">
          <p className="text-xs text-[#A78BFA] font-semibold mb-1">Based on your spending</p>
          <p className="text-sm text-[#F0F0F5]">
            You spent {inr(totalSpent)} this month → earning ~{inr(estimatedCashback)} in cashback (est. 1.5%).
            The slider is pre-set to that amount.
          </p>
        </div>
      ) : (
        <div className="bg-[#131318] border border-[#23232F] rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-[#8888A0]">Log expenses to get a personalized cashback estimate.</p>
          <Button size="sm" onClick={() => navigate('/log')}>Log →</Button>
        </div>
      )}

      {/* Controls */}
      <Card className="p-5 space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider">Monthly investment</label>
            <span className="font-mono font-bold text-[#22C55E] text-base">{inr(finalMonthly)}</span>
          </div>
          <div className="space-y-2 mb-2">
            <input
              type="range"
              min={50}
              max={sliderMax}
              step={50}
              value={customAmount || monthly}
              onChange={e => { setMonthly(+e.target.value); setCustomAmount(''); }}
            />
            <div className="flex justify-between text-[#55556A] text-[10px]">
              <span>₹50</span>
              <span>{inr(sliderMax)}</span>
            </div>
          </div>
          <input
            type="number"
            min={50}
            placeholder="Custom ₹/month (bypasses slider max)"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            className="w-full bg-[#1A1A22] border border-[#23232F] rounded-xl text-[#F0F0F5] text-sm px-3 py-2 outline-none transition-colors focus:border-[#22C55E] placeholder-[#55556A]"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider">Time horizon</label>
            <span className="font-mono font-bold text-[#F0F0F5] text-base">{years} years</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={years}
            onChange={e => setYears(+e.target.value)}
          />
          <div className="flex justify-between text-[#55556A] text-[10px] mt-1">
            <span>1Y</span><span>5Y</span><span>10Y</span><span>20Y</span><span>30Y</span>
          </div>
        </div>
      </Card>

      {/* Results — SIP & FD switch chart vs flat cashback; flat row is baseline only */}
      <div className="grid grid-cols-3 gap-3">
        <ResultCard label="SIP @ 12%" value={sipVal} color="#22C55E" icon="🚀" isActive={graphType === 'sip'} onClick={() => setGraphType('sip')} />
        <ResultCard label="FD @ 6.5%" value={fdVal} color="#06B6D4" icon="🏦" isActive={graphType === 'fd'} activeAccent="cyan" onClick={() => setGraphType('fd')} />
        <ResultCard label="Cashback flat" value={cbVal} color="#55556A" icon="💳" baseline />
      </div>

      {/* Delta callout */}
      <motion.div
        key={`${graphType}-${monthly}-${years}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#052e16] border border-[#16A34A]/40 rounded-2xl p-5 text-center"
      >
        <p className="text-[#8888A0] text-xs mb-1">
          {graphType === 'fd'
            ? `FD @ 6.5% vs flat cashback in ${years} years`
            : `SIP @ 12% advantage over flat cashback in ${years} years`}
        </p>
        <p className="font-mono font-black text-[#22C55E] text-3xl">{inr(delta)}</p>
        <p className="text-xs text-[#4ADE80] mt-1">{deltaPct}% more wealth</p>
      </motion.div>

      {/* Chart */}
      <Card className="p-4">
        <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-4">
          {graphType === 'fd' ? 'FD vs flat cashback' : 'SIP vs flat cashback'}
        </p>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gSip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A22" vertical={false} />
            <XAxis dataKey="year" stroke="#23232F" tick={{ fill: '#55556A', fontSize: 10 }} />
            <YAxis stroke="#23232F" tick={{ fill: '#55556A', fontSize: 10 }} tickFormatter={v => inr(v)} width={50} />
            <Tooltip content={<CHART_TOOLTIP />} />
            {graphType === 'sip' && (
              <Area type="monotone" dataKey="sip" name="SIP" stroke="#22C55E" strokeWidth={2} fill="url(#gSip)" />
            )}
            {graphType === 'fd' && (
              <Area type="monotone" dataKey="fd" name="FD @ 6.5%" stroke="#06B6D4" strokeWidth={2} fill="url(#gFd)" />
            )}
            <Area type="monotone" dataKey="cashback" name="Flat cashback" stroke="#8888A0" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Formula note */}
      <p className="text-[10px] text-[#55556A] text-center font-mono">
        SIP: FV = P × [(1.01ⁿ − 1) / 0.01] × 1.01 &nbsp;·&nbsp; 12% annual, monthly compounding | FD: FV = P×12×Y × (1 + 0.065÷12 × Y×12÷2) | Flat: P×12×Y
      </p>
    </div>
  )
}

function ResultCard({ label, value, color, icon, isActive, onClick, baseline, activeAccent = 'green' }) {
  const interactive = Boolean(onClick) && !baseline
  const activeRing = activeAccent === 'cyan'
    ? 'ring-2 ring-cyan-500/35 bg-cyan-950/40 border-cyan-600/50'
    : 'ring-2 ring-[#22C55E]/40 bg-[#052e16] border-[#16A34A]/60'
  return (
    <motion.div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } } : undefined}
      whileHover={interactive ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      className={`rounded-2xl p-3 text-center border transition-all ${
        baseline
          ? 'bg-[#131318] border-[#23232F] cursor-default opacity-95'
          : `cursor-pointer ${isActive
            ? activeRing
            : 'bg-[#131318] border-[#23232F] hover:border-[#2D2D3C]'}`
      }`}
    >
      <div className="text-lg mb-1">{icon}</div>
      <div className="font-mono font-bold text-sm" style={{ color }}>{inr(value)}</div>
      <div className="text-[#55556A] text-[10px] mt-0.5">{label}</div>
    </motion.div>
  )
}
