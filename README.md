# K2 Wealth v2 — Financial Empowerment for Gen-Z

> **Team K2 · Finvasia Hackathon 2026 · Chitkara University**  
> PS2 — Cashback Dependency · Track 1: Payments & Digital Banking

---

## What changed in v2

v1 was a demo with static fake data baked into the UI. v2 is an actual product:

- **Real onboarding** — income captured first, nothing works without it
- **Per-user data isolation** — Supabase anon auth or localStorage UUID; never shared
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
| **Log** | Tap category → type amount → done. Auto-nudge on log. Triggers visible. |
| **Dashboard** | Month summary, pie chart, AI nudges, score preview. Empty-state guarded. |
| **Growth** | SIP vs FD vs cashback chart. Slider max auto-set from your cashback estimate. |
| **Score** | Financial score 0–100, level journey, badges, profile settings. |

---

## Setup

### 1. Clone & install
```bash
git clone <repo>
cd k2-wealth
npm install
```

### 2. Configure
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

Run this SQL in your Supabase project → SQL editor:

```sql
-- Enable anon sign-in (Dashboard → Auth → Providers → Anonymous → Enable)

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
  badges         text[] default '{}',
  streak         integer default 0,
  last_log_date  date,
  updated_at     timestamptz default now()
);

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
    ├── Onboarding.jsx      ← 3-step: name → income → goal. Demo mode button.
    ├── LogExpense.jsx      ← Category grid → amount → log. Trigger display.
    ├── Dashboard.jsx       ← Month summary, pie, nudges, score preview.
    ├── Growth.jsx          ← SIP vs cashback chart. Personalized slider.
    └── Score.jsx           ← Score ring, insights, level journey, badges.
```

### Data flow
```
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
