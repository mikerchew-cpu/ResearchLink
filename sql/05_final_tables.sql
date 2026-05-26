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
