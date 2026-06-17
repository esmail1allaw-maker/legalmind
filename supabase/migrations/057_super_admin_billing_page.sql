-- Super-admin billing page: bootstrap platform owner + page access helper

insert into private.platform_operators (auth_uid)
select u.id
from auth.users u
where lower(trim(u.email)) = 'legalmind.yemen@gmail.com'
on conflict (auth_uid) do nothing;

update public.employees e
set role = 'super_admin'::public.employee_role_enum,
    status = 'active',
    updated_at = now()
from auth.users u
where e.deleted_at is null
  and e.auth_uid = u.id
  and lower(trim(u.email)) = 'legalmind.yemen@gmail.com';

-- Ensure profile exists for platform owner
do $$
declare
  v_uid uuid;
  v_employee public.employees%rowtype;
  v_email text := 'legalmind.yemen@gmail.com';
begin
  select u.id into v_uid from auth.users u where lower(trim(u.email)) = v_email limit 1;
  if v_uid is null then
    return;
  end if;

  select e.* into v_employee
  from public.employees e
  where e.deleted_at is null
    and (e.auth_uid = v_uid or lower(trim(coalesce(e.email, ''))) = v_email)
  order by case when e.auth_uid = v_uid then 0 else 1 end
  limit 1;

  if not found then
    return;
  end if;

  if v_employee.auth_uid is distinct from v_uid then
    update public.employees set auth_uid = v_uid where id = v_employee.id;
    select * into v_employee from public.employees where id = v_employee.id;
  end if;

  perform private.upsert_profile_for_employee(
    v_uid,
    v_employee,
    v_email,
    coalesce(nullif(trim(v_employee.full_name), ''), 'LegalMind Admin')
  );
end $$;

create or replace function public.can_access_super_admin_billing()
returns boolean
language sql
stable
security definer
set search_path = private, public, auth
as $$
  select coalesce(
    (select private.is_billing_admin()),
    false
  );
$$;

revoke all on function public.can_access_super_admin_billing() from public;
grant execute on function public.can_access_super_admin_billing() to authenticated;
