-- ResearchLink Malaysia — v1.2: Telephone & WhatsApp Broadcast
-- Run after 05_final_tables.sql

-- Add telephone_no to users
alter table public.users add column if not exists telephone_no text;

-- Allow null telephone_no, but encourage students to set it
comment on column public.users.telephone_no is 'Student contact number for WhatsApp survey broadcasts';

-- Create a broadcast_log table to track sent broadcasts
create table if not exists public.broadcast_log (
  id            uuid primary key default uuid_generate_v4(),
  survey_id     uuid not null references public.surveys(id) on delete cascade,
  sent_by       uuid not null references public.users(id),
  total_target  integer not null default 0,
  sent_count    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.broadcast_log enable row level security;
create policy "broadcast_log: creator sees own" on public.broadcast_log
  for select using (sent_by = auth.uid() or is_admin());
create policy "broadcast_log: admin write" on public.broadcast_log
  for insert with check (sent_by = auth.uid() or is_admin());
