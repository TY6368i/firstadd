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

-- ---------------------------------------------------------------------------
-- reCAPTCHA v3 sessions + pointer traces
-- 테이블은 SQL Editor에서 직접 만든 뒤, 아래 블록으로 RLS·anon INSERT를 켭니다.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'captcha_sessions'
  ) then
    execute 'alter table public.captcha_sessions enable row level security';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'captcha_sessions'
        and policyname = 'anon_insert_captcha_sessions'
    ) then
      create policy anon_insert_captcha_sessions
        on public.captcha_sessions
        for insert
        to anon
        with check (true);
    end if;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'captcha_pointer_batches'
  ) then
    execute 'alter table public.captcha_pointer_batches enable row level security';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'captcha_pointer_batches'
        and policyname = 'anon_insert_captcha_pointer_batches'
    ) then
      create policy anon_insert_captcha_pointer_batches
        on public.captcha_pointer_batches
        for insert
        to anon
        with check (true);
    end if;
  end if;
end $$;

