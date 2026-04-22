-- M2-08: audit from DB for task status / assignee updates (reassign path uses this; client can omit duplicate logs)
create or replace function public.tasks_log_update()
returns trigger
language plpgsql
security definer
set search_path to public, pg_temp
as $$
begin
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.activity_log (actor_id, action, subject_type, subject_id, payload)
    values (
      public.current_person_id(),
      'task.reassigned',
      'task',
      new.id,
      jsonb_build_object('previous_assignee_id', old.assignee_id, 'new_assignee_id', new.assignee_id)
    );
  end if;

  if new.status is distinct from old.status then
    if new.status = 'IN_PROGRESS' and old.status = 'TODO' then
      insert into public.activity_log (actor_id, action, subject_type, subject_id, payload)
      values (public.current_person_id(), 'task.started', 'task', new.id, '{}');
    elsif new.status = 'DONE' and (old.status = 'IN_PROGRESS' or old.status = 'TODO') then
      insert into public.activity_log (actor_id, action, subject_type, subject_id, payload)
      values (public.current_person_id(), 'task.done', 'task', new.id, '{}');
    elsif new.status = 'BLOCKED' then
      insert into public.activity_log (actor_id, action, subject_type, subject_id, payload)
      values (public.current_person_id(), 'task.blocked', 'task', new.id, '{}');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_activity_after_update on public.tasks;
create trigger tasks_activity_after_update
  after update on public.tasks
  for each row
  execute procedure public.tasks_log_update();

comment on function public.tasks_log_update() is 'M2-08: activity_log for assignee and status changes';
