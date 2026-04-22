# Spec: Agrova — Farm Operations Management App

> **Status:** Draft v1.0 — all requirements clarified via 10 rounds of Q&A
> **Owner:** (the operator — solo dev with AI agent help)
> **Last updated:** 2026-04-22
>
> Companion docs:
> - `../DESIGN.md` — design system (read before any UI work)
> - `../.cursor/rules/*` — coding rules

A **task management PWA** for a Turkish fruit operation that runs ~500 fields scattered across a city. An owner plans tasks on a web dashboard; foremen, agronomists, and low-literacy workers see and complete those tasks on a mobile-optimized PWA. The app also tracks equipment/chemical usage tied to each task, collects issue reports with photos, shows basic weather, and notifies the right person when anything happens.

---

## 1. Objective

### What we're building
A single-tenant internal tool. One operator, ~500 fruit fields, ~30–80 field staff, all in Turkey.

### Core promise
Replace paper + Excel + phone calls + foreman memory with a simple app: the owner plans, field staff execute, everyone stays in sync.

### Vision non-goals
Explicitly not building: accounting, invoicing, inventory valuation, harvest yield/weight tracking, attendance/clock-in-out, hours-for-payroll, multi-tenant SaaS, pesticide-compliance-grade logging (full Bitki Koruma detail deferred), migration tools for non-Turkish operators.

### Target users (all roles, one app)

| Role | Device | What they do |
|---|---|---|
| **Owner** (you) | Web (laptop / tablet) | Create and assign tasks, see today across all fields, review issues, manage field/worker/equipment catalogs |
| **Foreman** (ekipbaşı) | Mobile PWA | See & complete assigned tasks; reassign to crew; report issues |
| **Agronomist** | Mobile PWA | Same as foreman; typically assigned technical tasks (spraying, scouting) |
| **Worker** (field staff) | Mobile PWA | See today's tasks → tap Start → tap Done → maybe attach photo; report issues with photo |

**Note on worker literacy:** workers can barely read. The worker UX is therefore **icon + photo + color first**. No free-text entry. All labels in Turkish. See `DESIGN.md` and Section 6 below.

### User stories (acceptance-grade)

**Owner**
- I can draw ~500 field polygons on a satellite map over time, annotating each with crop, area, and plant count.
- I can create a task in ≤ 20 seconds: pick activity, pick field(s), pick assignee, set due date, optionally add notes and a priority.
- I can see a live board of every task today across the farm, color-coded by status.
- I get a notification the moment any worker reports an issue or marks a task blocked.
- I can export a CSV of all tasks + issues for any date range.
- I can see current weather for my city on the dashboard.

**Foreman / Agronomist / Worker**
- I install the PWA to my home screen. Once set up (via an SMS link from the owner), I never log in again — the session persists.
- I open the app: I see today's tasks assigned to me as a short icon-driven list.
- I tap a task: the next screen shows the activity icon, the field name, and 3 buttons: **Start · Block · Cancel**.
- Tapping **Start** flips the task to In Progress. Tapping it again shows **Done · Block**. Tapping **Done** asks me (optionally) to attach a photo, then a big green **Confirm** on a second screen.
- If something's wrong, I pick one of 7 issue icons, I **must** attach a photo, and I submit.
- I can hand off my task to another person via a **Reassign** button.
- If I lose signal mid-shift, everything keeps working. When I'm back on Wi-Fi/4G, pending actions sync automatically.

---

## 2. Success Signals (KPIs)

| Signal | Target | Measurement |
|---|---|---|
| Time for worker to mark a task done (taps + seconds) | ≤ 3 taps, ≤ 8 seconds | In-app telemetry (future) / manual QA |
| Time for owner to create & assign a task | ≤ 20 seconds | Stopwatch during onboarding |
| Offline durability | Full app usable for ≥ 4 hours with no signal | Manual QA |
| Cold-start on low-end Android (Samsung A14) | ≤ 2.5s to interactive | Lighthouse |
| Issue-to-owner-notification latency (online) | ≤ 10s | Logs |
| Dashboard "Today" page — time to visible data | ≤ 800ms on 4G | Lighthouse |
| Accidental task completions (reported) | < 1% over 30 days | User feedback |

---

## 3. Scope

### In scope (MVP)

**Catalogs (managed by owner on web)**
- Fields (~500): name, GPS center, polygon boundary, area, crop + variety (free text), plant count, planted year, address, free-text notes
- People: name + phone only; role = Owner / Foreman / Agronomist / Worker
- Equipment: vehicles, tools, chemicals, crates — each as a named item with category and optional notes
- Activities: a fixed list with custom additions — Budama (prune), İlaçlama (spray), Sulama (irrigate), Gübreleme (fertilize), Seyreltme (thin), Hasat (harvest), Çapalama (weed), Dikim (plant), Aşılama (graft), Gözlem (scout), Don koruma (frost protection), Biçme (mow), Nakliye (transport), Diğer (other)

