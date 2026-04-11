// src/lib/supabase.js
// Supabase with anonymous auth so every browser session is isolated.
// Falls back to localStorage-only if env vars are missing.

import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  || ''
const akey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_ENABLED = Boolean(url && akey)

export const supabase = SUPABASE_ENABLED
  ? createClient(url, akey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

/**
 * Ensure the current browser has an anonymous Supabase session.
 * Returns the user_id (UUID) to use as row owner.
 * In localStorage-only mode, generates/persists a local UUID.
 */
export async function ensureUserId() {
  if (SUPABASE_ENABLED && supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Supabase anon sign-in failed:', error.message)
      return localUserId()
    }
    return data.user.id
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

// ─── SQL schema — run once in Supabase SQL editor ────────────────────────────
/*
-- Enable RLS
alter table if exists expenses enable row level security;
alter table if exists profile enable row level security;

create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  category    text not null,
  note        text,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

create table if not exists profile (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  name          text,
  monthly_income numeric(10,2),
  savings_goal  numeric(10,2),
  onboarded     boolean default false,
  badges        text[] default '{}',
  streak        integer default 0,
  last_log_date date,
  updated_at    timestamptz default now()
);

-- RLS: users only see their own rows
create policy "own rows only" on expenses for all using (auth.uid() = user_id);
create policy "own profile only" on profile for all using (auth.uid() = user_id);
*/
