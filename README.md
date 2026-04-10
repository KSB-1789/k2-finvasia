# K2 Wealth — Financial Empowerment Dashboard

> **Team K2 · Finvasia Innovation Hackathon 2026 · Chitkara University, Punjab**
> Problem Statement: PS2 — Cashback Dependency (Track 1: Payments & Digital Banking)

Stop collecting cashback. Start building wealth.

K2 Wealth is a Gen-Z focused financial empowerment app that replaces cashback with AI-powered nudges to micro-invest, save smartly, and grow wealth. Built with React + Vite, Tailwind CSS, Supabase, and Google Gemini AI.

---

## 🚀 Features

| Screen | What it does |
|--------|-------------|
| **Landing** | Team K2 branding, problem statement, onboarding hook |
| **Dashboard** | Spending input by category, breakdown pie chart, smart triggers |
| **Growth Visualizer** | Cashback vs SIP vs FD compounding chart, interactive scenario builder |
| **Milestones & Score** | Financial growth score (0-100), level system, badges, streak |
| **Nudge Feed** | AI-generated nudges from Kai (Gemini), trigger-based suggestions, rate/save |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (dark mode, gradients, Gen-Z aesthetic)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **AI**: Google Gemini 1.5 Flash (free tier)
- **Database**: Supabase (free tier) — with localStorage fallback
- **Fonts**: Syne (display) + DM Sans (body) + JetBrains Mono
- **Deployment**: Netlify

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd k2-finvasia
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```env
# Google Gemini API (free)
# Get key at: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (optional — app works without it using localStorage)
# Get from: https://supabase.com → your project → Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Note**: The app works fully without Supabase — all data falls back to localStorage. Gemini API key is required for live AI nudges; without it, demo nudges are shown.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🗄️ Supabase Setup (Optional)

If you want persistent cloud storage:

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run this:

```sql
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
```

3. Add your project URL and anon key to `.env`

---

## 🌐 Deploy to Netlify

### Option A: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Option B: Netlify Dashboard

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site → Import from Git
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables in **Site Settings → Environment Variables**:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
5. Deploy!

The `netlify.toml` in the root handles SPA routing automatically.

---

## 📁 File Structure

```
k2-finvasia/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Nav.jsx          # Bottom nav + top bar
│   │   └── ui.jsx           # Shared UI primitives (Card, Button, ScoreRing, etc.)
│   ├── hooks/
│   │   └── useStore.js      # Unified data store (Supabase + localStorage)
│   ├── lib/
│   │   ├── gemini.js        # Gemini API integration (Kai nudge engine)
│   │   └── supabase.js      # Supabase client with fallback detection
│   ├── pages/
│   │   ├── Landing.jsx      # Onboarding/hero page
│   │   ├── Dashboard.jsx    # Spending input + analysis
│   │   ├── Growth.jsx       # Cashback → investment visualizer
│   │   ├── Milestones.jsx   # Score + gamified progress
│   │   └── Nudges.jsx       # AI nudge feed
│   ├── utils/
│   │   └── finance.js       # SIP math, triggers, badges, formatters
│   ├── App.jsx              # Root component + routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles + Tailwind
├── .env.example             # Environment variable template
├── netlify.toml             # Netlify deployment config
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 👥 Team Division (2-person guide)

**Person 1 — Frontend + Design**
- `src/pages/Landing.jsx` — onboarding
- `src/pages/Growth.jsx` — charts
- `src/components/ui.jsx` — design system
- `src/index.css` — global styles

**Person 2 — Logic + Integrations**
- `src/lib/gemini.js` — AI integration
- `src/lib/supabase.js` — database
- `src/hooks/useStore.js` — state management
- `src/utils/finance.js` — financial math
- `src/pages/Dashboard.jsx` + `Milestones.jsx` + `Nudges.jsx`

---

## 🤖 AI Prompt Design

Kai (the AI coach) uses this system persona in all Gemini calls:

> "You are Kai, a Gen-Z financial coach who is smart, relatable, and brutally honest in the nicest way. Max 3 sentences. Always mention ₹ amounts. Show time-based projections. Casual language. Sound like a smart friend, not a bank bot."

---

## 📐 Financial Formulas

**SIP Future Value**:
```
FV = P × [(1 + r)ⁿ - 1] / r × (1 + r)
```
Where: `P` = monthly investment, `r` = monthly rate (annual/12), `n` = total months

**Financial Score** (0–100):
- Penalizes high ratio of impulsive spend (food delivery, entertainment, shopping)
- Rewards essential spending (groceries)
- Penalizes total spend over ₹8,000/month

---

## 📝 License

MIT — built for Finvasia Hackathon 2026. Use freely.

---

*Built with 💜 by Team K2 · Chitkara University, Punjab*
