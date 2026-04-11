// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store'
import Shell from './components/layout/Shell'
import Onboarding from './pages/Onboarding'
import LogExpense  from './pages/LogExpense'
import Dashboard   from './pages/Dashboard'
import Growth      from './pages/Growth'
import Score       from './pages/Score'

// Guard: redirect to /onboarding if not yet onboarded
function RequireOnboarding({ children }) {
  const { profile, loading } = useStore(s => ({ profile: s.profile, loading: s.loading }))
  const location = useLocation()

  if (loading) return <AppLoader />
  if (!profile?.onboarded) return <Navigate to="/onboarding" state={{ from: location }} replace />
  return children
}

function AppLoader() {
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
  const init = useStore(s => s.init)

  // Boot: resolve userId, pull data
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
