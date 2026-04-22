-- M0-14: part a — search_path, is_owner, current_person (policies follow in 00404)
alter function public.handle_updated_at() set search_path to public, pg_temp;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path to public, pg_temp
as $$
  select exists (
    select 1
    from public.people p
    where p.auth_user_id = auth.uid()
      and p.role = 'OWNER'::public.person_role
  );
$$;

create or replace function public.current_person_id()
returns uuid
language sql
stable
security definer
set search_path to public, pg_temp
as $$
  select p.id
  from public.people p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;
