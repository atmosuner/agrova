-- M0-13: issues + activity_log + notifications (no RLS — M0-14)
-- Spec: specs/farm-operations-app.md §5; activity_log action strings e.g. §5 / dashboard events

-- ---------------------------------------------------------------------------
-- issues
-- ---------------------------------------------------------------------------
create table if not exists public.issues (
  id uuid not null default gen_random_uuid() primary key,
  task_id uuid references public.tasks (id) on delete set null,
  field_id uuid references public.fields (id) on delete set null,
  reporter_id uuid not null references public.people (id) on delete restrict,
  category public.issue_category not null,
  photo_url text not null,
  voice_note_url text,
  gps_lat numeric(9, 6),
  gps_lng numeric(9, 6),
  resolved_at timestamptz,
  resolved_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists issues_reporter_id_idx on public.issues (reporter_id);
create index if not exists issues_field_id_idx on public.issues (field_id);
create index if not exists issues_task_id_idx on public.issues (task_id);
create index if not exists issues_category_idx on public.issues (category);
create index if not exists issues_created_at_idx on public.issues (created_at desc);

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid not null default gen_random_uuid() primary key,
  actor_id uuid not null references public.people (id) on delete restrict,
  action text not null,
  subject_type text not null,
  subject_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint activity_log_subject_type_check
    check (subject_type in ('task', 'issue'))
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists activity_log_actor_id_idx on public.activity_log (actor_id);
create index if not exists activity_log_subject_idx on public.activity_log (subject_type, subject_id);

comment on column public.activity_log.action is
  'e.g. task.created, task.started, task.done, task.blocked, task.reassigned, issue.reported';

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid() primary key,
  recipient_id uuid not null references public.people (id) on delete cascade,
  activity_log_id uuid not null references public.activity_log (id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notifications_recipient_log_unique unique (recipient_id, activity_log_id)
);

create index if not exists notifications_recipient_id_idx on public.notifications (recipient_id);
create index if not exists notifications_read_at_idx on public.notifications (read_at)
  where read_at is null;
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

comment on table public.issues is 'Field issues; photo required; optional task/field link';
comment on table public.activity_log is 'Audit + feed + notification source';
comment on table public.notifications is 'Per-recipient delivery of activity_log events';
