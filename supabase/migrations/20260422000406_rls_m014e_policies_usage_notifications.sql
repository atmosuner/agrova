-- M0-14: part e — task_equipment, chemical, issues, activity_log, notifications
create policy m014_task_equipment_select
  on public.task_equipment for select to authenticated using (true);

create policy m014_task_equipment_mod
  on public.task_equipment for all
  to authenticated
  using (
    public.is_owner()
    or (public.task_by_id(task_id)).assignee_id = public.current_person_id()
  )
  with check (
    public.is_owner()
    or (public.task_by_id(task_id)).assignee_id = public.current_person_id()
  );

create policy m014_chemical_select
  on public.chemical_applications for select to authenticated using (true);

create policy m014_chemical_mod
  on public.chemical_applications for all
  to authenticated
  using (
    public.is_owner()
    or (public.task_by_id(task_id)).assignee_id = public.current_person_id()
  )
  with check (
    public.is_owner()
    or (public.task_by_id(task_id)).assignee_id = public.current_person_id()
  );

create policy m014_issues_select
  on public.issues for select to authenticated using (true);

create policy m014_issues_insert
  on public.issues for insert
  to authenticated
  with check (reporter_id = public.current_person_id());

create policy m014_issues_update_owner
  on public.issues for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy m014_activity_log_select
  on public.activity_log for select
  to authenticated
  using (public.is_owner() or actor_id = public.current_person_id());

create policy m014_notify_select
  on public.notifications for select
  to authenticated
  using (recipient_id = public.current_person_id());

create policy m014_notify_update
  on public.notifications for update
  to authenticated
  using (recipient_id = public.current_person_id())
  with check (recipient_id = public.current_person_id());
