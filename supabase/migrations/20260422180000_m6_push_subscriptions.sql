-- M6-01: Web Push device subscriptions
create table if not exists public.push_subscriptions (
  id uuid not null default gen_random_uuid() primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (person_id, endpoint)
);

create index if not exists push_subscriptions_person_id_idx on public.push_subscriptions (person_id);

comment on table public.push_subscriptions is 'M6: Web Push subscription rows per person/device';

alter table public.push_subscriptions enable row level security;

create policy m6_push_subscriptions_select_own
  on public.push_subscriptions for select
  to authenticated
  using (person_id = public.current_person_id());

create policy m6_push_subscriptions_insert_own
  on public.push_subscriptions for insert
  to authenticated
  with check (person_id = public.current_person_id());

create policy m6_push_subscriptions_delete_own
  on public.push_subscriptions for delete
  to authenticated
  using (person_id = public.current_person_id());

create policy m6_push_subscriptions_update_own
  on public.push_subscriptions for update
  to authenticated
  using (person_id = public.current_person_id())
  with check (person_id = public.current_person_id());

grant select, insert, update, delete on public.push_subscriptions to authenticated;
