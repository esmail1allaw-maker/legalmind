-- 098: Enforce "each lawyer sees only the cases assigned to them"
--
-- Authoritative, idempotent re-assertion of the cases SELECT policy so the rule
-- holds regardless of prior migration drift:
--   • office admin / manager / owner  → all firm cases (active + soft-deleted)
--   • lawyer (role = 'lawyer' OR has a lawyers record) → ONLY cases whose
--     assigned_lawyer_id equals their own lawyers.id
--   • assistant / other non-lawyer staff → firm's active cases (unchanged;
--     they have no per-case assignment model)
--
-- NOTE: For a team member to be restricted, they must be a lawyer (role
-- "محامي" / a lawyers record). A member whose role resolves to firm_manager /
-- admin is an office admin and will still see everything by design.

drop policy if exists "cases_select" on public.cases;

create policy "cases_select" on public.cases
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

-- Keep UPDATE consistent: a lawyer may only edit cases assigned to them.
drop policy if exists "cases_update" on public.cases;

create policy "cases_update" on public.cases
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