**Task flow**
- Owner creates a task: activity, field(s) (one or many), assignee, due date, priority (Low/Normal/Urgent), optional notes, optional equipment association
- Assignee sees it in their today list (mobile)
- Task states: **TODO → IN_PROGRESS → DONE**, plus **BLOCKED** and **CANCELLED**
- Anyone can reassign their own task to anyone else
- On completion: optional photo, confirm on second screen
- On block: reason picked from the 7 issue types + required photo
- Light recurrence: "duplicate for tomorrow" / "duplicate across N fields" — no cron-style scheduler in MVP

**Equipment usage log**
- When a task is created or in-progress, the assignee can associate equipment used (vehicles, tools, chemicals)
- This creates equipment-usage records linked to the task (who, what, when, which task, which field)
- Chemicals in MVP: just timestamp + applicator + field (no name/dose/target pest required — basic log only)
- All other equipment: just tap to associate; duration/usage is implicit from task duration

**Issue reporting**
- Any mobile user can open the "Report Issue" flow from anywhere in the app
- 7 fixed categories: Zararlı/Hastalık (pest), Bozuk Alet (broken equipment), Yaralanma (injury), Sulama Sorunu (irrigation), Hava Hasarı (weather damage), Hırsızlık (theft), Eksik Malzeme (missing supply)
- **Required:** category + one photo (camera or library)
- Optional: voice note recording
- Auto-attached: location (field from current task if any, or GPS), reporter, timestamp
- Issue is linked to a task if reported from within a task (otherwise free-standing)

**Web Push notifications**
- Every action is logged and notified (per the Round 8 answer)
- Events: task assigned to me · task reassigned to me · task I own is blocked · any issue reported · any task done (owner only) · daily end-of-day digest (owner) · weather alerts (later)
- Delivery: Web Push (browser/PWA) — only channel in MVP
- Each user can mute categories in settings
- SMS and WhatsApp **deferred to v1.1**

**Weather**
- Single widget on owner dashboard showing today's forecast for the operation's city (owner sets the city once in settings)
- Source: a free weather API (OpenWeatherMap or Open-Meteo)
- No per-field weather in MVP, no alerts, no history

**Map**
- Leaflet + ESRI World Imagery (satellite) tiles, free
- Owner draws field polygons on the map (one at a time) during field creation
- Owner home page shows all fields as polygons over the satellite
- Clicking a polygon opens the field detail

**Owner home screen (you asked me to design this)**
Designed as a **split dashboard** — a layout that scans quickly in the morning:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Sidebar    │  BUGÜN  (Today)                                             │
│            │  ┌───────────┬───────────┬───────────┬───────────┐          │
│ ● Bugün    │  │ 47 görev  │ 3 sorun   │ 12 tarla  │ Hava      │          │
│ ○ Tarlalar │  │ açık      │ açık      │ aktif     │ 24°C ☀    │          │
│ ○ Görevler │  └───────────┴───────────┴───────────┴───────────┘          │
│ ○ Sorunlar │                                                             │
│ ○ Raporlar │  ┌────────────────────────────────┐┌────────────────────┐   │
│ ○ Ayarlar  │  │ Bugünkü Görevler               ││ Harita             │   │
│            │  │ ┌─[YAPILACAK]──────────────┐   ││  ┌──────────────┐  │   │
│            │  │ │ Budama · Akpetek-3 · ... │   ││  │   (satellite │  │   │
│            │  │ │ Sulama · Çiftlik-7 · ... │   ││  │    map of    │  │   │
│            │  │ └──────────────────────────┘   ││  │    fields)   │  │   │
│            │  │ ┌─[SÜRÜYOR]────────────────┐   ││  └──────────────┘  │   │
│            │  │ │ İlaçlama · Karga · ...   │   │└────────────────────┘   │
│            │  │ └──────────────────────────┘   │                         │
│            │  │ ┌─[BİTTİ]──────────────────┐   │ ┌────────────────────┐  │
│            │  │ │ ... (collapsed)          │   │ │ Son Aktivite       │  │
│            │  │ └──────────────────────────┘   │ │ • Ahmet bitirdi... │  │
│            │  └────────────────────────────────┘ │ • Mehmet başladı.. │  │
│            │                                     │ • Sorun: Zararlı.. │  │
│            │                                     └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Four stat tiles** at top: open tasks today, open issues, active fields, weather
- **Task board** (left, primary) grouped by status (kanban-style columns or stacked collapsible groups on narrow screens)
- **Map** (right, secondary) with today's active fields highlighted
- **Activity feed** (bottom right) — the last 20 events (tasks started, completed, issues, reassignments)

### Out of scope (explicitly)

