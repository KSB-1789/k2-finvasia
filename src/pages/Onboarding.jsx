// src/pages/Onboarding.jsx
// CRITICAL PAGE. This is where real data enters the system.
// Three steps: Name → Income → Savings goal.
// No skipping income — it's required for score computation.
// Optionally: demo mode pre-fills plausible data the user confirms.

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, seedDemoData } from '../store'
import { shallow } from 'zustand/shallow'
import { Button, Input } from '../components/ui/index.jsx'

const STEPS = ['name', 'income', 'goal']

const INCOME_PRESETS = [15000, 25000, 40000, 60000, 80000, 100000]
const GOAL_PRESETS   = [5000, 10000, 15000, 20000, 30000, 50000]

// Demo mode — plausible student/young-professional profile
const DEMO_PROFILE = {
  name: 'Demo User',
  monthly_income: 45000,
  savings_goal: 8000,
}

export default function Onboarding() {
  console.log('Onboarding rendering')
  const navigate = useNavigate()
  const selector = useCallback(s => s.saveProfile, [])
  const saveProfile = useStore(selector, shallow)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', monthly_income: '', savings_goal: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: null }))
  }

  function validate() {
    const e = {}
    if (step === 0 && !form.name.trim()) e.name = 'We need something to call you'
    if (step === 1) {
      const v = Number(form.monthly_income)
      if (!v || v < 1000) e.monthly_income = 'Enter a monthly income (min ₹1,000)'
      if (v > 10000000) e.monthly_income = 'That seems off — check the amount'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function next() {
    if (!validate()) return
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }
    await submit()
  }

  async function submit() {
    setLoading(true)
    await saveProfile({
      name: form.name.trim(),
      monthly_income: Number(form.monthly_income),
      savings_goal: Number(form.savings_goal) || null,
      onboarded: true,
    })
    navigate('/log')
  }

  async function useDemo() {
    setDemoMode(true)
    setLoading(true)
    await saveProfile({ ...DEMO_PROFILE, onboarded: true, badges: ['first_log'] })
    // Seed realistic expenses into the user's store
    const { useStore: rawStore } = await import('../store')
    await seedDemoData(rawStore)
    navigate('/dashboard')
  }

  const currentKey = STEPS[step]

  return (
    <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center px-4">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />

      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 mb-10"
        >
          <div className="w-8 h-8 rounded-lg bg-[#22C55E] flex items-center justify-center">
            <span className="font-mono font-black text-[#0C0C10] text-sm">K2</span>
          </div>
          <span className="font-semibold text-[#F0F0F5]">K2 Wealth</span>
          <span className="ml-auto text-xs text-[#55556A] font-mono">
            {step + 1} of {STEPS.length}
          </span>
        </motion.div>

        {/* Progress bar */}
        <div className="h-px bg-[#23232F] rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-[#22C55E]"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#F0F0F5] mb-1">What should Kai call you?</h1>
                  <p className="text-[#8888A0] text-sm">Just a first name. This is your private space.</p>
                </div>
                <Input
                  label="Your name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="e.g. Arjun"
                  autoFocus
                  error={errors.name}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#F0F0F5] mb-1">
                    What's your monthly income, {form.name}?
                  </h1>
                  <p className="text-[#8888A0] text-sm">
                    This is the foundation of your financial score. It never leaves your device without your permission.
                  </p>
                </div>
                <Input
                  label="Take-home pay per month"
                  type="number"
                  prefix="₹"
                  value={form.monthly_income}
                  onChange={e => set('monthly_income', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="45000"
                  error={errors.monthly_income}
                />
                {/* Presets */}
                <div>
                  <p className="text-[#55556A] text-xs mb-2">Quick select</p>
                  <div className="flex flex-wrap gap-2">
                    {INCOME_PRESETS.map(v => (
                      <button
                        key={v}
                        onClick={() => set('monthly_income', v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          Number(form.monthly_income) === v
                            ? 'bg-[#052e16] border-[#22C55E] text-[#22C55E]'
                            : 'bg-[#131318] border-[#23232F] text-[#8888A0] hover:border-[#3D3D50]'
                        }`}
                      >
                        ₹{(v/1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#F0F0F5] mb-1">Set a monthly savings target</h1>
                  <p className="text-[#8888A0] text-sm">
                    How much do you want to save every month? This shapes your score and nudges.
                    You can change it any time.
                  </p>
                </div>
                <Input
                  label="Monthly savings goal"
                  type="number"
                  prefix="₹"
                  value={form.savings_goal}
                  onChange={e => set('savings_goal', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="10000"
                />
                {/* Presets */}
                <div>
                  <p className="text-[#55556A] text-xs mb-2">Suggestions based on your income</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_PRESETS.filter(v => v < Number(form.monthly_income)).slice(0, 5).map(v => (
                      <button
                        key={v}
                        onClick={() => set('savings_goal', v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          Number(form.savings_goal) === v
                            ? 'bg-[#052e16] border-[#22C55E] text-[#22C55E]'
                            : 'bg-[#131318] border-[#23232F] text-[#8888A0] hover:border-[#3D3D50]'
                        }`}
                      >
                        ₹{(v/1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                  <p className="text-[#55556A] text-xs mt-2">
                    💡 Aim for 20%+ of income. That's ₹{Math.round(Number(form.monthly_income) * 0.2).toLocaleString('en-IN')}/month for you.
                  </p>
                </div>
                {/* Skip */}
                <button
                  onClick={() => { set('savings_goal', ''); submit() }}
                  className="text-xs text-[#55556A] underline underline-offset-2 hover:text-[#8888A0]"
                >
                  Skip for now — I'll set this later
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-8 space-y-3">
          <Button className="w-full" size="lg" onClick={next} loading={loading}>
            {step < STEPS.length - 1 ? 'Continue →' : "Let's go →"}
          </Button>

          {step > 0 && (
            <Button variant="ghost" className="w-full" size="md" onClick={() => setStep(s => s - 1)}>
              ← Back
            </Button>
          )}
        </div>

        {/* Demo mode — clearly labeled */}
        {step === 0 && (
          <div className="mt-8 pt-6 border-t border-[#23232F]">
            <p className="text-center text-xs text-[#55556A] mb-3">
              Evaluating for the hackathon?
            </p>
            <Button variant="violet" className="w-full" size="md" onClick={useDemo}>
              🎭 Load Demo Profile (pre-filled data)
            </Button>
            <p className="text-center text-[10px] text-[#55556A] mt-2">
              Loads a realistic student profile. You can edit everything after.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
