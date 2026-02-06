-- Sprites storage bucket for AI-generated item/object sprites
insert into storage.buckets (id, name, public)
values ('sprites', 'sprites', true)
on conflict (id) do nothing;

-- Permissive storage policies (hackathon)
create policy "Public read access" on storage.objects for select using (bucket_id = 'sprites');
create policy "Anon insert access" on storage.objects for insert with check (bucket_id = 'sprites');
create policy "Anon update access" on storage.objects for update using (bucket_id = 'sprites');
create policy "Anon delete access" on storage.objects for delete using (bucket_id = 'sprites');
