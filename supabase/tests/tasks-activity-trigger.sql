-- Structural note for M2-08: tasks_log_update exists (run on DB with migrations applied).
-- begin; \i supabase/tests/tasks-activity-trigger.sql; rollback;
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tasks_log_update'
  ) then
    raise exception 'expected public.tasks_log_update()';
  end if;
  raise notice 'm2-08: tasks_log_update present';
end;
$$;
