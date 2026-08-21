-- Run this in the Supabase SQL Editor

alter table votes add column if not exists voter_name text;
