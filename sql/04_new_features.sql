-- ResearchLink Malaysia — v1.1 New Features
-- Run after 03_functions.sql

-- Completion token tracking
create table if not exists public.completion_tokens (
  id          uuid primary key default uuid_generate_v4(),
  survey_id   uuid not null references public.surveys(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  token       text not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.completion_tokens enable row level security;
create policy "completion_tokens: own" on public.completion_tokens
  for select using (user_id = auth.uid());
create policy "completion_tokens: insert" on public.completion_tokens
  for insert with check (true);

-- Waitlist (previously in 05, moved here for ordering)
create table if not exists public.waitlist (
  id           uuid primary key default uuid_generate_v4(),
  email        text unique not null,
  university   text,
  role         text not null default 'respondent',
  signed_up_at timestamptz not null default now(),
  invited_at   timestamptz,
  converted    boolean not null default false
);

alter table public.waitlist enable row level security;
create policy "waitlist: admin only" on public.waitlist for all using (is_admin());
create policy "waitlist: public insert" on public.waitlist for insert with check (true);
