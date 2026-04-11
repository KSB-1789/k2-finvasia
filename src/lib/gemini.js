// src/lib/gemini.js
// Gemini integration. NEVER called with fake data.
// All prompts are built from the user's actual stored expenses + profile.

const KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`

export const GEMINI_ENABLED = Boolean(KEY)

const KAI_PERSONA = `You are Kai, a sharp Gen-Z financial coach — not a bank bot.
Rules:
- Max 2-3 sentences per nudge. Short. Punchy.
- Always use ₹ amounts from the user's real data.
- Always show a concrete projection (e.g. "5 years at 12% = ₹X").
- Casual tone. Use contractions. No financial jargon.
- Be encouraging, never shameful.
- Calculate SIP using monthly compounding at 12% annual (1% monthly).
- Formula: FV = P × [(1.01^n - 1) / 0.01] × 1.01 where n = months`

async function callGemini(prompt, maxTokens = 400) {
  if (!GEMINI_ENABLED) return null
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: maxTokens },
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch (err) {
    console.error('[Gemini]', err.message)
    return null
  }
}

/**
 * Generate 3 personalized nudges from real user data.
 * @param {{ expenses: Array, profile: Object, byCategory: Object, totalThisMonth: number }} ctx
 * @returns {Promise<string[]>}
 */
export async function generateNudges({ expenses, profile, byCategory, totalThisMonth }) {
  const income = profile?.monthly_income || 0
  const saved = income - totalThisMonth
  const savingsRate = income > 0 ? ((saved / income) * 100).toFixed(1) : '?'

  const categoryLines = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  • ${cat}: ₹${amt.toLocaleString('en-IN')}`)
    .join('\n')

  const recentExpenses = expenses.slice(0, 5)
    .map(e => `  ${e.date} — ₹${e.amount} on ${e.category}${e.note ? ` (${e.note})` : ''}`)
    .join('\n')

  const prompt = `${KAI_PERSONA}

USER'S REAL DATA:
Monthly income: ₹${income.toLocaleString('en-IN')}
Saved this month: ₹${Math.max(0, saved).toLocaleString('en-IN')} (${savingsRate}% rate)
Total spent this month: ₹${totalThisMonth.toLocaleString('en-IN')}
Savings goal: ${profile?.savings_goal ? `₹${profile.savings_goal.toLocaleString('en-IN')}` : 'not set'}

Spending by category:
${categoryLines || '  (no expenses logged yet)'}

5 most recent expenses:
${recentExpenses || '  (none)'}

Generate exactly 3 nudges as a JSON array. Each nudge addresses a DIFFERENT insight from this real data.
Do NOT give generic advice — reference the actual numbers.
Output ONLY valid JSON: ["nudge1", "nudge2", "nudge3"]`

  const raw = await callGemini(prompt, 500)
  if (!raw) return fallbackNudges({ byCategory, totalThisMonth, income, saved })

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length >= 1) return parsed.slice(0, 3)
  } catch {}
  return fallbackNudges({ byCategory, totalThisMonth, income, saved })
}

/**
 * Generate a single context-aware nudge for a specific expense just logged.
 */
export async function nudgeOnExpense({ expense, byCategory, income }) {
  const catTotal = byCategory[expense.category] || expense.amount
  const pct = income > 0 ? ((catTotal / income) * 100).toFixed(0) : '?'
  const monthlyDivert = Math.round(Math.min(catTotal * 0.2, 500))
  const fiveYr = Math.round(monthlyDivert * ((Math.pow(1.01, 60) - 1) / 0.01) * 1.01)

  const prompt = `${KAI_PERSONA}

User just logged: ₹${expense.amount} on ${expense.category}${expense.note ? ` (${expense.note})` : ''}.
Their total on ${expense.category} this month: ₹${catTotal.toLocaleString('en-IN')} (${pct}% of ₹${income.toLocaleString('en-IN')} income).

Write ONE punchy 2-sentence nudge. Reference these exact numbers. Suggest diverting ₹${monthlyDivert}/month to SIP.
Projection: ₹${monthlyDivert}/month × 60 months at 12% = ₹${fiveYr.toLocaleString('en-IN')}.
Output ONLY the nudge text, no quotes, no JSON.`

  const text = await callGemini(prompt, 120)
  if (!text) return `💡 ₹${monthlyDivert}/month from ${expense.category} into a SIP = ₹${fiveYr.toLocaleString('en-IN')} in 5 years. Real talk.`
  return text
}

// ── Fallback nudges (data-aware, no Gemini required) ─────────────────────────
function fallbackNudges({ byCategory, totalThisMonth, income, saved }) {
  const top = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0]
  const topCat = top?.[0] || 'spending'
  const topAmt = top?.[1] || totalThisMonth
  const divert = Math.round(Math.min(topAmt * 0.15, 500))
  const fiveYr = Math.round(divert * ((Math.pow(1.01, 60) - 1) / 0.01) * 1.01)
  const savingsRate = income > 0 ? ((saved / income) * 100).toFixed(0) : 0

  return [
    `💳 Your top spend is ${topCat} at ₹${topAmt.toLocaleString('en-IN')} this month. Cutting just 15% and routing ₹${divert}/month to a SIP = ₹${fiveYr.toLocaleString('en-IN')} in 5 years. The math doesn't lie.`,
    `📊 You're saving ${savingsRate}% of income right now. Nudge that to 20%+ and compounding starts doing the heavy lifting — not your willpower.`,
    `🎯 Every time you log an expense, you're making an active decision, not a passive one. That shift in awareness is worth more than any cashback reward ever will be.`,
  ]
}
