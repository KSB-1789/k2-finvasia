# K2 Wealth v2 — Financial Empowerment for Gen-Z

> **Team K2 · Finvasia Hackathon 2026 · Chitkara University**  
> PS2 — Cashback Dependency · Track 1: Payments & Digital Banking

---

## What changed in v2

v1 was a demo with static fake data baked into the UI. v2 is an actual product:

- **Real onboarding** — income captured first, nothing works without it
- **Per-user data isolation** — Supabase email/password sessions or localStorage UUID; never shared
- **Zero fake defaults** — empty states everywhere, score only shows when real data exists
- **Score derived from real spending** — formula uses actual income + category ratios
- **AI nudges are context-injected** — Gemini receives your actual numbers; no generic advice
- **Responsive layout** — desktop sidebar + mobile bottom nav, properly designed
- **Demo mode done right** — seeds realistic data attributed to your userId, fully editable

---

## Features

| Screen | Core purpose |
|--------|-------------|
| **Onboarding** | Capture name, income, savings goal. Demo mode available. |
| **Log** | Tap category → type amount → done. Optional **Load sample expenses** (always when Supabase is on; also when the list is empty locally). |
| **Dashboard** | Month summary, pie chart, AI nudges, score preview. Empty-state guarded. |
| **Growth** | SIP vs FD vs cashback chart. Slider max auto-set from your cashback estimate. |
| **Score** | Financial score 0–100, level journey, badges, profile settings. |

---

## Recent Updates

### Edit and Delete Functionality for Expenses

Perfect! I've successfully added edit and delete functionality for logged expenses. Here's what I implemented:

#### New Features Added:
1. **Edit Expenses**
   - Added an "Edit" button next to each expense in the recent list
   - Clicking "Edit" pre-fills the logging form with the expense's current details
   - The form shows "Update" instead of "Log" when editing
   - Added a "Cancel" button to exit edit mode
   - Updates are saved to both localStorage and Supabase (if enabled)

2. **Delete Expenses**
   - The existing delete functionality is preserved with confirmation
   - Clicking "Del" shows confirmation buttons ("Del" and "No")

3. **Store Updates**
   - Added `updateExpense` function to the Zustand store
   - Handles both localStorage and Supabase updates
   - Maintains data consistency across storage methods

4. **UI Improvements**
   - Edit and Delete buttons are always visible (removed hover-only behavior for better UX)
   - Clear visual distinction between Edit (green) and Delete (red) actions
   - Form adapts to show editing state with appropriate buttons

#### How to Use:
- **Edit**: Click the green "Edit" button on any expense → modify details → click "Update"
- **Delete**: Click the red "Del" button → confirm with "Del" or cancel with "No"

The build completed successfully, so all functionality should work properly. You can now fully manage your expense history!

### Growth Page Enhancements

New features in the Growth/Investment Calculator:

1. **Custom Amount Input**
   - Type any custom investment amount instead of just using the slider
   - Slider goes up to ₹50K by default (8× your estimated cashback)
   - Custom input has no upper limit

2. **Multi-Graph Comparison**
   - Click **SIP** or **FD** to switch the chart (each vs flat cashback baseline)
   - Flat cashback is shown as the baseline line only (not a separate chart mode)
   - Graph updates in real-time based on selected type

3. **Fixed Sidebar Layout**
   - Desktop sidebar is `position: fixed` with main content `padding-left` so it stays visible while you scroll
   - Mobile still uses the bottom nav only (no sidebar)

---

## Setup

### 1. Clone & install
```bash
git clone <repo>
cd k2-wealth
npm install
```

### 2. Configure

Create a `.env` file in the project root (see variables below). You can copy the template with:

```bash
cp .env.example .env
```

Fill in `.env`:
```env
VITE_GEMINI_API_KEY=     # https://aistudio.google.com/app/apikey (free)
VITE_SUPABASE_URL=       # optional
VITE_SUPABASE_ANON_KEY=  # optional
```

> App works fully without Supabase — localStorage mode is the fallback.  
> App works without Gemini — fallback nudges use your real numbers, just without LLM phrasing.

### 3. Run
```bash
npm run dev   # http://localhost:5173
```

---

## Supabase setup (optional but recommended for demos)

### Auth (required when using cloud sync)

1. In **Supabase Dashboard → Authentication → Providers**, enable **Email**.
2. For local development, under **Authentication → Providers → Email**, you can turn **off** “Confirm email” so sign-up logs you in immediately. For production, leave confirmation on and use the email link before signing in.
3. The app **does not** use anonymous sign-in anymore: **Sign in / Sign up** (email + password) is **step 1 of onboarding** when needed. **Returning users** with `onboarded` set go straight to the app. If you are signed in but never finished the wizard, **only missing steps** are shown (saved name/income are skipped), and **name + income already in the database** finishes onboarding without the savings-goal screen (same as “skip for now” on savings).

### Database

Run this SQL in your Supabase project → SQL editor:

