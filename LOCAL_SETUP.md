# Running this project on your own machine

This document explains what's in this repository, what's actually working right
now, and how to get it running on your own PC. It's written for a machine that
has nothing installed yet.

## What this is

A real estate marketplace and property-management platform with six account
types (Customer, Dealer, Admin, Company, Tenant, Plaza Manager) built around:

- **`apps/web`** — Next.js website
- **`apps/mobile`** — Expo (React Native) mobile app
- **`apps/api`** — NestJS backend (PostgreSQL + Prisma)
- **`packages/theme`** — the shared "Aurora Glass" design tokens (color, type, spacing, elevation)
- **`packages/icons`** — the shared icon set used by both web and mobile

## Honest status: what's actually built vs. designed

This matters, so it's stated plainly rather than left for you to discover.

**Built and working, end to end:**
- The full backend API — auth (register/OTP/login/JWT for six roles:
  customer, dealer, admin, company, tenant, and plaza manager), listings,
  the requirement → broadcast lead → dealer accept (race-safe) → structured
  status updates → 6-hour SLA auto-release mechanic, chat (REST + WebSocket,
  with basic flag detection), reviews, notifications, a **company/agency
  layer** (a company account owns an invite code; dealers join it
  themselves; the company gets rollup stats across every dealer who's
  joined), a **property-management layer** (see below), and an admin
  console API (moderation, KYC review, flagged-message queue, audit log).
- **Property management** — a full post-listing rental operations system,
  separate from the public marketplace listings:
  - An owner (a Customer or Dealer account) can add a rental property they
    manage directly (`RentalUnit`, standalone — layout, furnishing,
    monthly rent), move a tenant in with a lease (start/end dates, rent,
    deposit, an agreement link), and from then on sees that tenant's
    contact info, rent-payment history, utility bills, and maintenance
    requests, with approve/reject and mark-paid actions.
  - A **Plaza Manager** account (register with the "Plaza Manager" type)
    owns one or more `Plaza` buildings, each with any number of units
    (floor number, layout — studio/1-bed/2-bed/3-bed/4+/shop/office —
    furnishing, rent). The manager runs the exact same tenant/lease/
    payment/bill/maintenance workflow as an owner, but across every unit
    in every plaza they manage.
  - A Plaza Manager can **link a unit to its real owner** by phone number
    (an existing Customer/Dealer account) — from that point on, the same
    live data (lease, tenant, payments, bills, maintenance) is visible to
    both the manager and the real owner, not copied or exported, so it
    stays in sync automatically ("auto-share").
  - A **Tenant** account (its own role — register with the "Tenant" type)
    sees its active lease, uploads a rent-payment record each month (with
    an optional proof link) for the owner/manager to approve or reject,
    uploads utility bills (electricity/gas/water/internet/other), raises
    maintenance requests, and can message the owner/manager directly.
  - Owner/manager ↔ tenant messaging reuses the same `Conversation`/
    `Message` model as the rest of the app (REST, polled every few
    seconds on the frontend) — nothing new to moderate, the admin
    console's chat monitoring already covers it.
  - A lease whose end date passes gets closed out automatically by an
    hourly scheduled job (status → `ENDED`, unit → `VACANT`, both parties
    notified) — mirrors the existing 6-hour SLA-release cron on the lead
    mechanic, so an owner who forgets to click "End lease" doesn't
    permanently lose the ability to re-let the unit.
- **The core marketplace discovery flow** — previously the homepage's
  search box, filter pills, and "Post a requirement"/"Browse verified
  dealers" buttons were decorative; all of it is wired to the real API now:
  - Home: live listings, a search bar and filter pills that jump into
    `/listings` with the right query applied.
  - `/listings` — full search results with city/purpose/property-type/
    verified filters and pagination, all client-side interactive against
    `GET /listings`.
  - `/listings/[id]` — a real listing detail page (photos, price, size,
    description, owner/dealer), with a **"Message"** button that opens (or
    reuses) a conversation with the listing's owner — one conversation per
    (listing, buyer) pair, since many buyers can be interested in the same
    listing — landing the buyer straight in their chat inbox.
  - `/requirements/new` — the actual requirement-posting form (property
    type, purpose, city/area, budget, beds, notes), gated to signed-in
    customer accounts, posting to the same broadcast-to-matched-dealers
    mechanic that's always powered the backend.
  - `/dealers` — a public directory of KYC-approved dealers (agency,
    coverage cities, property types, rating), filterable by city.
  - `/dealer/leads-feed` — the **live lead feed** dealers had been missing:
    every open, unclaimed requirement matched to a dealer's coverage
    cities and property types, with a one-click **Accept** wired to the
    same race-safe atomic-claim mechanic as the API (first dealer to
    accept wins; a second click on an already-claimed lead is rejected).
    Distinct from **"My leads"**, which stays the history table of leads
    you've already claimed.
