-- Public invitation preview (anon-safe) + provision invited users with firm role permissions

drop function if exists public.get_invitation_by_token(text);

create or replace function public.get_invitation_by_token(raw_token text)
returns table (
  id uuid,
  firm_id uuid,
  office_name text,
  email text,
  full_name text,
  phone text,
  role text,
  role_name text,
  role_slug text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    i.id,
    i.firm_id,
    f.name as office_name,
    i.email,
    i.full_name,
    i.phone,
    i.role::text,
    coalesce(fr.name, i.role::text) as role_name,
    fr.slug as role_slug,
    i.status,
    i.expires_at
  from public.invitations i
  join public.firms f on f.id = i.firm_id
  left join public.firm_roles fr on fr.id = i.firm_role_id
  where i.token_hash = public.invitation_hash(raw_token)
    and i.status = 'pending'
    and i.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_invitation_by_token(text) from public;
grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

create or replace function public.create_invited_profile(
  auth_user_id uuid,
  raw_token     text,
  invited_name  text,
  invited_email text
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  inv             public.invitations%rowtype;
  target_firm     public.firms%rowtype;
  new_employee_id uuid;
  final_name      text;
  final_phone     text;
  v_role_slug     text;
  v_role_permissions jsonb;
begin
  perform public.expire_old_invitations();

  select * into inv
  from public.invitations
  where token_hash = public.invitation_hash(raw_token)
  for update;

  if not found or inv.status <> 'pending' or inv.expires_at <= now() then
    raise exception 'Invitation is invalid or expired'
      using errcode = 'invalid_parameter_value';
  end if;

  if lower(inv.email) <> lower(invited_email) then
    raise exception 'Invitation email does not match'
      using errcode = 'invalid_parameter_value';
  end if;

  select * into target_firm
  from public.firms
  where id = inv.firm_id
    and deleted_at is null;

  if not found then
    raise exception 'Firm not found'
      using errcode = 'invalid_parameter_value';
  end if;

  if inv.firm_role_id is not null then
    select fr.slug, fr.permissions
    into v_role_slug, v_role_permissions
    from public.firm_roles fr
    where fr.id = inv.firm_role_id;
  end if;

  final_name := coalesce(
    nullif(trim(invited_name), ''),
    nullif(trim(inv.full_name), ''),
    split_part(inv.email, '@', 1)
  );
  final_phone := coalesce(nullif(trim(inv.phone), ''), null);

  insert into public.employees(
    auth_uid, firm_id, full_name, email, phone, role, status, firm_role_id, individual_permissions
  )
  values (
    auth_user_id,
    target_firm.id,
    final_name,
    inv.email,
    final_phone,
    inv.role,
    'active',
    inv.firm_role_id,
    coalesce(v_role_permissions, '{}'::jsonb)
  )
  returning id into new_employee_id;

  insert into public.profiles(id, firm_id, employee_id, full_name, email, phone, role)
  values (
    auth_user_id,
    inv.firm_id,
    new_employee_id,
    final_name,
    inv.email,
    final_phone,
    case inv.role::text
      when 'admin' then 'admin'::public.profile_role_enum
      when 'lawyer' then 'lawyer'::public.profile_role_enum
      when 'firm_manager' then 'admin'::public.profile_role_enum
      else 'assistant'::public.profile_role_enum
    end
  )
  on conflict (id) do update
    set firm_id = excluded.firm_id,
        employee_id = excluded.employee_id,
        full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        role = excluded.role,
        deleted_at = null;

  if inv.role = 'lawyer'
     or coalesce(v_role_slug, '') in ('lawyer', 'managing_lawyer') then
    insert into public.lawyers(employee_id)
    values (new_employee_id)
    on conflict (employee_id) do nothing;
  end if;

  update public.invitations
  set status = 'accepted',
      accepted_at = now(),
      employee_id = new_employee_id
  where id = inv.id;

  return inv.firm_id;
end;
$$;

revoke all on function public.create_invited_profile(uuid, text, text, text) from public;
grant execute on function public.create_invited_profile(uuid, text, text, text) to authenticated;
