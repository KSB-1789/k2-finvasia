// src/hooks/useStore.js
// Unified data store — uses Supabase if configured, localStorage otherwise.
// All reads/writes go through this hook so the rest of the app is storage-agnostic.

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const USER_ID = 'k2_default_user'

// ─── Default state ────────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  score: 42,
  level: 'Saver Rookie',
  streak: 3,
  badges: ['first_login'],
  lastActive: null,
}

const DEFAULT_SPENDING = {
  'Food Delivery': 3200,
  'Entertainment': 1800,
  'Shopping': 2500,
  'Transport': 800,
  'Subscriptions': 600,
  'Groceries': 2200,
  'Dining Out': 1400,
  'Others': 500,
}

const DEFAULT_NUDGES = []

// ─── localStorage helpers ─────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(`k2_${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function lsSet(key, value) {
  try { localStorage.setItem(`k2_${key}`, JSON.stringify(value)) } catch {}
}

// ─── Score calculation ────────────────────────────────────────────────────────
export function calculateScore(spending) {
  const total = Object.values(spending).reduce((a, b) => a + b, 0)
  if (total === 0) return 50

  const foodDelivery = spending['Food Delivery'] || 0
  const entertainment = spending['Entertainment'] || 0
  const shopping = spending['Shopping'] || 0
  const groceries = spending['Groceries'] || 0

  // Ratios (lower impulsive = better score)
  const impulsiveRatio = (foodDelivery + entertainment + shopping) / total
  const essentialRatio = groceries / total

  let score = 100
  score -= Math.round(impulsiveRatio * 50) // penalize impulse spending
  score += Math.round(essentialRatio * 10) // reward essentials
  score -= Math.round(Math.min((total - 8000) / 500, 20)) // penalize overspend

  return Math.min(100, Math.max(5, score))
}

export function getLevel(score) {
  if (score >= 85) return { name: 'Wealth Builder', emoji: '🏔️', color: '#F59E0B' }
  if (score >= 70) return { name: 'SIP Starter', emoji: '🚀', color: '#10B981' }
  if (score >= 55) return { name: 'Budget Boss', emoji: '💡', color: '#06B6D4' }
  if (score >= 40) return { name: 'Saver Rookie', emoji: '🌱', color: '#8B5CF6' }
  return { name: 'Spend Explorer', emoji: '🗺️', color: '#F43F5E' }
}

export function getScoreInsights(spending) {
  const total = Object.values(spending).reduce((a, b) => a + b, 0)
  const insights = { dragging: [], boosting: [] }

  const foodPct = ((spending['Food Delivery'] || 0) / total) * 100
  const entPct = ((spending['Entertainment'] || 0) / total) * 100
  const shopPct = ((spending['Shopping'] || 0) / total) * 100

  if (foodPct > 20) insights.dragging.push(`Food delivery is ${foodPct.toFixed(0)}% of budget (aim < 15%)`)
  if (entPct > 15) insights.dragging.push(`Entertainment spend is high at ${entPct.toFixed(0)}%`)
  if (shopPct > 25) insights.dragging.push(`Shopping at ${shopPct.toFixed(0)}% — try the 48hr rule`)

  if ((spending['Groceries'] || 0) > 0) insights.boosting.push('Cooking at home — nice move 🥗')
  if (total < 10000) insights.boosting.push('Total spend under ₹10k — solid discipline')
  if ((spending['Subscriptions'] || 0) < 500) insights.boosting.push('Subscriptions in check')

  return insights
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useStore() {
  const [spending, setSpendingState] = useState(() => lsGet('spending', DEFAULT_SPENDING))
  const [profile, setProfileState] = useState(() => lsGet('profile', DEFAULT_PROFILE))
  const [nudges, setNudgesState] = useState(() => lsGet('nudges', DEFAULT_NUDGES))
  const [loading, setLoading] = useState(false)

  // Derive score from spending
  const score = calculateScore(spending)
  const levelInfo = getLevel(score)

  // ─── Spending ──────────────────────────────────────────────────────────────
  const updateSpending = useCallback(async (newSpending) => {
    setSpendingState(newSpending)
    lsSet('spending', newSpending)

    if (isSupabaseConfigured && supabase) {
      // Upsert each category
      const month = new Date().toISOString().slice(0, 7)
      const rows = Object.entries(newSpending).map(([category, amount]) => ({
        user_id: USER_ID,
        month,
        category,
        amount,
      }))
      await supabase.from('spending_entries').upsert(rows, {
        onConflict: 'user_id,month,category'
      })
    }
  }, [])

  // ─── Profile ───────────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    const newProfile = { ...profile, ...updates }
    setProfileState(newProfile)
    lsSet('profile', newProfile)

    if (isSupabaseConfigured && supabase) {
      await supabase.from('user_profile').upsert({
        user_id: USER_ID,
        ...newProfile,
        last_active: new Date().toISOString().slice(0, 10),
      })
    }
  }, [profile])

  // ─── Nudges ────────────────────────────────────────────────────────────────
  const addNudge = useCallback(async (nudgeText, category = null) => {
    const nudge = {
      id: Date.now(),
      text: nudgeText,
      category,
      createdAt: new Date().toISOString(),
      liked: null,
    }
    const updated = [nudge, ...nudges].slice(0, 20) // keep last 20
    setNudgesState(updated)
    lsSet('nudges', updated)

    if (isSupabaseConfigured && supabase) {
      await supabase.from('nudge_history').insert({
        user_id: USER_ID,
        nudge: nudgeText,
        category,
      })
    }
    return nudge
  }, [nudges])

  const rateNudge = useCallback((nudgeId, liked) => {
    const updated = nudges.map(n => n.id === nudgeId ? { ...n, liked } : n)
    setNudgesState(updated)
    lsSet('nudges', updated)
  }, [nudges])

  const addBadge = useCallback(async (badgeId) => {
    if (profile.badges.includes(badgeId)) return
    const newBadges = [...profile.badges, badgeId]
    await updateProfile({ badges: newBadges })
  }, [profile.badges, updateProfile])

  return {
    spending,
    updateSpending,
    profile,
    updateProfile,
    nudges,
    addNudge,
    rateNudge,
    addBadge,
    score,
    levelInfo,
    loading,
    isSupabaseConfigured,
  }
}
