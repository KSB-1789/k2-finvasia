// src/pages/Onboarding.jsx
// Local: Name → Income → Goal.
// Supabase: Account (email + password) → Name → Income → Goal.

import { useState, useCallback, useLayoutEffect, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useStore,
  seedDemoData,
  isProfileOnboarded,
  setSignupOnboardingPending,
  clearSignupOnboardingPending,
} from '../store'
import { shallow } from 'zustand/shallow'
import { supabase, SUPABASE_ENABLED } from '../lib/supabase'
import { Button, Input } from '../components/ui/index.jsx'

const INCOME_PRESETS = [15000, 25000, 40000, 60000, 80000, 100000]
const GOAL_PRESETS   = [5000, 10000, 15000, 20000, 30000, 50000]

const DEMO_PROFILE = {
  name: 'Demo User',
  monthly_income: 45000,
  savings_goal: 8000,
  is_demo: true,
}

function profileHasName(p) {
  return Boolean(p?.name?.trim())
}

function profileHasIncome(p) {
  const v = p?.monthly_income
  return v != null && !Number.isNaN(Number(v)) && Number(v) >= 1000
}

/** First wizard step index that still needs input (auth handled separately). */
function firstIncompleteWizardStep(steps, p) {
  let i = 0
  if (steps[0] === 'auth') i = 1
  for (; i < steps.length; i++) {
    const k = steps[i]
    if (k === 'name' && !profileHasName(p)) return i
    if (k === 'income' && !profileHasIncome(p)) return i
    if (k === 'goal') return i
  }
  return Math.max(0, steps.length - 1)
}

function hydrateFormFromProfile(p, setForm) {
  if (!p) return
  setForm({
    name: p.name?.trim() ? String(p.name) : '',
    monthly_income: p.monthly_income != null ? String(p.monthly_income) : '',
    savings_goal: p.savings_goal != null && p.savings_goal !== '' ? String(p.savings_goal) : '',
  })
}

/** After session + profile load: go to app if done; else skip filled steps or finish without goal UI when name+income exist. */
function runResumeFromStore({ navigate, setStep, setForm, setCred, STEPS, onlyAdvanceStep = false }) {
  const p = useStore.getState().profile

  if (isProfileOnboarded(p)) {
    clearSignupOnboardingPending()
    navigate('/log', { replace: true })
    setCred({ email: '', password: '', confirm: '' })
    return
  }

  if (profileHasName(p) && profileHasIncome(p) && !isProfileOnboarded(p)) {
    void useStore.getState()
      .saveProfile({
        onboarded: true,
        savings_goal: p.savings_goal != null && p.savings_goal !== '' ? Number(p.savings_goal) : null,
      })
      .then(() => {
        clearSignupOnboardingPending()
        navigate('/log', { replace: true })
      })
    setCred({ email: '', password: '', confirm: '' })
    return
  }

  const target = firstIncompleteWizardStep(STEPS, p)
  if (onlyAdvanceStep) {
    setStep(s => {
      if (target > s) {
        if (p) hydrateFormFromProfile(p, setForm)
        return target
      }
      return s
    })
  } else {
    setStep(target)
    if (p) hydrateFormFromProfile(p, setForm)
  }
  setCred({ email: '', password: '', confirm: '' })
}

