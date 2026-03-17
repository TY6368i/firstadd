-- CAPTCHA practice app schema (minimal)
-- 1) Run this in Supabase SQL Editor
-- 2) Then set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in a local env file

create table if not exists public.captcha_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  captcha_type text not null check (captcha_type in ('text', 'image', 'recaptcha_click', 'placeholder')),
  success boolean not null,
  duration_ms integer null,
  meta jsonb null
);

create index if not exists captcha_attempts_created_at_idx
  on public.captcha_attempts (created_at desc);

create index if not exists captcha_attempts_session_id_idx
  on public.captcha_attempts (session_id);

-- RLS (recommended)
alter table public.captcha_attempts enable row level security;

-- Allow anonymous clients to INSERT practice attempts.
-- (No SELECT yet; add later when you decide how you want to expose stats.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'captcha_attempts'
      and policyname = 'anon_insert_attempts'
  ) then
    create policy anon_insert_attempts
      on public.captcha_attempts
      for insert
      to anon
      with check (true);
  end if;
end $$;