- Harvest / yield / weight tracking
- Attendance / clock-in-out / hours / payroll
- Worker identity beyond name + phone (no TC Kimlik, no SGK, no bank IBAN)
- Multi-farm / multi-tenant support (one owner, one farm)
- Turn-by-turn navigation to fields (workers already know)
- SMS / WhatsApp (deferred to v1.1)
- Observability (Sentry, PostHog, etc.) — add later if problems appear
- Full pesticide regulatory logging (defer detailed fields to v1.x)
- Video capture
- Per-field weather forecasts or historical weather
- Equipment maintenance schedules, fuel meter readings, odometer tracking
- Field bulk-import from Excel (manual entry, gradual)
- Agronomic analytics (yield/ha, labor cost/kg, etc.)
- Turkish payroll software integrations
- Migrant / non-Turkish-speaker support

---

## 4. Tech Stack

### Final decisions (all confirmed in Q&A)

| Layer | Choice | Why |
|---|---|---|
| **App form** | **Progressive Web App** (installable, one codebase for mobile + desktop) | Good 4G availability + hours of offline (not days) + solo dev + internal tool = PWA wins on maintenance cost |
| **Framework** | **React 19 + Vite + TypeScript** (strict) | Fast DX, huge AI-training-data footprint, well-documented, shadcn/ui native |
| **Routing** | **TanStack Router** (file-based) | Type-safe routes, great search-params handling |
| **UI kit** | **Tailwind CSS v4 + shadcn/ui** | Matches `DESIGN.md`; fastest path to production-quality UI |
| **Icons** | **Lucide React** + custom activity SVGs | See `DESIGN.md §9` |
| **Backend** | **Supabase** (Postgres 15 + Auth + Storage + Realtime + RLS) | Removes 90% of backend work; solo dev win |
| **Region** | **Supabase Cloud — Northeast Asia (Seoul)** | User-selected |
| **Mobile auth** | **SMS magic-link setup → persistent session** (Supabase Auth with custom phone-OTP flow, then never expires on device) | Workers can't type passwords; one-time friction only |
| **Owner auth** | **Email + password** (Supabase Auth) | Standard |
| **Offline storage** | **Dexie (IndexedDB wrapper)** — caches fields, today's tasks, issue categories, activities; **outbox** pattern for writes | Battle-tested; small; works inside service worker |
| **Service worker** | **Vite PWA plugin (Workbox)** | Standard PWA tooling |
| **Maps** | **Leaflet 1.9 + `react-leaflet` + ESRI World Imagery tiles** | Free, small bundle, polygon drawing via `leaflet-draw` |
| **i18n** | **`@lingui/react`** or **`react-i18next`** (pick one — Lingui preferred for DX) | Turkish-only at launch but externalized for future |
| **Date / time** | **`date-fns`** with `tr` locale, `Europe/Istanbul` timezone hard-coded | Simple, clear |
| **Forms** | **TanStack Form + Zod** | Type-safe, works well with Supabase |
| **Server state** | **TanStack Query** | Pairs with Supabase nicely; manages caching + revalidation |
| **Client state** | **Zustand** if cross-component state emerges | Only when needed |
| **Weather API** | **Open-Meteo** (free, no API key, generous rate limit) | Simplest path |
| **Notifications** | **Web Push API** via Supabase Edge Function + `web-push` library | In-stack, no extra vendor |
| **Testing** | **Vitest** (unit) + **Playwright** (e2e, critical flows only) | Industry standard |
| **Hosting (frontend)** | **Vercel** or **Cloudflare Pages** — both free for solo use | Pick on deploy day |
| **CI** | **GitHub Actions** — lint + typecheck + unit tests on every push; e2e nightly | Free for public repos / generous for private |

### Rejected alternatives & why
- **Flutter / React Native / native** — you're solo, connectivity is good, no app-store needs. PWA is simpler.
- **Self-hosted Node + Postgres** — Supabase removes ~3 weeks of auth/RLS/storage plumbing.
- **Next.js** — server components are overkill for a single-tenant internal tool. Vite's simpler.
- **Mapbox / Google Maps** — cost and complexity vs. Leaflet + free ESRI tiles.
- **SMS/WhatsApp in MVP** — WhatsApp Business API approval alone takes weeks; deferred.

---

## 5. Data Model

Everything lives in Supabase Postgres with Row-Level Security. Schema summary:

### `people`
```
id (uuid, pk)
full_name (text)
phone (text, unique)           -- E.164 format, e.g., +905301234567
role (enum: OWNER | FOREMAN | AGRONOMIST | WORKER)
auth_user_id (uuid, nullable)  -- links to supabase.auth.users when they've set up
setup_token (text, nullable)   -- one-time SMS link token; null once claimed
notification_prefs (jsonb)     -- which events trigger push for this person
created_at, updated_at
```

### `fields`
```
id (uuid, pk)
name (text)                    -- e.g., "Akpetek-3"
crop (text)                    -- free text: "elma", "kiraz", "şeftali"
variety (text, nullable)       -- e.g., "Golden Delicious"
plant_count (int, nullable)
planted_year (int, nullable)
area_hectares (numeric, nullable)
address (text, nullable)
gps_center (point)             -- PostGIS point
boundary (polygon, nullable)   -- PostGIS polygon
notes (text, nullable)
created_at, updated_at
```

