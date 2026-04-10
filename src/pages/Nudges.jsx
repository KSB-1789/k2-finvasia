// src/pages/Nudges.jsx
// AI-Generated Nudge Feed — card-based, conversational, Gen-Z tone

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button, SectionHeader, Pill, Toast } from '../components/ui'
import { TopBar } from '../components/Nav'
import { generateNudges, generateTriggerNudge } from '../lib/gemini'
import { getActiveTriggers, formatINR, sipFutureValue } from '../utils/finance'

function NudgeCard({ nudge, onRate, index }) {
  const [expanded, setExpanded] = useState(false)

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-4 relative overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-purple-500 to-transparent" />

      <div className="flex items-start gap-3">
        {/* Kai avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-base flex-shrink-0 shadow-lg shadow-purple-900/40">
          🤖
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-display font-bold text-white text-sm">Kai</span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-slate-600 text-xs">{timeAgo(nudge.createdAt)}</span>
            {nudge.category && <Pill color="purple">{nudge.category}</Pill>}
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">{nudge.text}</p>

          {/* Reaction row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1E1E2E]">
            <button
              onClick={() => onRate(nudge.id, true)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                nudge.liked === true
                  ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                  : 'border-[#2E2E4E] text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              👍 Helpful
            </button>
            <button
              onClick={() => onRate(nudge.id, false)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                nudge.liked === false
                  ? 'bg-rose-900/30 border-rose-700/50 text-rose-300'
                  : 'border-[#2E2E4E] text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              👎 Not for me
            </button>
            <span className="ml-auto text-slate-700 text-xs">#{nudge.id.toString().slice(-4)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TriggerCard({ trigger, spending, onGenerateNudge, loading }) {
  const currentAmt = spending[trigger.category] || 0
  const fiveYearValue = sipFutureValue(trigger.suggestSave, 0.12, 5)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-r from-amber-950/30 to-orange-950/20 border border-amber-800/30 rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-900/30 border border-amber-700/30 flex items-center justify-center text-base flex-shrink-0">
          ⚡
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-amber-300 text-sm">Trigger Fired</span>
            <Pill color="gold">{trigger.category}</Pill>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed mb-2">{trigger.description}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Current: <span className="text-white font-mono">{formatINR(currentAmt)}</span></span>
            <span>·</span>
            <span>Save: <span className="text-emerald-400 font-mono">₹{trigger.suggestSave}/mo</span></span>
            <span>·</span>
            <span>5yr: <span className="text-emerald-300 font-mono">{formatINR(fiveYearValue)}</span></span>
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="w-full mt-3"
        onClick={() => onGenerateNudge(trigger)}
        loading={loading}
      >
        Ask Kai about this →
      </Button>
    </motion.div>
  )
}

export default function Nudges({ store }) {
  const { nudges, spending, addNudge, rateNudge, addBadge } = store
  const [loadingNudge, setLoadingNudge] = useState(false)
  const [loadingTrigger, setLoadingTrigger] = useState(null)
  const [toast, setToast] = useState(null)

  const activeTriggers = getActiveTriggers(spending)
  const geminiConfigured = import.meta.env.VITE_GEMINI_API_KEY &&
    import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here'

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRefreshNudges = async () => {
    setLoadingNudge(true)
    try {
      const nudgeTexts = await generateNudges(spending)
      for (const text of nudgeTexts) {
        await addNudge(text)
      }
      await addBadge('first_nudge')
      showToast('3 fresh nudges from Kai! 🤖')
    } catch (err) {
      showToast('Nudge generation failed. Check API key.', 'error')
    } finally {
      setLoadingNudge(false)
    }
  }

  const handleTriggerNudge = async (trigger) => {
    setLoadingTrigger(trigger.id)
    try {
      const currentAmt = spending[trigger.category] || 0
      const text = await generateTriggerNudge(trigger.category, currentAmt, trigger.label)
      await addNudge(text, trigger.category)
      await addBadge('trigger_fired')
      showToast(`Kai weighed in on your ${trigger.category} habit!`)
    } catch {
      showToast('Could not get trigger nudge.', 'error')
    } finally {
      setLoadingTrigger(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <TopBar title="Nudge Feed" subtitle="Kai's personalized suggestions" />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Kai intro */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-purple-700/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl flex-shrink-0 animate-pulse-slow">
            🤖
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-white text-sm">Hey, I'm Kai 👋</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {geminiConfigured
                ? 'Gemini AI is live. Your nudges are fully personalized.'
                : 'Running in demo mode — add your Gemini API key for live nudges.'}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${geminiConfigured ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
        </motion.div>

        {/* Refresh button */}
        <Button
          size="md"
          className="w-full"
          onClick={handleRefreshNudges}
          loading={loadingNudge}
        >
          {loadingNudge ? 'Kai is thinking...' : '🔄 Generate Fresh Nudges'}
        </Button>

        {/* Active Triggers section */}
        {activeTriggers.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
              ⚡ Smart Triggers ({activeTriggers.length} active)
            </p>
            <div className="space-y-3">
              {activeTriggers.map(trigger => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  spending={spending}
                  onGenerateNudge={handleTriggerNudge}
                  loading={loadingTrigger === trigger.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Nudge cards */}
        {nudges.length > 0 ? (
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
              💬 Nudge History ({nudges.length})
            </p>
            <div className="space-y-3">
              <AnimatePresence>
                {nudges.map((nudge, i) => (
                  <NudgeCard
                    key={nudge.id}
                    nudge={nudge}
                    index={i}
                    onRate={rateNudge}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <Card>
            <div className="py-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-display font-bold text-white text-sm mb-1">No nudges yet</p>
              <p className="text-slate-500 text-xs">
                Hit "Generate Fresh Nudges" above to get<br />personalized advice from Kai.
              </p>
            </div>
          </Card>
        )}

        {/* Pro tip */}
        <Card>
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-display font-bold text-white text-sm mb-1">How nudges work</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Kai reads your spending data and uses Google Gemini to craft hyper-personalized suggestions.
                Rate each nudge to help Kai learn what resonates with you. The more you interact, the sharper the advice gets.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  )
}
