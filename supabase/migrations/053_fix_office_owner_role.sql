-- Fix office owners misclassified as lawyers + use firm_manager for new office signups

create or replace function public.create_office_admin_profile(
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
  normalized_phone text := normalize_yemeni_phone_for_storage(owner_phone);
begin
  perform set_config('row_security', 'off', true);

  if char_length(normalized_name) < 2 then
    raise exception 'Owner name must be at least 2 characters'
      using errcode = 'check_violation';
  end if;

  if normalized_phone is not null
     and normalized_phone !~ '^(77|73|71|70)[0-9]{7}$' then
    raise exception 'Invalid Yemeni phone number'
      using errcode = 'check_violation';
  end if;

  insert into firms(
    name, owner_full_name, email, phone, plan,
    subscription_status, subscription_plan, subscription_expires_at, is_locked
  )
  values (
    trim(office_name), normalized_name, normalized_email, normalized_phone, 'free',
    'trial', 'trial', now() + interval '30 days', false
  )
  returning id into new_firm_id;

  insert into employees(auth_uid, firm_id, full_name, email, phone, role, status)
  values (auth_user_id, new_firm_id, normalized_name, normalized_email, normalized_phone, 'firm_manager', 'active')
  returning id into new_employee_id;

  insert into profiles(id, firm_id, employee_id, full_name, email, role, phone)
  values (auth_user_id, new_firm_id, new_employee_id, normalized_name, normalized_email, 'admin', normalized_phone);

  return new_firm_id;
end;
$$;

-- Existing office owners linked to firm email but marked as lawyer
update public.employees e
set role = 'firm_manager'::public.employee_role_enum, status = 'active'
from public.firms f
where e.firm_id = f.id
  and e.deleted_at is null
  and f.deleted_at is null
  and e.role::text = 'lawyer'
  and lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce(f.email, '')));

-- Legacy office admins stored as employees.role = admin
update public.employees e
set role = 'firm_manager'::public.employee_role_enum
where e.deleted_at is null
  and e.role::text = 'admin'
  and not exists (
    select 1 from public.lawyers l
    where l.employee_id = e.id
  );

-- Profiles wrongly set to lawyer while employee is office admin (text casts — safe for both enum types)
do $$
declare
  v_profiles_role_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
  into v_profiles_role_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'profiles'
    and a.attname = 'role'
    and a.attnum > 0
    and not a.attisdropped;

  if v_profiles_role_type = 'profile_role_enum' then
    update public.profiles p
    set role = 'admin'::public.profile_role_enum, updated_at = now()
    from public.employees e
    where p.employee_id = e.id
      and p.deleted_at is null
      and e.deleted_at is null
      and e.role::text in ('firm_manager', 'admin', 'super_admin')
      and p.role::text = 'lawyer';
  else
    update public.profiles p
    set role = 'firm_manager'::public.employee_role_enum, updated_at = now()
    from public.employees e
    where p.employee_id = e.id
      and p.deleted_at is null
      and e.deleted_at is null
      and e.role::text in ('firm_manager', 'admin', 'super_admin')
      and p.role::text = 'lawyer';
  end if;
end $$;

-- Sync auth_uid on employees when profile exists but link is missing
update public.employees e
set auth_uid = p.id, status = 'active'
from public.profiles p
where p.employee_id = e.id
  and p.deleted_at is null
  and e.deleted_at is null
  and (e.auth_uid is null or e.auth_uid is distinct from p.id);