### `equipment`
```
id (uuid, pk)
category (enum: VEHICLE | TOOL | CHEMICAL | CRATE)
name (text)                    -- e.g., "Traktor-3", "Motorlu Testere A"
notes (text, nullable)
active (bool, default true)
created_at, updated_at
```

### `tasks`
```
id (uuid, pk)
activity (text)                -- one of the activity codes or a custom slug
field_id (uuid, fk)            -- tasks are single-field; if owner creates for N fields, we create N tasks
assignee_id (uuid, fk → people)
created_by (uuid, fk → people) -- always the owner in MVP
status (enum: TODO | IN_PROGRESS | DONE | BLOCKED | CANCELLED)
priority (enum: LOW | NORMAL | URGENT)
due_date (date)
notes (text, nullable)
completion_photo_url (text, nullable)  -- optional photo on Done
created_at, updated_at, completed_at (nullable), blocked_at (nullable)
```

### `task_equipment` (join)
```
task_id, equipment_id, attached_by (person), attached_at
```

### `chemical_applications`
For the "basic pesticide log" — just the three required fields:
```
id (uuid, pk)
task_id (uuid, fk)
field_id (uuid, fk)             -- denormalized for faster reporting
applicator_id (uuid, fk → people)
applied_at (timestamptz)
created_at
```
(Name/dose/target pest deferred to a later version when we extend the table.)

### `issues`
```
id (uuid, pk)
task_id (uuid, fk, nullable)    -- if reported from within a task
field_id (uuid, fk, nullable)   -- if reported free-standing but attached to a field
reporter_id (uuid, fk → people)
category (enum: PEST | EQUIPMENT | INJURY | IRRIGATION | WEATHER | THEFT | SUPPLY)
photo_url (text)                -- required
voice_note_url (text, nullable)
gps_lat, gps_lng (numeric, nullable)
resolved_at (timestamptz, nullable)
resolved_by (uuid, nullable)
created_at
```

### `activity_log` (audit + notification source)
Every state change writes here. This is also the source of the activity feed on the dashboard.
```
id (uuid, pk)
actor_id (uuid, fk → people)
action (text)                   -- e.g., 'task.created', 'task.started', 'task.done', 'task.blocked', 'task.reassigned', 'issue.reported'
subject_type (text)             -- 'task' | 'issue'
subject_id (uuid)
payload (jsonb)                 -- event-specific data
created_at (timestamptz)
```

### `notifications`
```
id (uuid, pk)
recipient_id (uuid, fk → people)
activity_log_id (uuid, fk)
delivered_at (timestamptz, nullable)
read_at (timestamptz, nullable)
created_at
```

### Row-Level Security policies
- `people`: readable by any authenticated user; only owner can write
- `fields`, `equipment`: readable by any authenticated user; only owner can write
- `tasks`: owner has full access; assignees can read and transition status (TODO→IN_PROGRESS→DONE/BLOCKED, plus reassign to anyone); others have read-only
- `issues`: any authenticated user can insert; everyone can read; only owner can resolve
- `activity_log`, `notifications`: system-managed; select via RLS (own notifications)

---

## 6. UX Specification

Built on the design system in `DESIGN.md`. Screens below.

### Worker PWA (mobile, bottom-tab nav: Görevler / Geçmiş / Profil)

**1. Setup (one-time)**
- Owner creates a person → clicks "Kurulum linki gönder" → Supabase edge function sends SMS with a magic link
- Worker taps the link → opens the PWA → prompted to install to home screen → signed in → never prompted again

**2. Görevler (Tasks) — the home**
- Big header "Merhaba, {name}" + today's date in Turkish (e.g., "Salı, 22 Nisan")
- Small sync indicator in top-right (green dot = synced, orange = pending, gray = offline)
- List of today's assigned tasks as cards:
  - Left: 96×96 activity icon in an Orchard-tinted circle
  - Center: Activity name (20px/600) · Field name (16px/500) · Due time (14px, muted)
  - Right: Status chip + priority dot if urgent
- Tapping a card → Task Detail

**3. Task Detail**
- Top: same activity icon, big · activity name · field name
- Middle: notes from owner (if any) · assignee name · "Sen" highlighted
- Bottom (sticky, full width): primary action button (72px tall, pill)
  - State TODO: `[▶ Başla]` (Start)
  - State IN_PROGRESS: `[✓ Bitir]` (Done)
- Secondary row of 3 icon buttons:
  - `[⚠ Sorun]` — opens Issue Report flow, auto-linked to this task
  - `[🔧 Alet]` — attach equipment used
  - `[↪ Aktar]` — reassign to someone else

**4. Completion flow**
- Tap **Bitir** → screen shows optional "Fotoğraf ekle?" with camera icon
- Take/pick photo or skip
- **Confirmation screen:** big activity icon + "Bu görev bitti mi?" with two buttons: `[Evet, bitir]` (green) / `[İptal]` (ghost)
- On Evet: animation ✓ → back to list

