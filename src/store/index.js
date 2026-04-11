// src/store/index.js
// Zustand store. All state is user-specific. Zero default/fake data.
// Supabase is authoritative when available; localStorage mirrors for offline.

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { supabase, SUPABASE_ENABLED, ensureUserId } from '../lib/supabase'
import { startOfMonth, format, isToday, parseISO } from 'date-fns'

// ── Helpers ────────────────────────────────────────────────────────────────
const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(`k2:${k}`); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => { try { localStorage.setItem(`k2:${k}`, JSON.stringify(v)) } catch {} },
  del: (k)    => { try { localStorage.removeItem(`k2:${k}`) } catch {} },
}

/** Coerce Supabase / LS shapes so onboarded + numbers match what the UI expects. */
export function normalizeProfileRow(row, uid) {
  if (!row) return null
  const ob = row.onboarded
  const onboarded =
    ob === true ||
    ob === 1 ||
    (typeof ob === 'string' && ['true', 't', '1', 'yes'].includes(ob.toLowerCase()))
  const inc = row.monthly_income
  const monthly_income =
    inc != null && inc !== '' && !Number.isNaN(Number(inc)) ? Number(inc) : null
  const sg = row.savings_goal
  const savings_goal =
    sg != null && sg !== '' && !Number.isNaN(Number(sg)) ? Number(sg) : null

  return {
    ...row,
    user_id: row.user_id || uid,
    name: row.name ?? null,
    monthly_income,
    savings_goal,
    onboarded: Boolean(onboarded),
    badges: Array.isArray(row.badges) ? row.badges : [],
    streak: Number(row.streak) || 0,
    last_log_date: row.last_log_date ?? null,
    is_demo: Boolean(row.is_demo),
    updated_at: row.updated_at,
  }
}

export function isProfileOnboarded(p) {
  return p?.onboarded === true
}

/** Set after email sign-up (with session). Cleared on sign-in, logout, or wizard complete. */
const LS_SIGNUP_ONBOARDING = 'k2:signup-onboarding-pending'

export function setSignupOnboardingPending() {
  try {
    localStorage.setItem(LS_SIGNUP_ONBOARDING, '1')
  } catch {
    /* ignore */
  }
}

export function clearSignupOnboardingPending() {
  try {
    localStorage.removeItem(LS_SIGNUP_ONBOARDING)
  } catch {
    /* ignore */
  }
}

export function isSignupOnboardingPending() {
  try {
    return localStorage.getItem(LS_SIGNUP_ONBOARDING) === '1'
  } catch {
    return false
  }
}

// ── Score computation (pure function, no side effects) ─────────────────────
export function computeScore({ expenses, profile }) {
  if (!expenses.length || !profile?.monthly_income) return null

  const income = profile.monthly_income
  const thisMonth = format(startOfMonth(new Date()), 'yyyy-MM')
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth))
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const savingsRate = Math.max(0, (income - totalSpent) / income)

  // Category ratios
  const byCategory = {}
  for (const e of monthExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  }
  const impulsive = (byCategory['Food Delivery'] || 0) + (byCategory['Entertainment'] || 0) + (byCategory['Shopping'] || 0)
  const impulsiveRatio = totalSpent > 0 ? impulsive / totalSpent : 0

  let score = 40 // base
  score += Math.round(savingsRate * 40)       // savings rate: up to +40
  score -= Math.round(impulsiveRatio * 25)    // impulse penalty: up to -25
  score += Math.min(10, profile.streak || 0)  // streak bonus: up to +10
  score += profile.savings_goal ? 5 : 0       // has a goal: +5

  return Math.min(100, Math.max(1, Math.round(score)))
}

