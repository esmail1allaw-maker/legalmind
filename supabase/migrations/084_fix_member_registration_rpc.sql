-- LegalMind Yemen — Fix member registration approve/reject RPCs after migration 083
-- Migration 083 converted these to SECURITY INVOKER; they need DEFINER for
-- admin-only employee mutations and lawyers provisioning.

-- ─── list pending join requests (firm admin only) ───────────────────────────
create or replace function public.list_pending_member_registrations()
returns table (
  employee_id uuid,
  full_name text,
  email text,
  role_slug text,
  role_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
begin
  if not private.is_office_admin() then
    raise exception 'not_authorized';
  end if;

  v_firm_id := private.get_current_firm_id();

  return query
  select
    e.id,
    e.full_name,
    e.email,
    fr.slug,
    fr.name,
    e.created_at
  from public.employees e
  left join public.firm_roles fr on fr.id = e.firm_role_id
  where e.firm_id = v_firm_id
    and e.deleted_at is null
    and e.status = 'pending_approval'
  order by e.created_at asc;
end;
$$;

-- ─── approve pending member ─────────────────────────────────────────────────
create or replace function public.approve_member_registration(p_employee_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
  v_employee public.employees%rowtype;
  v_role_slug text;
begin
  if not private.is_office_admin() then
    raise exception 'not_authorized';
  end if;

  v_firm_id := private.get_current_firm_id();

  select e.*
  into v_employee
  from public.employees e
  where e.id = p_employee_id
    and e.firm_id = v_firm_id
    and e.deleted_at is null
    and e.status = 'pending_approval'
  for update;

  if not found then
    raise exception 'member_not_pending';
  end if;

  select fr.slug
  into v_role_slug
  from public.firm_roles fr
  where fr.id = v_employee.firm_role_id;

  update public.employees
  set status = 'active', updated_at = now()
  where id = p_employee_id;

  if v_employee.role = 'lawyer'
     or coalesce(v_role_slug, '') in ('lawyer', 'managing_lawyer') then
    insert into public.lawyers(employee_id)
    values (p_employee_id)
    on conflict (employee_id) do nothing;
  end if;
end;
$$;

-- ─── reject pending member ──────────────────────────────────────────────────
create or replace function public.reject_member_registration(p_employee_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
begin
  if not private.is_office_admin() then
    raise exception 'not_authorized';
  end if;

  v_firm_id := private.get_current_firm_id();

  update public.employees
  set status = 'disabled', deleted_at = now(), updated_at = now()
  where id = p_employee_id
    and firm_id = v_firm_id
    and deleted_at is null
    and status = 'pending_approval';

  if not found then
    raise exception 'member_not_pending';
  end if;
end;
$$;

revoke all on function public.list_pending_member_registrations() from public, anon;
revoke all on function public.approve_member_registration(uuid) from public, anon;
revoke all on function public.reject_member_registration(uuid) from public, anon;

grant execute on function public.list_pending_member_registrations() to authenticated;
grant execute on function public.approve_member_registration(uuid) to authenticated;
grant execute on function public.reject_member_registration(uuid) to authenticated;
