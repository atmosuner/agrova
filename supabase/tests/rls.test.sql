-- Structural checks for M0-14 (run on a database where migrations 001–004 are applied).
-- With pgTAP (Supabase: often available; local: `supabase db test` / `psql` + pgtap):
--   begin; \i supabase/tests/rls.test.sql; rollback;
-- Without pgTAP: the DO blocks still validate.

-- ---------------------------------------------------------------------------
-- 1) RLS enabled on all public app tables
-- ---------------------------------------------------------------------------
do $$
declare
  expect text[] := array[
    'people', 'fields', 'equipment', 'tasks', 'task_equipment',
    'chemical_applications', 'issues', 'activity_log', 'notifications'
  ];
  t text;
  ok boolean;
begin
  foreach t in array expect
  loop
    select c.relrowsecurity
      into ok
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = t;
    if not coalesce(ok, false) then
      raise exception 'rls not enabled: %', t;
    end if;
  end loop;
  raise notice 'm0-14 rls: all 9 tables relrowsecurity on';
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Not-null FK: impossible assignee (superuser / migration context bypasses RLS)
--    Expect foreign_key_violation (reassign to non-existent person in practice).
-- ---------------------------------------------------------------------------
do $$
declare
  fid uuid;
  oid uuid;
begin
  insert into public.people (full_name, phone, role)
  values ('RLS T Owner', '+905559000011', 'OWNER')
  on conflict (phone) do update set full_name = excluded.full_name
  returning id into oid;
  delete from public.fields where name = 'm014-fk-probe';
  insert into public.fields (name, crop, gps_center)
  values ('m014-fk-probe', 'elma', st_geogfromtext('SRID=4326;POINT(29.1 41)'))
  returning id into fid;
  begin
    insert into public.tasks (
      activity, field_id, assignee_id, created_by, due_date
    ) values (
      'Budama', fid, (gen_random_uuid()), oid, current_date
    );
    raise exception 'expected FK error on bad assignee_id';
  exception
    when foreign_key_violation then
      raise notice 'm0-14 fk: bad assignee rejected as expected';
  end;
  delete from public.fields where id = fid;
  -- keep people for idempotency or delete test phones: optional
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Policy presence (m014_* on each table)
-- ---------------------------------------------------------------------------
do $$
declare
  n int;
begin
  select count(*)
  into n
  from pg_policies
  where schemaname = 'public'
    and policyname like 'm014\_%' escape '\';
  if n < 18 then
    raise exception 'expected many m014 policies, got %', n;
  end if;
  raise notice 'm0-14 policy count: %', n;
end;
$$;