```sql
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
  user_id        uuid primary key references auth.users(id) on delete cascade,
  name           text,
  monthly_income numeric(10,2),
  savings_goal   numeric(10,2),
  onboarded      boolean default false,
  is_demo        boolean default false,
  badges         text[] default '{}',
  streak         integer default 0,
  last_log_date  date,
  updated_at     timestamptz default now()
);

-- If you already created `profile` without `is_demo`, run:
-- alter table profile add column if not exists is_demo boolean default false;

create table if not exists nudges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  category   text,
  rating     text,
  created_at timestamptz default now()
);

alter table expenses enable row level security;
alter table profile   enable row level security;
alter table nudges    enable row level security;

create policy "own rows" on expenses for all using (auth.uid() = user_id);
create policy "own rows" on profile   for all using (auth.uid() = user_id);
create policy "own rows" on nudges    for all using (auth.uid() = user_id);
```

If **profile inserts or upserts fail** silently in the dashboard (row never appears), PostgreSQL RLS often needs an explicit **`WITH CHECK`** on `INSERT`. Replace the single `profile` policy with separate statements, for example:

```sql
drop policy if exists "own rows" on profile;
create policy "profile_select" on profile for select using (auth.uid() = user_id);
create policy "profile_insert" on profile for insert with check (auth.uid() = user_id);
create policy "profile_update" on profile for update using (auth.uid() = user_id);
create policy "profile_delete" on profile for delete using (auth.uid() = user_id);
```

Edits to expenses use `UPDATE` on `expenses` where `id` matches and `user_id = auth.uid()`. The `FOR ALL` policies above already allow `UPDATE` for the row owner. If you created narrower policies earlier, add or replace with the statements above so updates are not blocked.

---

## Netlify deploy

```bash
# Push to GitHub, then:
# Netlify → New Site → Import from GitHub
# Build: npm run build  |  Publish: dist
# Add env vars in Site Settings → Environment Variables
```

`netlify.toml` is already configured for SPA routing.

---

## Architecture

```
src/
├── store/index.js          ← Zustand + Immer. Single truth. Supabase + LS sync.
├── lib/
│   ├── supabase.js         ← Anon auth client. Per-user isolation.
│   ├── gemini.js           ← Context-injected prompts. Real number injection.
│   └── demoSeed.js         ← Realistic 30-day dataset for demo mode.
├── utils/finance.js        ← SIP formula, categories, triggers, badges, score.
├── components/
│   ├── ui/index.jsx        ← Button, Card, Input, ScoreRing, Toast, Empty.
│   └── layout/Shell.jsx    ← Desktop sidebar + mobile bottom nav.
└── pages/
    ├── Login.jsx           ← Email sign-in / sign-up when Supabase is configured.
    ├── Onboarding.jsx      ← 3-step: name → income → goal. Demo mode button.
    ├── LogExpense.jsx      ← Category grid → amount → log. Trigger display.
    ├── Dashboard.jsx       ← Month summary, pie, nudges, score preview.
    ├── Growth.jsx          ← SIP vs cashback chart. Personalized slider.
    └── Score.jsx           ← Score ring, insights, level journey, badges.
```

### Data flow
```
User signs in (Supabase) or gets a local UUID
  → init() loads profile + expenses for that user
User logs expense
  → addExpense() in store
  → mirrored to localStorage immediately
  → synced to Supabase (if configured)
  → streak updated
  → badge check
  → (async) Gemini nudge generated with real context
  → nudge saved to store + Supabase
  → UI re-renders from store (score, breakdown, triggers all reactive)
```

### Score formula
```
base = 40
+ savingsRate × 40       (income - spent) / income
- impulsiveRatio × 25    (food delivery + entertainment + shopping) / total
+ min(streak, 10)        logging habit bonus
+ 5 if savings goal set
= clamped [1, 100]
```

### Investment formulas (Growth page)

**SIP (Systematic Investment Plan) @ 12% annual**
```
FV = P × [(1.01^n − 1) / 0.01] × 1.01
   where P = monthly amount, n = months, 1% = monthly rate (12% annual)
   monthly compounding with end-of-period payments
```

**FD (Fixed Deposit) @ 6.5% annual**
```
FV = P × 12 × years × (1 + (0.065/12) × (years×12/2))
   where P = monthly amount
   simplified average rate model for month-by-month deposits
```

**Cashback (Flat)**
```
FV = P × 12 × years
   no compounding, direct accumulation
```

---

## Team split (2 people)

**Person A — Data & Logic**
- `src/store/index.js`
- `src/lib/supabase.js`
- `src/lib/gemini.js`
- `src/utils/finance.js`
- `src/lib/demoSeed.js`

**Person B — UI & Pages**
- `src/components/ui/index.jsx`
- `src/components/layout/Shell.jsx`
- `src/pages/` (all 5 pages)
- `src/index.css`
- `tailwind.config.js`

---

*Built by Team K2 · Chitkara University, Punjab · Finvasia Innovation Hackathon 2026*
