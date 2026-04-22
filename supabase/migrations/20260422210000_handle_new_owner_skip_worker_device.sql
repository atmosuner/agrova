-- Worker device accounts are created by claim-setup-token with email @device.agrova.app;
-- people is already linked in a follow-up update. The owner-only trigger must not run.
create or replace function public.handle_new_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full text;
  v_phone text;
  v_email text;
begin
  v_email := coalesce(new.email, '');
  if v_email like '%@device.agrova.app' then
    return new;
  end if;
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

comment on function public.handle_new_owner() is
  'M1-01: creates OWNER people row on auth.users insert. Skips @device.agrova.app (worker PWA; claim-setup-token links people).';
