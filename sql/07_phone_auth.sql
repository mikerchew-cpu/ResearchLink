-- ResearchLink Malaysia — v1.3: Phone-based auth
-- Run after 06_telephone_whatsapp.sql

-- OTP codes table for phone auth
create table if not exists public.otp_codes (
  id         uuid primary key default uuid_generate_v4(),
  phone      text not null,
  code       text not null,
  expires_at timestamptz not null default now() + interval '5 minutes',
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_phone_idx on public.otp_codes(phone, created_at desc);

alter table public.otp_codes enable row level security;
create policy "otp_codes: auth insert" on public.otp_codes for insert with check (true);
create policy "otp_codes: auth read" on public.otp_codes for select using (true);
