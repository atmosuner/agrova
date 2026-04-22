-- M1-02: one row per owner — operation display name, city (weather), fixed timezone
create table if not exists public.operation_settings (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null
    unique
    references auth.users (id) on delete cascade,
  operation_name text not null,
  weather_city text not null,
  timezone text not null default 'Europe/Istanbul',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists operation_settings_user_id_idx on public.operation_settings (user_id);

drop trigger if exists operation_settings_set_updated_at on public.operation_settings;
create trigger operation_settings_set_updated_at
  before update on public.operation_settings
  for each row
  execute procedure public.handle_updated_at();

comment on table public.operation_settings is 'M1-02: owner-facing label, Turkish city for weather, TZ locked to Istanbul';

grant all on public.operation_settings to service_role, authenticated;

alter table public.operation_settings enable row level security;

-- Owner app user only: own row, must be is_owner() (people.OWNER)
create policy m102_operation_settings_select
  on public.operation_settings for select
  to authenticated
  using (user_id = auth.uid() and public.is_owner());

create policy m102_operation_settings_insert
  on public.operation_settings for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_owner());

create policy m102_operation_settings_update
  on public.operation_settings for update
  to authenticated
  using (user_id = auth.uid() and public.is_owner())
  with check (user_id = auth.uid() and public.is_owner());
