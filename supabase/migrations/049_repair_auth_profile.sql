-- Auto-repair orphaned auth users: link employees by email and create missing profiles

create or replace function public.repair_current_user_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_employee public.employees%rowtype;
  v_firm_id uuid;
  v_meta jsonb;
  v_profile_role public.profile_role_enum;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.profiles where id = v_uid and deleted_at is null) then
    return jsonb_build_object('ok', true, 'action', 'profile_exists');
  end if;

  update public.profiles
  set deleted_at = null,
      updated_at = now()
  where id = v_uid
    and deleted_at is not null;

  if exists (select 1 from public.profiles where id = v_uid and deleted_at is null) then
    return jsonb_build_object('ok', true, 'action', 'profile_restored');
  end if;

  select lower(trim(email)), coalesce(raw_user_meta_data, '{}'::jsonb)
  into v_email, v_meta
  from auth.users
  where id = v_uid;

  if v_email is null then
    raise exception 'auth_user_not_found';
  end if;

  v_full_name := coalesce(
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(trim(v_meta->>'owner_full_name'), ''),
    split_part(v_email, '@', 1)
  );

  select e.*
  into v_employee
  from public.employees e
  where e.deleted_at is null
    and (
      e.auth_uid = v_uid
      or (
        e.auth_uid is null
        and e.email is not null
        and lower(trim(e.email)) = v_email
      )
    )
  order by case when e.auth_uid = v_uid then 0 else 1 end, e.created_at desc
  limit 1;

  if found then
    if v_employee.auth_uid is distinct from v_uid then
      update public.employees
      set auth_uid = v_uid
      where id = v_employee.id;
    end if;

    v_profile_role := case v_employee.role::text
      when 'lawyer' then 'lawyer'::public.profile_role_enum
      when 'assistant' then 'assistant'::public.profile_role_enum
      else 'admin'::public.profile_role_enum
    end;

    insert into public.profiles (id, firm_id, employee_id, full_name, email, role, phone)
    values (
      v_uid,
      v_employee.firm_id,
      v_employee.id,
      coalesce(nullif(trim(v_employee.full_name), ''), v_full_name),
      coalesce(nullif(trim(v_employee.email), ''), v_email),
      v_profile_role,
      v_employee.phone
    )
    on conflict (id) do update
      set firm_id = excluded.firm_id,
          employee_id = excluded.employee_id,
          full_name = excluded.full_name,
          email = excluded.email,
          role = excluded.role,
          phone = excluded.phone,
          deleted_at = null,
          updated_at = now();

    return jsonb_build_object('ok', true, 'action', 'linked_employee', 'employee_id', v_employee.id);
  end if;

  select f.id
  into v_firm_id
  from public.firms f
  where f.deleted_at is null
    and lower(trim(coalesce(f.email, ''))) = v_email
  order by f.created_at desc
  limit 1;

  if v_firm_id is not null then
    insert into public.employees (auth_uid, firm_id, full_name, email, role, status)
    values (
      v_uid,
      v_firm_id,
      v_full_name,
      v_email,
      case
        when exists (select 1 from private.platform_operators po where po.auth_uid = v_uid)
          or exists (
            select 1 from public.employees ex
            where ex.firm_id = v_firm_id and ex.role = 'super_admin' and ex.deleted_at is null
          )
        then 'super_admin'::public.employee_role_enum
        else 'firm_manager'::public.employee_role_enum
      end,
      'active'
    )
    returning * into v_employee;

    insert into public.profiles (id, firm_id, employee_id, full_name, email, role)
    values (v_uid, v_firm_id, v_employee.id, v_full_name, v_email, 'admin'::public.profile_role_enum)
    on conflict (id) do update
      set firm_id = excluded.firm_id,
          employee_id = excluded.employee_id,
          deleted_at = null,
          updated_at = now();

    return jsonb_build_object('ok', true, 'action', 'created_from_firm_email', 'firm_id', v_firm_id);
  end if;

  if lower(coalesce(v_meta->>'registration_flow', '')) = 'office'
     or nullif(trim(coalesce(v_meta->>'office_name', v_meta->>'company', '')), '') is not null then
    perform public.create_office_admin_profile(
      v_uid,
      coalesce(nullif(trim(v_meta->>'office_name'), ''), nullif(trim(v_meta->>'company'), ''), 'مكتب محاماة'),
      v_full_name,
      v_email,
      nullif(trim(coalesce(v_meta->>'phone', '')), '')
    );
    return jsonb_build_object('ok', true, 'action', 'created_office_profile');
  end if;

  if exists (select 1 from private.platform_operators po where po.auth_uid = v_uid) then
    perform public.create_office_admin_profile(
      v_uid,
      'LegalMind Platform',
      v_full_name,
      v_email,
      null
    );

    update public.employees
    set role = 'super_admin'
    where auth_uid = v_uid
      and deleted_at is null;

    insert into private.platform_operators (auth_uid)
    values (v_uid)
    on conflict (auth_uid) do nothing;

    return jsonb_build_object('ok', true, 'action', 'created_platform_admin');
  end if;

  raise exception 'profile_repair_failed';
end;
$$;

revoke all on function public.repair_current_user_profile() from public;
grant execute on function public.repair_current_user_profile() to authenticated;

-- Ensure login can always read own employee row (even before profile exists)
drop policy if exists "employees_select_own_auth" on public.employees;
create policy "employees_select_own_auth" on public.employees
  for select
  using (auth_uid = (select auth.uid()) and deleted_at is null);