**5. Issue Report**
- Full-screen grid of 7 big icon tiles (one per issue category), label below each
- Tap one → camera opens immediately → take photo (required)
- Confirm screen: thumbnail + category name + optional "Sesli not" button (voice record, optional)
- `[Gönder]` button submits

**6. Geçmiş (History)**
- List of my tasks this week, grouped by day, status chip next to each

**7. Profil**
- Name, phone, role
- Notification mute toggles per category
- Language (future) · Theme (system / light / dark)
- Log out (rarely used — persistent session)

### Owner web dashboard (left sidebar + content)

Sidebar items: **Bugün · Tarlalar · Görevler · Sorunlar · Ekip · Ekipman · Raporlar · Ayarlar**

**1. Bugün (Today)** — home screen (see ASCII mockup in Section 3 above)

**2. Tarlalar (Fields)**
- Full-screen satellite map + right side list
- Click a polygon → field detail side-sheet: name, crop, area, current tasks, all metadata
- "Yeni tarla ekle" button → draw polygon → fill form → save

**3. Görevler (Tasks)**
- Table view (default) and kanban view (toggle)
- Filters: status · field · assignee · activity · date range
- Table columns: Activity · Field · Assignee · Status · Priority · Due date
- Row click → task detail side-sheet with full timeline (audit log)
- "Yeni görev" button opens creation modal

**4. Task creation modal** (critical UX)
- Activity picker (icon grid)
- Field picker (search + multi-select — if multiple, the system creates N tasks)
- Assignee picker (list with roles)
- Due date (date picker)
- Priority (3 buttons)
- Notes (textarea)
- Optional "Ekipman bağla" section
- "Oluştur" button

**5. Sorunlar (Issues)**
- Feed view, newest first
- Each card: category icon, photo thumbnail (click to enlarge), reporter, field, timestamp, status (open/resolved)
- "Çözüldü olarak işaretle" button
- Filters: category · field · resolved

**6. Ekip (People)**
- Table: name, phone, role, last active
- "Yeni kişi" opens form → fills details → "Kurulum linki gönder"

**7. Ekipman (Equipment)**
- Tabs per category: Araçlar · Aletler · Kimyasallar · Kasalar
- Simple list with add/edit/archive

**8. Raporlar (Reports)**
- Date range picker
- Two buttons: "Görevleri indir (CSV)" · "Sorunları indir (CSV)"
- No fancy charting in MVP

**9. Ayarlar (Settings)**
- Operation name, city (for weather), timezone (fixed), language (tr-only)
- Own profile · password change

---

## 7. Offline Strategy

Because connectivity is "good 4G" but "hours offline" possible:

**Cached locally (IndexedDB via Dexie):**
- All people (~50 records)
- All fields (~500 records, including polygons — maybe 1–2 MB)
- All activities, issue categories, equipment
- Today's tasks assigned to me (mobile) / today's tasks total (owner)
- Unread notifications

**Write outbox:**
- Every mutation (task state change, issue report, equipment attach, reassign) writes to an `outbox` Dexie table first, then posts to Supabase
- On failure: exponential backoff (5s, 30s, 2m, 10m, cap 15m) with retry
- Each outbox row has a client-generated UUID → idempotent; Supabase rejects duplicates

**Sync:**
- On regain-online event → flush outbox, then re-fetch today's data
- On app open → fetch in background, show cached first

**Conflict rules:**
- Task status transitions: last server-timestamp wins
- Task reassignment: last server-timestamp wins
- Issues: append-only, no conflict possible
- Equipment attachments: append-only

**UI signals:**
- Sync indicator (top right on mobile, sidebar bottom on web): green dot = synced, orange = pending (count), gray = offline
- Tapping the indicator on mobile opens a simple "Sync status" sheet with outstanding items

**Photos:**
- Captured → stored in Cache Storage + referenced in outbox
- Upload to Supabase Storage only when online and preferably on Wi-Fi (fall back to cellular after 10 min if Wi-Fi unavailable)
- Task/issue considered submitted even before photo uploads; photo_url fills in asynchronously

---

## 8. Commands

Single-package Vite app (no monorepo complexity for solo dev).

```bash
# one-time
pnpm install

# develop
pnpm dev                       # vite, port 5173
pnpm supabase:start            # local supabase (docker)

# quality
pnpm lint                      # eslint + prettier check
pnpm lint:fix
pnpm typecheck                 # tsc --noEmit
pnpm test                      # vitest
pnpm test:watch
pnpm test:e2e                  # playwright (critical flows only)

# db
pnpm supabase:migrate          # apply migrations to local
pnpm supabase:push             # push to cloud
pnpm supabase:gen-types        # generate typescript types from schema

# build & deploy
pnpm build                     # vite build
pnpm preview                   # preview built PWA locally
pnpm deploy                    # deploy to vercel/cloudflare (tbd on deploy day)
```

---

## 9. Project Structure

