-- M1-03: soft-archive crew; at most one OWNER row (sign-up row)
alter table public.people
  add column if not exists active boolean not null default true;

create index if not exists people_active_idx on public.people (active);

-- At most one row with role = OWNER (pair with app rule: no OWNER in team form)
create unique index if not exists people_one_owner_idx
  on public.people ((1))
  where (role = 'OWNER'::public.person_role);

comment on column public.people.active is 'M1-03: false = archived (hidden by default in owner UI)';
