-- Admin list RPC (avoids PostgREST join issues) + resilient super_admin select policy

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
  if not (select private.is_subscription_super_admin()) then
    raise exception 'not_authorized';
  end if;

  return query
  select
    sr.id as request_id,
    coalesce(p.id, sr.payment_id, sr.id) as payment_id,
    coalesce(sr.subscription_id, p.subscription_id) as subscription_id,
    sr.firm_id,
    f.name as firm_name,
    sr.plan,
    coalesce(s.plan_type, public.map_plan_to_plan_type(sr.plan)) as plan_type,
    sr.amount_yer,
    sr.transfer_reference,
    sr.receipt_path,
    sr.receipt_url,
    coalesce(p.proof_of_payment_url, p.receipt_url, sr.receipt_url) as proof_of_payment_url,
    coalesce(p.status, 'pending') as payment_status,
    sr.created_at
  from public.subscription_requests sr
  inner join public.firms f on f.id = sr.firm_id
  left join public.payments p on p.id = sr.payment_id
  left join public.subscriptions s on s.id = sr.subscription_id
  where sr.status = 'pending'
  order by sr.created_at asc;
end;
$$;

revoke all on function public.list_pending_subscription_requests_admin() from public;
grant execute on function public.list_pending_subscription_requests_admin() to authenticated;

drop policy if exists "subscription_requests_select_super_admin" on public.subscription_requests;
create policy "subscription_requests_select_super_admin" on public.subscription_requests
  for select
  using ((select private.is_subscription_super_admin()));
