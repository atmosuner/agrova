-- M1-01: Link new auth user to public.people as OWNER (metadata: full_name, phone)
-- Supabase Auth stores app metadata in raw_user_meta_data on auth.users.

create or replace function public.handle_new_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full text;
  v_phone text;
begin
  v_full := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  if v_full is null then
    raise exception 'full_name is required in user metadata';
  end if;
  if v_phone is null then
    raise exception 'phone is required in user metadata';
  end if;

  insert into public.people (full_name, phone, role, auth_user_id)
  values (v_full, v_phone, 'OWNER'::public.person_role, new.id);

  return new;
end;
$$;

comment on function public.handle_new_owner() is 'M1-01: creates OWNER people row when a new auth.users row is inserted';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_owner();
