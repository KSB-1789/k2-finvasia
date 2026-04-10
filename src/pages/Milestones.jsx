// src/pages/Milestones.jsx
// Financial Growth Score + Gamified Milestones & Badges

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, ScoreRing, SectionHeader, Pill } from '../components/ui'
import { TopBar } from '../components/Nav'
import { calculateScore, getLevel, getScoreInsights } from '../hooks/useStore'
import { BADGES } from '../utils/finance'

const LEVELS = [
  { name: 'Spend Explorer', emoji: '🗺️', minScore: 0, color: '#F43F5E', desc: 'Just starting out. No shame — awareness is step one.' },
  { name: 'Saver Rookie', emoji: '🌱', minScore: 40, color: '#8B5CF6', desc: 'You\'re tracking. That\'s already more than 80% of people.' },
  { name: 'Budget Boss', emoji: '💡', minScore: 55, color: '#06B6D4', desc: 'Spending is intentional. Building good momentum.' },
  { name: 'SIP Starter', emoji: '🚀', minScore: 70, color: '#10B981', desc: 'Investing regularly. Compounding is working for you.' },
  { name: 'Wealth Builder', emoji: '🏔️', minScore: 85, color: '#F59E0B', desc: 'You\'re in the top tier. Your future self will thank you.' },
]

function LevelCard({ level, isActive, isPast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
        isActive
          ? 'border-purple-600/50 bg-purple-900/20'
          : isPast
          ? 'border-emerald-800/30 bg-emerald-950/20'
          : 'border-[#1E1E2E] bg-[#111118] opacity-50'
      }`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: level.color + '20', border: `1px solid ${level.color}30` }}
      >
        {level.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-white text-sm">{level.name}</span>
          {isActive && <Pill color="purple">Current</Pill>}
          {isPast && <Pill color="green">✓ Unlocked</Pill>}
        </div>
        <p className="text-slate-500 text-xs mt-0.5 truncate">{level.desc}</p>
      </div>
      <span className="text-slate-600 font-mono text-xs">{level.minScore}+</span>
    </motion.div>
  )
}

function BadgeCard({ badgeId, unlocked }) {
  const badge = BADGES[badgeId] || { name: badgeId, emoji: '🎖️', desc: 'Mystery badge' }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={unlocked ? { scale: 1.05 } : {}}
      className={`p-3 rounded-2xl border text-center ${
        unlocked
          ? 'border-amber-700/40 bg-amber-950/20'
          : 'border-[#1E1E2E] bg-[#0D0D12] opacity-40 grayscale'
      }`}
    >
      <div className="text-2xl mb-1">{badge.emoji}</div>
      <div className="font-display font-bold text-white text-xs leading-tight">{badge.name}</div>
      <div className="text-slate-500 text-[10px] mt-0.5 leading-tight">{badge.desc}</div>
    </motion.div>
  )
}

export default function Milestones({ store }) {
  const { spending, profile, score, levelInfo, addBadge } = store
  const insights = getScoreInsights(spending)
  const currentLevelInfo = levelInfo

  // Auto-award badges based on score
  useEffect(() => {
    if (score >= 50) addBadge('score_50')
    if (score >= 70) addBadge('score_70')
    if (score >= 85) addBadge('score_85')
  }, [score])

  const allBadgeIds = Object.keys(BADGES)
  const earnedBadges = profile.badges || []
  const nextLevel = LEVELS.find(l => l.minScore > score)
  const pointsToNext = nextLevel ? nextLevel.minScore - score : 0

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <TopBar title="Milestones & Score" subtitle="Your financial growth journey" />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#111118] to-[#0D0D15] border border-[#1E1E2E] rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-black text-white text-xl">Financial Score</h2>
              <p className="text-slate-500 text-sm">Based on your spending patterns</p>
            </div>
            <div className="flex items-center gap-2 bg-[#1A1A25] border border-[#2E2E4E] rounded-xl px-3 py-2">
              <span className="text-lg">{currentLevelInfo.emoji}</span>
              <div>
                <div className="text-white text-xs font-bold">{currentLevelInfo.name}</div>
                <div className="text-slate-500 text-[10px]">Current level</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ScoreRing score={score} size={110} />
            <div className="flex-1">
              {nextLevel ? (
                <>
                  <p className="text-slate-400 text-xs mb-2">Next: <span className="text-white font-semibold">{nextLevel.name} {nextLevel.emoji}</span></p>
                  <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((score - (LEVELS[LEVELS.findIndex(l => l.name === currentLevelInfo.name)]?.minScore || 0)) / pointsToNext) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(to right, ${currentLevelInfo.color}, ${nextLevel.color})` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{pointsToNext} points to unlock</p>
                </>
              ) : (
                <p className="text-amber-400 font-semibold text-sm">🏆 Maximum level achieved!</p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <div className="text-center">
                  <div className="font-display font-bold text-white text-lg">{profile.streak || 0}</div>
                  <div className="text-slate-500 text-[10px]">day streak 🔥</div>
                </div>
                <div className="w-px h-8 bg-[#2E2E2E]" />
                <div className="text-center">
                  <div className="font-display font-bold text-white text-lg">{earnedBadges.length}</div>
                  <div className="text-slate-500 text-[10px]">badges earned</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Score insights */}
        {(insights.dragging.length > 0 || insights.boosting.length > 0) && (
          <Card>
            <SectionHeader title="What's affecting your score" />
            {insights.dragging.length > 0 && (
              <div className="mb-3">
                <p className="text-rose-400 text-xs font-semibold mb-2">📉 Dragging it down</p>
                <div className="space-y-2">
                  {insights.dragging.map(item => (
                    <div key={item} className="flex items-center gap-2 bg-rose-950/20 border border-rose-800/20 rounded-xl px-3 py-2">
                      <span className="text-rose-500 text-xs">↓</span>
                      <span className="text-slate-300 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {insights.boosting.length > 0 && (
              <div>
                <p className="text-emerald-400 text-xs font-semibold mb-2">📈 Working in your favor</p>
                <div className="space-y-2">
                  {insights.boosting.map(item => (
                    <div key={item} className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-800/20 rounded-xl px-3 py-2">
                      <span className="text-emerald-500 text-xs">↑</span>
                      <span className="text-slate-300 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Level progression */}
        <Card>
          <SectionHeader title="Level Journey" subtitle="5 stages to financial freedom" />
          <div className="space-y-2">
            {LEVELS.map(level => {
              const isActive = level.name === currentLevelInfo.name
              const isPast = level.minScore < score && !isActive
              return <LevelCard key={level.name} level={level} isActive={isActive} isPast={isPast} />
            })}
          </div>
        </Card>

        {/* Badges grid */}
        <Card>
          <SectionHeader
            title="Badges"
            subtitle={`${earnedBadges.length} of ${allBadgeIds.length} earned`}
          />
          <div className="grid grid-cols-3 gap-3">
            {allBadgeIds.map(id => (
              <BadgeCard key={id} badgeId={id} unlocked={earnedBadges.includes(id)} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
