-- M2-09: structural checks for `public.tasks` RLS (run on a DB with all migrations applied).
-- Run: `pnpm supabase:test` (linked local/remote) or `psql $DATABASE_URL -v ON_ERROR_STOP=1 -f supabase/tests/tasks-rls.test.sql`
-- pgTAP optional: `create extension if not exists pgtap with schema extensions;`

-- ---------------------------------------------------------------------------
-- 1) Four row policies on tasks (m014_tasks_*)
-- ---------------------------------------------------------------------------
do $$
declare
  n int;
begin
  select count(*)::int
  into n
  from pg_policies
  where schemaname = 'public'
    and tablename = 'tasks'
    and policyname in (
      'm014_tasks_select',
      'm014_tasks_insert_owner',
      'm014_tasks_update',
      'm014_tasks_delete_owner'
    );
  if n <> 4 then
    raise exception 'm2-09 tasks: expected 4 m014_tasks policies, got %', n;
  end if;
  raise notice 'm2-09 tasks: % m014 policies present', n;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) reassign_task RPC exists (worker/owner path; used by client + outbox)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'reassign_task'
  ) then
    raise exception 'm2-09: public.reassign_task missing';
  end if;
  raise notice 'm2-09: reassign_task present';
end;
$$;
