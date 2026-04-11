// src/pages/Login.jsx
// Legacy URL: sign-in now lives inside onboarding (step 1 when Supabase is on).

import { Navigate } from 'react-router-dom'
import { SUPABASE_ENABLED } from '../lib/supabase'

export default function Login() {
  if (!SUPABASE_ENABLED) {
    return <Navigate to="/onboarding" replace />
  }
  return <Navigate to="/onboarding" replace />
}
