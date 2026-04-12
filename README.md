# K2 Wealth — Financial Empowerment for Gen-Z

> **Team K2 · Finvasia Hackathon 2026 · Chitkara University**  
> PS2 — Cashback Dependency · Track 1: Payments & Digital Banking

---

## Summary
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


#### Features:
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


### Growth Page

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
3. The app **does not** use anonymous sign-in anymore: **Sign in / Sign up** (email + password) is **step 1 of onboarding** when Supabase is on. **Sign in** skips the wizard gate; **sign up** (first session) still runs name → income → goal until you finish.

### Database

Use the **canonical reset script** (drops `profile`, `expenses`, `nudges`, recreates them, and applies RLS with proper **`WITH CHECK`** on inserts — the old one-line `FOR ALL USING (...)` policies are a common reason profile rows never insert or upserts misbehave):

- Run the full file in **Supabase → SQL → New query**:  
  [`supabase/schema-reset.sql`](supabase/schema-reset.sql)

That script wipes **all** app table data (not `auth.users`). After a reset, sign in again and save name / income / goal once.

If you prefer a minimal **upgrade** on an existing project (no table drop), at least replace combined policies with per-command policies so `INSERT` has `WITH CHECK`, matching the same file.

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
