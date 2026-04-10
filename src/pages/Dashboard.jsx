// src/pages/Dashboard.jsx
// Spending Input & Analysis + Smart Saving Triggers

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Card, Button, SectionHeader, Pill, Toast } from '../components/ui'
import { TopBar } from '../components/Nav'
import { generateNudges } from '../lib/gemini'
import { getActiveTriggers } from '../utils/finance'
import { formatINR } from '../utils/finance'

const CATEGORIES = [
  { name: 'Food Delivery', icon: '🍕', color: '#F43F5E' },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { name: 'Shopping', icon: '🛍️', color: '#F59E0B' },
  { name: 'Transport', icon: '🚗', color: '#06B6D4' },
  { name: 'Subscriptions', icon: '📱', color: '#EC4899' },
  { name: 'Groceries', icon: '🥗', color: '#10B981' },
  { name: 'Dining Out', icon: '🍽️', color: '#F97316' },
  { name: 'Others', icon: '💡', color: '#6B7280' },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1A1A25] border border-[#2E2E4E] rounded-xl px-3 py-2 text-sm">
        <span className="text-white font-semibold">{payload[0].name}</span>
        <br />
        <span className="text-purple-300">{formatINR(payload[0].value)}</span>
      </div>
    )
  }
  return null
}

export default function Dashboard({ store }) {
  const { spending, updateSpending, addNudge, score, levelInfo } = store
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [localSpend, setLocalSpend] = useState({ ...spending })
  const [loadingNudge, setLoadingNudge] = useState(false)
  const [toast, setToast] = useState(null)

  const total = Object.values(localSpend).reduce((a, b) => a + b, 0)
  const activeTriggers = getActiveTriggers(localSpend)

  const pieData = CATEGORIES.map(c => ({
    name: c.name,
    value: localSpend[c.name] || 0,
    color: c.color,
  })).filter(d => d.value > 0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    await updateSpending(localSpend)
    setEditMode(false)
    showToast('Spending updated! Kai is analyzing... 🤖', 'info')
  }

  const handleGetNudges = async () => {
    setLoadingNudge(true)
    try {
      const nudgeTexts = await generateNudges(localSpend)
      for (const text of nudgeTexts) {
        await addNudge(text)
      }
      navigate('/nudges')
    } catch (err) {
      showToast('Could not fetch nudges. Check your Gemini API key.', 'error')
    } finally {
      setLoadingNudge(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <TopBar title="Spending Dashboard" subtitle={`Total this month: ${formatINR(total)}`} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Score snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-900/30 to-purple-900/20 border border-purple-700/30 rounded-2xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-slate-400 text-xs mb-1">Financial Score</p>
            <p className="font-display font-black text-3xl text-white">{score}<span className="text-slate-600 text-lg">/100</span></p>
            <p className="text-purple-300 text-sm mt-1">{levelInfo.emoji} {levelInfo.name}</p>
          </div>
          <Button size="sm" onClick={() => navigate('/milestones')}>View Progress →</Button>
        </motion.div>

        {/* Pie Chart */}
        <Card>
          <SectionHeader title="Spending Breakdown" subtitle="This month" />
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
              Add spending to see your breakdown
            </div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto text-slate-300 font-mono">{formatINR(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Inputs */}
        <Card>
          <SectionHeader
            title="Monthly Spending"
            action={
              <Button size="sm" variant={editMode ? 'green' : 'secondary'} onClick={editMode ? handleSave : () => setEditMode(true)}>
                {editMode ? 'Save ✓' : 'Edit'}
              </Button>
            }
          />
          <div className="space-y-3">
            {CATEGORIES.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: cat.color + '20' }}>
                  {cat.icon}
                </div>
                <span className="text-slate-300 text-sm flex-1 font-body">{cat.name}</span>
                {editMode ? (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={localSpend[cat.name] || ''}
                      onChange={e => setLocalSpend(prev => ({ ...prev, [cat.name]: parseInt(e.target.value) || 0 }))}
                      className="w-24 bg-[#1A1A25] border border-[#2E2E4E] rounded-lg px-2 py-1 text-white text-sm text-right font-mono focus:border-purple-600 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-[#1E1E2E] w-20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: total > 0 ? `${Math.min(100, ((localSpend[cat.name] || 0) / total) * 100)}%` : '0%',
                          background: cat.color
                        }}
                      />
                    </div>
                    <span className="text-slate-300 text-sm font-mono w-16 text-right">
                      {formatINR(localSpend[cat.name] || 0)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#1E1E2E] flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-xs">Total</span>
              <span className="text-white font-display font-bold text-lg ml-2">{formatINR(total)}</span>
            </div>
            {editMode && (
              <Button size="sm" variant="ghost" onClick={() => { setLocalSpend({ ...spending }); setEditMode(false) }}>
                Cancel
              </Button>
            )}
          </div>
        </Card>

        {/* Active Triggers */}
        {activeTriggers.length > 0 && (
          <Card glow>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <h3 className="font-display font-bold text-white text-sm">Smart Saving Triggers</h3>
              <Pill color="coral">{activeTriggers.length} active</Pill>
            </div>
            <div className="space-y-3">
              {activeTriggers.map(trigger => (
                <motion.div
                  key={trigger.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-rose-300 text-xs font-semibold">{trigger.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{trigger.description}</p>
                    </div>
                    <Pill color="coral">Save ₹{trigger.suggestSave}</Pill>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleGetNudges}
          loading={loadingNudge}
        >
          {loadingNudge ? 'Kai is analyzing...' : '🤖 Get AI Nudges from Kai'}
        </Button>

        {/* Supabase indicator */}
        <div className="text-center">
          <span className={`text-[10px] font-mono ${store.isSupabaseConfigured ? 'text-emerald-600' : 'text-slate-700'}`}>
            {store.isSupabaseConfigured ? '● Synced to Supabase' : '● Stored locally (configure Supabase in .env)'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  )
}
