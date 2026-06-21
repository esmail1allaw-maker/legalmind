-- Per-employee permission sets (editable by office owner / users.permissions holder)

alter table public.employees
  add column if not exists individual_permissions jsonb;

-- Backfill from firm role templates
update public.employees e
set individual_permissions = fr.permissions
from public.firm_roles fr
where e.firm_role_id = fr.id
  and e.individual_permissions is null
  and e.deleted_at is null;

create or replace function private.employee_effective_permissions(p_employee_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    e.individual_permissions,
    fr.permissions,
    '{}'::jsonb
  )
  from public.employees e
  left join public.firm_roles fr on fr.id = e.firm_role_id
  where e.id = p_employee_id
    and e.deleted_at is null
  limit 1;
$$;

create or replace function private.has_permission(perm_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public
as $$
declare
  v_perm boolean;
  v_role text;
  v_status text;
  v_employee_id uuid;
begin
  if perm_key is null or perm_key = '' then return false; end if;

  select e.id, e.status
  into v_employee_id, v_status
  from public.employees e
  where e.auth_uid = auth.uid() and e.deleted_at is null
  limit 1;

  if v_status = 'pending_approval' then return false; end if;

  if v_employee_id is not null then
    select (private.employee_effective_permissions(v_employee_id) ->> perm_key)::boolean
    into v_perm;
    if v_perm is not null then return v_perm; end if;
  end if;

  v_role := private.get_current_role()::text;
  return case perm_key
    when 'financials.view' then v_role in ('super_admin','admin','firm_manager','lawyer','assistant')
    when 'financials.add_payments' then v_role in ('super_admin','admin','firm_manager')
    else private.is_office_admin()
  end;
end;
$$;

create or replace function public.get_employee_permissions(p_employee_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
begin
  v_firm_id := private.get_current_firm_id();

  if not (private.is_office_admin() or private.has_permission('users.permissions')) then
    raise exception 'not_authorized';
  end if;

  if not exists (
    select 1 from public.employees e
    where e.id = p_employee_id
      and e.firm_id = v_firm_id
      and e.deleted_at is null
  ) then
    raise exception 'employee_not_found';
  end if;

  return coalesce(private.employee_effective_permissions(p_employee_id), '{}'::jsonb);
end;
$$;

create or replace function public.update_employee_permissions(
  p_employee_id uuid,
  p_permissions jsonb
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
  v_caller_id uuid;
  v_target_slug text;
  v_safe jsonb := coalesce(p_permissions, '{}'::jsonb);
begin
  v_firm_id := private.get_current_firm_id();
  v_caller_id := private.get_current_employee_id();

  if not (private.is_office_admin() or private.has_permission('users.permissions')) then
    raise exception 'not_authorized';
  end if;

  if p_employee_id = v_caller_id and not private.is_office_admin() then
    raise exception 'not_authorized';
  end if;

  select fr.slug into v_target_slug
  from public.employees e
  left join public.firm_roles fr on fr.id = e.firm_role_id
  where e.id = p_employee_id
    and e.firm_id = v_firm_id
    and e.deleted_at is null;

  if v_target_slug is null then
    raise exception 'employee_not_found';
  end if;

  if v_target_slug = 'firm_owner' and not private.is_office_admin() then
    raise exception 'not_authorized';
  end if;

  if not private.is_office_admin() then
    v_safe := v_safe || jsonb_build_object(
      'users.permissions', false,
      'users.manage', false
    );
  end if;

  update public.employees
  set individual_permissions = v_safe,
      updated_at = now()
  where id = p_employee_id
    and firm_id = v_firm_id
    and deleted_at is null;

  if not found then
    raise exception 'employee_not_found';
  end if;
end;
$$;

create or replace function public.apply_firm_role_to_employee(
  p_employee_id uuid,
  p_role_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
  v_perms jsonb;
begin
  v_firm_id := private.get_current_firm_id();

  if not (private.is_office_admin() or private.has_permission('users.permissions')) then
    raise exception 'not_authorized';
  end if;

  select fr.permissions into v_perms
  from public.firm_roles fr
  where fr.id = p_role_id
    and fr.firm_id = v_firm_id;

  if v_perms is null then
    raise exception 'role_not_found';
  end if;

  update public.employees e
  set firm_role_id = p_role_id,
      individual_permissions = v_perms,
      updated_at = now()
  where e.id = p_employee_id
    and e.firm_id = v_firm_id
    and e.deleted_at is null;

  if not found then
    raise exception 'employee_not_found';
  end if;
end;
$$;

-- Copy role permissions when approving new members
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

  update public.employees e
  set status = 'active',
      individual_permissions = coalesce(
        e.individual_permissions,
        (select fr.permissions from public.firm_roles fr where fr.id = e.firm_role_id),
        '{}'::jsonb
      ),
      updated_at = now()
  where id = p_employee_id;

  if v_employee.role = 'lawyer'
     or coalesce(v_role_slug, '') in ('lawyer', 'managing_lawyer') then
    insert into public.lawyers(employee_id)
    values (p_employee_id)
    on conflict (employee_id) do nothing;
  end if;
end;
$$;

revoke all on function public.get_employee_permissions(uuid) from public;
grant execute on function public.get_employee_permissions(uuid) to authenticated;

revoke all on function public.update_employee_permissions(uuid, jsonb) from public;
grant execute on function public.update_employee_permissions(uuid, jsonb) to authenticated;

revoke all on function public.apply_firm_role_to_employee(uuid, uuid) from public;
grant execute on function public.apply_firm_role_to_employee(uuid, uuid) to authenticated;

-- Set individual permissions when member registers
create or replace function public.create_office_member_profile(
  auth_user_id uuid,
  office_code_input text,
  member_name text,
  member_email text,
  firm_role_slug_input text default 'lawyer'
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_firm_id uuid;
  new_employee_id uuid;
  v_firm_role_id uuid;
  v_role_slug text := lower(trim(coalesce(firm_role_slug_input, 'lawyer')));
  v_legacy_role public.employee_role_enum;
  v_role_permissions jsonb;
  normalized_code text := upper(trim(office_code_input));
  normalized_email text := lower(trim(member_email));
  normalized_name text := trim(member_name);
begin
  perform set_config('row_security', 'off', true);

  if char_length(normalized_name) < 2 then
    raise exception 'Member name must be at least 2 characters' using errcode = 'check_violation';
  end if;

  if normalized_code = '' or not is_valid_firm_code_format(normalized_code) then
    raise exception 'Invalid firm code format' using errcode = 'check_violation';
  end if;

  if v_role_slug = '' or v_role_slug = 'firm_owner' then
    raise exception 'Invalid role selection' using errcode = 'check_violation';
  end if;

  select g.id into target_firm_id
  from get_office_by_firm_code(normalized_code) g
  limit 1;

  if target_firm_id is null then
    raise exception 'Firm code does not exist: %', normalized_code using errcode = 'no_data_found';
  end if;

  select fr.id, fr.permissions into v_firm_role_id, v_role_permissions
  from public.firm_roles fr
  where fr.firm_id = target_firm_id
    and fr.slug = v_role_slug
    and fr.slug <> 'firm_owner'
  limit 1;

  if v_firm_role_id is null then
    raise exception 'Role not found for this office: %', v_role_slug using errcode = 'no_data_found';
  end if;

  if exists (
    select 1 from employees e
    where lower(e.email) = normalized_email and e.deleted_at is null
  ) then
    raise exception 'Email already registered as an employee' using errcode = 'unique_violation';
  end if;

  if exists (
    select 1 from profiles p
    where lower(p.email) = normalized_email and p.deleted_at is null
  ) then
    raise exception 'Email already registered' using errcode = 'unique_violation';
  end if;

  v_legacy_role := case
    when v_role_slug in ('lawyer', 'managing_lawyer') then 'lawyer'::public.employee_role_enum
    else 'assistant'::public.employee_role_enum
  end;

  insert into employees(auth_uid, firm_id, full_name, email, role, status, firm_role_id, individual_permissions)
  values (
    auth_user_id, target_firm_id, normalized_name, normalized_email, v_legacy_role,
    'pending_approval', v_firm_role_id, coalesce(v_role_permissions, '{}'::jsonb)
  )
  returning id into new_employee_id;

  insert into profiles(id, firm_id, employee_id, full_name, email, role)
  values (auth_user_id, target_firm_id, new_employee_id, normalized_name, normalized_email, v_legacy_role);

  return target_firm_id;
end;
$$;
