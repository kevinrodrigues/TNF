-- Run this in the Supabase SQL Editor
-- This replaces the auth-based votes table with an email-based one

-- 1. Drop old tables (safe — we're switching to a new auth approach)
drop table if exists votes;
drop table if exists otp_codes;

-- 2. New votes table — keyed by email, no auth.users dependency
create table votes (
  id          uuid primary key default gen_random_uuid(),
  voter_email text unique not null,
  candidate   text not null,
  created_at  timestamptz default now()
);
alter table votes enable row level security;
-- No RLS policies = only service role key (used in Netlify Functions) can access

-- 3. OTP codes table — stores verification codes and vote tokens
create table otp_codes (
  email       text primary key,
  code        text,
  vote_token  text,
  expires_at  timestamptz not null
);
alter table otp_codes enable row level security;
-- No RLS policies = only service role key can access

-- 4. Vote count function (safe to call from browser — returns a number only)
create or replace function public.get_vote_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from votes;
$$;
grant execute on function public.get_vote_count() to anon, authenticated;
