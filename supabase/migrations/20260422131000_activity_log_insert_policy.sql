-- M2-03: allow authenticated users to insert audit rows for themselves (actor = current person)
create policy m014_activity_log_insert_self
  on public.activity_log for insert
  to authenticated
  with check (actor_id = public.current_person_id());
