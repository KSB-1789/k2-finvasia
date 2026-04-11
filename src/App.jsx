// src/App.jsx
import { useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store'
import { shallow } from 'zustand/shallow'
import { SUPABASE_ENABLED, supabase } from './lib/supabase'
import { isProfileOnboarded } from './store'
import Shell from './components/layout/Shell'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import LogExpense  from './pages/LogExpense'
import Dashboard   from './pages/Dashboard'
import Growth      from './pages/Growth'
import Score       from './pages/Score'

// Guard: Supabase requires a signed-in user, then onboarding complete
function RequireOnboarding({ children }) {
  const loading = useStore(s => s.loading, shallow)
  const userId = useStore(s => s.userId, shallow)
  const profile = useStore(s => s.profile, shallow)
  const location = useLocation()

  if (loading) return <AppLoader />
  if (SUPABASE_ENABLED && !userId) return <Navigate to="/onboarding" state={{ from: location }} replace />
  if (!isProfileOnboarded(profile)) return <Navigate to="/onboarding" state={{ from: location }} replace />
  return children
}

function AppLoader() {
  console.log('Showing loader')
  return (
    <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center gap-3">
      <div className="w-6 h-6 rounded-md bg-[#22C55E] flex items-center justify-center">
        <span className="font-mono font-black text-[#0C0C10] text-xs">K2</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#22C55E]/40 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/*" element={
        <RequireOnboarding>
          <Shell>
            <Routes>
              <Route path="/log"       element={<LogExpense />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/growth"    element={<Growth />} />
              <Route path="/score"     element={<Score />} />
              <Route path="*"          element={<Navigate to="/log" replace />} />
            </Routes>
          </Shell>
        </RequireOnboarding>
      } />
    </Routes>
  )
}

export default function App() {
  const initSelector = useCallback(s => s.init, [])
  const init = useStore(initSelector, shallow)

  // Boot: resolve userId, pull data
  useEffect(() => { init() }, [])

  // After sign-in the session is ready before our store ran init; refresh so profile/expenses load.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void useStore.getState().init()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
