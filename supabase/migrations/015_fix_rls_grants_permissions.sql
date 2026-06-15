-- LegalMind Yemen — Fix RLS, function EXECUTE grants, and permission errors (403/42501/400)
-- Run after 001–014. Idempotent: safe to re-run.
--
-- Fixes:
--   • permission denied for get_current_firm_id() and other RLS helpers (009 revoked EXECUTE)
--   • 403 on firms / profiles / employees / invitations
--   • Broken role resolution when profiles.employee_id is NULL
--   • Missing profiles_update_own policy
--   • accept_invitation_for_auth_user not creating profiles row

-- ─── 1) Harden tenant / role helpers ─────────────────────────────────────────

create or replace function get_current_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select firm_id from profiles where id = auth.uid() and deleted_at is null limit 1),
    (select firm_id from employees where auth_uid = auth.uid() and deleted_at is null limit 1)
  );
$$;

create or replace function get_current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select employee_id from profiles where id = auth.uid() and deleted_at is null limit 1),
    (select id from employees where auth_uid = auth.uid() and deleted_at is null limit 1)
  );
$$;

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

create or replace function get_current_role()
returns employee_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select e.role
      from profiles p
      join employees e on e.id = p.employee_id and e.deleted_at is null
      where p.id = auth.uid() and p.deleted_at is null
      limit 1
    ),
    (
      select e.role
      from employees e
      where e.auth_uid = auth.uid() and e.deleted_at is null
      limit 1
    )
  );
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

create or replace function is_office_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(get_current_role() in ('super_admin','admin','firm_manager'), false);
$$;

create or replace function is_firm_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(is_office_profile_admin() or is_office_admin(), false);
$$;

-- ─── 2) Data repair: link profiles ↔ employees ────────────────────────────────

update profiles p
set employee_id = e.id
from employees e
where e.auth_uid = p.id
  and e.deleted_at is null
  and p.employee_id is null;

update profiles p
set firm_id = e.firm_id
from employees e
where e.auth_uid = p.id
  and e.deleted_at is null
  and p.firm_id is distinct from e.firm_id;

-- ─── 3) RLS policies (firms, profiles, employees, invitations) ────────────────

alter table firms enable row level security;
alter table profiles enable row level security;
alter table employees enable row level security;
alter table invitations enable row level security;

-- firms
drop policy if exists "firms_select_own" on firms;
drop policy if exists "firms_select_member" on firms;
create policy "firms_select_member" on firms for select
  using (
    id in (
      select firm_id from profiles where id = auth.uid() and deleted_at is null
      union
      select firm_id from employees where auth_uid = auth.uid() and deleted_at is null
    )
  );

drop policy if exists "firms_update_admin" on firms;
create policy "firms_update_admin" on firms for update
  using (id = get_current_firm_id() and is_firm_manager())
  with check (id = get_current_firm_id() and is_firm_manager());

-- profiles
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select
  using (id = auth.uid() and deleted_at is null);

drop policy if exists "profiles_select_firm" on profiles;
create policy "profiles_select_firm" on profiles for select
  using (firm_id = get_current_firm_id() and deleted_at is null);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid() and deleted_at is null)
  with check (id = auth.uid() and deleted_at is null);

drop policy if exists "profiles_update_admin_firm" on profiles;
create policy "profiles_update_admin_firm" on profiles for update
  using (firm_id = get_current_firm_id() and is_firm_manager())
  with check (firm_id = get_current_firm_id() and is_firm_manager());

-- employees
drop policy if exists "employees_select_own" on employees;
create policy "employees_select_own" on employees for select
  using (auth_uid = auth.uid() and deleted_at is null);

drop policy if exists "employees_select_office" on employees;
create policy "employees_select_office" on employees for select
  using (firm_id = get_current_firm_id() and deleted_at is null);

drop policy if exists "employees_insert_own" on employees;
create policy "employees_insert_own" on employees for insert
  with check (auth_uid = auth.uid());

drop policy if exists "employees_insert_admin" on employees;
create policy "employees_insert_admin" on employees for insert
  with check (firm_id = get_current_firm_id() and is_firm_manager());

drop policy if exists "employees_update_admin" on employees;
create policy "employees_update_admin" on employees for update
  using (firm_id = get_current_firm_id() and is_firm_manager())
  with check (firm_id = get_current_firm_id() and is_firm_manager());

