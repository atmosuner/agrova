-- M0-14: part b — task_by_id, reassign_task
create or replace function public.task_by_id(p_id uuid)
returns public.tasks
language sql
stable
security definer
set search_path to public, pg_temp
as $$
  select t
  from public.tasks t
  where t.id = p_id;
$$;

create or replace function public.reassign_task(p_task_id uuid, p_new_assignee uuid)
returns void
language plpgsql
security definer
set search_path to public, pg_temp
as $$
begin
  if p_task_id is null or p_new_assignee is null then
    raise exception 'reassign_task: null argument';
  end if;

  if public.is_owner() then
    update public.tasks
    set updated_at = timezone('utc', now()),
        assignee_id = p_new_assignee
    where id = p_task_id;
    if not found then
      raise exception 'reassign_task: task not found';
    end if;
    return;
  end if;

  if not exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and t.assignee_id = public.current_person_id()
  ) then
    raise exception 'reassign_task: not assignee or task missing';
  end if;

  update public.tasks
  set updated_at = timezone('utc', now()),
      assignee_id = p_new_assignee
  where id = p_task_id
    and assignee_id = public.current_person_id();
  if not found then
    raise exception 'reassign_task: could not reassign (task changed?)';
  end if;
end;
$$;
