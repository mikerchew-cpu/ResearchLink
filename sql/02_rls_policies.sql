-- ResearchLink Malaysia — Row Level Security
-- Run after 01_schema.sql

-- Helper: is_admin check
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Users RLS
alter table public.users enable row level security;

create policy "users: read own" on public.users
  for select using (id = auth.uid() or is_admin());
create policy "users: update own" on public.users
  for update using (id = auth.uid());
create policy "users: insert" on public.users
  for insert with check (true);
create policy "users: delete own" on public.users
  for delete using (id = auth.uid());

-- Surveys RLS
alter table public.surveys enable row level security;

create policy "surveys: read active" on public.surveys
  for select using (status = 'active' or creator_id = auth.uid() or is_admin());
create policy "surveys: insert own" on public.surveys
  for insert with check (creator_id = auth.uid());
create policy "surveys: update own" on public.surveys
  for update using (creator_id = auth.uid() or is_admin());
create policy "surveys: delete own" on public.surveys
  for delete using (creator_id = auth.uid());

-- Responses RLS
alter table public.responses enable row level security;

create policy "responses: read own" on public.responses
  for select using (respondent_id = auth.uid());
create policy "responses: insert own" on public.responses
  for insert with check (respondent_id = auth.uid());

-- Reward txns RLS
alter table public.reward_txns enable row level security;

create policy "reward_txns: read own" on public.reward_txns
  for select using (user_id = auth.uid() or is_admin());
create policy "reward_txns: insert" on public.reward_txns
  for insert with check (true);

-- Boost orders RLS
alter table public.boost_orders enable row level security;

create policy "boost_orders: read own" on public.boost_orders
  for select using (user_id = auth.uid() or is_admin());
create policy "boost_orders: insert own" on public.boost_orders
  for insert with check (user_id = auth.uid());

-- Campaigns RLS
alter table public.campaigns enable row level security;

create policy "campaigns: read own" on public.campaigns
  for select using (created_by = auth.uid() or is_admin());
create policy "campaigns: insert" on public.campaigns
  for insert with check (true);

-- Voucher pool RLS
alter table public.voucher_pool enable row level security;

create policy "voucher_pool: read" on public.voucher_pool
  for select using (true);
create policy "voucher_pool: admin write" on public.voucher_pool
  for all using (is_admin());

-- Consent audit RLS
alter table public.consent_audit_log enable row level security;

create policy "consent_audit: admin only" on public.consent_audit_log
  for all using (is_admin());
