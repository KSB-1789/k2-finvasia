// src/pages/Growth.jsx
// Cashback → Investment Converter with compounding growth visualization

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { Card, Button, SectionHeader, StatCard } from '../components/ui'
import { TopBar } from '../components/Nav'
import { generateGrowthData, sipFutureValue, formatINR } from '../utils/finance'

const CASHBACK_PRESETS = [50, 100, 200, 300, 500]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1A1A25] border border-[#2E2E4E] rounded-xl px-3 py-3 text-xs space-y-1">
        <p className="text-slate-400 font-semibold mb-1">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-mono font-bold">{formatINR(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Growth({ store }) {
  const [monthly, setMonthly] = useState(200)
  const [years, setYears] = useState(5)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    setChartData(generateGrowthData(monthly, years))
  }, [monthly, years])

  const sipValue = sipFutureValue(monthly, 0.12, years)
  const fdValue = sipFutureValue(monthly, 0.065, years)
  const cashbackValue = monthly * 12 * years
  const advantage = sipValue - cashbackValue

  // Cashback equivalent from the store spending
  const totalSpend = Object.values(store.spending).reduce((a, b) => a + b, 0)
  const estimatedCashback = Math.round(totalSpend * 0.015) // ~1.5% avg cashback

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <TopBar title="Growth Visualizer" subtitle="Cashback vs Real Wealth" />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Estimated cashback callout */}
        {estimatedCashback > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-900/25 to-orange-900/20 border border-amber-700/30 rounded-2xl p-4"
          >
            <p className="text-amber-400 text-xs font-semibold mb-1">💡 Based on your spending</p>
            <p className="text-white text-sm">
              You're earning ~<span className="font-bold text-amber-300">{formatINR(estimatedCashback)}/month</span> in cashback.
              Scroll down to see what happens when you invest it instead.
            </p>
          </motion.div>
        )}

        {/* Controls */}
        <Card>
          <SectionHeader title="Configure Scenario" />

          <div className="space-y-5">
            {/* Monthly amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-400 text-sm">Monthly amount to invest</label>
                <span className="font-display font-bold text-white text-lg">{formatINR(monthly)}</span>
              </div>

              {/* Preset buttons */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {CASHBACK_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setMonthly(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      monthly === p
                        ? 'bg-purple-900/50 border-purple-600 text-purple-300'
                        : 'bg-[#1A1A25] border-[#2E2E4E] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    ₹{p}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={monthly}
                onChange={e => setMonthly(+e.target.value)}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Years */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-400 text-sm">Time horizon</label>
                <span className="font-display font-bold text-white text-lg">{years} years</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={years}
                onChange={e => setYears(+e.target.value)}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-slate-600 text-xs mt-1">
                <span>1Y</span><span>5Y</span><span>10Y</span><span>15Y</span><span>20Y</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Result cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            key={`sip-${monthly}-${years}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-3 text-center"
          >
            <div className="text-lg mb-1">🚀</div>
            <div className="text-emerald-300 font-display font-black text-base">{formatINR(sipValue)}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">SIP @ 12%</div>
          </motion.div>
          <motion.div
            key={`fd-${monthly}-${years}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-cyan-900/20 border border-cyan-700/30 rounded-2xl p-3 text-center"
          >
            <div className="text-lg mb-1">🏦</div>
            <div className="text-cyan-300 font-display font-black text-base">{formatINR(fdValue)}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">FD @ 6.5%</div>
          </motion.div>
          <motion.div
            key={`cb-${monthly}-${years}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-3 text-center"
          >
            <div className="text-lg mb-1">💳</div>
            <div className="text-slate-400 font-display font-black text-base">{formatINR(cashbackValue)}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Cashback (flat)</div>
          </motion.div>
        </div>

        {/* Advantage callout */}
        <motion.div
          key={`adv-${monthly}-${years}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-violet-900/30 to-emerald-900/20 border border-purple-700/20 rounded-2xl p-4 text-center"
        >
          <p className="text-slate-400 text-xs mb-1">SIP advantage over flat cashback</p>
          <p className="font-display font-black text-3xl text-white">{formatINR(advantage)}</p>
          <p className="text-emerald-400 text-xs mt-1 font-semibold">
            {((advantage / cashbackValue) * 100).toFixed(0)}% more wealth in {years} years
          </p>
        </motion.div>

        {/* Chart */}
        <Card>
          <SectionHeader title="Compounding Growth" subtitle="Month-by-month simulation" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B7280" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
              <XAxis dataKey="year" stroke="#374151" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis
                stroke="#374151"
                tick={{ fill: '#6B7280', fontSize: 10 }}
                tickFormatter={v => formatINR(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sip" name="SIP (12%)" stroke="#10B981" strokeWidth={2} fill="url(#sipGrad)" />
              <Area type="monotone" dataKey="fd" name="FD (6.5%)" stroke="#06B6D4" strokeWidth={2} fill="url(#fdGrad)" />
              <Area type="monotone" dataKey="cashback" name="Cashback (flat)" stroke="#6B7280" strokeWidth={1.5} fill="url(#cbGrad)" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Educational callout */}
        <Card>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📐</span>
            <div>
              <h4 className="font-display font-bold text-white text-sm mb-1">The math behind this</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                SIP returns are calculated using compound interest formula: <span className="font-mono text-purple-300">M × [(1+r)ⁿ - 1] / r × (1+r)</span> where r = monthly rate (12%/12) and n = total months. Cashback is treated as flat accumulation with no compounding.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
