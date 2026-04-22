-- M8-08: when a non-owner is archived, re-point their activity_log rows to a sentinel person (KVKK-style anonymization of actor).
-- M6-07: enable pg_cron + pg_net for daily digest; schedule the HTTP call in the SQL Editor (see supabase/README.md).

-- ---------------------------------------------------------------------------
-- Sentinel "removed user" (stable id for activity_log.actor_id rewrites)
-- ---------------------------------------------------------------------------
insert into public.people (id, full_name, phone, role, notification_prefs, active)
values (
  '00000000-0000-4000-8000-000000000001',
  'Kaldırılmış kullanıcı',
  '+900000000000',
  'WORKER',
  '{}'::jsonb,
  false
)
on conflict (id) do nothing;

create or replace function public.people_anonymize_activity_on_archive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if
    (tg_op = 'UPDATE' and coalesce(old.active, true) = true and new.active = false and old.role is distinct from 'OWNER')
  then
    update public.activity_log
    set actor_id = '00000000-0000-4000-8000-000000000001'
    where actor_id = old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists people_archive_anonymize_activity on public.people;
create trigger people_archive_anonymize_activity
  after update of active on public.people
  for each row
  execute procedure public.people_anonymize_activity_on_archive();

-- ---------------------------------------------------------------------------
-- pg_cron + pg_net (used to POST /functions/v1/daily-digest with shared secret)
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

comment on extension pg_cron is 'M6-07: schedule select cron.schedule(... after setting project URL + DAILY_DIGEST_CRON_SECRET; see supabase/README.md)';
