-- 105: Lawyer sees only assigned cases + linked clients (surgical — no pre-auth changes)
--
-- Regression: migration 103 replaced clients_select with firm-wide visibility, undoing
-- the lawyer scoping from migration 002. Cases policy from 098 is re-asserted idempotently.
--
-- Rules (unchanged for everyone else):
--   • office admin / manager / owner  → all firm clients & cases
--   • assistant (non-lawyer)          → all firm active clients & cases
--   • lawyer                          → cases where assigned_lawyer_id = their lawyers.id
--                                     → clients linked to at least one such case
--
-- Does NOT touch: pre-auth RPCs, invitations, registration, firms, employees, billing.

-- ─── 1) Helper: can the current user see this client? ───────────────────────
create or replace function private.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select exists (
    select 1
    from public.clients cl
    where cl.id = target_client_id
      and cl.firm_id = private.get_current_firm_id()
      and cl.deleted_at is null
      and (
        private.is_office_admin()
        or (
          private.get_current_role() = 'assistant'
          and private.get_current_lawyer_id() is null
        )
        or (
          (
            private.get_current_role() = 'lawyer'
            or private.get_current_lawyer_id() is not null
          )
          and exists (
            select 1
            from public.cases c
            where c.client_id = cl.id
              and c.firm_id = cl.firm_id
              and c.deleted_at is null
              and c.assigned_lawyer_id is not null
              and c.assigned_lawyer_id = private.get_current_lawyer_id()
          )
        )
      )
  );
$$;

revoke all on function private.can_access_client(uuid) from public, anon;
grant execute on function private.can_access_client(uuid) to authenticated, service_role;

-- Re-align case gate with 098 (idempotent)
create or replace function private.can_access_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select exists (
    select 1
    from public.cases c
    where c.id = target_case_id
      and c.firm_id = private.get_current_firm_id()
      and c.deleted_at is null
      and (
        private.is_office_admin()
        or (
          (
            private.get_current_role() = 'lawyer'
            or private.get_current_lawyer_id() is not null
          )
          and c.assigned_lawyer_id is not null
          and c.assigned_lawyer_id = private.get_current_lawyer_id()
        )
        or (
          private.get_current_role() = 'assistant'
          and private.get_current_lawyer_id() is null
        )
      )
  );
$$;

revoke all on function private.can_access_case(uuid) from public, anon;
grant execute on function private.can_access_case(uuid) to authenticated, service_role;

-- ─── 2) clients SELECT — lawyer-scoped ───────────────────────────────────────
drop policy if exists "clients_select_role_scoped" on public.clients;
drop policy if exists "clients_select_firm" on public.clients;
drop policy if exists clients_select on public.clients;
drop policy if exists "clients_select" on public.clients;

create policy clients_select on public.clients
  for select
  to authenticated
  using (
    (select private.is_firm_subscription_active())
    and firm_id = (select private.get_current_firm_id())
    and deleted_at is null
    and (
      (select private.is_office_admin())
      or (
        (select private.get_current_role()) = 'assistant'
        and (select private.get_current_lawyer_id()) is null
      )
      or (
        (
          (select private.get_current_role()) = 'lawyer'
          or (select private.get_current_lawyer_id()) is not null
        )
        and exists (
          select 1
          from public.cases c
          where c.client_id = clients.id
            and c.firm_id = clients.firm_id
            and c.deleted_at is null
            and c.assigned_lawyer_id is not null
            and c.assigned_lawyer_id = (select private.get_current_lawyer_id())
        )
      )
    )
  );

-- ─── 3) cases SELECT / UPDATE — re-assert 098 (idempotent) ───────────────────
drop policy if exists "cases_select_role_scoped" on public.cases;
drop policy if exists cases_select on public.cases;
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

drop policy if exists "cases_update_role_scoped" on public.cases;
drop policy if exists cases_update on public.cases;
drop policy if exists "cases_update" on public.cases;

create policy cases_update on public.cases
  for update
  to authenticated
  using (
    (select private.is_firm_subscription_active())
    and firm_id = (select private.get_current_firm_id())
    and (
      (select private.is_office_admin())
      or (select private.has_permission('cases.edit'))
      or (
        (select private.get_current_role()) = 'assistant'
        and (select private.get_current_lawyer_id()) is null
        and deleted_at is null
      )
      or (
        (
          (select private.get_current_role()) = 'lawyer'
          or (select private.get_current_lawyer_id()) is not null
        )
        and deleted_at is null
        and assigned_lawyer_id is not null
        and assigned_lawyer_id = (select private.get_current_lawyer_id())
      )
    )
  )
  with check (
    (select private.is_firm_subscription_active())
    and firm_id = (select private.get_current_firm_id())
  );

notify pgrst, 'reload schema';
