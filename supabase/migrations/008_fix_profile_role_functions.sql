-- Fix get_current_profile_role return type mismatch when profiles.role uses employee_role_enum
-- Drops RLS policies first because they depend on is_office_profile_admin().

drop policy if exists "invitations_select_firm_admin" on invitations;
drop policy if exists "invitations_insert_firm_admin" on invitations;
drop policy if exists "invitations_update_firm_admin" on invitations;
drop policy if exists "firms_update_admin" on firms;
drop policy if exists "profiles_update_admin_firm" on profiles;

drop function if exists is_office_profile_admin();
drop function if exists get_current_profile_role();

create or replace function get_current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case role::text
    when 'firm_manager' then 'admin'
    when 'super_admin' then 'admin'
    else role::text
  end
  from profiles
  where id = auth.uid() and deleted_at is null
  limit 1;
$$;

create or replace function is_office_profile_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(get_current_profile_role() = 'admin', false);
$$;

create policy "firms_update_admin" on firms for update
  using (id = get_current_firm_id() and is_office_profile_admin())
  with check (id = get_current_firm_id() and is_office_profile_admin());

create policy "profiles_update_admin_firm" on profiles for update
  using (firm_id = get_current_firm_id() and is_office_profile_admin())
  with check (firm_id = get_current_firm_id() and is_office_profile_admin());

create policy "invitations_select_firm_admin" on invitations for select
  using (firm_id = get_current_firm_id() and is_office_profile_admin());

create policy "invitations_insert_firm_admin" on invitations for insert
  with check (firm_id = get_current_firm_id() and is_office_profile_admin());

create policy "invitations_update_firm_admin" on invitations for update
  using (firm_id = get_current_firm_id() and is_office_profile_admin())
  with check (firm_id = get_current_firm_id() and is_office_profile_admin());
