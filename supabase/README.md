# Supabase (Agrova)

- **Migrations** live in `migrations/`. File names are ordered by timestamp prefix.
- **Apply** the SQL on your **Supabase (Seoul)** project:
  - **Cursor / Supabase MCP** — `apply_migration` with the migration file’s SQL (keeps the hosted DB in sync with `migrations/*`); or
  - **Dashboard** → **SQL Editor** → paste a migration file, run; or
  - **Supabase CLI:** `supabase link --project-ref <ref>` then `supabase db push` (when using local CLI with this repo).

M0-14 RLS is split across five timestamped files (`20260422000402`–`20260422000406`) so each `apply_migration` payload stays small. **M0-15:** private bucket `issue-photos` + `storage.objects` policies in `20260422000500_storage_issue_photos_bucket.sql` (first path segment = `auth.uid()`). **M0-16:** `src/types/db.ts` is generated; refresh with **`pnpm supabase:gen-types`**, which reads `supabase/mcp_gentypes.json` (from Cursor `generate_typescript_types` MCP) or, if that file is missing, `npx supabase gen types` when `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are set (see root `.env.example`). **M0-17:** Edge function stubs — `web-push-fanout` (notifications) and `setup-link` (no SMS in MVP; owner shares URLs manually). Run locally: `pnpm supabase:functions:serve` (needs [Supabase CLI](https://supabase.com/docs/guides/cli) + linked project). See `farm-operations-app.plan.md`.

### Provisioning: `create-team-person`, `team-person-email`, `claim-setup-token`

- **`create-team-person`** (deploy with **`--no-verify-jwt`**) — creates `people` + Auth user (`w{personId}@device.agrova.app`) with an **owner-set password** (8–72 chars); clears `setup_token` / `setup_token_expires_at` so workers use e-mail + password on `/login`. The owner **Team** form calls it from the browser. The function still requires `Authorization: Bearer <user JWT>` and checks `getUser()` + `people.role === OWNER`. **Why disable gateway JWT verify:** many projects issue **ES256** user access tokens; the Edge **API gateway** `verify_jwt` path can respond with `401` and `Unsupported JWT algorithm ES256`, while `auth.getUser()` inside the function validates those tokens correctly.
- **`team-person-email`** (deploy with **`--no-verify-jwt`**) — owner **Edit person** loads and updates a crew member’s **Supabase Auth** sign-in e-mail (`getUserById` / `updateUserById`, with `email_confirm: true` on set). `POST` JSON: `{ "op": "get" | "set", "personId", "email"? }` (same `Authorization` + OWNER checks as `set-worker-password`).
- **`claim-setup-token`** (JWT off; one-time `setup_token` in body) — legacy path: create Auth if missing; or **pairing** if auth already exists (after owner added via the function above).

With [Supabase CLI](https://supabase.com/docs/guides/cli) linked (`supabase login` / `link`) and the project ref from your Dashboard (or `VITE_SUPABASE_URL`):

```bash
npx -y supabase@2 functions deploy create-team-person --no-verify-jwt --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy set-worker-password --no-verify-jwt --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy team-person-email --no-verify-jwt --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy claim-setup-token --no-verify-jwt --project-ref <PROJECT_REF>
```

Or use **Supabase Dashboard → Edge Functions** and paste from `supabase/functions/<name>/index.ts` after a push to your repo. Redeploy these functions whenever the TypeScript in this repo changes.

### Policy / schema checks (`db test`)

- **SQL in** `supabase/tests/` (e.g. `rls.test.sql`) are intended for `pnpm supabase:test` (CLI `supabase db test` with a linked project / local database where migrations are applied). They are **not** in the default GitHub Actions quality job (requires a Supabase-linked environment).
- **M2-09** includes `supabase/tests/tasks-rls.test.sql` (policy names on `public.tasks` + `reassign_task` presence). Run with `pnpm supabase:test` on a database where all migrations are applied, alongside `rls.test.sql` if your `supabase db test` config runs the whole `tests/` folder.

### M6 / M8 Edge functions & secrets

**VAPID (generate keys, set secrets, redeploy, verify):** see [`docs/operations/vapid-and-web-push.md`](../docs/operations/vapid-and-web-push.md). Quick key generation: `pnpm vapid:keys` from the repo root.

- **`web-push-fanout`** — requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in project secrets.
- **`get-vapid-public-key`** — public key for the browser (no JWT by default).
- **`daily-digest`** — `POST` with header `Authorization: Bearer <DAILY_DIGEST_CRON_SECRET>` (set the same value in Edge secrets). Intended to be triggered by **pg_cron** + **pg_net** after `20260422220000_m8_anonymize_and_cron_ext.sql` (extensions enabled). Schedule in the **SQL Editor** (replace project ref and secret), e.g. daily at 15:00 UTC (= 18:00 Europe/Istanbul year-round):

```sql
select net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/daily-digest',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || '<DAILY_DIGEST_CRON_SECRET>'
  ),
  body := '{}'::jsonb
);
```

- **`export-data`** — `GET` with the end-user JWT; returns a JSON attachment (owner-only).

### M8 anonymized actor

Migration `20260422220000_m8_anonymize_and_cron_ext.sql` inserts sentinel person `00000000-0000-4000-8000-000000000001` (`Kaldırılmış kullanıcı`) and rewrites `activity_log.actor_id` when a non-owner is archived (`active = false`).
