-- 103: Permanent fix — pre-auth 401s + Performance Advisor warnings
--
-- Root causes fixed:
--   1) Migration 102 wrapped pre-auth RPCs in private.*_svc but granted EXECUTE on
--      the svc only to authenticated — anon callers got 401 on get_office_by_code,
--      get_invitation_by_token, list_approved_testimonials, etc.
--   2) Performance Advisor: bare current_setting() in invitations/firm_roles RLS
--   3) Performance Advisor: duplicate permissive SELECT policies on audit_logs
--
-- Pattern: private *_svc (DEFINER + row_security off) + public INVOKER wrapper.
-- Grant EXECUTE on BOTH public wrapper AND private svc to anon + authenticated.

notify pgrst, 'reload schema';

-- ─── 1) firms_registration_public (INVOKER view — no Security Definer View lint) ─
create or replace view public.firms_registration_public
with (security_invoker = true) as
select
  f.id,
  f.name,
  f.firm_code::text as firm_code
from public.firms f
where f.deleted_at is null
  and f.firm_code is not null;

grant select on public.firms_registration_public to anon, authenticated;
grant select (id, name, firm_code) on public.firms to anon;

drop policy if exists firms_select_registration on public.firms;
create policy firms_select_registration on public.firms
  for select
  to anon
  using (deleted_at is null and firm_code is not null);

-- ─── 2) Pre-auth RPCs — DEFINER svc + INVOKER public wrapper ─────────────────

create or replace function private.get_office_by_firm_code_svc(firm_code_input text)
returns table(id uuid, name text, firm_code text)
language plpgsql
stable
security definer
set search_path = public, private, extensions
as $$
declare
  normalized text := public.normalize_firm_code(firm_code_input);
begin
  perform set_config('row_security', 'off', true);

  if not public.is_valid_firm_code_format(normalized) then
    return;
  end if;

  return query
    select f.id, f.name, f.firm_code::text
    from public.firms f
    where f.deleted_at is null
      and f.firm_code is not null
      and public.normalize_firm_code(f.firm_code::text) = normalized
    limit 1;
end;
$$;

create or replace function public.get_office_by_firm_code(firm_code_input text)
returns table(id uuid, name text, firm_code text)
language sql
stable
security invoker
set search_path = public, private, extensions
as $$
  select * from private.get_office_by_firm_code_svc(firm_code_input);
$$;

create or replace function private.get_office_by_code_svc(office_code_input text)
returns table(id uuid, name text, office_code text, firm_code text)
language sql
stable
security definer
set search_path = public, private, extensions
as $$
  select g.id, g.name, g.firm_code, g.firm_code
  from private.get_office_by_firm_code_svc(office_code_input) g;
$$;

create or replace function public.get_office_by_code(office_code_input text)
returns table(id uuid, name text, office_code text, firm_code text)
language sql
stable
security invoker
set search_path = public, private, extensions
as $$
  select * from private.get_office_by_code_svc(office_code_input);
$$;

create or replace function private.office_code_exists_svc(office_code_input text)
returns boolean
language sql
stable
security definer
set search_path = public, private, extensions
as $$
  select exists (
    select 1 from private.get_office_by_firm_code_svc(office_code_input)
  );
$$;

create or replace function public.office_code_exists(office_code_input text)
returns boolean
language sql
stable
security invoker
set search_path = public, private, extensions
as $$
  select private.office_code_exists_svc(office_code_input);
$$;

create or replace function private.get_firm_roles_for_registration_svc(office_code_input text)
returns table(slug text, name text)
language plpgsql
stable
security definer
set search_path = public, private, extensions
as $$
begin
  perform set_config('row_security', 'off', true);

  return query
    select fr.slug, fr.name
    from public.firm_roles fr
    join private.get_office_by_firm_code_svc(office_code_input) g on g.id = fr.firm_id
    where fr.is_template = true
      and fr.slug <> 'firm_owner'
    order by
      case fr.slug
        when 'managing_lawyer' then 1
        when 'lawyer' then 2
        when 'legal_assistant' then 3
        when 'secretary' then 4
        when 'accountant' then 5
        else 99
      end,
      fr.name;
end;
$$;

create or replace function public.get_firm_roles_for_registration(office_code_input text)
returns table(slug text, name text)
language sql
stable
security invoker
set search_path = public, private, extensions
as $$
  select * from private.get_firm_roles_for_registration_svc(office_code_input);
