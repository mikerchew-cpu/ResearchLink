# ResearchLink Malaysia — v1.1 Complete Codebase

Malaysia's verified student research exchange platform. Built with Next.js 14, Supabase, and OpenAI.

---

## Project structure

```
researchlink/
│
├── sql/                              # Run in Supabase SQL Editor IN ORDER
│   ├── 01_schema.sql                 # All 8 core tables + triggers
│   ├── 02_rls_policies.sql           # PDPA-enforcing Row Level Security
│   ├── 03_functions.sql              # Anonymised response functions
│   ├── 04_new_features.sql           # Completion tokens, referrals, vouchers, moderation
│   └── 05_final_tables.sql           # Waitlist, supervisor links, views, indexes
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout: SessionProvider + I18nProvider + Toaster
│   │   ├── globals.css               # CSS variables, dark mode, reset, PWA safe areas
│   │   │
│   │   ├── waitlist/page.tsx         # Pre-launch landing page (root → /waitlist)
│   │   ├── auth/
│   │   │   ├── signin/page.tsx       # Google .edu.my SSO login
│   │   │   └── error/page.tsx        # Sign-in error handling
│   │   │
│   │   ├── feed/page.tsx             # Main survey feed (server component)
│   │   ├── complete/page.tsx         # Completion token claim page
│   │   ├── post/page.tsx             # Post survey (3-step: form → token → live)
│   │   ├── my-surveys/page.tsx       # Researcher's survey list + boost modal
│   │   ├── survey/[id]/page.tsx      # Single survey analytics + AI assistant
│   │   ├── rewards/page.tsx          # Voucher redemption + points history
│   │   ├── referral/page.tsx         # Referral codes + Xiaohongshu share card
│   │   ├── profile/page.tsx          # PDPA consent + data rights + delete account
│   │   ├── corporate/page.tsx        # Insight Blast self-serve portal (3-step)
│   │   ├── supervisor/page.tsx       # Supervisor FYP dashboard (premium tier)
│   │   │
│   │   └── admin/
│   │       ├── page.tsx              # Admin overview: KPIs, alerts, quick actions
│   │       ├── moderation/page.tsx   # Content review queue + community reports
│   │       └── reports/page.tsx      # Gen-Z report generation + publish management
│   │
│   ├── api/
│   │   ├── surveys/
│   │   │   ├── route.ts              # GET feed, POST create (credit-gated)
│   │   │   ├── mine/route.ts         # GET researcher's own surveys
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET/PATCH/DELETE single survey
│   │   │       ├── publish/route.ts  # POST activate draft (runs moderation)
│   │   │       ├── approve/route.ts  # POST admin: approve & publish
│   │   │       └── reject/route.ts   # POST admin: reject + notify creator
│   │   │
│   │   ├── completion-token/route.ts # POST /generate + /verify
│   │   ├── boost/route.ts            # POST create order, PUT iPay88 webhook
│   │   ├── tag-survey/route.ts       # POST AI topic tagging (GPT-4o-mini)
│   │   ├── moderation/route.ts       # POST /screen + /report, GET /queue
│   │   ├── referral/route.ts         # GET my code, POST /claim, GET /leaderboard
│   │   ├── voucher/route.ts          # GET /rates, POST /redeem
│   │   ├── report/
│   │   │   ├── route.ts              # POST /generate + /purchase
│   │   │   └── list/route.ts         # GET list of reports
│   │   ├── whatsapp-bot/route.ts     # POST /webhook + /notify
│   │   ├── ai-assistant/route.ts     # POST — Claude-powered survey coach
│   │   ├── waitlist/route.ts         # POST signup, GET count
│   │   ├── corporate/campaign/route.ts # POST Insight Blast submission
│   │   ├── supervisor/notify/route.ts  # POST WhatsApp + FCM to supervisee
│   │   │
│   │   ├── profile/
│   │   │   ├── route.ts              # GET own profile
│   │   │   ├── consent/route.ts      # PUT PDPA consent (logged to audit trail)
│   │   │   ├── delete/route.ts       # DELETE account (PDPA erasure)
│   │   │   └── rewards/route.ts      # GET reward transaction history
│   │   │
│   │   ├── admin/
│   │   │   ├── stats/route.ts        # GET KPIs, charts, tables
│   │   │   ├── health/route.ts       # GET platform health view
│   │   │   ├── export/route.ts       # GET data export (6 types, PDPA compliant)
│   │   │   └── reports/[id]/publish/ # POST toggle published status
│   │   │
│   │   └── cron/
│   │       └── points-expiry/route.ts # GET weekly points expiry (Vercel Cron)
│   │
│   ├── components/
│   │   ├── AppShell.tsx              # Desktop sidebar + mobile bottom nav
│   │   ├── SurveyCard.tsx            # Feed card (boosted badge, progress, respond btn)
│   │   ├── FeedFilters.tsx           # Tag filter pills (URL-based routing)
│   │   ├── StatsBar.tsx              # Credits + points header row
│   │   ├── ConsentGate.tsx           # First-time PDPA consent screen
│   │   ├── I18nProvider.tsx          # next-intl provider (BM/EN auto-detect)
│   │   └── ui/
│   │       └── toaster.tsx           # Toast notification system
│   │
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth + Google SSO + .edu.my domain parser
│   │   └── supabase.ts               # Browser + server Supabase clients
│   │
│   └── locales/
│       ├── en/common.json            # English UI strings (complete)
│       └── bm/common.json            # Bahasa Malaysia UI strings (complete)
│
├── public/
│   └── manifest.json                 # PWA manifest (install prompt + shortcuts)
│
├── next.config.js                    # Security headers, image domains, redirects
├── tailwind.config.js                # ResearchLink design tokens
├── postcss.config.js
├── tsconfig.json
├── package.json
├── vercel.json                       # Cron schedule + security headers
├── .env.example                      # All required environment variables
├── .gitignore
└── README.md
```

