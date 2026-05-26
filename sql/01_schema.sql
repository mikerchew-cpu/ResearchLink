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
