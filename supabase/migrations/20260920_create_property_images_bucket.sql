insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = true;

create policy "Public can view property images"
on storage.objects for select
using (bucket_id = 'property-images');

create policy "Authenticated users can upload their property images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their property images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'property-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'property-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their property images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