---

## Setup (15 minutes)

### 1. Clone and install

```bash
git clone https://github.com/your-org/researchlink-malaysia
cd researchlink-malaysia
npm install
cp .env.example .env.local
# Fill in ALL values in .env.local
```

### 2. Supabase — run SQL files in order

Go to [supabase.com](https://supabase.com) → your project → **SQL Editor** → run each file:

```
sql/01_schema.sql         # Core tables
sql/02_rls_policies.sql   # PDPA Row Level Security
sql/03_functions.sql      # Anonymised data functions
sql/04_new_features.sql   # v1.1 new tables
sql/05_final_tables.sql   # Views, indexes, waitlist
```

**Important:** Create your project in **Singapore (ap-southeast-1)** for PDPA compliance.

### 3. Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://researchlink.com.my/api/auth/callback/google`
4. Add Client ID and Secret to `.env.local`

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Add all `.env.example` variables to **Vercel → Settings → Environment Variables**.

---

## Pre-launch checklist

### Legal (do before onboarding any user)
- [ ] SSM Sdn Bhd registration complete
- [ ] JPDP data controller registration filed (Section 16 PDPA)
- [ ] DPO appointed and notified to JPDP within 21 days
- [ ] Terms of Service drafted by Malaysian tech lawyer (budget RM 2–4k)
- [ ] Privacy Policy drafted and published at `/privacy`
- [ ] `researchlink.com.my` domain registered via MYNIC

### Technical
- [ ] All 5 SQL files run in Supabase (Singapore region)
- [ ] Google OAuth credentials configured
- [ ] Firebase project created, FCM enabled, `FIREBASE_ADMIN_SDK_JSON` set
- [ ] Wati account active, webhook URL set to `/api/whatsapp-bot/webhook`
- [ ] iPay88 merchant account approved
- [ ] `COMPLETION_TOKEN_SECRET` and `CRON_SECRET` generated (`openssl rand -hex 32`)
- [ ] Shopee affiliate account created, first voucher codes uploaded to `voucher_pool` table
- [ ] ZUS Coffee partnership email sent (use XMUM traction as proof)
- [ ] TNG eWallet API application submitted at developer.tngdigital.com.my
- [ ] Vercel cron job confirmed active (Settings → Cron Jobs)
- [ ] PostHog analytics working

### Go-live
- [ ] Change `next.config.js` root redirect from `/waitlist` → `/feed`
- [ ] Send launch emails to waitlist
- [ ] Founder posts MBA thesis as Survey #1

---

## Revenue stream activation

| Stream | What's built | Activation needed |
|--------|-------------|------------------|
| Boost (RM 20/50) | iPay88 integration complete | Register iPay88 merchant |
| Insight Blast | Corporate portal + campaign table | Send first pitch to GXBank |
| University dashboard | Full dashboard built | Sell to XMUM FYP office (pilot free) |
| Gen-Z reports | PDF pipeline complete | Generate first report, set price in admin |
| Supervisor tier | Dashboard built | Bundle with university subscription |
| AI assistant | Claude API integrated | Included in researcher account |

---

## Key design decisions

**PDPA is structural, not cosmetic.** Every respondent privacy guarantee is enforced at the Postgres layer via Row Level Security — researchers cannot query `respondent_id` or email in any query. The application layer is a second defence, not the first.

**Completion tokens solve the quality problem.** Points are only credited after cryptographic proof of survey completion. This is ResearchLink's most defensible quality differentiator.

**WhatsApp-first onboarding.** Malaysian students live in WhatsApp. The onboarding bot (Wati) gives them a signup link before they ever visit the web app, reducing cold-start friction significantly.

**BM/EN from day one.** Public university expansion (UM, UKM, UPM) requires Bahasa Malaysia. The full BM locale is built and auto-detected from browser language or `?lang=bm` URL param.
