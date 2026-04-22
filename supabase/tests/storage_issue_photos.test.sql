-- M0-15 structural checks: bucket + storage policies (run in a transaction in SQL Editor / psql)

-- ---------------------------------------------------------------------------
-- 1) Private bucket
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'issue-photos' and name = 'issue-photos' and public is false
  ) then
    raise exception 'm0-15: issue-photos bucket missing or not private';
  end if;
  raise notice 'm0-15: issue-photos bucket ok';
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) m015_* policies on storage.objects
-- ---------------------------------------------------------------------------
do $$
declare
  n int;
begin
  select count(*)
  into n
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname like 'm015\_issue\_photos\_%' escape '\';
  if n < 4 then
    raise exception 'm0-15: expected 4 m015_issue_photos policies, got %', n;
  end if;
  raise notice 'm0-15: storage policy count: %', n;
end;
$$;
