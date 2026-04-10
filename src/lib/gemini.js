// src/lib/gemini.js
// Google Gemini API integration for AI nudge engine
// Uses gemini-1.5-flash (free tier)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

// System persona for Kai, the Gen-Z financial coach
const KAI_SYSTEM_PROMPT = `You are Kai, a Gen-Z financial coach who is smart, relatable, and brutally honest in the nicest way. 
You analyze spending patterns and give short, punchy, actionable nudges.
Rules:
- Max 3 sentences per nudge
- Always mention specific ₹ amounts
- Always show a time-based projection (e.g., "in 5 years = ₹X")
- Use casual language — contractions, simple words, no jargon
- Sound like a smart friend who actually cares, not a bank bot
- Occasionally use a relevant emoji at the start
- Calculate SIP returns at 12% annual returns for projections
- Be encouraging, never shame the user`

/**
 * Generate personalized spending nudges from Gemini
 * @param {Object} spendingData - { category: amount } map
 * @param {string} focusCategory - Optional specific category to focus on
 * @returns {Promise<string[]>} Array of nudge strings
 */
export async function generateNudges(spendingData, focusCategory = null) {
  // If no API key, return mock nudges
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return getMockNudges(spendingData)
  }

  const totalSpending = Object.values(spendingData).reduce((a, b) => a + b, 0)
  const topCategories = Object.entries(spendingData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: ₹${amt}`)
    .join(', ')

  const focusNote = focusCategory
    ? `Focus specifically on their ${focusCategory} spending of ₹${spendingData[focusCategory]}.`
    : 'Focus on their highest spending category.'

  const prompt = `${KAI_SYSTEM_PROMPT}

User's monthly spending breakdown:
${Object.entries(spendingData).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}
Total: ₹${totalSpending}

${focusNote}

Generate exactly 3 separate nudges as a JSON array of strings. Each nudge is one card in their feed.
Format: ["nudge1", "nudge2", "nudge3"]
Only output the JSON array, nothing else.`

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 512,
        }
      })
    })

    if (!response.ok) {
      console.error('Gemini API error:', response.status)
      return getMockNudges(spendingData)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    
    // Strip markdown fences if present
    const clean = text.replace(/```json|```/g, '').trim()
    const nudges = JSON.parse(clean)
    return Array.isArray(nudges) ? nudges : getMockNudges(spendingData)
  } catch (err) {
    console.error('Gemini parse error:', err)
    return getMockNudges(spendingData)
  }
}

/**
 * Generate a single smart saving trigger nudge
 * @param {string} category - Category that triggered the rule
 * @param {number} amount - Amount spent
 * @param {string} trigger - Rule description
 */
export async function generateTriggerNudge(category, amount, trigger) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return `💡 You triggered a saving rule for ${category}! Redirecting ₹100 to savings could become ₹8,000+ in 3 years.`
  }

  const prompt = `${KAI_SYSTEM_PROMPT}

A saving trigger just fired for this user:
Category: ${category}
Amount: ₹${amount}
Rule triggered: ${trigger}

Write ONE punchy nudge (max 2 sentences) about this specific trigger and how much they'd gain by auto-saving ₹100-200.
Just output the nudge text, no quotes, no JSON.`

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
      })
    })
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      `💡 Auto-saving ₹100 from ${category} every trigger = ₹12,000+ in 5 years at 12% returns!`
  } catch {
    return `💡 Auto-saving ₹100 from ${category} every trigger = ₹12,000+ in 5 years at 12% returns!`
  }
}

// ─── Mock nudges for development / demo (no API key needed) ──────────────────
function getMockNudges(spendingData) {
  const entries = Object.entries(spendingData).sort(([, a], [, b]) => b - a)
  const top = entries[0]
  const topAmt = top ? top[1] : 2000
  const topCat = top ? top[0] : 'food delivery'
  const sipAmt = Math.round(topAmt * 0.2)
  const fiveYearReturn = Math.round(sipAmt * 12 * ((Math.pow(1.01, 60) - 1) / 0.01))

  return [
    `🍕 You dropped ₹${topAmt} on ${topCat} this month — that's wild ngl. If you redirected just ₹${sipAmt}/month to a SIP for 5 years at 12%, you'd have ₹${fiveYearReturn.toLocaleString('en-IN')}+ sitting in your portfolio.`,
    `☕ Real talk — that cashback you're chasing? It's like getting a cookie while the bakery walks away with your savings. Micro-investing even ₹200/month compounds to ₹16,000+ in 5 years. The math hits different.`,
    `🎯 Your spending score can jump 15 points this month if you cap ${topCat} at ₹${Math.round(topAmt * 0.7)} and route the difference to a liquid fund. Small move, big flex in 2 years.`,
  ]
}
