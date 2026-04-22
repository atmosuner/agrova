-- M4: issues photo optional until upload; realtime; activity; reporter RPC for media URLs

alter table public.issues
  alter column photo_url drop not null;

-- ---------------------------------------------------------------------------
-- Reporter may set photo / voice URLs via RPC only (path must live under auth uid folder)
-- ---------------------------------------------------------------------------
create or replace function public.set_issue_photo_url(p_issue_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path to public, pg_temp
as $$
declare
  rep uuid;
begin
  select reporter_id into rep from public.issues where id = p_issue_id for update;
  if rep is null then
    raise exception 'issue not found';
  end if;
  if rep is distinct from public.current_person_id() then
    raise exception 'forbidden';
  end if;
  if split_part(p_path, '/', 1) is distinct from auth.uid()::text then
    raise exception 'invalid path';
  end if;
  update public.issues set photo_url = p_path where id = p_issue_id;
end;
$$;

revoke all on function public.set_issue_photo_url(uuid, text) from public;
grant execute on function public.set_issue_photo_url(uuid, text) to authenticated;

create or replace function public.set_issue_voice_note_url(p_issue_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path to public, pg_temp
as $$
declare
  rep uuid;
begin
  select reporter_id into rep from public.issues where id = p_issue_id for update;
  if rep is null then
    raise exception 'issue not found';
  end if;
  if rep is distinct from public.current_person_id() then
    raise exception 'forbidden';
  end if;
  if split_part(p_path, '/', 1) is distinct from auth.uid()::text then
    raise exception 'invalid path';
  end if;
  update public.issues set voice_note_url = p_path where id = p_issue_id;
end;
$$;

revoke all on function public.set_issue_voice_note_url(uuid, text) from public;
grant execute on function public.set_issue_voice_note_url(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Activity: issue reported (on insert)
-- ---------------------------------------------------------------------------
create or replace function public.issues_log_inserted()
returns trigger
language plpgsql
security definer
set search_path to public, pg_temp
as $$
begin
  insert into public.activity_log (actor_id, action, subject_type, subject_id, payload)
  values (
    new.reporter_id,
    'issue.reported',
    'issue',
    new.id,
    jsonb_build_object('category', new.category::text)
  );
  return new;
end;
$$;

drop trigger if exists issues_activity_after_insert on public.issues;
create trigger issues_activity_after_insert
  after insert on public.issues
  for each row
  execute procedure public.issues_log_inserted();

-- ---------------------------------------------------------------------------
-- Activity: issue resolved (on update)
-- ---------------------------------------------------------------------------
create or replace function public.issues_log_resolved()
returns trigger
language plpgsql
security definer
set search_path to public, pg_temp
as $$
begin
  if new.resolved_at is not null and old.resolved_at is null and new.resolved_by is not null then
    insert into public.activity_log (actor_id, action, subject_type, subject_id, payload)
    values (new.resolved_by, 'issue.resolved', 'issue', new.id, '{}'::jsonb);
  end if;
  return new;
end;
$$;

drop trigger if exists issues_activity_after_update_resolved on public.issues;
create trigger issues_activity_after_update_resolved
  after update on public.issues
  for each row
  execute procedure public.issues_log_resolved();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'issues'
  ) then
    alter publication supabase_realtime add table public.issues;
  end if;
end $$;

comment on function public.set_issue_photo_url(uuid, text) is 'M4: reporter sets storage object path after upload';
comment on function public.set_issue_voice_note_url(uuid, text) is 'M4: reporter sets voice object path after upload';
comment on function public.issues_log_inserted() is 'M4: activity_log on issue insert';
comment on function public.issues_log_resolved() is 'M4: activity_log when issue marked resolved';
