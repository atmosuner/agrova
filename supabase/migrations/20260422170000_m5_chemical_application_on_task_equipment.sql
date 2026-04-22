-- M5-02: when CHEMICAL equipment is attached to a task, insert chemical_applications (minimal log)
create or replace function public.task_equipment_insert_chemical_application()
returns trigger
language plpgsql
security definer
set search_path to public, pg_temp
as $$
declare
  eq_cat public.equipment_category;
  fld uuid;
begin
  select e.category into eq_cat from public.equipment e where e.id = new.equipment_id;
  if eq_cat = 'CHEMICAL' then
    select t.field_id into fld from public.tasks t where t.id = new.task_id;
    if fld is null then
      raise exception 'task % has no field_id', new.task_id;
    end if;
    insert into public.chemical_applications (task_id, field_id, applicator_id, applied_at)
    values (new.task_id, fld, new.attached_by, timezone('utc', now()));
  end if;
  return new;
end;
$$;

drop trigger if exists task_equipment_after_insert_chemical on public.task_equipment;
create trigger task_equipment_after_insert_chemical
  after insert on public.task_equipment
  for each row
  execute procedure public.task_equipment_insert_chemical_application();

comment on function public.task_equipment_insert_chemical_application() is 'M5-02: auto row in chemical_applications for CHEMICAL equipment attachments';
