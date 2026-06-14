-- Repair missing user profiles after auth sign-up (fixes login "profile incomplete")

do $$ begin
  create type profile_role_enum as enum ('admin','lawyer','assistant');
exception when duplicate_object then null; end $$;

alter table employees add column if not exists auth_uid uuid references auth.users(id) on delete cascade;
alter table employees add column if not exists email text;
alter table employees add column if not exists deleted_at timestamptz;

-- Link employees to auth.users by email when auth_uid is missing
update employees e
set auth_uid = u.id
from auth.users u
where e.auth_uid is null
  and e.email is not null
  and lower(trim(e.email)) = lower(trim(u.email));

create unique index if not exists employees_auth_uid_unique_idx on employees(auth_uid);

-- Create missing profiles from linked employees
insert into profiles (id, firm_id, employee_id, full_name, email, role)
select
  u.id,
  e.firm_id,
  e.id,
  coalesce(nullif(trim(e.full_name), ''), u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(nullif(trim(e.email), ''), u.email),
  case e.role::text
    when 'admin' then 'admin'::profile_role_enum
    when 'lawyer' then 'lawyer'::profile_role_enum
    when 'firm_manager' then 'admin'::profile_role_enum
    when 'super_admin' then 'admin'::profile_role_enum
    else 'assistant'::profile_role_enum
  end
from auth.users u
join employees e on e.auth_uid = u.id and e.deleted_at is null
where e.firm_id is not null
  and not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Create profiles for auth users with metadata but no employee row (office registration)
insert into profiles (id, firm_id, full_name, email, role)
select
  u.id,
  f.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  'admin'::profile_role_enum
from auth.users u
join firms f on lower(trim(coalesce(f.email, ''))) = lower(trim(u.email))
where not exists (select 1 from profiles p where p.id = u.id)
  and not exists (select 1 from employees e where e.auth_uid = u.id)
on conflict (id) do nothing;

-- RLS: allow reading own profile and own employee row (required for login)
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select
  using (id = auth.uid() and deleted_at is null);

drop policy if exists "employees_select_own" on employees;
create policy "employees_select_own" on employees for select
  using (auth_uid = auth.uid() and deleted_at is null);

-- Allow reading own firm row (for firms join in profile query)
drop policy if exists "firms_select_member" on firms;
create policy "firms_select_member" on firms for select
  using (
    id in (
      select firm_id from profiles where id = auth.uid() and deleted_at is null
      union
      select firm_id from employees where auth_uid = auth.uid() and deleted_at is null
    )
  );

-- Ensure auth trigger exists for new sign-ups (requires handle_new_user from 004)
do $$ begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function handle_new_user();
  end if;
end $$;
