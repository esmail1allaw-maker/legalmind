-- Login + billing hardening: employee role in profile context, batch orphan repair helper

create or replace function public.get_current_profile_context()
returns table (
  profile_id uuid,
  firm_id uuid,
  employee_id uuid,
  full_name text,
  email text,
  role text,
  firm_name text,
  firm_code text
)
language plpgsql
stable
security invoker
set search_path = public, private
as $$
begin
  return query
  select
    p.id,
    p.firm_id,
    p.employee_id,
    p.full_name,
    p.email,
    coalesce(e.role::text, p.role::text) as role,
    f.name,
    f.firm_code::text
  from public.profiles p
  left join public.employees e
    on e.id = p.employee_id
   and e.deleted_at is null
  left join public.firms f on f.id = p.firm_id
  where p.id = (select auth.uid())
    and p.deleted_at is null;
end;
$$;

revoke all on function public.get_current_profile_context() from public;
grant execute on function public.get_current_profile_context() to authenticated;

-- One-time helper (run from SQL Editor if needed): repair all auth users missing profiles
create or replace function public.repair_all_orphan_auth_profiles()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  v_user record;
  v_fixed int := 0;
  v_failed int := 0;
begin
  for v_user in
    select u.id
    from auth.users u
    where not exists (
      select 1 from public.profiles p
      where p.id = u.id and p.deleted_at is null
    )
  loop
    begin
      perform set_config('request.jwt.claim.sub', v_user.id::text, true);
      perform set_config('request.jwt.claim.role', 'authenticated', true);
      perform public.repair_current_user_profile();
      v_fixed := v_fixed + 1;
    exception when others then
      v_failed := v_failed + 1;
    end;
  end loop;

  return jsonb_build_object('fixed', v_fixed, 'failed', v_failed);
end;
$$;

revoke all on function public.repair_all_orphan_auth_profiles() from public;
grant execute on function public.repair_all_orphan_auth_profiles() to service_role;
