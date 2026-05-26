-- ResearchLink Malaysia — Core Schema
-- Run this first in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists public.users (
  id              uuid primary key default uuid_generate_v4(),
  email           text unique not null,
  name            text,
  avatar_url      text,
  university      text,
  programme       text,
  year_of_study   text,
  role            text not null default 'respondent',
  credit_balance  integer not null default 3,
  points_balance  integer not null default 0,
  referral_code   text unique,
  has_consented   boolean not null default false,
  consent_research boolean not null default false,
  consent_brand   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Surveys table
create table if not exists public.surveys (
  id                uuid primary key default uuid_generate_v4(),
  creator_id        uuid not null references public.users(id) on delete cascade,
  title             text not null,
  description       text,
  survey_url        text not null,
  status            text not null default 'pending',
  target_responses  integer not null default 100,
  target_faculty    text,
  target_year       text,
  response_count    integer not null default 0,
  points            integer not null default 10,
  estimated_minutes integer default 5,
  is_boosted        boolean not null default false,
  boost_expires_at  timestamptz,
  topic_tags        text[] default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Responses table
create table if not exists public.responses (
  id              uuid primary key default uuid_generate_v4(),
  survey_id       uuid not null references public.surveys(id) on delete cascade,
  respondent_id   uuid not null references public.users(id) on delete cascade,
  points_earned   integer not null default 10,
  submitted_at    timestamptz not null default now(),
  unique (survey_id, respondent_id)
);

-- Reward transactions
create table if not exists public.reward_txns (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,
  points      integer not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Boost orders
create table if not exists public.boost_orders (
  id          uuid primary key default uuid_generate_v4(),
  survey_id   uuid not null references public.surveys(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  tier        text not null,
  amount_myr  numeric(10,2) not null,
  status      text not null default 'pending',
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Campaigns (Insight Blast / Corporate)
create table if not exists public.campaigns (
  id              uuid primary key default uuid_generate_v4(),
  brand           text not null,
  objective       text,
  target_audience text,
  amount_myr      numeric(10,2) not null default 5000,
  status          text not null default 'pending',
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now()
);

-- Voucher pool
create table if not exists public.voucher_pool (
  id          uuid primary key default uuid_generate_v4(),
  brand       text not null,
  rm_value    numeric(10,2) not null,
  code        text not null unique,
  expires_at  timestamptz,
  redeemed_by uuid references public.users(id),
  redeemed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Moderation queue
create table if not exists public.moderation_queue (
  id          uuid primary key default uuid_generate_v4(),
  survey_id   uuid not null references public.surveys(id) on delete cascade,
  reason      text,
  reviewed    boolean not null default false,
  reviewed_by uuid references public.users(id),
  created_at  timestamptz not null default now()
);

-- Survey reports
create table if not exists public.survey_reports (
  id          uuid primary key default uuid_generate_v4(),
  survey_id   uuid not null references public.surveys(id) on delete cascade,
  reported_by uuid not null references public.users(id),
  reason      text not null,
  reviewed    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Consent audit log
create table if not exists public.consent_audit_log (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  consent_research boolean not null,
  consent_brand   boolean not null,
  ip_address      text,
  created_at      timestamptz not null default now()
);

-- Published reports
create table if not exists public.published_reports (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  price_myr       numeric(10,2) not null,
  category        text,
  content         text,
  is_published    boolean not null default false,
  purchase_count  integer not null default 0,
  generated_at    timestamptz not null default now()
);
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
-- ResearchLink Malaysia — Helper Functions
-- Run after 02_rls_policies.sql

-- Increment function (used by API routes)
create or replace function public.increment(amount int default 1)
returns int language sql as $$
  select amount;
$$;

-- Award credit on response
create or replace function public.award_credit_on_response(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.users
  set credit_balance = credit_balance + 1
  where id = p_user_id;
end;
$$;

-- Auto-generate referral code on user insert
create or replace function public.generate_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substring(md5(new.id::text || random()::text) from 1 for 8));
  end if;
  return new;
end;
$$;

create trigger trg_users_referral_code
  before insert on public.users
  for each row execute function public.generate_referral_code();

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger trg_surveys_updated_at
  before update on public.surveys
  for each row execute function public.update_updated_at();
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
-- ============================================================
-- ResearchLink Malaysia — sql/05_final_tables.sql
-- Waitlist, supervisor-student linking, platform settings,
-- voucher pool seed data, and useful admin views
-- Run last, after 01–04
-- ============================================================

-- ── Waitlist (pre-launch email capture) ──────────────────────
-- Created in 04_new_features.sql — uncomment below if running 05 standalone
-- create table if not exists public.waitlist (
--   id           uuid primary key default uuid_generate_v4(),
--   email        text unique not null,
--   university   text,
--   role         text not null default 'respondent',
--   signed_up_at timestamptz not null default now(),
--   invited_at   timestamptz,
--   converted    boolean not null default false
-- );

-- alter table public.waitlist enable row level security;
-- create policy "waitlist: admin only" on public.waitlist for all using (is_admin());
-- create policy "waitlist: public insert" on public.waitlist for insert with check (true);

-- ── Supervisor ↔ student linking ─────────────────────────────
create table public.supervisor_students (
  id             uuid primary key default uuid_generate_v4(),
  supervisor_id  uuid not null references public.users(id) on delete cascade,
  student_id     uuid not null references public.users(id) on delete cascade,
  university     text not null,
  programme      text,        -- e.g. 'FYP', 'Masters', 'PhD'
  linked_at      timestamptz not null default now(),
  unique (supervisor_id, student_id)
);

alter table public.supervisor_students enable row level security;
create policy "supervisor_students: supervisor sees own" on public.supervisor_students
  for select using (supervisor_id = auth.uid() or student_id = auth.uid() or is_admin());
create policy "supervisor_students: admin write" on public.supervisor_students
  for all using (is_admin());

-- ── Platform settings (key-value store for admin config) ─────
create table public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users(id)
);

alter table public.platform_settings enable row level security;
create policy "platform_settings: public read" on public.platform_settings for select using (true);
create policy "platform_settings: admin write" on public.platform_settings for all using (is_admin());

-- Seed default settings
insert into public.platform_settings (key, value) values
  ('credits_to_post',        '5'),
  ('points_per_response',    '10'),
  ('referrer_bonus_points',  '50'),
  ('referee_bonus_points',   '20'),
  ('points_expiry_months',   '6'),
  ('boost_price_basic_myr',  '20'),
  ('boost_price_featured_myr', '50'),
  ('boost_basic_hours',      '48'),
  ('boost_featured_hours',   '72'),
  ('max_surveys_per_user',   '10'),
  ('platform_launch_date',   '"2025-06-01"'),
  ('maintenance_mode',       'false')
on conflict (key) do nothing;

-- ── Voucher pool seed (for Shopee/ZUS codes — admin uploads real codes) ─
-- This seeds DEMO codes for development. Replace with real codes before launch.
insert into public.voucher_pool (brand, rm_value, code, expires_at) values
  ('Shopee',     2.00, 'DEMO-SHP-RM2-001', (now() + interval '30 days')),
  ('Shopee',     2.00, 'DEMO-SHP-RM2-002', (now() + interval '30 days')),
  ('Shopee',     5.00, 'DEMO-SHP-RM5-001', (now() + interval '30 days')),
  ('Shopee',     5.00, 'DEMO-SHP-RM5-002', (now() + interval '30 days')),
  ('ZUS Coffee', 5.00, 'DEMO-ZUS-RM5-001', (now() + interval '30 days')),
  ('ZUS Coffee', 5.00, 'DEMO-ZUS-RM5-002', (now() + interval '30 days'))
on conflict do nothing;

-- ── Useful admin views (read-only, no PII exposed) ───────────

-- Platform health overview
create or replace view public.v_platform_health as
select
  (select count(*) from public.users)                                   as total_users,
  (select count(*) from public.users  where created_at > now() - interval '7 days')  as new_users_7d,
  (select count(*) from public.surveys where status = 'active')         as active_surveys,
  (select count(*) from public.surveys where is_boosted = true)         as boosted_surveys,
  (select count(*) from public.responses where submitted_at > now() - interval '7 days') as responses_7d,
  (select coalesce(sum(amount_myr),0) from public.boost_orders where status = 'paid' and paid_at > now() - interval '30 days') as boost_revenue_30d,
  (select coalesce(sum(amount_myr),0) from public.campaigns where status = 'completed' and created_at > now() - interval '30 days') as campaign_revenue_30d,
  (select count(*) from public.moderation_queue where reviewed = false) as pending_moderation,
  (select count(*) from public.survey_reports   where reviewed = false) as pending_reports,
  (select count(*) from public.waitlist)                                as waitlist_signups;

-- University activity (no PII)
create or replace view public.v_university_activity as
select
  u.university,
  count(distinct u.id)               as total_users,
  count(distinct s.id)               as surveys_posted,
  sum(s.response_count)              as total_responses,
  round(avg(s.response_count)::numeric, 1) as avg_responses_per_survey
from public.users u
left join public.surveys s on s.creator_id = u.id
group by u.university
order by total_users desc;

-- Revenue by month (last 12 months)
create or replace view public.v_monthly_revenue as
select
  date_trunc('month', paid_at) as month,
  sum(amount_myr)               as boost_revenue,
  0::numeric                    as campaign_revenue
from public.boost_orders
where status = 'paid' and paid_at > now() - interval '12 months'
group by 1
union all
select
  date_trunc('month', created_at),
  0,
  sum(amount_myr)
from public.campaigns
where status = 'completed' and created_at > now() - interval '12 months'
group by 1
order by month;

-- ── Award credit helper (used by completion token route) ─────
-- Already created in 03_functions.sql — skip if exists
create or replace function award_credit_on_response(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.users
  set credit_balance = credit_balance + 1
  where id = p_user_id;
end; $$;

-- ── Useful index additions ────────────────────────────────────
create index if not exists surveys_creator_status_idx
  on public.surveys(creator_id, status);

create index if not exists responses_respondent_idx
  on public.responses(respondent_id, submitted_at desc);

create index if not exists reward_txns_user_idx
  on public.reward_txns(user_id, created_at desc);

create index if not exists users_university_idx
  on public.users(university);

create index if not exists boost_orders_paid_idx
  on public.boost_orders(status, paid_at desc);

-- ── Grant view access ────────────────────────────────────────
grant select on public.v_platform_health     to authenticated;
grant select on public.v_university_activity to authenticated;
grant select on public.v_monthly_revenue     to authenticated;
