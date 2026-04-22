-- M0-14: part d — people, fields, equipment, tasks
create policy m014_people_select_authenticated
  on public.people for select
  to authenticated
  using (true);

create policy m014_people_insert_owner
  on public.people for insert
  to authenticated
  with check (public.is_owner());

create policy m014_people_update
  on public.people for update
  to authenticated
  using (public.is_owner() or id = public.current_person_id())
  with check (public.is_owner() or id = public.current_person_id());

create policy m014_people_delete_owner
  on public.people for delete
  to authenticated
  using (public.is_owner());

create policy m014_fields_select
  on public.fields for select to authenticated using (true);

create policy m014_fields_write_owner
  on public.fields for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy m014_equipment_select
  on public.equipment for select to authenticated using (true);

create policy m014_equipment_write_owner
  on public.equipment for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy m014_tasks_select
  on public.tasks for select to authenticated using (true);

create policy m014_tasks_insert_owner
  on public.tasks for insert
  to authenticated
  with check (public.is_owner() and created_by = public.current_person_id());

create policy m014_tasks_update
  on public.tasks for update
  to authenticated
  using (public.is_owner() or assignee_id = public.current_person_id())
  with check (public.is_owner() or assignee_id = public.current_person_id());

create policy m014_tasks_delete_owner
  on public.tasks for delete
  to authenticated
  using (public.is_owner());
