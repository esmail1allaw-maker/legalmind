-- Security hardening: privilege escalation, timeline RPC, audit logs, receipts

-- ─── 1) Block self-service privilege escalation on employees ─────────────────
drop policy if exists "employees_update_self" on public.employees;

create or replace function private.guard_employee_privilege_columns()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if private.is_office_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.firm_role_id is distinct from old.firm_role_id
     or new.status is distinct from old.status
     or new.firm_id is distinct from old.firm_id
     or new.auth_uid is distinct from old.auth_uid
     or new.email is distinct from old.email
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'not_authorized';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_employee_privilege on public.employees;
create trigger trg_guard_employee_privilege
  before update on public.employees
  for each row execute function private.guard_employee_privilege_columns();

-- ─── 2) Timeline RPC — require case access ───────────────────────────────────
create or replace function public.append_case_timeline_event(
  p_case_id uuid,
  p_event_type text,
  p_title text,
  p_details text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
  v_id uuid;
begin
  if not private.can_access_case(p_case_id) then
    raise exception 'not_authorized';
  end if;

  select firm_id into v_firm_id
  from public.cases
  where id = p_case_id and deleted_at is null;

  if v_firm_id is null then
    raise exception 'case_not_found';
  end if;

  insert into public.case_timeline_events (
    firm_id, case_id, event_type, title, details, metadata, actor_id
  )
  values (
    v_firm_id, p_case_id, p_event_type, p_title, p_details, p_metadata,
    private.get_current_employee_id()
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ─── 3) Audit logs — firm-scoped for office admins ───────────────────────────
drop policy if exists "audit_logs_select" on public.audit_logs;
drop policy if exists "audit_logs_select_admin" on public.audit_logs;

create policy "audit_logs_select" on public.audit_logs
  for select using (
    private.is_office_admin()
    and changed_by is not null
    and exists (
      select 1 from public.employees e
      where e.id = changed_by
        and e.firm_id = private.get_current_firm_id()
        and e.deleted_at is null
    )
  );

create or replace function public.list_firm_audit_logs(p_limit integer default 100)
returns setof public.audit_logs
language sql
stable
security definer
set search_path = public, private
as $$
  select a.*
  from public.audit_logs a
  where private.is_office_admin()
    and a.changed_by is not null
    and exists (
      select 1 from public.employees e
      where e.id = a.changed_by
        and e.firm_id = private.get_current_firm_id()
        and e.deleted_at is null
    )
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.list_firm_audit_logs(integer) from public;
grant execute on function public.list_firm_audit_logs(integer) to authenticated;

-- ─── 4) Receipt vouchers — RPC-only insert, print permission on reprint ──────
drop policy if exists "receipt_vouchers_insert" on public.receipt_vouchers;
revoke insert on public.receipt_vouchers from authenticated;

