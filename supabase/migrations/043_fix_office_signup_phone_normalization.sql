-- Fix office signup failing on mobile when phone includes spaces, +967, or dashes.
-- employees.phone requires ^[0-9]{9,15}$ while firms.phone allowed formatted input.

create or replace function public.normalize_yemeni_phone_for_storage(raw_phone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  digits text;
begin
  digits := regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g');
  if digits like '967%' and char_length(digits) > 9 then
    digits := substring(digits from 4);
  end if;
  if digits like '0%' and char_length(digits) > 9 then
    digits := substring(digits from 2);
  end if;
  return nullif(digits, '');
end;
$$;

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
  values (auth_user_id, new_firm_id, normalized_name, normalized_email, normalized_phone, 'admin', 'active')
  returning id into new_employee_id;

  insert into profiles(id, firm_id, employee_id, full_name, email, role, phone)
  values (auth_user_id, new_firm_id, new_employee_id, normalized_name, normalized_email, 'admin', normalized_phone);

  return new_firm_id;
end;
$$;

revoke all on function public.normalize_yemeni_phone_for_storage(text) from public;
grant execute on function public.normalize_yemeni_phone_for_storage(text) to service_role;
