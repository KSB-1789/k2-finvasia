// src/utils/finance.js

export const CATEGORIES = [
  { id: 'Food Delivery',  emoji: '🍕', color: '#F43F5E' },
  { id: 'Groceries',      emoji: '🛒', color: '#22C55E' },
  { id: 'Dining Out',     emoji: '🍽️', color: '#F97316' },
  { id: 'Transport',      emoji: '🚇', color: '#06B6D4' },
  { id: 'Shopping',       emoji: '🛍️', color: '#A78BFA' },
  { id: 'Entertainment',  emoji: '🎬', color: '#EC4899' },
  { id: 'Subscriptions',  emoji: '📱', color: '#8B5CF6' },
  { id: 'Health',         emoji: '💊', color: '#34D399' },
  { id: 'Education',      emoji: '📚', color: '#60A5FA' },
  { id: 'Bills',          emoji: '⚡', color: '#FBBF24' },
  { id: 'Others',         emoji: '📦', color: '#6B7280' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

/** SIP future value at 12% annual (monthly compounding) */
export function sipFV(monthly, years) {
  const n = years * 12
  const r = 0.01 // 1% per month
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

/** Format number as ₹ with Indian notation */
export function inr(amount, decimals = 0) {
  if (amount == null || isNaN(amount)) return '₹0'
  const n = Number(amount)
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/** FD lump-sum style FV (matches Growth.jsx headline fdVal for same horizon). */
export function fdFV(monthly, years) {
  if (years <= 0) return 0
  const principal = monthly * 12 * years
  return principal * (1 + (0.065 / 12) * ((years * 12) / 2))
}

/** Growth comparison data for chart */
export function growthData(monthly, years) {
  return Array.from({ length: years + 1 }, (_, y) => ({
    year: y === 0 ? 'Now' : `${y}Y`,
    sip:      y === 0 ? 0 : Math.round(sipFV(monthly, y)),
    cashback: Math.round(monthly * 12 * y),
    fd:       y === 0 ? 0 : Math.round(fdFV(monthly, y)),
  }))
}

/** Level info based on score */
export function levelFromScore(score) {
  if (!score) return { name: 'Not rated yet', emoji: '—', color: '#6B7280', next: 'Log expenses to get rated' }
  if (score >= 85) return { name: 'Wealth Builder',  emoji: '🏔️', color: '#F59E0B', next: null }
  if (score >= 70) return { name: 'SIP Starter',     emoji: '🚀', color: '#22C55E', next: 'Wealth Builder at 85' }
  if (score >= 55) return { name: 'Budget Boss',     emoji: '💡', color: '#06B6D4', next: 'SIP Starter at 70' }
  if (score >= 40) return { name: 'Saver Rookie',    emoji: '🌱', color: '#A78BFA', next: 'Budget Boss at 55' }
  return             { name: 'Spend Explorer',       emoji: '🗺️', color: '#F43F5E', next: 'Saver Rookie at 40' }
}

export const ALL_BADGES = {
  first_log:   { emoji: '📝', name: 'First Log',     desc: 'Logged your first expense.' },
  ten_logs:    { emoji: '🔟', name: 'Ten Deep',       desc: 'Logged 10 expenses.' },
  week_streak: { emoji: '🔥', name: '7-Day Streak',   desc: 'Logged every day for a week.' },
  score_60:    { emoji: '⚡', name: 'Halfway',         desc: 'Financial score hit 60.' },
  score_80:    { emoji: '🏆', name: 'Power Saver',    desc: 'Financial score hit 80.' },
}

/** Trigger rules — fire when category exceeds threshold */
export const TRIGGERS = [
  {
    id: 'food_high',
    category: 'Food Delivery',
    thresholdPct: 0.10, // 10% of income
    saveSuggestion: (excess) => Math.round(Math.min(excess * 0.5, 1000)),
    label: (cat, amt, income) => `Food delivery hit ₹${inr(amt)} — ${((amt/income)*100).toFixed(0)}% of your income`,
  },
  {
    id: 'shopping_high',
    category: 'Shopping',
    thresholdPct: 0.15,
    saveSuggestion: (excess) => Math.round(Math.min(excess * 0.4, 800)),
    label: (cat, amt) => `Shopping at ${inr(amt)} this month — check if it was all intentional`,
  },
  {
    id: 'entertainment_high',
    category: 'Entertainment',
    thresholdPct: 0.08,
    saveSuggestion: (excess) => Math.round(Math.min(excess * 0.5, 500)),
    label: (cat, amt) => `Entertainment spend: ${inr(amt)} — nice, but let's see what half of that compounds to`,
  },
]

export function getActiveTriggers(byCategory, income) {
  if (!income) return []
  return TRIGGERS.filter(t => (byCategory[t.category] || 0) > income * t.thresholdPct)
    .map(t => {
      const amt = byCategory[t.category]
      const excess = amt - income * t.thresholdPct
      const saveSuggestion = t.saveSuggestion(excess)
      const fiveYr = Math.round(sipFV(saveSuggestion, 5))
      return { ...t, amt, saveSuggestion, fiveYr, label: t.label(t.category, amt, income) }
    })
}
