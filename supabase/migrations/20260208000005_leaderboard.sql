-- Leaderboard table for winner name entries
create table leaderboard (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  bucks integer not null default 0,
  phases_survived integer not null default 0,
  time_survived_minutes integer not null default 0,
  end_type text not null,
  jacobs_mood text not null,
  created_at timestamptz default now()
);

create index idx_leaderboard_rank on leaderboard (bucks desc, phases_survived desc);

alter table leaderboard enable row level security;
create policy "Allow all on leaderboard" on leaderboard for all using (true) with check (true);
