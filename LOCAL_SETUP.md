# Running this project on your own machine

This document explains what's in this repository, what's actually working right
now, and how to get it running on your own PC. It's written for a machine that
has nothing installed yet.

## What this is

A three-way real estate marketplace (Customer / Dealer / Admin) with:

- **`apps/web`** — Next.js website
- **`apps/mobile`** — Expo (React Native) mobile app
- **`apps/api`** — NestJS backend (PostgreSQL + Prisma)
- **`packages/theme`** — the shared "Aurora Glass" design tokens (color, type, spacing, elevation)
- **`packages/icons`** — the shared icon set used by both web and mobile

## Honest status: what's actually built vs. designed

This matters, so it's stated plainly rather than left for you to discover.

**Built and working, end to end:**
- The full backend API — auth (register/OTP/login/JWT), listings, the
  requirement → broadcast lead → dealer accept (race-safe) → structured
  status updates → 6-hour SLA auto-release mechanic, chat (REST + WebSocket,
  with basic flag detection), reviews, notifications, and an admin console
  API (moderation, KYC review, flagged-message queue, audit log).
- Four screens on web: Home (live listings from the API), Login, Register,
  Verify OTP.
- **A full admin console UI** at `/admin` (web only, sign in with the admin
  account below): dashboard stats, users, dealers with KYC approve/reject,
  listings with moderation actions, a leads overview, chat monitoring
  (conversation list + a read-only thread viewer that highlights flagged
  messages), the flagged-message queue, reports with resolve/dismiss, and
  the audit log. All of it hits the real API — nothing mocked.
- The same four customer-facing screens on mobile, gated with local
  component state (no navigation library wired up yet — see "Known
  limitations" below).
- The **Aurora Glass** design system (fonts, color tokens, glass/blur
  components, icon set) shared by both frontends.

**Designed but not built as screens yet:** most of the customer/dealer side
of the ~80-screen inventory from the original product spec — property
detail pages, the dealer dashboard (lead feed, accept flow, status
updates), the in-app chat UI for customers/dealers, search filters wired to
the real API, requirement posting, etc. The **backend API for almost all of
this already exists and is tested** (see the smoke-test description below)
— it's the frontend screens that are the next round of work. Admin is the
one side that's now fully built out, UI included.

## Prerequisites

Install these first:

| Tool | Version | Check with |
|---|---|---|
| Node.js | 22.x | `node -v` |
| npm | 10.x+ (ships with Node) | `npm -v` |
| PostgreSQL | 16.x, running locally | `psql --version` |

Node/npm: https://nodejs.org (use the LTS installer, or `nvm install 22`)
PostgreSQL: https://www.postgresql.org/download/ (or `brew install postgresql@16` on macOS, or your Linux distro's package manager) — make sure the server is actually started, not just installed.

## Fast path: one script

From the repository root:

```bash
./setup.sh              # fresh database via migrations + seed (recommended default)
# or
./setup.sh --from-dump  # same schema, but restores database-dump.sql for its data instead
```

This installs dependencies, creates the `marketplace` Postgres role/database
if they don't already exist, copies each app's `.env.example` to its real
`.env` (skipped if one's already there), and prepares the database. It's
safe to re-run. If it can't figure out how to connect to Postgres as an
admin on your system, it'll tell you exactly what to run manually — see the
step-by-step version below for what it's doing under the hood.

Skip to **"Run it"** once it finishes. The rest of this section is the
manual, step-by-step version of the same thing, for when you'd rather do it
by hand or the script doesn't fit your setup.

## 1. Install dependencies

From the repository root (this is an npm workspaces monorepo — one install covers all three apps):

```bash
npm install
```

## 2. Set up the database

Start PostgreSQL if it isn't already running, then create a database and a role for the app:

```bash
psql -U postgres -c "CREATE USER marketplace WITH PASSWORD 'marketplace_dev' CREATEDB;"
psql -U postgres -c "CREATE DATABASE marketplace_dev OWNER marketplace;"
```

Depending on how Postgres was installed, `-U postgres` may prompt for a
password (Windows/most installers), may need `sudo -u postgres psql ...`
instead (Linux distro packages, which default to peer authentication), or
may not need `-U` at all (macOS Homebrew, where your own OS user is already
a superuser). `setup.sh` tries all three automatically.

Then apply the schema:

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
```

Now populate it — two options:

### Option A — fresh seed (clean slate, recommended)

```bash
npx prisma db seed
```

Creates the 4 seeded accounts and one listing — see "Test credentials" below.

### Option B — restore the included dump

```bash
cd ..   # back to repo root
PGPASSWORD=marketplace_dev psql -h localhost -U marketplace -d marketplace_dev -f database-dump.sql
```

`database-dump.sql` is data-only (the schema already came from `migrate
deploy` above) — it's a straight export of the same 4 seeded accounts and
one listing that `prisma db seed` creates. Functionally equivalent to
Option A; use whichever's more convenient.

## 3. Configure environment variables

Each app has a `.env.example` — copy it to the real filename:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

The defaults in `apps/api/.env.example` already match the database created
in step 2 (`marketplace` / `marketplace_dev` / `marketplace_dev`). If you
used different credentials, edit `DATABASE_URL` in `apps/api/.env` to match.

`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are dev placeholders — fine for
local use, but generate real random secrets before ever deploying this
anywhere reachable by the internet.

## 4. Run it

Three separate terminals:

```bash
# Terminal 1 — backend API (http://localhost:4000, Swagger docs at /docs)
cd apps/api
npx prisma generate   # only needed once, or after schema.prisma changes
npm run start:dev

# Terminal 2 — website (http://localhost:3000)
npm run dev:web

# Terminal 3 — mobile app (Expo dev tools)
npm run dev:mobile
```

For the mobile app: Expo will print a QR code — scan it with the Expo Go app
on your phone, or press `i`/`a` in the terminal to launch an iOS
simulator/Android emulator if you have one installed. **Note:** if you run
the mobile app on a physical device or an Android emulator, `localhost` in
`apps/mobile/.env` won't reach your computer — change
`EXPO_PUBLIC_API_URL` to your computer's LAN IP instead (e.g.
`http://192.168.1.23:4000`). The iOS simulator is the only case where
`localhost` works as-is.

Once all three are running, open **http://localhost:3000** in your browser.

## Test credentials

Every seeded account uses the same password: `DevPass123!`

| Role | Phone | Notes |
|---|---|---|
| Admin | `+920000000001` | Sign in on the website, then go to `/admin` for the admin console |
| Dealer | `+920000000002` | "Ahmed — City Realty", approved KYC, covers Lahore |
| Dealer | `+920000000003` | "Sara — Prime Homes", approved KYC, covers Lahore |
| Customer | `+920000000004` | "Bilal Khan" |

New accounts you register yourself go through the real OTP-verification
flow — the OTP code isn't actually sent anywhere (no SMS provider is wired
up yet), it's returned directly in the API response and shown on the
Verify screen with a "Dev mode" label, so you can complete signup without
needing a real phone.

