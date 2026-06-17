-- Final billing admin fix: align DB checks with get_current_role(), firms access, one-time setup claim

create or replace function private.is_billing_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public, auth
as $$
  select coalesce(
    (select private.get_current_role()) = 'super_admin'::public.employee_role_enum,
    false
  )
  or exists (
    select 1
    from private.platform_operators po
    where po.auth_uid = (select auth.uid())
  );
$$;

create or replace function private.is_subscription_super_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public, auth
as $$
  select private.is_billing_admin();
$$;

create or replace function public.is_billing_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public, auth
as $$
  select private.is_billing_admin();
$$;

create or replace function public.is_subscription_super_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public, auth
as $$
  select private.is_billing_admin();
$$;

revoke all on function public.is_billing_admin() from public;
revoke all on function public.is_subscription_super_admin() from public;
grant execute on function public.is_billing_admin() to authenticated, service_role;
grant execute on function public.is_subscription_super_admin() to authenticated, service_role;

create or replace function public.list_pending_subscription_requests_admin()
returns table (
  request_id uuid,
  payment_id uuid,
  subscription_id uuid,
  firm_id uuid,
  firm_name text,
  plan text,
  plan_type text,
  amount_yer numeric,
  transfer_reference text,
  receipt_path text,
  receipt_url text,
  proof_of_payment_url text,
  payment_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select private.is_billing_admin()) then
    raise exception 'not_authorized';
  end if;

  return query
  select
    sr.id as request_id,
    coalesce(sr.payment_id, sr.id) as payment_id,
    sr.subscription_id,
    sr.firm_id,
    f.name as firm_name,
    sr.plan,
    coalesce(
      (select s.plan_type from public.subscriptions s where s.id = sr.subscription_id limit 1),
      case sr.plan
        when 'monthly' then 'monthly'
        when 'quarterly' then 'quarterly'
        when 'annual' then 'yearly'
        when 'yearly' then 'yearly'
        else sr.plan
      end
    ) as plan_type,
    sr.amount_yer,
    sr.transfer_reference,
    sr.receipt_path,
    sr.receipt_url,
    coalesce(
      (select coalesce(p.proof_of_payment_url, p.receipt_url)
       from public.payments p where p.id = sr.payment_id limit 1),
      sr.receipt_url
    ) as proof_of_payment_url,
    coalesce(
      (select p.status from public.payments p where p.id = sr.payment_id limit 1),
      'pending'
    ) as payment_status,
    sr.created_at
  from public.subscription_requests sr
  inner join public.firms f on f.id = sr.firm_id
  where sr.status = 'pending'
  order by sr.created_at asc;
end;
$$;

revoke all on function public.list_pending_subscription_requests_admin() from public;
grant execute on function public.list_pending_subscription_requests_admin() to authenticated;

-- One-time (or admin-only) claim: grants billing admin to the logged-in employee
create or replace function public.claim_billing_admin_setup()
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_employee_id uuid;
  v_has_admin boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select exists (
    select 1
    from public.employees e
    where e.role = 'super_admin'
      and e.deleted_at is null
      and e.status = 'active'
  )
  or exists (select 1 from private.platform_operators)
  into v_has_admin;

  if v_has_admin and not (select private.is_billing_admin()) then
    raise exception 'not_authorized';
  end if;

  select e.id into v_employee_id
  from public.employees e
  where e.auth_uid = v_uid
    and e.deleted_at is null
  order by e.created_at desc
  limit 1;

  if v_employee_id is null then
    raise exception 'employee_not_found';
  end if;

  update public.employees
  set role = 'super_admin', status = 'active'
  where id = v_employee_id;

  insert into private.platform_operators (auth_uid)
  values (v_uid)
  on conflict (auth_uid) do nothing;

  return jsonb_build_object(
    'ok', true,
    'auth_uid', v_uid,
    'employee_id', v_employee_id
  );
end;
$$;

revoke all on function public.claim_billing_admin_setup() from public;
grant execute on function public.claim_billing_admin_setup() to authenticated;

drop policy if exists "subscription_requests_select" on public.subscription_requests;
create policy "subscription_requests_select" on public.subscription_requests
  for select
  using (
    firm_id = (select private.get_current_firm_id())
    or (select private.is_billing_admin())
  );

drop policy if exists "firms_select_billing_admin" on public.firms;
create policy "firms_select_billing_admin" on public.firms
  for select
  using ((select private.is_billing_admin()));