export default function Onboarding() {
  const navigate = useNavigate()
  const saveProfile = useStore(useCallback(s => s.saveProfile, []), shallow)
  const userId = useStore(s => s.userId, shallow)
  const profile = useStore(s => s.profile, shallow)
  const bootLoading = useStore(s => s.loading, shallow)
  const authEmail = useStore(s => s.authEmail, shallow)

  const STEPS = useMemo(
    () => (SUPABASE_ENABLED ? ['auth', 'name', 'income', 'goal'] : ['name', 'income', 'goal']),
    []
  )

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', monthly_income: '', savings_goal: '' })
  const [cred, setCred] = useState({ email: '', password: '', confirm: '' })
  const [authMode, setAuthMode] = useState('signin')
  const [errors, setErrors] = useState({})
  const [authMsg, setAuthMsg] = useState(null)
  const [authMsgKind, setAuthMsgKind] = useState('info')
  const [loading, setLoading] = useState(false)

  const stepKey = STEPS[step] ?? 'name'

  // Resume wizard: skip auth when signed in; skip name/income when already saved; finish without goal screen when both exist.
  useLayoutEffect(() => {
    if (bootLoading) return
    if (SUPABASE_ENABLED && !userId) return
    runResumeFromStore({ navigate, setStep, setForm, setCred, STEPS })
  }, [bootLoading, userId, STEPS, navigate])

  // Second init (e.g. auth listener) can populate profile after first paint — skip wizard without resetting mid-form backward.
  useEffect(() => {
    if (bootLoading || (SUPABASE_ENABLED && !userId)) return
    if (!profile) return
    runResumeFromStore({ navigate, setStep, setForm, setCred, STEPS, onlyAdvanceStep: true })
  }, [bootLoading, userId, profile?.onboarded, profile?.name, profile?.monthly_income, STEPS, navigate])

  function setFormKey(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: null }))
  }

  function validateProfileStep() {
    const e = {}
    if (stepKey === 'name' && !form.name.trim()) e.name = 'We need something to call you'
    if (stepKey === 'income') {
      const v = Number(form.monthly_income)
      if (!v || v < 1000) e.monthly_income = 'Enter a monthly income (min ₹1,000)'
      if (v > 10000000) e.monthly_income = 'That seems off — check the amount'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submitAuth() {
    setAuthMsg(null)
    const em = cred.email.trim().toLowerCase()
    if (!em || !cred.password) {
      setAuthMsgKind('error')
      setAuthMsg('Enter email and password.')
      return
    }
    if (authMode === 'signup' && cred.password !== cred.confirm) {
      setAuthMsgKind('error')
      setAuthMsg('Passwords do not match.')
      return
    }
    if (cred.password.length < 6) {
      setAuthMsgKind('error')
      setAuthMsg('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      let session = null
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: em, password: cred.password })
        if (error) throw error
        session = data.session
        clearSignupOnboardingPending()
        await useStore.getState().init({ session })
        navigate('/log', { replace: true })
        setCred({ email: '', password: '', confirm: '' })
        return
      }
      const { data, error } = await supabase.auth.signUp({ email: em, password: cred.password })
      if (error) throw error
      if (!data.session) {
        setAuthMsgKind('info')
        setAuthMsg('Check your inbox to confirm your email, then sign in. (You can disable confirmation in Supabase Auth → Email for development.)')
        setAuthMode('signin')
        setLoading(false)
        return
      }
      session = data.session
      setSignupOnboardingPending()
      await useStore.getState().init({ session })
      runResumeFromStore({ navigate, setStep, setForm, setCred, STEPS })
    } catch (err) {
      setAuthMsgKind('error')
      setAuthMsg(err?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function next() {
    if (stepKey === 'auth') {
      await submitAuth()
      return
    }
    if (!validateProfileStep()) return
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }
    await submitProfile()
  }

  async function submitProfile() {
    setLoading(true)
    try {
      await saveProfile({
        name: form.name.trim(),
        monthly_income: Number(form.monthly_income),
        savings_goal: Number(form.savings_goal) || null,
        onboarded: true,
        is_demo: false,
      })
      clearSignupOnboardingPending()
      navigate('/log')
    } finally {
      setLoading(false)
    }
  }

  async function useDemo() {
    setLoading(true)
    try {
      await saveProfile({ ...DEMO_PROFILE, onboarded: true, badges: ['first_log'] })
      clearSignupOnboardingPending()
      const { useStore: rawStore } = await import('../store')
      await seedDemoData(rawStore)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    if (SUPABASE_ENABLED && step === 1 && STEPS[0] === 'auth') {
      void (async () => {
        await supabase.auth.signOut()
        await useStore.getState().init()
        setStep(0)
      })()
      return
    }
    setStep(s => Math.max(0, s - 1))
  }

  const isLast = step === STEPS.length - 1
  const displayName = (form.name || profile?.name || '').trim() || 'there'

  const primaryLabel =
    stepKey === 'auth'
      ? (authMode === 'signin' ? 'Sign in' : 'Create account')
      : isLast
        ? "Let's go →"
        : 'Continue →'

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center px-4">
        <p className="text-sm text-[#8888A0]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />

      <div className="w-full max-w-md">
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

        <div className="h-px bg-[#23232F] rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-[#22C55E]"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {stepKey === 'auth' && (
              <div className="space-y-5">
                <div className="flex rounded-xl border border-[#23232F] p-1 bg-[#131318] gap-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthMsg(null) }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      authMode === 'signin'
                        ? 'bg-[#052e16] text-[#22C55E] border border-[#16A34A]/30'
                        : 'text-[#8888A0] hover:text-[#F0F0F5]'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthMsg(null) }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      authMode === 'signup'
                        ? 'bg-[#052e16] text-[#22C55E] border border-[#16A34A]/30'
                        : 'text-[#8888A0] hover:text-[#F0F0F5]'
                    }`}
                  >
                    Sign up
                  </button>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#F0F0F5] mb-1">
                    {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p className="text-[#8888A0] text-sm">
                    {authMode === 'signin'
                      ? 'Sign in with your email and password. Your expenses and profile load from Supabase automatically.'
                      : 'New here? Create an account with email and password, then finish the next steps once (name, income, goal).'}
                  </p>
                </div>
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={cred.email}
                  onChange={e => setCred(c => ({ ...c, email: e.target.value }))}
                  placeholder="you@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  value={cred.password}
                  onChange={e => setCred(c => ({ ...c, password: e.target.value }))}
                  placeholder="At least 6 characters"
                />
                {authMode === 'signup' && (
                  <Input
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    value={cred.confirm}
                    onChange={e => setCred(c => ({ ...c, confirm: e.target.value }))}
                    placeholder="Repeat password"
                  />
                )}
                {authMsg && (
                  <p className={`text-xs rounded-xl px-3 py-2 border ${
                    authMsgKind === 'error'
                      ? 'text-[#FB7185] border-[#881337]/50 bg-[#4c0519]/20'
                      : 'text-[#A78BFA] border-[#4C1D95]/40 bg-[#2e1065]/20'
                  }`}>
                    {authMsg}
                  </p>
                )}
              </div>
            )}

            {stepKey === 'name' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#F0F0F5] mb-1">What should Kai call you?</h1>
                  <p className="text-[#8888A0] text-sm">
                    {SUPABASE_ENABLED
                      ? 'This is only your display name in the app — your login is your email.'
                      : 'Just a first name. This is your private space.'}
                  </p>
                  {SUPABASE_ENABLED && authEmail && (
                    <p className="text-[10px] text-[#55556A] font-mono mt-2 truncate">Signed in as {authEmail}</p>
                  )}
                </div>
                <Input
                  label="Your name"
                  value={form.name}
                  onChange={e => setFormKey('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="e.g. Arjun"
                  autoFocus
                  error={errors.name}
                />
              </div>
            )}

            {stepKey === 'income' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#F0F0F5] mb-1">
                    What's your monthly income, {displayName}?
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
                  onChange={e => setFormKey('monthly_income', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="45000"
                  error={errors.monthly_income}
                />
                <div>
                  <p className="text-[#55556A] text-xs mb-2">Quick select</p>
                  <div className="flex flex-wrap gap-2">
                    {INCOME_PRESETS.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormKey('monthly_income', String(v))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          Number(form.monthly_income) === v
                            ? 'bg-[#052e16] border-[#22C55E] text-[#22C55E]'
                            : 'bg-[#131318] border-[#23232F] text-[#8888A0] hover:border-[#3D3D50]'
                        }`}
                      >
                        ₹{(v / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stepKey === 'goal' && (
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
                  onChange={e => setFormKey('savings_goal', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="10000"
                />
                <div>
                  <p className="text-[#55556A] text-xs mb-2">Suggestions based on your income</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_PRESETS.filter(v => v < Number(form.monthly_income)).slice(0, 5).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormKey('savings_goal', String(v))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          Number(form.savings_goal) === v
                            ? 'bg-[#052e16] border-[#22C55E] text-[#22C55E]'
                            : 'bg-[#131318] border-[#23232F] text-[#8888A0] hover:border-[#3D3D50]'
                        }`}
                      >
                        ₹{(v / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                  <p className="text-[#55556A] text-xs mt-2">
                    Aim for 20%+ of income. That's ₹{Math.round(Number(form.monthly_income) * 0.2).toLocaleString('en-IN')}/month for you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setFormKey('savings_goal', ''); submitProfile() }}
                  className="text-xs text-[#55556A] underline underline-offset-2 hover:text-[#8888A0]"
                >
                  Skip for now — I'll set this later
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 space-y-3">
          <Button className="w-full" size="lg" onClick={() => void next()} loading={loading}>
            {primaryLabel}
          </Button>

          {step > 0 && (
            <Button variant="ghost" className="w-full" size="md" type="button" onClick={goBack}>
              ← Back
            </Button>
          )}
        </div>

        {stepKey === 'name' && userId && (
          <div className="mt-8 pt-6 border-t border-[#23232F]">
            <p className="text-center text-xs text-[#55556A] mb-3">
              Evaluating for the hackathon?
            </p>
            <Button variant="violet" className="w-full" size="md" type="button" onClick={() => void useDemo()}>
              Load Demo Profile (pre-filled data)
            </Button>
            <p className="text-center text-[10px] text-[#55556A] mt-2">
              Loads a realistic profile. You can edit everything after.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
