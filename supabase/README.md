# Supabase (Agrova)

- **Migrations** live in `migrations/`. File names are ordered by timestamp prefix.
- **Apply** the SQL on your **Supabase (Seoul)** project:
  - **Cursor / Supabase MCP** — `apply_migration` with the migration file’s SQL (keeps the hosted DB in sync with `migrations/*`); or
  - **Dashboard** → **SQL Editor** → paste a migration file, run; or
  - **Supabase CLI:** `supabase link --project-ref <ref>` then `supabase db push` (when using local CLI with this repo).

M0-14 RLS is split across five timestamped files (`20260422000402`–`20260422000406`) so each `apply_migration` payload stays small. **M0-15:** private bucket `issue-photos` + `storage.objects` policies in `20260422000500_storage_issue_photos_bucket.sql` (first path segment = `auth.uid()`). Generated TypeScript types follow in M0-16 (`farm-operations-app.plan.md`).
