-- M0-14: part c — role trigger, grants, RLS on (policies 00405)
create or replace function public.enforce_people_non_owner_cannot_change_role()
returns trigger
language plpgsql
set search_path to public, pg_temp
as $$
begin
  if new.role is distinct from old.role and not public.is_owner() then
    raise exception 'only owner may change person_role';
  end if;
  return new;
end;
$$;

drop trigger if exists people_enforce_role on public.people;
create trigger people_enforce_role
  before update on public.people
  for each row
  execute procedure public.enforce_people_non_owner_cannot_change_role();

grant usage on schema public to authenticated;
grant all on
  public.people, public.fields, public.equipment, public.tasks,
  public.task_equipment, public.chemical_applications,
  public.issues, public.activity_log, public.notifications
  to service_role, authenticated;
revoke all on function public.is_owner() from public;
revoke all on function public.current_person_id() from public;
revoke all on function public.reassign_task(uuid, uuid) from public;
revoke all on function public.task_by_id(uuid) from public;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.current_person_id() to authenticated;
grant execute on function public.reassign_task(uuid, uuid) to authenticated;
grant execute on function public.task_by_id(uuid) to authenticated;

alter table public.people enable row level security;
alter table public.fields enable row level security;
alter table public.equipment enable row level security;
alter table public.tasks enable row level security;
alter table public.task_equipment enable row level security;
alter table public.chemical_applications enable row level security;
alter table public.issues enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;