drop policy if exists "employees_delete_admin" on employees;
create policy "employees_delete_admin" on employees for delete
  using (firm_id = get_current_firm_id() and get_current_role() in ('super_admin','admin','firm_manager'));

-- invitations (admins via profile OR employee role)
drop policy if exists "invitations_select_firm_admin" on invitations;
create policy "invitations_select_firm_admin" on invitations for select
  using (firm_id = get_current_firm_id() and is_firm_manager());

drop policy if exists "invitations_insert_firm_admin" on invitations;
create policy "invitations_insert_firm_admin" on invitations for insert
  with check (firm_id = get_current_firm_id() and is_firm_manager());

drop policy if exists "invitations_update_firm_admin" on invitations;
create policy "invitations_update_firm_admin" on invitations for update
  using (firm_id = get_current_firm_id() and is_firm_manager())
  with check (firm_id = get_current_firm_id() and is_firm_manager());

-- lawyers self-insert during signup (014)
drop policy if exists "lawyers_insert_self" on lawyers;
create policy "lawyers_insert_self" on lawyers for insert
  with check (
    exists (
      select 1 from employees e
      where e.id = employee_id
        and e.auth_uid = auth.uid()
        and e.deleted_at is null
    )
  );

-- ─── 4) Invitation RPC: accept flow creates profile ───────────────────────────

