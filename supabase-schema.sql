-- ═══════════════════════════════════════════════════════════════════
-- JSOM COMET PASSPORT — SUPABASE DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1. PASSPORTS TABLE ────────────────────────────────────────────
create table if not exists public.passports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  email         text not null,
  passport_no   text not null unique,

  -- Profile info (set at sign-up)
  name          text not null default '',
  major         text not null default '',
  year          text not null default '',

  -- About Me page (user fills in later)
  about_me      text not null default '',
  fun_fact      text not null default '',
  utd_memory    text not null default '',
  coffee_order  text not null default '',

  -- Timestamps
  issued_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- One passport per user
  constraint passports_user_id_key unique (user_id)
);

-- Index for fast lookups by user_id
create index if not exists passports_user_id_idx on public.passports(user_id);


-- ─── 2. ROW LEVEL SECURITY (RLS) ───────────────────────────────────
-- RLS ensures users can only read/write their OWN passport.

alter table public.passports enable row level security;

-- Users can read their own passport
create policy "Users can view own passport"
  on public.passports for select
  using (auth.uid() = user_id);

-- Users can insert their own passport (called from /auth/callback)
create policy "Users can insert own passport"
  on public.passports for insert
  with check (auth.uid() = user_id);

-- Users can update their own passport
create policy "Users can update own passport"
  on public.passports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: allow public read for shared passport links
-- Uncomment the line below if you want /passport/:username to be publicly viewable
-- create policy "Passports are publicly viewable" on public.passports for select using (true);


-- ─── 3. AUTO-UPDATE updated_at TRIGGER ─────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger passports_updated_at
  before update on public.passports
  for each row execute function public.handle_updated_at();


-- ─── 4. VERIFY SETUP ───────────────────────────────────────────────
-- Run this to confirm everything was created correctly:
-- select table_name, column_name, data_type
-- from information_schema.columns
-- where table_name = 'passports'
-- order by ordinal_position;
