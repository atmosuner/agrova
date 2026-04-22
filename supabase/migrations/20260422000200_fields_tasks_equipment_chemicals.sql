-- M0-12: fields (PostGIS) + tasks + task_equipment + chemical_applications (no RLS — M0-14)
-- Spec: specs/farm-operations-app.md §5

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- fields
-- ---------------------------------------------------------------------------
create table if not exists public.fields (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  crop text not null,
  variety text,
  plant_count integer,
  planted_year integer,
  area_hectares numeric(12, 4),
  address text,
  gps_center geography(POINT, 4326) not null,
  boundary geography(POLYGON, 4326),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists fields_gps_center_gix on public.fields using gist (gps_center);
create index if not exists fields_boundary_gix on public.fields using gist (boundary)
  where boundary is not null;
create index if not exists fields_name_idx on public.fields (name);

drop trigger if exists fields_set_updated_at on public.fields;
create trigger fields_set_updated_at
  before update on public.fields
  for each row
  execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid not null default gen_random_uuid() primary key,
  activity text not null,
  field_id uuid not null references public.fields (id) on delete restrict,
  assignee_id uuid not null references public.people (id) on delete restrict,
  created_by uuid not null references public.people (id) on delete restrict,
  status public.task_status not null default 'TODO',
  priority public.task_priority not null default 'NORMAL',
  due_date date not null,
  notes text,
  completion_photo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  blocked_at timestamptz
);

create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_field_id_idx on public.tasks (field_id);
create index if not exists tasks_due_date_status_idx on public.tasks (due_date, status);
create index if not exists tasks_created_by_idx on public.tasks (created_by);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- task_equipment
-- ---------------------------------------------------------------------------
create table if not exists public.task_equipment (
  task_id uuid not null references public.tasks (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  attached_by uuid not null references public.people (id) on delete restrict,
  attached_at timestamptz not null default timezone('utc', now()),
  primary key (task_id, equipment_id)
);

create index if not exists task_equipment_equipment_id_idx on public.task_equipment (equipment_id);
create index if not exists task_equipment_attached_by_idx on public.task_equipment (attached_by);

-- ---------------------------------------------------------------------------
-- chemical_applications
-- ---------------------------------------------------------------------------
create table if not exists public.chemical_applications (
  id uuid not null default gen_random_uuid() primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  field_id uuid not null references public.fields (id) on delete restrict,
  applicator_id uuid not null references public.people (id) on delete restrict,
  applied_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chemical_applications_field_id_idx on public.chemical_applications (field_id);
create index if not exists chemical_applications_task_id_idx on public.chemical_applications (task_id);
create index if not exists chemical_applications_applicator_id_idx on public.chemical_applications (applicator_id);
create index if not exists chemical_applications_applied_at_idx on public.chemical_applications (applied_at desc);

comment on table public.fields is 'Fruit fields; WGS84 geography for center + boundary polygon';
comment on table public.tasks is 'Work items; one row per field when owner picks N fields';
comment on table public.task_equipment is 'Equipment (incl. chemicals) used on a task';
comment on table public.chemical_applications is 'Minimal chemical application log; extended in v1.x';
