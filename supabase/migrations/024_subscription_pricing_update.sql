-- Update subscription plan pricing model: monthly / quarterly / annual
-- IMPORTANT: drop constraints BEFORE updating plan values.

alter table firms drop constraint if exists firms_subscription_plan_check;
alter table subscription_requests drop constraint if exists subscription_requests_plan_check;

-- Migrate legacy plan ids
update firms
set subscription_plan = case subscription_plan
  when 'free' then 'trial'
  when 'professional' then 'monthly'
  when 'corporate' then 'annual'
  else subscription_plan
end
where subscription_plan in ('free', 'professional', 'corporate');

update subscription_requests
set plan = case plan
  when 'free' then 'monthly'
  when 'professional' then 'monthly'
  when 'corporate' then 'annual'
  else plan
end
where plan in ('free', 'professional', 'corporate');

alter table firms
  alter column subscription_plan set default 'trial';

alter table firms
  add constraint firms_subscription_plan_check
  check (subscription_plan in ('trial', 'monthly', 'quarterly', 'annual'));

alter table subscription_requests
  add constraint subscription_requests_plan_check
  check (plan in ('monthly', 'quarterly', 'annual'));

-- Helper: duration to add when admin approves a request
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