## Useful commands

```bash
# Type-check / lint / build each app
npm run build:web          # from repo root
npm run lint:web
cd apps/mobile && npm run typecheck
cd apps/api && npx tsc --noEmit && npx eslint "src/**/*.ts" && npm test

# Browse/edit the database visually
cd apps/api && npx prisma studio

# API docs (once the API is running)
open http://localhost:4000/docs
```

## Known limitations (so you're not surprised)

- **OTP delivery is mocked.** No real SMS provider is connected — see
  `apps/api/src/auth/otp.service.ts` for where to plug one in (Twilio,
  etc.).
- **No file storage.** Listing photos and dealer KYC documents expect a
  URL — there's no upload endpoint or S3-style storage wired up.
- **No real-time infrastructure decision made for production.** Chat uses a
  self-hosted Socket.io WebSocket gateway, which works fine for local
  development and any host that supports persistent connections (a VPS,
  Railway, Render, etc.) but **will not work as-is on Vercel**, since
  Vercel's serverless functions can't hold a WebSocket connection open. If
  you deploy the API to Vercel, chat needs to be swapped to a managed
  real-time service (Pusher, Ably, Supabase Realtime) or polling.
- **No billing/payments, no VoIP calling.** Data models exist for some of
  this (dealer credits, call logs) but no payment gateway or telephony
  integration is connected.
- **Mobile has no navigation library yet.** The four mobile screens are
  gated with plain component state, not React Navigation or Expo Router —
  fine for four screens, but that'll need to change once more screens are
  built.
- **The mobile app was never visually verified running** (no simulator
  available in the environment this was built in) — it passes a full
  TypeScript type-check, but hasn't been seen rendering on a device.
  Please report anything that looks off.
