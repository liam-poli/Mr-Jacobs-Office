-- Permissive RLS policies for hackathon
-- Allows all operations via anon key — not production security

alter table tags enable row level security;
create policy "Allow all on tags" on tags for all using (true) with check (true);

alter table objects enable row level security;
create policy "Allow all on objects" on objects for all using (true) with check (true);

alter table items enable row level security;
create policy "Allow all on items" on items for all using (true) with check (true);