export function scoreInsights({ expenses, profile }) {
  if (!expenses.length || !profile?.monthly_income) return { drags: [], boosts: [] }

  const income = profile.monthly_income
  const thisMonth = format(startOfMonth(new Date()), 'yyyy-MM')
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth))
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const saved = income - totalSpent

  const byCategory = {}
  for (const e of monthExpenses) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount

  const drags = [], boosts = []

  if (saved < 0) drags.push(`Overspent by ₹${Math.abs(saved).toLocaleString('en-IN')} this month`)
  if ((byCategory['Food Delivery'] || 0) > income * 0.15) drags.push(`Food delivery is ${((byCategory['Food Delivery']/income)*100).toFixed(0)}% of income — aim for <10%`)
  if ((byCategory['Shopping'] || 0) > income * 0.20) drags.push(`Shopping at ₹${byCategory['Shopping'].toLocaleString('en-IN')} — try the 48-hour rule`)
  if (!profile.savings_goal) drags.push('No savings goal set — goals improve discipline 3×')

  if (saved > 0) boosts.push(`Saving ₹${saved.toLocaleString('en-IN')} so far this month 🎯`)
  if ((profile.streak || 0) >= 3) boosts.push(`${profile.streak}-day logging streak 🔥`)
  if ((byCategory['Groceries'] || 0) > 0 && !(byCategory['Food Delivery'])) boosts.push('Cooking at home — no delivery spend 🥗')

  return { drags, boosts }
}

