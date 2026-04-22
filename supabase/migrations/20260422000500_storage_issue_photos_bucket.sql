-- M0-15: private bucket for issue (and later voice) files under the caller's auth folder
-- First path segment must be auth.uid()::text (see farm-operations-app.plan M0-15). Client path example: "<uid>/<issue_id>.jpg"
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'issue-photos',
  'issue-photos',
  false,
  10485760, -- 10 MiB
  array[
    'image/jpeg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'application/octet-stream'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects: default is deny; grant paths under auth uid folder and full read to owner
create policy m015_issue_photos_insert_own_folder
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'issue-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy m015_issue_photos_select_owner_or_own_folder
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'issue-photos'
    and (
      public.is_owner()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- Upsert/overwrite: same as visibility for updates
create policy m015_issue_photos_update_owner_or_own_folder
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'issue-photos'
    and (
      public.is_owner()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'issue-photos'
    and (
      public.is_owner()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy m015_issue_photos_delete_owner_or_own_folder
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'issue-photos'
    and (
      public.is_owner()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
