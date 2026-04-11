// src/lib/demoSeed.js
// Seeds a realistic demo dataset when user picks "Demo Mode".
// All data is attributed to the user's actual userId — it's THEIR data.
// They can edit/delete everything. Nothing is hardcoded in UI.

import { format, subDays } from 'date-fns'

/**
 * Returns a plausible set of expenses for a 23-year-old software professional
 * earning ₹45,000/month in Chandigarh. Covers the last 30 days.
 */
export function buildDemoExpenses(userId) {
  const today = new Date()
  const expense = (daysAgo, category, amount, note) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    category,
    amount,
    note: note || null,
    date: format(subDays(today, daysAgo), 'yyyy-MM-dd'),
    created_at: subDays(today, daysAgo).toISOString(),
  })

  return [
    // Food Delivery — noticeable but not absurd
    expense(1,  'Food Delivery', 249, 'Swiggy biryani'),
    expense(3,  'Food Delivery', 189, 'Zomato pizza'),
    expense(6,  'Food Delivery', 320, 'Swiggy dinner'),
    expense(9,  'Food Delivery', 210, 'McD delivery'),
    expense(14, 'Food Delivery', 175, 'Swiggy lunch'),
    expense(18, 'Food Delivery', 299, 'KFC bucket'),
    expense(22, 'Food Delivery', 260, 'Dominos'),
    // Groceries
    expense(2,  'Groceries', 1800, 'Big Bazaar monthly'),
    expense(15, 'Groceries', 620, 'DMart veggies'),
    expense(28, 'Groceries', 450, 'Local market'),
    // Transport
    expense(1,  'Transport', 180, 'Rapido weekly'),
    expense(5,  'Transport', 65, 'Auto'),
    expense(10, 'Transport', 250, 'Ola to airport'),
    expense(20, 'Transport', 120, 'Metro + auto'),
    // Entertainment
    expense(4,  'Entertainment', 399, 'Netflix annual split'),
    expense(8,  'Entertainment', 189, 'Movie — PVR'),
    expense(16, 'Entertainment', 249, 'Spotify 3mo'),
    // Shopping
    expense(7,  'Shopping', 1299, 'Myntra shirt'),
    expense(21, 'Shopping', 799, 'Amazon earphones'),
    // Subscriptions
    expense(1,  'Subscriptions', 179, 'ChatGPT Plus'),
    expense(1,  'Subscriptions', 99,  'YouTube Premium'),
    // Dining Out
    expense(5,  'Dining Out', 680, 'Dinner with friends'),
    expense(13, 'Dining Out', 340, 'Lunch office'),
    // Health
    expense(12, 'Health', 450, 'Gym monthly'),
    expense(25, 'Health', 180, 'Pharmacy'),
    // Bills
    expense(3,  'Bills', 899, 'Electricity'),
    expense(3,  'Bills', 399, 'Mobile recharge'),
  ]
}

export const DEMO_NUDGES = [
  {
    id: crypto.randomUUID(),
    user_id: null, // filled in at seed time
    text: "🍕 You've spent ₹1,902 on food delivery this month — that's 4.2% of your income. Diverting just ₹400/month to a SIP for 5 years at 12% = ₹32,000+. Your future self will eat just as well.",
    category: 'Food Delivery',
    rating: null,
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    user_id: null,
    text: "📊 Your savings rate this month is ~18% — close to the 20% threshold that triggers compounding at a serious scale. One less Swiggy order a week gets you there.",
    category: null,
    rating: null,
    created_at: new Date().toISOString(),
  },
]
