-- M5-05: structural check — chemical trigger on task_equipment (run in SQL editor / supabase test)
select count(*) as trigger_ok
  from pg_trigger
 where tgname = 'task_equipment_after_insert_chemical'
   and tgenabled = 'O';

select proname, prosecdef
  from pg_proc
 where proname = 'task_equipment_insert_chemical_application';