```
agrova/
├── DESIGN.md                         # design system (read first)
├── specs/
│   └── farm-operations-app.md        # this file
├── supabase/
│   ├── migrations/                   # SQL migrations
│   ├── functions/                    # edge functions (sms setup, web-push)
│   └── seed.sql                      # seed data for local dev
├── src/
│   ├── main.tsx                      # app entry
│   ├── routes/                       # TanStack Router file-based routes (ENGLISH paths)
│   │   ├── _owner/                   # owner-only layout (sidebar)
│   │   │   ├── today.tsx             # UI title: "Bugün"
│   │   │   ├── fields.tsx            # UI title: "Tarlalar"
│   │   │   ├── tasks.tsx             # UI title: "Görevler"
│   │   │   ├── issues.tsx            # UI title: "Sorunlar"
│   │   │   ├── people.tsx            # UI title: "Ekip"
│   │   │   ├── equipment.tsx         # UI title: "Ekipman"
│   │   │   └── reports.tsx           # UI title: "Raporlar"
│   │   ├── _mobile/                  # mobile-optimized layout (bottom tabs)
│   │   │   ├── tasks.tsx             # UI title: "Görevler"
│   │   │   ├── task.$id.tsx          # UI title: activity name
│   │   │   ├── report-issue.tsx      # UI title: "Sorun Bildir"
│   │   │   ├── history.tsx           # UI title: "Geçmiş"
│   │   │   └── profile.tsx           # UI title: "Profil"
│   │   ├── setup.$token.tsx          # one-time SMS setup link
│   │   └── login.tsx                 # owner login
│   ├── features/                     # feature-scoped code
│   │   ├── tasks/
│   │   ├── fields/
│   │   ├── issues/
│   │   ├── equipment/
│   │   ├── people/
│   │   ├── notifications/
│   │   └── weather/
│   ├── components/                   # reusable primitives
│   │   ├── ui/                       # shadcn-generated
│   │   ├── icons/
│   │   │   └── activities/           # custom activity icons
│   │   ├── map/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase.ts               # supabase client
│   │   ├── db.ts                     # dexie database
│   │   ├── sync.ts                   # outbox + reconciliation
│   │   ├── i18n.ts                   # lingui setup
│   │   ├── date.ts                   # date-fns + tr locale
│   │   └── push.ts                   # web push registration
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── db.ts                     # generated from supabase
├── public/
│   ├── icons/                        # pwa icons
│   ├── manifest.webmanifest
│   └── sw.js                         # generated by vite-plugin-pwa
├── e2e/                              # playwright tests
├── .cursor/                          # already present
├── .github/workflows/
│   └── ci.yml
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 10. Code Style

TypeScript strict. Functional core + thin imperative shell. Zod at every Supabase boundary.

**File + symbol naming**
- Files: `kebab-case.ts(x)`. Components: `PascalCase.tsx`.
- Exports: named only. No default exports except route/entry files.
- Types: prefer `type` over `interface`.
- No `any`. No non-null assertions (`!`) except with a `// justified:` comment.
- Comments explain *why*, never *what*.
- Absolute imports from `@/` (configured via Vite alias).

**Example — a feature service:**
```ts
// src/features/tasks/complete-task.ts
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { outbox } from '@/lib/db'

export const completeTaskInput = z.object({
  taskId: z.string().uuid(),
  actorId: z.string().uuid(),
  completionPhotoUrl: z.string().url().optional(),
})

export type CompleteTaskInput = z.infer<typeof completeTaskInput>

export async function completeTask(input: CompleteTaskInput) {
  const parsed = completeTaskInput.parse(input)
  const completedAt = new Date().toISOString()

  await outbox.enqueue({
    kind: 'task.complete',
    payload: { ...parsed, completedAt },
  })

  // optimistic local update; remote reconciliation happens in sync worker
  return { taskId: parsed.taskId, completedAt }
}
```

**React conventions**
- Function components only. No class components.
- State colocated; lift only when it must cross.
- Server state via **TanStack Query** (never a naked `fetch` in a component).
- Every page a lazy route (TanStack Router handles this).
- Tailwind for styling; shadcn components for UI primitives; `cn()` util for conditional classes.

**No narrative comments rule**
Do not write `// Import the module` or `// Fetch the data`. If the reader can see what the code does, comments don't help.

---

## 11. Testing Strategy

**Philosophy:** Test behavior, not implementation. Favor integration tests over unit tests. E2E only for the most critical user journeys.

| Layer | Framework | Location | What |
|---|---|---|---|
| Unit | **Vitest** | colocated `*.test.ts(x)` | Pure services (sync reconciliation, zod schemas, date utils) |
| Supabase | **Vitest + local supabase** | `src/features/**/integration/*.test.ts` | RLS policies, DB constraints, edge function behavior |
| Component | **Vitest + React Testing Library** | colocated `*.test.tsx` | Behavior only, not snapshots |
| E2E | **Playwright** | `e2e/` | 5–7 critical flows (see below) |