create or replace function public.reprint_receipt_voucher(p_voucher_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_v public.receipt_vouchers%rowtype;
begin
  select * into v_v from public.receipt_vouchers where id = p_voucher_id;
  if not found then raise exception 'voucher_not_found'; end if;
  if not private.can_view_case_financials(v_v.case_id) then raise exception 'not_authorized'; end if;
  if not private.has_permission('financials.print_receipts') and not private.is_office_admin() then
    raise exception 'not_authorized';
  end if;

  update public.receipt_vouchers
  set reprint_count = reprint_count + 1,
      printed_at = now(),
      printed_by = private.get_current_employee_id()
  where id = p_voucher_id;

  return jsonb_build_object('ok', true, 'receipt_number', v_v.receipt_number);
end;
$$;

revoke all on function public.next_receipt_number(uuid) from public;
revoke all on function public.next_receipt_number(uuid) from authenticated;

-- ─── 5) Lock down role template seeding ──────────────────────────────────────
create or replace function public.seed_firm_role_templates(p_firm_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if p_firm_id is distinct from private.get_current_firm_id()
     and not private.is_platform_operator() then
    raise exception 'not_authorized';
  end if;

  insert into public.firm_roles (firm_id, name, slug, is_template, permissions)
  values
    (p_firm_id, 'مالك المكتب', 'firm_owner', true, '{
      "cases.view":true,"cases.create":true,"cases.edit":true,"cases.delete":true,
      "clients.view":true,"clients.create":true,"clients.edit":true,"clients.delete":true,
      "documents.upload":true,"documents.download":true,"documents.delete":true,
      "financials.view":true,"financials.add_payments":true,"financials.print_receipts":true,
      "sessions.view":true,"sessions.create":true,"sessions.edit":true,
      "users.invite":true,"users.manage":true,"users.permissions":true,
      "subscriptions.view":true,"subscriptions.manage":true,
      "settings.view":true,"settings.edit":true
    }'::jsonb),
    (p_firm_id, 'محامٍ managing', 'managing_lawyer', true, '{
      "cases.view":true,"cases.create":true,"cases.edit":true,"cases.delete":false,
      "clients.view":true,"clients.create":true,"clients.edit":true,"clients.delete":false,
      "documents.upload":true,"documents.download":true,"documents.delete":false,
      "financials.view":true,"financials.add_payments":true,"financials.print_receipts":true,
      "sessions.view":true,"sessions.create":true,"sessions.edit":true,
      "users.invite":true,"users.manage":false,"users.permissions":false,
      "subscriptions.view":true,"subscriptions.manage":false,
      "settings.view":true,"settings.edit":false
    }'::jsonb),
    (p_firm_id, 'محامٍ', 'lawyer', true, '{
      "cases.view":true,"cases.create":true,"cases.edit":true,"cases.delete":false,
      "clients.view":true,"clients.create":true,"clients.edit":true,"clients.delete":false,
      "documents.upload":true,"documents.download":true,"documents.delete":false,
      "financials.view":true,"financials.add_payments":false,"financials.print_receipts":false,
      "sessions.view":true,"sessions.create":true,"sessions.edit":true,
      "users.invite":false,"users.manage":false,"users.permissions":false,
      "subscriptions.view":false,"subscriptions.manage":false,
      "settings.view":false,"settings.edit":false
    }'::jsonb),
    (p_firm_id, 'مساعد قانوني', 'legal_assistant', true, '{
      "cases.view":true,"cases.create":false,"cases.edit":false,"cases.delete":false,
      "clients.view":true,"clients.create":true,"clients.edit":true,"clients.delete":false,
      "documents.upload":true,"documents.download":true,"documents.delete":false,
      "financials.view":true,"financials.add_payments":false,"financials.print_receipts":true,
      "sessions.view":true,"sessions.create":true,"sessions.edit":true,
      "users.invite":false,"users.manage":false,"users.permissions":false,
      "subscriptions.view":false,"subscriptions.manage":false,
      "settings.view":false,"settings.edit":false
    }'::jsonb),
    (p_firm_id, 'محاسب', 'accountant', true, '{
      "cases.view":true,"cases.create":false,"cases.edit":false,"cases.delete":false,
      "clients.view":true,"clients.create":false,"clients.edit":false,"clients.delete":false,
      "documents.upload":false,"documents.download":true,"documents.delete":false,
      "financials.view":true,"financials.add_payments":true,"financials.print_receipts":true,
      "sessions.view":true,"sessions.create":false,"sessions.edit":false,
      "users.invite":false,"users.manage":false,"users.permissions":false,
      "subscriptions.view":true,"subscriptions.manage":false,
      "settings.view":false,"settings.edit":false
    }'::jsonb),
    (p_firm_id, 'سكرتير', 'secretary', true, '{
      "cases.view":true,"cases.create":false,"cases.edit":false,"cases.delete":false,
      "clients.view":true,"clients.create":true,"clients.edit":true,"clients.delete":false,
      "documents.upload":true,"documents.download":true,"documents.delete":false,
      "financials.view":false,"financials.add_payments":false,"financials.print_receipts":false,
      "sessions.view":true,"sessions.create":true,"sessions.edit":false,
      "users.invite":false,"users.manage":false,"users.permissions":false,
      "subscriptions.view":false,"subscriptions.manage":false,
      "settings.view":false,"settings.edit":false
    }'::jsonb)
  on conflict (firm_id, slug) do nothing;
end;
$$;

revoke all on function public.seed_firm_role_templates(uuid) from public;
revoke all on function public.seed_firm_role_templates(uuid) from authenticated;
grant execute on function public.seed_firm_role_templates(uuid) to service_role;