- Login, Register (with a Buyer/Owner, Dealer, or Company account-type
  picker), Verify OTP.
- **A full admin console UI** at `/admin` (web only, sign in with the admin
  account below): dashboard stats (marketplace *and* companies/property
  management in one view), a Users list covering every non-dealer role
  (customer/company/tenant/plaza manager, with a role column), dealers with
  KYC approve/reject, companies, listings with moderation actions, a leads
  overview, plazas, leases (read-only oversight — who owes a review, not an
  approve/reject action, since that decision belongs to the unit's owner or
  manager), chat monitoring (conversation list + a read-only thread viewer
  that highlights flagged messages), the flagged-message queue, reports
  with resolve/dismiss, and the audit log. All of it hits the real API —
  nothing mocked, and there's now no account type or data model admin can't
  see.
- **A working notification bell**, top-right on every dashboard/admin
  console and on the marketing nav once signed in: unread badge, a
  dropdown of recent notifications, click-to-mark-read, mark-all-read.
  Covers lead broadcast/accept/SLA-release, a new lease starting, a rent
  payment being submitted *and* reviewed, a utility bill being submitted,
  and a maintenance request being raised *and* updated.
- **Five more role-specific dashboards, also web-only and fully wired to
  the real API:**
  - `/dashboard` — the buyer/seller (customer) dashboard: an overview of
    open requirements and leads in progress, a table of every requirement
    you've posted with the live status of its matched lead, a table of any
    properties you've listed yourself (FSBO), and a **"My rentals"** tab —
    the property-management flow described above (add a rental property,
    move a tenant in, review their payments/bills/maintenance, chat).
  - `/dealer` — the dealer's own console: performance stats (active leads,
    accepted/closed/conversion rate, rating), a table of every lead you've
    ever claimed, your own listings, a **"My rentals"** tab (dealers can own
    and manage rental properties too — the backend always allowed it, this
    is where you actually reach it), and a Company tab to join or leave an
    agency by invite code.
  - `/company` — the company/agency console: register with the "Company"
    account type to get an invite code, share it with your dealers, and
    see a rollup (dealer count, active leads, conversion rate, total
    listings, average rating) plus a per-dealer table that drills into each
    dealer's full lead history and listings.
  - `/tenant` — the tenant portal: register with the "Tenant" account type,
    see your active lease and who to contact, submit rent payments and
    utility bills, raise maintenance requests, and chat with your owner or
    plaza manager.
  - `/plaza` — the plaza manager console: register with the "Plaza Manager"
    account type (this creates your first building), add more plazas, add
    units per floor with layout/furnishing/rent, move tenants in, link a
    unit's real owner by phone so records auto-share with them, and manage
    the same payment/bill/maintenance/chat workflow as an owner — across
    every unit you manage.
