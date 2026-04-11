// src/pages/Score.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { computeScore, scoreInsights } from '../store'
import { levelFromScore, ALL_BADGES, inr } from '../utils/finance'
import { ScoreRing, Card, Button, Empty } from '../components/ui'

const LEVELS = [
  { name: 'Spend Explorer', emoji: '🗺️', min: 0,  color: '#F43F5E' },
  { name: 'Saver Rookie',   emoji: '🌱', min: 40, color: '#A78BFA' },
  { name: 'Budget Boss',    emoji: '💡', min: 55, color: '#06B6D4' },
  { name: 'SIP Starter',    emoji: '🚀', min: 70, color: '#22C55E' },
  { name: 'Wealth Builder', emoji: '🏔️', min: 85, color: '#F59E0B' },
]

function NextLevelBar({ score }) {
  const current = [...LEVELS].reverse().find(l => score >= l.min)
  const next    = LEVELS.find(l => l.min > score)
  if (!current || !next) return null
  const pct = ((score - current.min) / (next.min - current.min)) * 100
  return (
    <div>
      <div className="flex justify-between text-[10px] text-[#55556A] mb-1">
        <span>{current.name}</span><span>{next.name} at {next.min}</span>
      </div>
      <div className="h-1.5 bg-[#23232F] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: next.color }}
        />
      </div>
    </div>
  )
}

function ProfileSettings({ profile }) {
  const saveProfile = useStore(s => s.saveProfile)
  const [editing, setEditing] = useState(false)
  const [income, setIncome]   = useState(profile?.monthly_income || '')
  const [goal, setGoal]       = useState(profile?.savings_goal   || '')

  async function save() {
    await saveProfile({
      monthly_income: Number(income) || profile?.monthly_income,
      savings_goal:   Number(goal)   || null,
    })
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-[#8888A0]">Income: <span className="text-[#F0F0F5] font-mono">{inr(profile?.monthly_income)}</span></p>
          <p className="text-xs text-[#8888A0]">Goal: <span className="text-[#F0F0F5] font-mono">{profile?.savings_goal ? inr(profile.savings_goal) : 'not set'}</span></p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[['Monthly income ₹', income, setIncome], ['Savings goal ₹', goal, setGoal]].map(([label, val, setter]) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[10px] text-[#55556A] uppercase tracking-wider">{label}</label>
            <input type="number" value={val} onChange={e => setter(e.target.value)}
              className="w-full bg-[#1A1A22] border border-[#23232F] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] font-mono focus:border-[#22C55E] outline-none" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  )
}

export default function Score() {
  const navigate = useNavigate()
  const { expenses, profile } = useStore(s => ({ expenses: s.expenses, profile: s.profile }))

  const score    = computeScore({ expenses, profile })
  const insights = scoreInsights({ expenses, profile })
  const level    = levelFromScore(score)
  const badges   = profile?.badges || []
  const income   = profile?.monthly_income || 0
  const hasData  = expenses.length > 0 && income > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#F0F0F5]">Financial Score</h1>
        <p className="text-sm text-[#8888A0] mt-0.5">Calculated from your real spending and habits</p>
      </div>

      {!hasData ? (
        <Card className="py-2">
          <Empty icon="📊" title="Score needs data"
            body={!income ? "Set your monthly income — it's the baseline for everything." : 'Log expenses this month to get your score.'}
            action={<Button onClick={() => navigate(!income ? '/onboarding' : '/log')}>{!income ? 'Set income →' : 'Log expenses →'}</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <ScoreRing score={score} size={110} stroke={8} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{level.emoji}</span>
                  <span className="font-bold text-[#F0F0F5]">{level.name}</span>
                </div>
                {level.next && <p className="text-xs text-[#8888A0] mb-3">Next: {level.next}</p>}
                {score < 85 && <NextLevelBar score={score} />}
                <div className="flex gap-4 mt-3">
                  {[['Streak', `${profile?.streak || 0}d 🔥`], ['Income', inr(income)], ['Badges', badges.length]].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[#55556A] text-[10px] uppercase tracking-wider">{label}</p>
                      <p className="font-mono font-bold text-[#F0F0F5]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {(insights.drags.length > 0 || insights.boosts.length > 0) && (
            <Card className="p-4 space-y-2">
              <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-1">What's moving your score</p>
              {insights.drags.map((d, i) => (
                <motion.div key={`d${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-2.5 bg-[#4c0519]/20 border border-[#881337]/20 rounded-xl px-3 py-2">
                  <span className="text-[#F43F5E] text-xs mt-0.5 flex-shrink-0">↓</span>
                  <p className="text-xs text-[#C8C8D8]">{d}</p>
                </motion.div>
              ))}
              {insights.boosts.map((b, i) => (
                <motion.div key={`b${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (insights.drags.length + i) * 0.06 }}
                  className="flex items-start gap-2.5 bg-[#052e16]/40 border border-[#16A34A]/20 rounded-xl px-3 py-2">
                  <span className="text-[#22C55E] text-xs mt-0.5 flex-shrink-0">↑</span>
                  <p className="text-xs text-[#C8C8D8]">{b}</p>
                </motion.div>
              ))}
            </Card>
          )}

          <Card className="p-4">
            <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-3">Level Journey</p>
            <div className="space-y-2">
              {LEVELS.map(lvl => {
                const nextMin  = LEVELS.find(l => l.min > lvl.min)?.min ?? 101
                const isActive = score >= lvl.min && score < nextMin
                const isPast   = score >= nextMin
                return (
                  <div key={lvl.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                    isActive ? 'bg-[#052e16] border-[#16A34A]/40'
                    : isPast ? 'bg-[#131318] border-[#23232F]'
                    : 'bg-[#0C0C10] border-[#1A1A22] opacity-40'
                  }`}>
                    <span className="text-lg w-7 text-center flex-shrink-0">{lvl.emoji}</span>
                    <p className={`text-sm font-semibold flex-1 ${isActive ? 'text-[#22C55E]' : isPast ? 'text-[#F0F0F5]' : 'text-[#8888A0]'}`}>{lvl.name}</p>
                    <span className="font-mono text-xs text-[#55556A]">{lvl.min}+</span>
                    {isPast   && <span className="text-[10px] text-[#22C55E]">✓</span>}
                    {isActive && <span className="text-[10px] text-[#22C55E] font-bold">← you</span>}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-3">
              Badges — {badges.length}/{Object.keys(ALL_BADGES).length} earned
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {Object.entries(ALL_BADGES).map(([id, badge]) => {
                const earned = badges.includes(id)
                return (
                  <motion.div key={id} whileHover={earned ? { scale: 1.05 } : {}}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center ${
                      earned ? 'bg-[#451a03]/30 border-[#78350F]/50' : 'bg-[#0C0C10] border-[#1A1A22] opacity-30 grayscale'
                    }`}>
                    <span className="text-xl">{badge.emoji}</span>
                    <span className={`text-[10px] font-semibold leading-tight ${earned ? 'text-[#FCD34D]' : 'text-[#55556A]'}`}>{badge.name}</span>
                    {earned && <span className="text-[9px] text-[#8888A0] leading-tight">{badge.desc}</span>}
                  </motion.div>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider mb-3">Profile Settings</p>
            <ProfileSettings profile={profile} />
          </Card>
        </>
      )}
    </div>
  )
}