// ── Store ─────────────────────────────────────────────────────────────────
export const useStore = create(
  immer((set, get) => ({
    // ── State
    userId: null,
    authEmail: null,    // Supabase session email (when configured)
    profile: null,      // { name, monthly_income, savings_goal, onboarded, badges, streak, last_log_date, is_demo? }
    expenses: [],       // [{ id, amount, category, note, date, created_at }]
    nudges: [],         // [{ id, text, category, created_at, rating }]
    loading: true,
    syncing: false,

    // ── Init: load userId, then pull profile + expenses
    // Pass `session` right after signIn/signUp so we never race getSession() before the client persists it.
    async init(opts = {}) {
      const passedSession = opts?.session ?? null
      set(s => { s.loading = true })

      let uid
      if (SUPABASE_ENABLED && supabase && passedSession?.user?.id) {
        uid = passedSession.user.id
      } else {
        uid = await ensureUserId()
      }

      const emailFromPass = passedSession?.user?.email ?? null
      set(s => {
        s.userId = uid
        s.authEmail = emailFromPass
      })

      if (SUPABASE_ENABLED && supabase) {
        if (emailFromPass == null) {
          const { data: { session } } = await supabase.auth.getSession()
          set(s => { s.authEmail = session?.user?.email ?? null })
        }
        if (!uid) {
          set(s => {
            s.profile = null
            s.expenses = []
            s.nudges = []
            s.loading = false
          })
          return
        }
        await get()._pullFromSupabase(uid)
      } else {
        const profileRaw = LS.get(`${uid}:profile`)
        const profile = normalizeProfileRow(profileRaw, uid)
        const expenses = LS.get(`${uid}:expenses`, [])
        const nudges   = LS.get(`${uid}:nudges`, [])
        set(s => {
          s.profile = profile
          s.expenses = expenses
          s.nudges = nudges
          s.loading = false
        })
      }
    },

    async logout() {
      const uid = get().userId
      set(s => { s.loading = true })
      if (uid) {
        LS.del(`${uid}:profile`)
        LS.del(`${uid}:expenses`)
        LS.del(`${uid}:nudges`)
      }
      if (!SUPABASE_ENABLED) {
        try { localStorage.removeItem('k2_uid') } catch { /* ignore */ }
      }
      if (SUPABASE_ENABLED && supabase) {
        await supabase.auth.signOut()
      }
      clearSignupOnboardingPending()
      set(s => {
        s.userId = null
        s.authEmail = null
        s.profile = null
        s.expenses = []
        s.nudges = []
      })
      await get().init()
    },

    async _pullFromSupabase(uid) {
      if (!uid) {
        set(s => {
          s.profile = null
          s.expenses = []
          s.nudges = []
          s.loading = false
        })
        return
      }
      const [
        { data: profileData, error: profileError },
        { data: expenseData },
        { data: nudgeData },
      ] = await Promise.all([
        supabase.from('profile').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('expenses').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(500),
        supabase.from('nudges').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(30),
      ])
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[k2] profile select:', profileError.message)
      }

      // Server row missing (new user or lag): reuse same-device LS cache so resume logic still works.
      const lsProfile = LS.get(`${uid}:profile`)
      const rawProfile =
        profileData ??
        (lsProfile && (lsProfile.user_id === uid || !lsProfile.user_id) ? { ...lsProfile, user_id: uid } : null)

      const profile = normalizeProfileRow(rawProfile, uid)

      set(s => {
        s.profile = profile
        s.expenses = expenseData || []
        s.nudges = nudgeData || []
        s.loading = false
      })
      LS.set(`${uid}:profile`, profile)
      LS.set(`${uid}:expenses`, expenseData || [])
      LS.set(`${uid}:nudges`, nudgeData || [])
    },

    // ── Profile ────────────────────────────────────────────────────────────
    async saveProfile(updates) {
      const uid = get().userId
      if (!uid) throw new Error('Not signed in')

      const merged = { ...(get().profile || {}), ...updates, user_id: uid, updated_at: new Date().toISOString() }
      const normalized = normalizeProfileRow(merged, uid)
      set(s => { s.profile = normalized })
      LS.set(`${uid}:profile`, normalized)

      if (SUPABASE_ENABLED && supabase) {
        const PROFILE_KEYS = ['user_id', 'name', 'monthly_income', 'savings_goal', 'onboarded', 'badges', 'streak', 'last_log_date', 'updated_at', 'is_demo']
        const row = Object.fromEntries(
          PROFILE_KEYS.filter(k => normalized[k] !== undefined).map(k => [k, normalized[k]])
        )
        const { error: upErr } = await supabase.from('profile').upsert(row, { onConflict: 'user_id' })
        if (upErr) {
          console.error('[k2] profile upsert:', upErr.message)
          throw upErr
        }
        const { data: fresh, error: pullErr } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()
        if (pullErr) console.error('[k2] profile re-fetch:', pullErr.message)
        if (fresh) {
          const again = normalizeProfileRow(fresh, uid)
          set(s => { s.profile = again })
          LS.set(`${uid}:profile`, again)
        }
      }
    },

    // ── Expenses ───────────────────────────────────────────────────────────
    async addExpense({ amount, category, note, date }) {
      const uid = get().userId
      const expense = {
        id: crypto.randomUUID(),
        user_id: uid,
        amount: Number(amount),
        category,
        note: note?.trim() || null,
        date: date || format(new Date(), 'yyyy-MM-dd'),
        created_at: new Date().toISOString(),
      }

      set(s => { s.expenses.unshift(expense) })

      // Update streak
      await get()._updateStreak()

      // Mirror
      const all = get().expenses
      LS.set(`${uid}:expenses`, all)

      if (SUPABASE_ENABLED && supabase) {
        const { data, error } = await supabase.from('expenses').insert({ ...expense }).select().single()
        if (!error && data) {
          // replace temp id with real db id
          set(s => { const i = s.expenses.findIndex(e => e.id === expense.id); if (i >= 0) s.expenses[i] = data })
          LS.set(`${uid}:expenses`, get().expenses)
        }
      }

      // Auto-award badges
      await get()._checkBadges()

      return expense
    },

    async deleteExpense(id) {
      const uid = get().userId
      set(s => { s.expenses = s.expenses.filter(e => e.id !== id) })
      LS.set(`${uid}:expenses`, get().expenses)
      if (SUPABASE_ENABLED && supabase) await supabase.from('expenses').delete().eq('id', id)
    },

    async updateExpense(id, updates) {
      const uid = get().userId
      const payload = {
        amount: updates.amount != null ? Number(updates.amount) : undefined,
        category: updates.category,
        note: updates.note === undefined ? undefined : (String(updates.note).trim() || null),
        date: updates.date,
      }
      // Drop undefined so we do not overwrite columns accidentally
      const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined))

      set(s => {
        const expenseIndex = s.expenses.findIndex(e => e.id === id)
        if (expenseIndex >= 0) {
          s.expenses[expenseIndex] = { ...s.expenses[expenseIndex], ...clean }
        }
      })
      LS.set(`${uid}:expenses`, get().expenses)
      if (SUPABASE_ENABLED && supabase) {
        const { error } = await supabase
          .from('expenses')
          .update(clean)
          .eq('id', id)
          .eq('user_id', uid)
        if (error) throw error
      }
    },

    async _updateStreak() {
      const profile = get().profile
      const today = format(new Date(), 'yyyy-MM-dd')
      if (profile?.last_log_date === today) return // already logged today

      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
      const streak = profile?.last_log_date === yesterday ? (profile.streak || 0) + 1 : 1
      await get().saveProfile({ streak, last_log_date: today })
    },

    // ── Nudges ─────────────────────────────────────────────────────────────
    async addNudge({ text, category }) {
      const uid = get().userId
      const nudge = {
        id: crypto.randomUUID(),
        user_id: uid,
        text,
        category: category || null,
        rating: null,
        created_at: new Date().toISOString(),
      }
      set(s => { s.nudges.unshift(nudge) })
      LS.set(`${uid}:nudges`, get().nudges.slice(0, 30))

      if (SUPABASE_ENABLED && supabase) {
        await supabase.from('nudges').insert(nudge)
      }
      return nudge
    },

    async rateNudge(id, rating) {
      const uid = get().userId
      set(s => { const n = s.nudges.find(n => n.id === id); if (n) n.rating = rating })
      LS.set(`${uid}:nudges`, get().nudges)
      if (SUPABASE_ENABLED && supabase) await supabase.from('nudges').update({ rating }).eq('id', id)
    },

    // ── Badges ─────────────────────────────────────────────────────────────
    async _checkBadges() {
      const { expenses, profile } = get()
      const earned = profile?.badges || []
      const newBadges = []

      if (expenses.length >= 1 && !earned.includes('first_log')) newBadges.push('first_log')
      if (expenses.length >= 10 && !earned.includes('ten_logs')) newBadges.push('ten_logs')
      if ((profile?.streak || 0) >= 7 && !earned.includes('week_streak')) newBadges.push('week_streak')

      const score = computeScore({ expenses, profile })
      if (score >= 60 && !earned.includes('score_60')) newBadges.push('score_60')
      if (score >= 80 && !earned.includes('score_80')) newBadges.push('score_80')

      if (newBadges.length) {
        await get().saveProfile({ badges: [...earned, ...newBadges] })
      }
    },

    // ── Selectors (computed, not stored) ──────────────────────────────────
    get currentMonth() { return format(startOfMonth(new Date()), 'yyyy-MM') },

    get monthExpenses() {
      const m = format(startOfMonth(new Date()), 'yyyy-MM')
      return get().expenses.filter(e => e.date.startsWith(m))
    },

    get totalThisMonth() {
      return get().monthExpenses.reduce((s, e) => s + e.amount, 0)
    },

    get byCategory() {
      const out = {}
      for (const e of get().monthExpenses) out[e.category] = (out[e.category] || 0) + e.amount
      return out
    },

    get score() {
      return computeScore({ expenses: get().expenses, profile: get().profile })
    },
  }))
)

