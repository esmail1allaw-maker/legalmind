-- LegalMind Yemen - backend stability helper RPCs
-- Idempotent helpers for profile/firm context checks.
-- Requires: profiles (004), firm_code column (004 or 007).

alter table firms add column if not exists firm_code text;
alter table firms add column if not exists deleted_at timestamptz;

-- Profile helpers (idempotent if 004/005/008 already ran)
do $$ begin
  create type profile_role_enum as enum ('admin','lawyer','assistant');
exception when duplicate_object then null; end $$;

create or replace function get_current_profile_role()
returns text as $$
  select case role::text
    when 'firm_manager' then 'admin'
    when 'super_admin' then 'admin'
    else role::text
  end
  from profiles
  where id = auth.uid() and deleted_at is null
  limit 1;
$$ language sql stable security definer;

create or replace function is_office_profile_admin()
returns boolean as $$
  select coalesce(get_current_profile_role() = 'admin', false);
$$ language sql stable security definer;

drop function if exists get_current_profile_context();
create function get_current_profile_context()
returns table (
  profile_id uuid,
  firm_id uuid,
  employee_id uuid,
  full_name text,
  email text,
  role text,
  firm_name text,
  firm_code text
) as $$
begin
  return query
  select
    p.id,
    p.firm_id,
    p.employee_id,
    p.full_name,
    p.email,
    p.role::text,
    f.name,
    f.firm_code
  from profiles p
  join firms f on f.id = p.firm_id
  where p.id = auth.uid()
    and p.deleted_at is null
    and f.deleted_at is null
  limit 1;
end;
$$ language plpgsql stable security definer;

create or replace function is_current_user_office_admin()
returns boolean as $$
  select coalesce(is_office_profile_admin(), false);
$$ language sql stable security definer;

create or replace function office_code_exists(office_code_input text)
returns boolean as $$
  select exists (
    select 1
    from firms f
    where upper(f.firm_code) = upper(trim(office_code_input))
      and f.deleted_at is null
  );
$$ language sql stable security definer;

grant execute on function get_current_profile_context() to authenticated;
grant execute on function is_current_user_office_admin() to authenticated;
grant execute on function office_code_exists(text) to anon, authenticated;
