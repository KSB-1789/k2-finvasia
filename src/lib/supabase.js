// src/lib/supabase.js
// Supabase client with graceful localStorage fallback
// If VITE_SUPABASE_URL is not set, all data is stored locally.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Flag: true if Supabase is configured
export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your_supabase_anon_key_here'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ─── Supabase schema (run this SQL in your Supabase SQL editor) ───────────────
/*
create table if not exists spending_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  month text not null,
  category text not null,
  amount numeric not null,
  created_at timestamptz default now()
);

create table if not exists user_profile (
  user_id text primary key default 'default',
  score integer default 0,
  level text default 'Saver Rookie',
  streak integer default 0,
  badges jsonb default '[]',
  last_active date,
  created_at timestamptz default now()
);

create table if not exists nudge_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  nudge text not null,
  category text,
  created_at timestamptz default now()
);
*/