create or replace function accept_invitation_for_auth_user(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invitations%rowtype;
  target_employee_id uuid;
  auth_email text;
  profile_role profile_role_enum;
begin
  auth_email := lower(coalesce((select email from auth.users where id = auth.uid()), ''));
  if auth_email = '' then
    raise exception 'Authenticated user is required';
  end if;

  select * into inv
  from invitations
  where token_hash = invitation_hash(raw_token)
  for update;

  if not found or inv.status <> 'pending' or inv.expires_at <= now() then
    raise exception 'Invitation is invalid or expired';
  end if;

  if lower(inv.email) <> auth_email then
    raise exception 'Invitation email does not match current user';
  end if;

  select id into target_employee_id
  from employees
  where lower(email) = lower(inv.email)
    and firm_id = inv.firm_id
    and deleted_at is null
  limit 1;

  if target_employee_id is null then
    insert into employees (auth_uid, firm_id, full_name, email, phone, role, status)
    values (
      auth.uid(),
      inv.firm_id,
      coalesce(inv.full_name, split_part(inv.email, '@', 1)),
      inv.email,
      inv.phone,
      inv.role,
      'active'
    )
    returning id into target_employee_id;
  else
    update employees
    set auth_uid = auth.uid(),
        full_name = coalesce(inv.full_name, full_name),
        phone = coalesce(inv.phone, phone),
        role = inv.role,
        status = 'active',
        deleted_at = null
    where id = target_employee_id;
  end if;

  profile_role := case inv.role::text
    when 'admin' then 'admin'::profile_role_enum
    when 'lawyer' then 'lawyer'::profile_role_enum
    when 'firm_manager' then 'admin'::profile_role_enum
    when 'super_admin' then 'admin'::profile_role_enum
    else 'assistant'::profile_role_enum
  end;

  insert into profiles (id, firm_id, employee_id, full_name, email, role)
  values (
    auth.uid(),
    inv.firm_id,
    target_employee_id,
    coalesce(inv.full_name, split_part(inv.email, '@', 1)),
    inv.email,
    profile_role
  )
  on conflict (id) do update
    set firm_id = excluded.firm_id,
        employee_id = excluded.employee_id,
        full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role,
        deleted_at = null;

  update invitations
  set status = 'accepted',
      accepted_at = now(),
      employee_id = target_employee_id
  where id = inv.id;

  return target_employee_id;
end;
$$;

-- Align create_office_invitation admin check with is_firm_manager()
create or replace function create_office_invitation(
  invite_email text,
  invite_role text,
  app_origin text default null
)
returns table (
  id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  invite_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text;
  hashed_token text;
  new_invitation invitations%rowtype;
  base_url text;
begin
  perform expire_old_invitations();

  if not is_firm_manager() then
    raise exception 'Only firm admins can create invitations';
  end if;

  if invite_role not in ('lawyer','assistant') then
    raise exception 'Invalid invitation role';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  hashed_token := invitation_hash(raw_token);
  base_url := coalesce(nullif(trim(app_origin), ''), 'https://app.com');

  insert into invitations (
    firm_id,
    email,
    role,
    status,
    token_hash,
    invited_by,
    expires_at,
    invite_url
  )
  values (
    get_current_firm_id(),
    lower(trim(invite_email)),
    invite_role::employee_role_enum,
    'pending',
    hashed_token,
    get_current_employee_id(),
    now() + interval '7 days',
    base_url || '/invite/' || raw_token
  )
  returning * into new_invitation;

  return query
  select new_invitation.id, new_invitation.email, new_invitation.role::text,
         new_invitation.status, new_invitation.expires_at, new_invitation.invite_url;
end;
$$;

create or replace function cancel_office_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_firm_manager() then
    raise exception 'Only firm admins can cancel invitations';
  end if;

  update invitations
  set status = 'cancelled',
      cancelled_at = now()
  where id = invitation_id
    and firm_id = get_current_firm_id()
    and status in ('pending','expired');
end;
$$;

create or replace function resend_office_invitation(
  invitation_id uuid,
  app_origin text default null
)
returns table (
  id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  invite_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invitations%rowtype;
  raw_token text;
  base_url text;
begin
  perform expire_old_invitations();

  if not is_firm_manager() then
    raise exception 'Only firm admins can resend invitations';
  end if;

  select * into inv from invitations where invitations.id = invitation_id for update;
  if not found or inv.firm_id <> get_current_firm_id() then
    raise exception 'Invitation not found';
  end if;

  if inv.status = 'accepted' then
    raise exception 'Accepted invitations cannot be resent';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  base_url := coalesce(nullif(trim(app_origin), ''), 'https://app.com');

  update invitations
  set status = 'pending',
      token_hash = invitation_hash(raw_token),
      expires_at = now() + interval '7 days',
      resent_at = now(),
      cancelled_at = null,
      invite_url = base_url || '/invite/' || raw_token
  where invitations.id = invitation_id
  returning * into inv;

  return query
  select inv.id, inv.email, inv.role::text, inv.status, inv.expires_at, inv.invite_url;
end;
$$;

-- ─── 5) GRANT EXECUTE — RLS helpers (required after 009 revoke) ───────────────

do $$
declare
  fn record;
begin
  for fn in
    select *
    from (values
      ('public.get_current_firm_id()'),
      ('public.get_current_employee_id()'),
      ('public.get_current_role()'),
      ('public.get_current_profile_role()'),
      ('public.get_current_office_id()'),
      ('public.is_office_profile_admin()'),
      ('public.is_office_admin()'),
      ('public.is_firm_manager()'),
      ('public.is_current_user_office_admin()'),
      ('public.get_current_lawyer_id()'),
      ('public.can_access_case(uuid)'),
      ('public.insert_audit_log()'),
      ('public.update_client_cases_count()'),
      ('public.get_current_profile_context()'),
      ('public.accept_invitation_for_auth_user(text)'),
      ('public.create_office_invitation(text, text, text)'),
      ('public.cancel_office_invitation(uuid)'),
      ('public.resend_office_invitation(uuid, text)'),
      ('public.get_invitation_by_token(text)'),
      ('public.get_office_by_code(text)'),
      ('public.get_office_by_firm_code(text)'),
      ('public.office_code_exists(text)'),
      ('public.sync_pull_table(text, text)'),
      ('public.sync_apply_event(text, text, uuid, uuid, text, jsonb)')
    ) as t(signature)
  loop
    begin
      execute format('grant execute on function %s to authenticated', fn.signature);
    exception
      when undefined_function then
        raise notice 'Skipped missing function: %', fn.signature;
    end;
  end loop;
end $$;

-- Public registration RPCs (anon)
do $$
declare
  fn record;
begin
  for fn in
    select *
    from (values
      ('public.get_office_by_code(text)'),
      ('public.get_office_by_firm_code(text)'),
      ('public.office_code_exists(text)'),
      ('public.get_invitation_by_token(text)')
    ) as t(signature)
  loop
    begin
      execute format('grant execute on function %s to anon', fn.signature);
    exception
      when undefined_function then
        raise notice 'Skipped missing function: %', fn.signature;
    end;
  end loop;
end $$;

-- Table privileges (Supabase default; re-apply if missing)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
