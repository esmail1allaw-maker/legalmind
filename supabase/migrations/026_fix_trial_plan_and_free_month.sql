-- Fix firms_subscription_plan_check violation + first month free (30-day trial)
-- Run after 023 (and 024 if it failed partway)

-- ─── 1) Drop OLD constraints BEFORE migrating plan values ─────────────────────
alter table firms drop constraint if exists firms_subscription_plan_check;
alter table subscription_requests drop constraint if exists subscription_requests_plan_check;

-- ─── 2) Migrate legacy plan ids ───────────────────────────────────────────────
update firms
set subscription_plan = case subscription_plan
  when 'free' then 'trial'
  when 'professional' then 'monthly'
  when 'corporate' then 'annual'
  else subscription_plan
end
where subscription_plan in ('free', 'professional', 'corporate');

update firms
set subscription_plan = 'trial'
where subscription_plan is null;

update subscription_requests
set plan = case plan
  when 'free' then 'monthly'
  when 'professional' then 'monthly'
  when 'corporate' then 'annual'
  else plan
end
where plan in ('free', 'professional', 'corporate');

-- ─── 3) Apply new constraints ─────────────────────────────────────────────────
alter table firms
  alter column subscription_plan set default 'trial';

alter table firms
  alter column subscription_status set default 'trial';

alter table firms
  add constraint firms_subscription_plan_check
  check (subscription_plan in ('trial', 'monthly', 'quarterly', 'annual'));

alter table subscription_requests
  add constraint subscription_requests_plan_check
  check (plan in ('monthly', 'quarterly', 'annual'));

-- ─── 4) First month free: 30-day trial from registration date ────────────────
update firms
set
  subscription_plan = 'trial',
  subscription_status = case
    when created_at + interval '30 days' <= now() then 'expired'
    else 'trial'
  end,
  subscription_expires_at = created_at + interval '30 days',
  is_locked = (created_at + interval '30 days' <= now())
where subscription_plan in ('trial', 'free')
   or subscription_plan is null;

-- Unlock firms wrongly locked while constraint migration failed (still in trial)
update firms
set
  subscription_status = 'trial',
  is_locked = false
where subscription_plan = 'trial'
  and created_at + interval '30 days' > now()
  and (is_locked = true or subscription_status = 'expired');

-- ─── 5) Auto-init trial on new firm registration ─────────────────────────────
create or replace function init_firm_trial_subscription()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.subscription_status := coalesce(new.subscription_status, 'trial');
  if new.subscription_plan is null or new.subscription_plan in ('free', 'professional', 'corporate') then
    new.subscription_plan := case new.subscription_plan
      when 'professional' then 'monthly'
      when 'corporate' then 'annual'
      else 'trial'
    end;
  end if;
  new.subscription_expires_at := coalesce(
    new.subscription_expires_at,
    coalesce(new.created_at, now()) + interval '30 days'
  );
  new.is_locked := coalesce(new.is_locked, false);
  return new;
end;
$$;

drop trigger if exists trg_init_firm_trial_subscription on firms;
create trigger trg_init_firm_trial_subscription
  before insert on firms
  for each row execute function init_firm_trial_subscription();

-- ─── 6) New offices get explicit 30-day trial ────────────────────────────────
create or replace function create_office_admin_profile(
  auth_user_id uuid,
  office_name text,
  owner_name text,
  owner_email text,
  owner_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_firm_id uuid;
  new_employee_id uuid;
  normalized_email text := lower(trim(owner_email));
  normalized_name text := trim(owner_name);
begin
  perform set_config('row_security', 'off', true);

  if char_length(normalized_name) < 2 then
    raise exception 'Owner name must be at least 2 characters'
      using errcode = 'check_violation';
  end if;

  insert into firms(
    name, owner_full_name, email, phone, plan,
    subscription_status, subscription_plan, subscription_expires_at, is_locked
  )
  values (
    office_name, normalized_name, normalized_email, owner_phone, 'free',
    'trial', 'trial', now() + interval '30 days', false
  )
  returning id into new_firm_id;

  insert into employees(auth_uid, firm_id, full_name, email, phone, role, status)
  values (auth_user_id, new_firm_id, normalized_name, normalized_email, owner_phone, 'admin', 'active')
  returning id into new_employee_id;

  insert into profiles(id, firm_id, employee_id, full_name, email, role, phone)
  values (auth_user_id, new_firm_id, new_employee_id, normalized_name, normalized_email, 'admin', owner_phone);

  return new_firm_id;
end;
$$;

-- ─── 7) Plan duration helper ─────────────────────────────────────────────────
create or replace function subscription_plan_duration_days(plan_code text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case plan_code
    when 'trial' then 30
    when 'monthly' then 30
    when 'quarterly' then 90
    when 'annual' then 365
    else 30
  end;
$$;

grant execute on function public.subscription_plan_duration_days(text) to authenticated;
