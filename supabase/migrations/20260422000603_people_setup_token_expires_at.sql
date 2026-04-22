-- M1-04: worker setup link expiry
alter table public.people
  add column if not exists setup_token_expires_at timestamptz;

create index if not exists people_setup_token_idx on public.people (setup_token)
  where setup_token is not null;

comment on column public.people.setup_token_expires_at is 'M1-04: /setup/{token} valid until; null = no/legacy token';
