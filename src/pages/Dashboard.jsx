// src/pages/Dashboard.jsx
// Summary screen. Shows THIS MONTH's real data.
// No data = empty state with actionable CTA. No fake numbers ever.

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format, startOfMonth, parseISO } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../store'
import { generateNudges, GEMINI_ENABLED } from '../lib/gemini'
import { CATEGORY_MAP, inr, getActiveTriggers } from '../utils/finance'
import { Card, Button, ScoreRing, Empty, useToast, Toast } from '../components/ui/index.jsx'
import { computeScore, scoreInsights } from '../store'

const PIE_TOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1A22] border border-[#2D2D3C] rounded-xl px-3 py-2 text-xs">
      <p className="text-[#F0F0F5] font-semibold">{payload[0].name}</p>
      <p className="text-[#22C55E] font-mono">{inr(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const expenses = useStore(s => s.expenses)
  const profile = useStore(s => s.profile)
  const nudges = useStore(s => s.nudges)
  const addNudge = useStore(s => s.addNudge)

  const byCategory = useMemo(() => {
    const bc = {}
    for (const e of expenses) {
      bc[e.category] = (bc[e.category] || 0) + e.amount
    }
    return bc
  }, [expenses])

  const [loadingNudge, setLoadingNudge] = useState(false)
  const { toasts, toast } = useToast()

  const income = profile?.monthly_income || 0
  const goal   = profile?.savings_goal   || 0
  const thisMonth = format(startOfMonth(new Date()), 'yyyy-MM')
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth))
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const saved = Math.max(0, income - totalSpent)
  const savingsRate = income > 0 ? (saved / income) * 100 : 0

  const score   = computeScore({ expenses, profile })
  const insights = scoreInsights({ expenses, profile })

  const pieData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => ({ name: cat, value: amt, color: CATEGORY_MAP[cat]?.color || '#6B7280' }))

  const triggers = getActiveTriggers(byCategory, income)
  const recentNudges = nudges.slice(0, 3)

  async function refreshNudges() {
    if (!monthExpenses.length) { toast('Log some expenses first — Kai needs real data', 'error'); return }
    setLoadingNudge(true)
    try {
      const texts = await generateNudges({ expenses: monthExpenses, profile, byCategory, totalThisMonth: totalSpent })
      for (const text of texts) await addNudge({ text })
      toast('Fresh nudges from Kai ✓', 'success')
    } catch {
      toast('Could not reach Gemini. Check API key.', 'error')
    } finally {
      setLoadingNudge(false)
    }
  }

  const hasData = monthExpenses.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F0F0F5]">
            {profile?.name ? `Hey, ${profile.name}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-[#8888A0]">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/log')}>+ Log</Button>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Spent"
          value={inr(totalSpent)}
          sub={income ? `of ${inr(income)}` : 'no income set'}
          color={totalSpent > income && income ? '#F43F5E' : '#F0F0F5'}
        />
        <MetricCard
          label="Saved"
          value={inr(saved)}
          sub={income ? `${savingsRate.toFixed(0)}% rate` : '—'}
          color={savingsRate >= 20 ? '#22C55E' : savingsRate >= 10 ? '#F59E0B' : '#F0F0F5'}
        />
        <MetricCard
          label="Logged"
          value={monthExpenses.length}
          sub="expenses"
          color="#F0F0F5"
        />
      </div>

      {/* Goal progress */}
      {goal > 0 && income > 0 && (
        <div className="bg-[#131318] border border-[#23232F] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#8888A0] font-medium">Monthly Goal: {inr(goal)}</span>
            <span className={`text-xs font-mono font-bold ${saved >= goal ? 'text-[#22C55E]' : 'text-[#8888A0]'}`}>
              {saved >= goal ? '✓ Reached' : `${inr(goal - saved)} to go`}
            </span>
          </div>
          <div className="h-1.5 bg-[#23232F] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (saved / goal) * 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-[#22C55E]"
            />
          </div>
        </div>
      )}

      {!hasData ? (
        <Card className="py-2">
          <Empty
            icon="📊"
            title="Nothing logged this month"
            body="Start tracking your expenses — your dashboard, score, and AI nudges are all built from your real data."
            action={<Button onClick={() => navigate('/log')}>Log your first expense →</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Spending breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie */}
            <Card className="p-4">
              <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-3">By Category</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<PIE_TOOLTIP />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Category list */}
            <Card className="p-4">
              <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-3">Breakdown</p>
              <div className="space-y-2.5">
                {pieData.slice(0, 6).map(d => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="text-sm">{CATEGORY_MAP[d.name]?.emoji || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-[#8888A0] truncate">{d.name}</span>
                        <span className="text-xs font-mono text-[#F0F0F5]">{inr(d.value)}</span>
                      </div>
                      <div className="h-1 bg-[#23232F] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(d.value / totalSpent) * 100}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Smart triggers */}
          {triggers.length > 0 && (
            <div>
              <p className="text-xs text-[#55556A] font-semibold uppercase tracking-wider mb-2">⚡ Smart Triggers</p>
              <div className="space-y-2">
                {triggers.map(t => (
                  <div key={t.id} className="bg-[#451a03]/30 border border-[#78350F]/40 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#FCD34D] font-semibold">{t.label}</p>
                      <p className="text-xs text-[#8888A0] mt-0.5">
                        Save ₹{t.saveSuggestion}/mo → {inr(t.fiveYr)} in 5yr at 12%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score preview */}
          {score != null && (
            <Card className="p-4 flex items-center gap-5">
              <ScoreRing score={score} size={80} stroke={6} />
              <div className="flex-1">
                <p className="text-xs text-[#8888A0] mb-0.5">Financial Score</p>
                <p className="text-[#F0F0F5] font-bold text-lg">{score}/100</p>
                {insights.drags[0] && (
                  <p className="text-xs text-[#F43F5E] mt-1">↓ {insights.drags[0]}</p>
                )}
                {insights.boosts[0] && (
                  <p className="text-xs text-[#22C55E] mt-0.5">↑ {insights.boosts[0]}</p>
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/score')}>Details</Button>
            </Card>
          )}
        </>
      )}

      {/* AI Nudges section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#55556A] font-semibold uppercase tracking-wider">Kai's Nudges</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={refreshNudges}
            loading={loadingNudge}
            disabled={!hasData}
          >
            {GEMINI_ENABLED ? '🤖 Ask Kai' : '🤖 Demo Nudge'}
          </Button>
        </div>

        {recentNudges.length === 0 ? (
          <div className="bg-[#131318] border border-[#23232F] rounded-2xl p-5 text-center">
            <p className="text-[#8888A0] text-sm">
              {hasData
                ? 'Hit "Ask Kai" to get personalized nudges based on your actual spending.'
                : 'Log expenses first — Kai needs your real data to give useful advice.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNudges.map((n, i) => (
              <NudgeCard key={n.id} nudge={n} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="bg-[#131318] border border-[#23232F] rounded-2xl p-3">
      <p className="text-[#55556A] text-[10px] font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono font-bold text-base leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-[#55556A] text-[10px] mt-0.5">{sub}</p>}
    </div>
  )
}

function NudgeCard({ nudge, index }) {
  const rateNudge = useStore(s => s.rateNudge)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-[#131318] border border-[#23232F] rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#4C1D95] border border-[#7C3AED]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">🤖</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-[#A78BFA]">Kai</span>
            {nudge.category && (
              <span className="text-[10px] text-[#55556A] bg-[#1A1A22] border border-[#23232F] px-1.5 py-0.5 rounded-md">
                {nudge.category}
              </span>
            )}
          </div>
          <p className="text-sm text-[#C8C8D8] leading-relaxed">{nudge.text}</p>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() => rateNudge(nudge.id, 'up')}
              className={`text-xs px-2 py-1 rounded-lg border transition-all ${nudge.rating === 'up' ? 'bg-[#052e16] border-[#22C55E] text-[#22C55E]' : 'border-[#23232F] text-[#55556A] hover:border-[#3D3D50]'}`}
            >👍</button>
            <button
              onClick={() => rateNudge(nudge.id, 'down')}
              className={`text-xs px-2 py-1 rounded-lg border transition-all ${nudge.rating === 'down' ? 'bg-[#4c0519] border-[#F43F5E] text-[#F43F5E]' : 'border-[#23232F] text-[#55556A] hover:border-[#3D3D50]'}`}
            >👎</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
