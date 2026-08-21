-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Create the votes table
create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  voter_id   uuid references auth.users(id) not null,
  candidate  text not null,
  created_at timestamptz default now(),

  -- One vote per user, enforced at DB level
  constraint votes_voter_unique unique (voter_id)
);

-- 2. Enable Row Level Security
alter table votes enable row level security;

-- 3. Authenticated users can insert their own vote only
create policy "insert_own_vote" on votes
  for insert
  to authenticated
  with check (auth.uid() = voter_id);

-- 4. Users can check if they have already voted (their own row only)
create policy "select_own_vote" on votes
  for select
  to authenticated
  using (auth.uid() = voter_id);

-- No UPDATE or DELETE policies — votes are immutable.
-- The service role key (used only in the Netlify Function) bypasses RLS to tally all votes.
