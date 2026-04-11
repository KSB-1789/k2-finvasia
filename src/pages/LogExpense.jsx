// src/pages/LogExpense.jsx
// The most-used screen. Optimized for speed: tap category → type amount → done.
// Real-time feedback after logging. Triggers nudge generation.
// Recent expenses shown with delete capability.

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useStore } from '../store'
import { CATEGORIES, CATEGORY_MAP, inr, getActiveTriggers } from '../utils/finance'
import { nudgeOnExpense, GEMINI_ENABLED } from '../lib/gemini'
import { Button, Input, Card, useToast, Toast, Empty } from '../components/ui'

export default function LogExpense() {
  const { expenses, profile, byCategory, addExpense, deleteExpense, addNudge } = useStore(s => ({
    expenses:      s.expenses,
    profile:       s.profile,
    byCategory:    s.byCategory,
    addExpense:    s.addExpense,
    deleteExpense: s.deleteExpense,
    addNudge:      s.addNudge,
  }))

  const [category, setCategory] = useState(null)
  const [amount, setAmount]     = useState('')
  const [note, setNote]         = useState('')
  const [date, setDate]         = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving]     = useState(false)
  const [lastAdded, setLastAdded] = useState(null)
  const amountRef = useRef()
  const { toasts, toast } = useToast()

  // Auto-focus amount when category picked
  useEffect(() => {
    if (category) amountRef.current?.focus()
  }, [category])

  async function handleLog() {
    if (!category) { toast('Pick a category first', 'error'); return }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast('Enter a valid amount', 'error'); return }

    setSaving(true)
    try {
      const expense = await addExpense({ amount: amt, category, note, date })
      setLastAdded(expense)
      setAmount('')
      setNote('')
      toast(`₹${amt.toLocaleString('en-IN')} logged ✓`, 'success')

      // Generate contextual nudge (async, non-blocking)
      if (GEMINI_ENABLED && profile?.monthly_income) {
        nudgeOnExpense({
          expense,
          byCategory: { ...byCategory, [category]: (byCategory[category] || 0) + amt },
          income: profile.monthly_income,
        }).then(text => addNudge({ text, category })).catch(() => {})
      }
    } catch (err) {
      toast('Failed to save. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Group expenses by date
  const grouped = {}
  for (const e of expenses.slice(0, 50)) {
    const d = e.date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  }

  const income   = profile?.monthly_income || 0
  const triggers = getActiveTriggers(byCategory, income)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F0F0F5]">Log Expense</h1>
        <p className="text-sm text-[#8888A0] mt-0.5">
          Tap a category, enter amount, done.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5">
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => setCategory(cat.id)}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center ${
              category === cat.id
                ? 'border-[#22C55E] bg-[#052e16]'
                : 'border-[#23232F] bg-[#131318] hover:border-[#2D2D3C]'
            }`}
          >
            <span className="text-xl leading-none">{cat.emoji}</span>
            <span className={`text-[9px] font-semibold leading-tight ${category === cat.id ? 'text-[#22C55E]' : 'text-[#8888A0]'}`}>
              {cat.id.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Amount + note input */}
      <AnimatePresence>
        {category && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131318] border border-[#23232F] rounded-2xl p-4 mb-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{CATEGORY_MAP[category]?.emoji}</span>
              <span className="font-medium text-[#F0F0F5] text-sm">{category}</span>
              {byCategory[category] > 0 && (
                <span className="ml-auto text-xs text-[#8888A0]">
                  {inr(byCategory[category])} this month
                </span>
              )}
            </div>

            <Input
              ref={amountRef}
              label="Amount"
              type="number"
              prefix="₹"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLog()}
              placeholder="0"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Swiggy, petrol..."
              />
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleLog}
              loading={saving}
            >
              Log ₹{amount || '0'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active triggers */}
      {triggers.length > 0 && (
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold text-[#55556A] uppercase tracking-wider">⚡ Saving Triggers</p>
          {triggers.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#451a03]/40 border border-[#78350F]/50 rounded-xl p-3"
            >
              <p className="text-[#FCD34D] text-xs font-semibold">{t.label}</p>
              <p className="text-[#8888A0] text-xs mt-0.5">
                Route ₹{t.saveSuggestion}/month to SIP → {inr(t.fiveYr)} in 5 years
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent expenses */}
      <div>
        <p className="text-xs font-semibold text-[#55556A] uppercase tracking-wider mb-3">Recent</p>
        {expenses.length === 0 ? (
          <Empty
            icon="📝"
            title="No expenses yet"
            body="Log your first expense above. Every rupee tracked is data working for you."
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 7)
              .map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs text-[#55556A] font-mono mb-2">
                    {format(parseISO(date), 'EEE, d MMM')}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(e => (
                      <ExpenseRow key={e.id} expense={e} onDelete={() => deleteExpense(e.id)} />
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

function ExpenseRow({ expense, onDelete }) {
  const cat = CATEGORY_MAP[expense.category]
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 bg-[#131318] border border-[#23232F] rounded-xl px-3 py-2.5 group"
    >
      <span className="text-base flex-shrink-0">{cat?.emoji || '📦'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F0F0F5] font-medium">{expense.category}</p>
        {expense.note && <p className="text-xs text-[#55556A] truncate">{expense.note}</p>}
      </div>
      <span className="font-mono text-sm text-[#F0F0F5] font-semibold flex-shrink-0">
        {inr(expense.amount)}
      </span>

      {confirming ? (
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onDelete} className="text-[10px] text-[#FB7185] border border-[#881337] rounded-lg px-2 py-1">Del</button>
          <button onClick={() => setConfirming(false)} className="text-[10px] text-[#8888A0] border border-[#23232F] rounded-lg px-2 py-1">No</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="opacity-0 group-hover:opacity-100 text-[#55556A] hover:text-[#FB7185] transition-all text-xs flex-shrink-0"
        >
          ✕
        </button>
      )}
    </motion.div>
  )
}
