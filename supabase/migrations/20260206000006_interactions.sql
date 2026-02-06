-- Interaction cache table: hash-based lookup for item-on-object outcomes
create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  input_hash text unique not null,
  item_tags text[] not null default '{}',
  object_tags text[] not null default '{}',
  required_state text,
  result_state text,
  output_item text,
  output_item_tags text[] default '{}',
  description text not null,
  source text not null default 'ai',
  created_at timestamptz default now()
);

create index if not exists idx_interactions_hash on interactions (input_hash);

alter table interactions enable row level security;
do $$ begin
  create policy "Allow all on interactions" on interactions for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- Seed common interactions so the game works without AI calls
-- Hash formula: sorted_item_tags.join('+') + '|' + sorted_object_tags.join('+') + '|' + (state || 'ANY')

-- Water on powered electronics → BROKEN
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('WET|CONDUCTIVE+ELECTRONIC|POWERED', '{WET}', '{CONDUCTIVE,ELECTRONIC}', 'POWERED', 'BROKEN',
        'Water floods the circuitry — sparks fly and the machine dies.', 'manual')
on conflict (input_hash) do nothing;

-- Sharp item on locked wooden object → UNLOCKED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('SHARP|WOODEN|LOCKED', '{SHARP}', '{WOODEN}', 'LOCKED', 'UNLOCKED',
        'You pry the wood apart with the blade. The lock gives way.', 'manual')
on conflict (input_hash) do nothing;

-- Magnetic item on metallic locked object → UNLOCKED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('MAGNETIC|METALLIC|LOCKED', '{MAGNETIC}', '{METALLIC}', 'LOCKED', 'UNLOCKED',
        'The magnet pulls the latch mechanism open with a satisfying click.', 'manual')
on conflict (input_hash) do nothing;

-- Hot item on anything organic → BURNING
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('HOT|ORGANIC|ANY', '{HOT}', '{ORGANIC}', null, 'BURNING',
        'It catches fire immediately. The office smells like a barbecue.', 'manual')
on conflict (input_hash) do nothing;

-- Wet item on burning object → extinguished
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('WET||BURNING', '{WET}', '{}', 'BURNING', 'UNPOWERED',
        'The flames hiss and die. Everything is soaked and sad.', 'manual')
on conflict (input_hash) do nothing;

-- Chemical item on electronic object → CONTAMINATED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('CHEMICAL|ELECTRONIC|ANY', '{CHEMICAL}', '{ELECTRONIC}', null, 'CONTAMINATED',
        'The chemicals seep into the circuitry. It smells terrible and probably violates several regulations.', 'manual')
on conflict (input_hash) do nothing;

-- Conductive item on electronic unpowered object → POWERED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('CONDUCTIVE|ELECTRONIC|UNPOWERED', '{CONDUCTIVE}', '{ELECTRONIC}', 'UNPOWERED', 'POWERED',
        'You jury-rig a connection. The machine whirs back to life.', 'manual')
on conflict (input_hash) do nothing;

-- Sticky item on any object → JAMMED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('STICKY||ANY', '{STICKY}', '{}', null, 'JAMMED',
        'It is now thoroughly gummed up. HR would not approve.', 'manual')
on conflict (input_hash) do nothing;
