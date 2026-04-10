// src/pages/Landing.jsx
// Onboarding page — Team K2 branding, problem hook, CTA

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui'

const STATS = [
  { value: '₹2.3L', label: 'avg cashback per year' },
  { value: '12%', label: 'SIP annual return' },
  { value: '10x', label: 'wealth multiplier' },
]

const STEPS = [
  { icon: '📊', title: 'Log your spending', desc: 'Tell us where your money goes each month.' },
  { icon: '🤖', title: 'Kai analyzes it', desc: 'Our AI coach spots patterns and opportunities.' },
  { icon: '🚀', title: 'Invest the difference', desc: 'Turn cashback triggers into wealth-building habits.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-emerald-900/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-900/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#8B5CF6 1px, transparent 1px), linear-gradient(to right, #8B5CF6 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-lg mx-auto px-5 pb-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-10 pb-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <span className="font-display font-black text-white text-sm">K2</span>
            </div>
            <span className="font-display font-bold text-slate-400 text-sm tracking-wider">WEALTH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-600 font-mono">Finvasia Hackathon 2026</span>
            <span className="text-[10px] bg-purple-900/40 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-full font-medium">PS2</span>
          </div>
        </motion.div>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="pt-12 pb-8"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/30 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">Stop chasing cashback. Start building wealth.</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl leading-[1.1] mb-4">
            Your cashback is{' '}
            <span className="relative">
              <span className="text-slate-500 line-through decoration-rose-500">lying</span>
            </span>{' '}
            <br />
            to you.{' '}
            <span
              className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              Let's fix that.
            </span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-8 font-body">
            ₹200 cashback this month sounds great — until you realize that same ₹200 in a SIP for 10 years is{' '}
            <span className="text-emerald-400 font-semibold">₹44,000+</span>.
            K2 Wealth shows you the real math, powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => navigate('/dashboard')} className="flex-1">
              Start tracking for free →
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/growth')} className="flex-1">
              See the math 📈
            </Button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-12"
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-3 text-center">
              <div className="font-display font-black text-xl text-white">{value}</div>
              <div className="text-slate-500 text-[10px] leading-tight mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4">How it works</p>
          <div className="space-y-3">
            {STEPS.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-start gap-4 bg-[#111118] border border-[#1E1E2E] rounded-2xl p-4"
              >
                <div className="w-10 h-10 bg-purple-900/30 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <div className="font-display font-bold text-white text-sm">{title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                </div>
                <div className="ml-auto text-slate-700 font-mono text-xs font-bold self-center">0{i + 1}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Meet Kai */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-purple-700/30 rounded-3xl p-6 mb-12"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-purple-900/50">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-bold text-white">Meet Kai</span>
                <span className="text-[10px] bg-purple-900/50 text-purple-400 border border-purple-700/40 px-2 py-0.5 rounded-full">Powered by Gemini AI</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                "You spent ₹3,200 on Swiggy this month. Redirecting just ₹500 to a SIP for 5 years = <span className="text-emerald-400 font-semibold">₹40,000+</span>. That's not a sacrifice — that's a cheat code."
              </p>
              <p className="text-purple-400 text-xs mt-2 font-medium">— Kai, your AI financial coach</p>
            </div>
          </div>
        </motion.div>

        {/* Chitkara / Team branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <Button size="lg" onClick={() => navigate('/dashboard')} className="w-full mb-6">
            Launch K2 Wealth Dashboard 🚀
          </Button>
          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
            <span>Built by</span>
            <span className="text-purple-500 font-bold font-display">Team K2</span>
            <span>·</span>
            <span>Chitkara University</span>
            <span>·</span>
            <span>Finvasia 2026</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