- The same four customer-facing screens on mobile, gated with local
  component state (no navigation library wired up yet — see "Known
  limitations" below).
- The **Aurora Glass** design system (fonts, color tokens, glass/blur
  components, icon set) shared by both frontends.
- **AI, powered by Gemini** (web only — see `apps/api/src/ai/`):
  - A floating **AI assistant widget** on every web page (bottom-right,
    signed-in or anonymous) that answers questions about listings, dealers,
    and market prices using live tool-calling against the real database —
    it never invents a price, a listing, or a dealer name, only reports
    what a tool call actually returned. Signed-in users get answers
    personalized to their own recent requirements (customer) or dealer
    profile (dealer). Supports **voice in** (the browser's
    `SpeechRecognition` API — click the mic) and **voice out** (toggle a
    speaker icon to have replies read aloud via `SpeechSynthesis`), both
    free, no extra API or billing involved.
  - A real **marketplace chat inbox** (`/dashboard/messages` for
    customers, `/dealer/messages` for dealers) — this was previously
    backend-only (admin could monitor it, nobody could actually use it).
    REST-polled, same pattern as the tenant/owner chat.
  - **AI auto-reply while a dealer is offline.** If a buyer messages a
    dealer who hasn't been active in the last 10 minutes, the AI drafts a
    brief, grounded reply from the dealer's lead/listing context and posts
    it under the dealer's own name — but it is **always and only** sent
    with `aiGenerated: true`, and every surface that renders it (the inbox,
    both sides) shows a distinct "AI Assistant" label. It never
    impersonates the dealer silently, and it never invents a price or
    promise the dealer hasn't actually made.
  - **AI-assisted chat moderation.** The existing fast regex-based flag
    detector (phone numbers, "message me on WhatsApp", etc.) still runs
    synchronously on every message; a second, slower Gemini-based pass now
    runs afterward in the background and can additionally flag scam/fraud
    language and harassment the regex can't catch — verified live with a
    message that named no phone number or off-platform keyword but was
    still correctly flagged as scam language.
  - Gracefully disabled, not broken, without a key: every AI feature checks
    `GeminiClient.enabled` first — with no `GEMINI_API_KEY` set, the
    assistant widget returns a clear "not configured" error and auto-reply/
    moderation silently no-op. The rest of the app is unaffected either way.

**Designed but not built as screens yet:** in-app review submission (the
`POST /reviews` API exists — see `apps/api/src/reviews/` — but there's no
frontend form to call it yet), and a few smaller items from the original
~80-screen product spec (saved searches/alerts have no backend or frontend
yet at all). The core buy/sell/rent discovery flow (search, listing
detail, requirement posting, dealer directory, the live lead feed) is now
built — see above. Admin and the six role dashboards were already fully
built out, UI included.

**Audited and hardened.** The whole platform went through a dedicated
correctness/security/completeness pass after the property-management layer
was added, and every real finding was fixed and re-verified live (not just
patched and assumed correct):
- A **race condition** in lease creation — two concurrent requests could
  both succeed and put a unit in an inconsistent state — is now closed with
  the same atomic-claim pattern the lead-accept mechanic already used;
  verified with real concurrent requests (exactly one wins).
- A **validation bypass** on the plaza-update endpoint (a plaza manager
  could inject arbitrary fields, including reassigning `managerId` to
  someone else) is fixed; verified the exact injection attempt now gets
  rejected.
- **Access tokens are now refreshed transparently.** They're short-lived
  (15 minutes) by design, and until this pass, nothing in the frontend ever
  refreshed one — every session silently broke after 15 minutes with no way
  back short of manually signing out and back in. `apiFetch` now retries
  once through `/auth/refresh` on a 401 before giving up, and only signs
  the user out if the refresh itself fails; verified by shortening the
  token lifetime to a few seconds and confirming a live session survives
  expiry with no visible interruption.
- Fixed a `&lt;input type="month"&gt;` bug where the rent-payment and
  utility-bill forms would visually blank themselves the moment you picked
  a month (the value still submitted correctly underneath, but it looked
  broken).
- A handful of list endpoints (admin's full conversation list, several
  property-management lists) had no row cap; all now match the `take: 200`
  convention used everywhere else in the API.
- Several tenant pages had no error handling on load — a transient failure
  left them stuck on "Loading…" forever; all now show a real error with a
  retry action.

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

**macOS / Linux:**
```bash
./setup.sh              # fresh database via migrations + seed (recommended default)
# or
./setup.sh --from-dump  # same schema, but restores database-dump.sql for its data instead
```

**Windows (PowerShell):**
```powershell
.\setup.ps1              # fresh database via migrations + seed (recommended default)
# or
.\setup.ps1 -FromDump    # same schema, but restores database-dump.sql for its data instead
```
If PowerShell blocks the script from running, run this once per session
first: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

Either script installs dependencies, creates the `marketplace` Postgres role/
database if they don't already exist, copies each app's `.env.example` to
its real `.env` (skipped if one's already there), and prepares the
database. Both are safe to re-run. If a script can't figure out how to
connect to Postgres as an admin on your system, it'll tell you exactly what
to run manually — see the step-by-step version below for what it's doing
under the hood.

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

**Optional: AI features.** Get a free key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) and set
`GEMINI_API_KEY` in `apps/api/.env`. Without it, the app runs exactly as
described everywhere else in this doc — the AI assistant widget, auto-reply,
and AI moderation pass just stay off. `GEMINI_MODEL` defaults to
`gemini-flash-lite-latest`, which had the most headroom on Google's free
tier as of when this was built (`gemini-flash-latest` free tier is limited
to 5 requests/minute, which the assistant can burn through in a couple of
back-and-forth exchanges since each turn can be more than one Gemini call
when it uses a tool).

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
| Dealer | `+920000000002` | "Ahmed — City Realty", approved KYC, covers Lahore — sign in and go to `/dealer` |
| Dealer | `+920000000003` | "Sara — Prime Homes", approved KYC, covers Lahore |
| Customer | `+920000000004` | "Bilal Khan" — sign in and go to `/dashboard` |

New accounts you register yourself go through the real OTP-verification
flow — the OTP code isn't actually sent anywhere (no SMS provider is wired
up yet), it's returned directly in the API response and shown on the
Verify screen with a "Dev mode" label, so you can complete signup without
needing a real phone.

