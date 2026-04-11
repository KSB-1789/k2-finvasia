// src/lib/supabase.js
// With Supabase configured: sessions come from Email auth (no auto-anonymous).
// Without env vars: localStorage UUID only (offline mode).

import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  || ''
const akey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_ENABLED = Boolean(url && akey)

export const supabase = SUPABASE_ENABLED
  ? createClient(url, akey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

/**
 * Returns auth user id when a Supabase session exists; otherwise null.
 * Local-only mode: always returns a persisted local UUID.
 */
export async function ensureUserId() {
  if (SUPABASE_ENABLED && supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id ?? null
  }
  return localUserId()
}

function localUserId() {
  let id = localStorage.getItem('k2_uid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('k2_uid', id)
  }
  return id
}
