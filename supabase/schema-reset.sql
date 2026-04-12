-- K2 Wealth — full reset of app tables + RLS (run in Supabase → SQL → New query)
--
-- Deletes ALL rows in profile, expenses, nudges. Does NOT delete auth.users.
-- Use on a dev project or when you want a clean schema matching the app.
--
-- After running: sign up / sign in again and complete onboarding once.

begin;

-- ── Drop policies (names from older README + this script) ─────────────────
drop policy if exists "own rows" on public.expenses;
drop policy if exists "own rows" on public.profile;
drop policy if exists "own rows" on public.nudges;

drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;

drop policy if exists "profile_select" on public.profile;
drop policy if exists "profile_insert" on public.profile;
drop policy if exists "profile_update" on public.profile;
drop policy if exists "profile_delete" on public.profile;

drop policy if exists "nudges_select" on public.nudges;
drop policy if exists "nudges_insert" on public.nudges;
drop policy if exists "nudges_update" on public.nudges;
drop policy if exists "nudges_delete" on public.nudges;

-- ── Tables (FK to auth.users only) ─────────────────────────────────────────
drop table if exists public.nudges cascade;
drop table if exists public.expenses cascade;
drop table if exists public.profile cascade;

create table public.profile (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  name            text,
  monthly_income  numeric(12,2),
  savings_goal    numeric(12,2),
  onboarded       boolean not null default false,
  is_demo         boolean not null default false,
  badges          text[] not null default array[]::text[],
  streak          integer not null default 0,
  last_log_date   date,
  updated_at      timestamptz not null default now()
);

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  category    text not null,
  note        text,
  date        date not null default (current_date),
  created_at  timestamptz not null default now()
);

create table public.nudges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  text        text not null,
  category    text,
  rating      text,
  created_at  timestamptz not null default now()
);

-- ── RLS: separate commands so INSERT has WITH CHECK (required on Postgres) ─
alter table public.profile enable row level security;
alter table public.expenses enable row level security;
alter table public.nudges enable row level security;

create policy "profile_select"
  on public.profile for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profile_insert"
  on public.profile for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profile_update"
  on public.profile for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profile_delete"
  on public.profile for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "expenses_select"
  on public.expenses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "expenses_insert"
  on public.expenses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "expenses_update"
  on public.expenses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses_delete"
  on public.expenses for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "nudges_select"
  on public.nudges for select
  to authenticated
  using (auth.uid() = user_id);

create policy "nudges_insert"
  on public.nudges for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "nudges_update"
  on public.nudges for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nudges_delete"
  on public.nudges for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