// ── Demo seeder (called from Onboarding demo mode) ────────────────────────────
/** Replace expenses + nudges with the demo dataset (local + Supabase). Deletes existing rows in cloud first so nothing stale remains. */
export async function seedDemoData(storeInstance) {
  const { buildDemoExpenses, DEMO_NUDGES } = await import('../lib/demoSeed.js')
  const uid = storeInstance.getState().userId
  if (!uid) throw new Error('Not signed in')

  const expenses = buildDemoExpenses(uid)
  const nudges   = DEMO_NUDGES.map(n => ({ ...n, user_id: uid, id: crypto.randomUUID() }))

  storeInstance.setState(s => { s.expenses = expenses; s.nudges = nudges })

  const lsSet = (k, v) => { try { localStorage.setItem(`k2:${k}`, JSON.stringify(v)) } catch {} }
  lsSet(`${uid}:expenses`, expenses)
  lsSet(`${uid}:nudges`,   nudges)

  if (SUPABASE_ENABLED && supabase) {
    const { error: delE } = await supabase.from('expenses').delete().eq('user_id', uid)
    if (delE) throw delE
    const { error: delN } = await supabase.from('nudges').delete().eq('user_id', uid)
    if (delN) throw delN
    if (expenses.length) {
      const { error: insE } = await supabase.from('expenses').insert(expenses)
      if (insE) throw insE
    }
    if (nudges.length) {
      const { error: insN } = await supabase.from('nudges').insert(nudges)
      if (insN) throw insN
    }
  }
}