**Coverage targets:**
- `src/lib/sync.ts` and `src/lib/db.ts`: **≥ 95%**. Bugs here cost the most.
- `src/features/**/*.ts` (services): **≥ 80%**.
- Components: no numeric target — judged by meaningful tests.
- Repo overall: **≥ 70%**.

**Critical E2E flows (Playwright)**
1. Owner creates a field, draws polygon, saves
2. Owner creates a task assigned to a worker, worker sees it on mobile view
3. Worker completes a task (Start → Done → Confirm)
4. Worker reports an issue with a photo — owner sees the notification
5. Worker goes offline, completes a task, returns online, sync succeeds
6. Owner reassigns a task; new assignee sees it
7. Owner exports tasks as CSV

**Rules**
- Every bug fix lands with a regression test that fails before the fix.
- Tests are deterministic. No sleeps; use fake timers.
- CI runs unit + integration on every PR; E2E nightly.

---

## 12. Security & Privacy

- **Transport:** HTTPS only (Vercel / Cloudflare Pages enforce).
- **Auth:** Supabase Auth handles password hashing (Argon2), JWTs, session cookies.
- **Row-Level Security:** Every table has RLS policies. No anonymous access except the one-time setup link claim.
- **Photos:** Supabase Storage with signed URLs (expire after 1 hour when served to the UI).
- **Personal data (KVKK baseline):**
  - Minimal identity: name + phone only.
  - Privacy page in app explains what's collected and why.
  - Owner can delete any person record; this cascades to their notifications but anonymizes (not deletes) historical audit log entries (marked "removed user").
  - Export all data button on Settings (JSON dump of everything).
- **Audit:** `activity_log` captures every write. Owner can view it but not edit.
- **No third-party analytics** in MVP. No trackers.
- **Service worker + PWA install:** keep scope narrow, no scary permissions (only camera, notifications, geolocation — all requested on demand, not upfront).
- **Dependency hygiene:** `pnpm audit` monthly; Dependabot PRs auto-created.

---

## 13. Language Boundary & Internationalization

### Hard rule: code is English, UI is Turkish

This is enforced by `.cursor/rules/language-boundary.mdc` (always applied). Summary:

- **Engineering zone (English):** file and folder names, variables, functions, types, enum codes, route paths, database tables and columns, test descriptions, commit messages, logs, env vars, code comments.
- **User zone (Turkish):** button labels, headings, body copy, form labels, error messages shown to users, toasts, push/SMS/email payloads, `aria-label` and `alt` text, page `<title>`.
- **User-generated content** (field names, notes, issue descriptions) is stored verbatim in Turkish.

Turkish strings never appear hardcoded in JSX — they route through **Lingui** (`t\`...\``). Even though Turkish is the only active locale today, externalization is mandatory.

### Routes: English path, Turkish page title

```tsx
// Route path: /tasks   (English — engineering zone)
export function TasksPage() {
  return (
    <>
      <PageTitle>{t`Görevler`}</PageTitle>   {/* Turkish — user zone */}
      <TaskBoard />
    </>
  )
}
```

### Enum codes: English, labels from i18n catalog

```ts
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED'

const taskStatusLabel: Record<TaskStatus, string> = {
  TODO:         t`Yapılacak`,
  IN_PROGRESS:  t`Sürüyor`,
  DONE:         t`Bitti`,
  BLOCKED:      t`Engellendi`,
  CANCELLED:    t`İptal`,
}
```

### Other i18n specifics

- `date-fns` with `tr` locale everywhere.
- Timezone hard-coded to `Europe/Istanbul`.
- Currency not used (no financial features).
- RTL deferred.
- Future locales (English, Arabic) require no code changes — only catalog additions.

---

## 14. Notifications

**Delivered channels (MVP):**
- **Web Push** via VAPID, registered when the PWA is installed and the user grants permission
- Fallback: in-app bell icon with badge count (for users who declined push)

**Deferred to v1.1:**
- SMS (likely Netgsm given Turkey)
- WhatsApp (approval process too slow for MVP)

**Events (all logged to `activity_log`, all push-delivered):**
| Event | Recipient |
|---|---|
| Task assigned / reassigned | the new assignee |
| Task started | owner |
| Task done | owner |
| Task blocked | owner |
| Issue reported | owner |
| Daily 18:00 digest | owner |

Each recipient can mute categories in their profile settings. Owner always gets issue notifications (can't be muted — it's their job).

---

## 15. Boundaries

### Always do
- Run `pnpm lint && pnpm typecheck && pnpm test` before every commit
- Add a regression test with every bug fix
- Validate every user input + every Supabase response with Zod
- Handle the offline case in any UI that writes data
- Follow the naming / structure / code-style rules in Sections 9–10
- **Read `DESIGN.md` before writing any UI** (enforced by `.cursor/rules/design-system.mdc`)
- **Code in English, UI in Turkish** (enforced by `.cursor/rules/language-boundary.mdc`)
- All user-facing text goes through Lingui — never hardcode Turkish in JSX

