// src/App.jsx
// Root app component — routing, shared store, layout

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './hooks/useStore'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Growth from './pages/Growth'
import Milestones from './pages/Milestones'
import Nudges from './pages/Nudges'

export default function App() {
  const store = useStore()

  return (
    <BrowserRouter>
      <div className="font-body bg-[#0A0A0F] min-h-screen text-white">
        <Routes>
          {/* Landing — no nav */}
          <Route path="/" element={<Landing />} />

          {/* App screens — with bottom nav */}
          <Route path="/dashboard" element={
            <>
              <Dashboard store={store} />
              <Nav />
            </>
          } />
          <Route path="/growth" element={
            <>
              <Growth store={store} />
              <Nav />
            </>
          } />
          <Route path="/milestones" element={
            <>
              <Milestones store={store} />
              <Nav />
            </>
          } />
          <Route path="/nudges" element={
            <>
              <Nudges store={store} />
              <Nav />
            </>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