$$;

create or replace function private.get_invitation_by_token_svc(raw_token text)
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
language plpgsql
stable
security definer
set search_path = public, private, extensions
as $$
begin
  perform set_config('row_security', 'off', true);

  if coalesce(trim(raw_token), '') = '' then
    return;
  end if;

  return query
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
    left join public.firms f
      on f.id = i.firm_id
     and f.deleted_at is null
    left join public.firm_roles fr
      on fr.id = i.firm_role_id
    where i.token_hash = encode(extensions.digest(trim(raw_token), 'sha256'), 'hex')
      and i.status = 'pending'
      and i.expires_at > now()
    limit 1;
end;
$$;

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
security invoker
set search_path = public, private, extensions
as $$
  select * from private.get_invitation_by_token_svc(raw_token);
$$;

create or replace function private.list_approved_testimonials_svc(p_limit integer default 24)
returns table (
  id uuid,
  author_name text,
  author_role text,
  body text,
  stars integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    t.id,
    t.author_name,
    t.author_role,
    t.body,
    t.stars::integer,
    t.created_at
  from public.public_testimonials t
  where t.status = 'approved'
  order by t.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 50));
$$;

create or replace function public.list_approved_testimonials(p_limit integer default 24)
returns table (
  id uuid,
  author_name text,
  author_role text,
  body text,
  stars integer,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public, private
as $$
  select * from private.list_approved_testimonials_svc(p_limit);
$$;

-- ─── 3) Grants: anon MUST have EXECUTE on private svc (invoker delegates as caller) ─
do $$
declare
  grant_row record;
begin
  for grant_row in
    select *
    from (values
      ('private.get_office_by_firm_code_svc(text)', 'anon, authenticated, service_role'),
      ('private.get_office_by_code_svc(text)', 'anon, authenticated, service_role'),
      ('private.office_code_exists_svc(text)', 'anon, authenticated, service_role'),
      ('private.get_firm_roles_for_registration_svc(text)', 'anon, authenticated, service_role'),
      ('private.get_invitation_by_token_svc(text)', 'anon, authenticated, service_role'),
      ('private.list_approved_testimonials_svc(integer)', 'anon, authenticated, service_role'),
      ('public.normalize_firm_code(text)', 'anon, authenticated'),
      ('public.is_valid_firm_code_format(text)', 'anon, authenticated'),
      ('public.get_office_by_firm_code(text)', 'anon, authenticated'),
      ('public.get_office_by_code(text)', 'anon, authenticated'),
      ('public.office_code_exists(text)', 'anon, authenticated'),
      ('public.get_firm_roles_for_registration(text)', 'anon, authenticated'),
      ('public.get_invitation_by_token(text)', 'anon, authenticated'),
      ('public.list_approved_testimonials(integer)', 'anon, authenticated'),
      ('public.submit_public_testimonial(text, text, text, integer)', 'anon, authenticated'),
      ('public.log_security_event(text, text, jsonb, text)', 'anon, authenticated'),
      ('public.get_platform_bank_details()', 'anon, authenticated')
    ) as grants(function_signature, grantees)
  loop
    begin
      execute format('revoke all on function %s from public', grant_row.function_signature);
      execute format(
        'grant execute on function %s to %s',
        grant_row.function_signature,
        grant_row.grantees
      );
    exception
      when undefined_function then
        raise notice 'Skipped missing function: %', grant_row.function_signature;
    end;
  end loop;
end $$;

-- ─── 4) Performance Advisor — invitations RLS (wrap current_setting) ─────────
drop policy if exists invitations_select_authenticated on public.invitations;
drop policy if exists invitations_select_anon on public.invitations;
drop policy if exists invitations_anon_preview_by_token on public.invitations;
drop policy if exists "invitations_select" on public.invitations;

create policy invitations_select_authenticated on public.invitations
  for select
  to authenticated
  using (
    (
      firm_id = (select private.get_current_firm_id())
      and (select private.is_firm_manager())
    )
    or (
      status = 'pending'
      and expires_at > now()
      and token_hash = encode(
        extensions.digest(
          nullif(trim((select current_setting('app.invitation_token', true))), ''),
          'sha256'
        ),
        'hex'
      )
    )
  );