### Ask first
- Adding a new top-level dependency (`package.json`)
- Changing the Supabase schema (migration + data backfill plan required)
- Adding a new Supabase Storage bucket
- Adding a new external service (weather API change, SMS provider, etc.)
- Adding a new route (ensure it matches the Section 9 structure)
- Introducing a new state management or routing library
- Shipping a feature not listed in this spec
- Anything that changes RLS policies

### Never do
- Commit secrets, `.env` files, Supabase service-role keys
- Bypass RLS with the service-role key from the client
- Use pure black or pure white in UI (use tokens from `DESIGN.md`)
- Use weight 700+ in typography
- Put a text input on a worker screen without explicit spec approval
- Use drop shadows for elevation
- Use third-party analytics / trackers in the client
- Remove a failing test without owner approval
- `git push --force` to `main`
- Edit generated Supabase types by hand
- Name any file, route, variable, table, or column in Turkish
- Display any English user-facing string to an end user
- Hardcode Turkish strings in JSX instead of going through Lingui

---

## 16. Delivery Milestones

No hard deadline (solo dev, no rush). Suggested ordering:

| Milestone | Ships | Verification |
|---|---|---|
| **M0 — Foundations** | Vite + TS + Tailwind + shadcn scaffold; Supabase connected; DESIGN.md visual tokens in code; CI green; routing skeleton; i18n wired; theme toggle works | One dummy route renders in tr with correct design tokens |
| **M1 — Catalogs (owner)** | Owner can sign up, create people / fields (with map polygon drawing) / equipment; CSV export of each | Owner adds 10 fields + 5 people end-to-end on web |
| **M2 — Task creation (owner)** | Task creation modal; tasks list & kanban; reassignment; audit log in DB | Owner creates a task, sees it in the board |
| **M3 — Worker mobile MVP** | SMS setup flow; persistent session; mobile layout; today's tasks list; task detail with Start/Done; reassign; Dexie cache; outbox for writes | Worker completes a task offline, sync succeeds |
| **M4 — Issues & photos** | Issue reporting flow with required photo; Supabase Storage integration; photo upload retry on Wi-Fi; issues feed for owner | Worker reports an issue offline, photo uploads later |
| **M5 — Equipment + chemicals** | Attach equipment to tasks; chemical application basic log (ts + applicator + field); equipment screens for owner | Owner sees all equipment usages for a field |
| **M6 — Notifications** | Web Push registration; VAPID keys; edge function fan-out from `activity_log`; mute preferences | Owner receives push within 10s of an issue report |
| **M7 — Owner home dashboard** | Today screen: stat tiles + task board + satellite map + activity feed; weather widget (Open-Meteo) | Owner's morning glance < 5s to full picture |
| **M8 — Polish + launch** | Accessibility audit; Lighthouse > 90 for PWA install + perf; i18n completeness; KVKK page + data export; install instructions | Deployed; real use on real fields |

Detailed task breakdowns for each milestone will be produced during **Phase 3 (Tasks)** in the spec-driven workflow.

---

## 17. Success Criteria (done = all true)

- [ ] Owner can add a field (with polygon on a map) in ≤ 60 seconds
- [ ] Owner can create and assign a task in ≤ 20 seconds
- [ ] Worker can mark a task done in ≤ 3 taps, ≤ 8 seconds
- [ ] Worker can report an issue with a photo in ≤ 5 taps
- [ ] App functions fully offline for ≥ 4 hours, syncs without data loss on reconnect
- [ ] PWA installs to home screen on Android Chrome + iOS Safari 16.4+
- [ ] Turkish diacritics (ş ç ğ ı İ ö ü) render correctly at every typography size
- [ ] Cold-start on a Samsung Galaxy A14 is ≤ 2.5s to interactive
- [ ] Lighthouse PWA score ≥ 90; Performance ≥ 85 on 4G
- [ ] WCAG AA contrast throughout; AAA on worker primary actions
- [ ] Every worker action produces an `activity_log` row within 10s of being online
- [ ] Owner gets a Web Push within 10s of any issue reported
- [ ] CSV export of tasks + issues matches row counts in the DB

---

## 18. Known Open Items for Future Iterations

Not blocking MVP, but noted so they're not forgotten:

- Full pesticide compliance logging (chemical, dose, target pest, wind, waiting period)
- SMS & WhatsApp notifications
- Per-field weather + frost/wind alerts
- Equipment maintenance schedules and fuel meter readings
- Field grouping by district/mahalle + tags
- Bulk Excel import for initial field seeding
- Reporting analytics (task throughput, issue trends)
- English / Arabic localization
- Multi-farm support (if you ever need it)
- Observability stack (Sentry + PostHog) once real users hit unexpected issues
- Harvest yield tracking (explicitly descoped for MVP but a likely v2 feature)

---

*This spec captured every decision made in the 10-round clarification. Update it when decisions change. Reference the relevant section in every PR description.*