There's no seeded Company, Tenant, or Plaza Manager account (the dump
predates those roles) — register new accounts to try them:

- **Company**: register with account type "Company" → you land on
  `/company` with an invite code. Sign in as an existing dealer (e.g.
  `+920000000002`), go to `/dealer/company`, and enter that code to join.
  The company account then shows that dealer's stats on `/company/dealers`.
- **Property management (owner side, no plaza needed)**: sign in as the
  seeded customer `+920000000004`, go to `/dashboard/rentals`, and add a
  property. To move a tenant in you'll first need a Tenant account (see
  next point) — the lease form asks for the tenant's phone number, and
  that account must already exist with the Tenant role.
- **Tenant**: register with account type "Tenant" (no extra fields needed).
  Once an owner or plaza manager creates a lease using this account's
  phone number, sign in and go to `/tenant` to see it.
- **Plaza Manager**: register with account type "Plaza Manager" and a
  building name — you land on `/plaza` with your first plaza already
  created. Add a unit, then use its lease form with a Tenant account's
  phone number to move someone in. To demo the owner auto-share, register
  a separate Customer account and use "Link owner" on the unit detail page
  with that account's phone number.

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
- **No file storage.** Listing photos, dealer KYC documents, lease
  agreements, rent-payment proof, and utility-bill documents all expect a
  URL — there's no upload endpoint or S3-style storage wired up.
- **Rent payments and utility bills are self-reported, not verified.** A
  tenant marks a payment as made and links proof; the owner/plaza manager
  approves or rejects it by eye. There's no payment gateway integration
  (see "No billing/payments" below), so nothing enforces that the money
  actually moved.
- **The tenant/owner/plaza-manager chat is REST-polled, not WebSocket.**
  It reuses the same `Conversation`/`Message` model as the rest of the app,
  but the frontend polls every 4 seconds rather than opening a socket —
  simple and reliable locally, but not instant, and worth swapping to the
  existing WebSocket gateway (or a managed real-time service, see below)
  before treating it as production chat.
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
- **AI voice input/output uses the browser's Web Speech API, not a
  server-side model.** `SpeechRecognition` (voice in) is well-supported in
  Chrome/Edge/Safari but not Firefox; the mic button simply doesn't render
  when a browser lacks it, so there's no broken control to click, but voice
  input silently isn't an option there. `SpeechSynthesis` (voice out) is
  broadly supported.
- **No cost controls on the Gemini integration.** There's no per-user rate
  limit, quota, or spend cap in front of the AI assistant, auto-reply, or
  moderation pass beyond whatever's configured on the Google AI Studio key
  itself — fine for local dev and a free-tier key, but add one before
  exposing this publicly with a paid key.
- **AI moderation is a second opinion, not a gate.** It runs asynchronously
  after a message is already saved and delivered — it can flag a message
  for the trust & safety queue after the fact, but (like the existing regex
  pass) it never blocks sending. Both are best-effort filters, not a
  guarantee.
