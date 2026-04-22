-- M0-11: enums + people + equipment (no RLS here — M0-14)
-- Spec: specs/farm-operations-app.md §5

-- gen_random_uuid() (Supabase: ensure pgcrypto; safe if already present)
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.person_role as enum ('OWNER', 'FOREMAN', 'AGRONOMIST', 'WORKER');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.equipment_category as enum ('VEHICLE', 'TOOL', 'CHEMICAL', 'CRATE');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_priority as enum ('LOW', 'NORMAL', 'URGENT');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.issue_category as enum (
    'PEST',
    'EQUIPMENT',
    'INJURY',
    'IRRIGATION',
    'WEATHER',
    'THEFT',
    'SUPPLY'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- people
-- ---------------------------------------------------------------------------
create table if not exists public.people (
  id uuid not null default gen_random_uuid() primary key,
  full_name text not null,
  phone text not null,
  role public.person_role not null,
  auth_user_id uuid references auth.users (id) on delete set null,
  setup_token text,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint people_phone_e164 check (phone ~ '^\+[1-9]\d{1,14}$'),
  constraint people_phone_unique unique (phone)
);

create index if not exists people_role_idx on public.people (role);
create index if not exists people_auth_user_id_idx on public.people (auth_user_id);

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row
  execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- equipment
-- ---------------------------------------------------------------------------
create table if not exists public.equipment (
  id uuid not null default gen_random_uuid() primary key,
  category public.equipment_category not null,
  name text not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists equipment_category_idx on public.equipment (category);
create index if not exists equipment_active_idx on public.equipment (active);

drop trigger if exists equipment_set_updated_at on public.equipment;
create trigger equipment_set_updated_at
  before update on public.equipment
  for each row
  execute procedure public.handle_updated_at();

comment on table public.people is 'Crew and owner directory; phone is E.164';
comment on table public.equipment is 'Equipment catalog; usage on tasks in later migrations';
