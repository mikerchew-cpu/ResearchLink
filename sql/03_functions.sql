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
