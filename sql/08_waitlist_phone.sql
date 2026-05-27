-- ResearchLink Malaysia — v1.4: Waitlist phone instead of email
-- Run after 07_phone_auth.sql

alter table public.waitlist add column if not exists phone text;
alter table public.waitlist alter column email drop not null;
create unique index if not exists waitlist_phone_idx on public.waitlist(phone) where phone is not null;