create policy invitations_select_anon on public.invitations
  for select
  to anon
  using (
    status = 'pending'
    and expires_at > now()
    and token_hash = encode(
      extensions.digest(
        nullif(trim((select current_setting('app.invitation_token', true))), ''),
        'sha256'
      ),
      'hex'
    )
  );

-- ─── 5) Performance Advisor — firm_roles RLS (wrap current_setting) ──────────
drop policy if exists firm_roles_select_authenticated on public.firm_roles;
drop policy if exists firm_roles_select_anon on public.firm_roles;
drop policy if exists firm_roles_anon_registration_read on public.firm_roles;
drop policy if exists firm_roles_invitation_preview on public.firm_roles;
drop policy if exists "firm_roles_select" on public.firm_roles;

create policy firm_roles_select_authenticated on public.firm_roles
  for select
  to authenticated
  using (
    firm_id = (select private.get_current_firm_id())
    or (
      is_template = true
      and slug <> 'firm_owner'
      and exists (
        select 1 from public.firms_registration_public f
        where f.id = firm_roles.firm_id
      )
    )
    or exists (
      select 1
      from public.invitations i
      where i.firm_role_id = firm_roles.id
        and i.status = 'pending'
        and i.expires_at > now()
        and i.token_hash = encode(
          extensions.digest(
            nullif(trim((select current_setting('app.invitation_token', true))), ''),
            'sha256'
          ),
          'hex'
        )
    )
  );

create policy firm_roles_select_anon on public.firm_roles
  for select
  to anon
  using (
    (
      is_template = true
      and slug <> 'firm_owner'
      and exists (
        select 1 from public.firms_registration_public f
        where f.id = firm_roles.firm_id
      )
    )
    or exists (
      select 1
      from public.invitations i
      where i.firm_role_id = firm_roles.id
        and i.status = 'pending'
        and i.expires_at > now()
        and i.token_hash = encode(
          extensions.digest(
            nullif(trim((select current_setting('app.invitation_token', true))), ''),
            'sha256'
          ),
          'hex'
        )
    )
  );

-- ─── 6) Performance Advisor — audit_logs (single permissive SELECT) ──────────
drop policy if exists "audit_logs_select" on public.audit_logs;
drop policy if exists "audit_logs_select_admin" on public.audit_logs;

create policy audit_logs_select on public.audit_logs
  for select
  to authenticated
  using (
    (select private.is_office_admin())
    and changed_by is not null
    and exists (
      select 1
      from public.employees e
      where e.id = audit_logs.changed_by
        and e.firm_id = (select private.get_current_firm_id())
        and e.deleted_at is null
    )
  );

-- ─── 7) Performance Advisor — clients / error_logs / cases (clean policies) ──
drop policy if exists "clients_select_firm" on public.clients;
drop policy if exists "clients_select" on public.clients;

create policy clients_select on public.clients
  for select
  to authenticated
  using (
    (select private.is_firm_subscription_active())
    and firm_id = (select private.get_current_firm_id())
    and deleted_at is null
  );

drop policy if exists "error_logs_insert" on public.error_logs;
drop policy if exists "error_logs_select_admin" on public.error_logs;
drop policy if exists "error_logs_select" on public.error_logs;

create policy error_logs_select on public.error_logs
  for select
  to authenticated
  using ((select private.is_office_admin()));

-- cases: re-assert 098 (all helpers already in SELECT subqueries)
drop policy if exists "cases_select_role_scoped" on public.cases;
drop policy if exists "cases_select" on public.cases;

create policy cases_select on public.cases
  for select
  to authenticated
  using (
    (select private.is_firm_subscription_active())
    and firm_id = (select private.get_current_firm_id())
    and (
      (
        deleted_at is null
        and (
          (select private.is_office_admin())
          or (
            (
              (select private.get_current_role()) = 'lawyer'
              or (select private.get_current_lawyer_id()) is not null
            )
            and assigned_lawyer_id is not null
            and assigned_lawyer_id = (select private.get_current_lawyer_id())
          )
          or (
            (select private.get_current_role()) = 'assistant'
            and (select private.get_current_lawyer_id()) is null
          )
        )
      )
      or (
        deleted_at is not null
        and (select private.is_office_admin())
      )
    )
  );

notify pgrst, 'reload schema';
