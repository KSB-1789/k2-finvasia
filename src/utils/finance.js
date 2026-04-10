// src/utils/finance.js
// Financial calculation utilities

/**
 * Calculate SIP future value
 * @param {number} monthly - Monthly SIP amount
 * @param {number} rate - Annual return rate (e.g., 0.12 for 12%)
 * @param {number} years - Investment duration in years
 * @returns {number} Future value
 */
export function sipFutureValue(monthly, rate = 0.12, years) {
  const months = years * 12
  const monthlyRate = rate / 12
  return monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
}

/**
 * Format number as Indian currency
 */
export function formatINR(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/**
 * Generate compounding chart data for cashback vs investment
 * @param {number} monthlySavings - Monthly amount
 * @param {number} years - Total years
 */
export function generateGrowthData(monthlySavings, years = 10) {
  const data = []
  for (let y = 0; y <= years; y++) {
    const cashbackValue = monthlySavings * 12 * y // flat accumulation
    const sipValue = y === 0 ? 0 : sipFutureValue(monthlySavings, 0.12, y)
    const fdValue = y === 0 ? 0 : sipFutureValue(monthlySavings, 0.065, y)
    data.push({
      year: y === 0 ? 'Now' : `${y}Y`,
      cashback: Math.round(cashbackValue),
      sip: Math.round(sipValue),
      fd: Math.round(fdValue),
    })
  }
  return data
}

/**
 * Smart saving trigger rules
 */
export const SAVING_TRIGGERS = [
  {
    id: 'food_delivery_heavy',
    category: 'Food Delivery',
    condition: (amt) => amt > 2000,
    threshold: 2000,
    suggestSave: 200,
    label: 'Food delivery > ₹2000/month',
    description: 'Order delivery more than 3x a week? Auto-divert ₹200 to savings.',
  },
  {
    id: 'entertainment_high',
    category: 'Entertainment',
    condition: (amt) => amt > 1500,
    threshold: 1500,
    suggestSave: 150,
    label: 'Entertainment > ₹1500/month',
    description: 'Weekend movies & OTT adding up? Redirect ₹150 to a liquid fund.',
  },
  {
    id: 'shopping_splurge',
    category: 'Shopping',
    condition: (amt) => amt > 3000,
    threshold: 3000,
    suggestSave: 300,
    label: 'Shopping > ₹3000/month',
    description: 'Impulse buys stacking up — save ₹300/month instead.',
  },
  {
    id: 'subscriptions_creep',
    category: 'Subscriptions',
    condition: (amt) => amt > 800,
    threshold: 800,
    suggestSave: 100,
    label: 'Subscriptions > ₹800/month',
    description: 'Subscription creep is real. Audit & save ₹100+.',
  },
]

/**
 * Check which triggers are active for current spending
 */
export function getActiveTriggers(spending) {
  return SAVING_TRIGGERS.filter(t => {
    const amt = spending[t.category] || 0
    return t.condition(amt)
  })
}

// Badge definitions
export const BADGES = {
  first_login: { name: 'First Step', emoji: '👋', desc: 'You showed up. That already puts you ahead.' },
  week_streak: { name: '7-Day Streak', emoji: '🔥', desc: 'A week of tracking. The habit is forming.' },
  score_50: { name: 'Halfway There', emoji: '⚡', desc: 'Crossed 50 on the wealth score.' },
  score_70: { name: 'Budget Boss', emoji: '💡', desc: 'Score hit 70. You\'re in the top tier.' },
  score_85: { name: 'Wealth Builder', emoji: '🏔️', desc: 'Score 85+. You\'re what GenZ finance looks like.' },
  first_nudge: { name: 'Kai\'s Friend', emoji: '🤝', desc: 'Got your first AI nudge from Kai.' },
  cashback_convert: { name: 'Convertor', emoji: '⚗️', desc: 'Ran the cashback → investment calculator.' },
  trigger_fired: { name: 'Rule Setter', emoji: '⚙️', desc: 'A smart saving trigger fired for you.' },
  low_food: { name: 'Home Chef', emoji: '👨‍🍳', desc: 'Food delivery under ₹1500 — cooking it!' },
}
