-- Run this in the Supabase SQL Editor after setup.sql

-- 1. Add voter_email column so results can show who voted for whom
alter table votes add column if not exists voter_email text;

-- 2. Postgres function that returns the total vote count
--    Uses security definer so it bypasses RLS — only returns a number, no vote data
create or replace function public.get_vote_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from votes;
$$;

-- Allow anyone (anon + authenticated) to call this function
grant execute on function public.get_vote_count() to anon, authenticated;
