-- LegalMind Yemen — Supabase linter security hardening
-- Fixes: function_search_path_mutable, anon/authenticated SECURITY DEFINER RPC exposure
-- Idempotent: skips GRANT for functions not yet created (run 004/007 first if missing).

-- ─── 1) Pin search_path on all public functions ───────────────────────────────
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
  loop
    execute format('alter function %s set search_path = public', fn.signature);
  end loop;
end $$;

-- ─── 2) Revoke default PUBLIC execute on all public functions ─────────────────
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public', fn.signature);
    execute format('revoke all on function %s from anon', fn.signature);
    execute format('revoke all on function %s from authenticated', fn.signature);
  end loop;
end $$;

-- ─── 3) Grant RPC access only for functions that exist ────────────────────────
do $$
declare
  grant_row record;
begin
  for grant_row in
    select *
    from (values
      ('public.office_code_exists(text)', 'anon, authenticated'),
      ('public.get_office_by_code(text)', 'anon, authenticated'),
      ('public.get_office_by_firm_code(text)', 'anon, authenticated'),
      ('public.get_invitation_by_token(text)', 'anon, authenticated'),
      ('public.get_current_profile_context()', 'authenticated'),
      ('public.is_current_user_office_admin()', 'authenticated'),
      ('public.accept_invitation_for_auth_user(text)', 'authenticated'),
      ('public.create_office_invitation(text, text, text)', 'authenticated'),
      ('public.cancel_office_invitation(uuid)', 'authenticated'),
      ('public.resend_office_invitation(uuid, text)', 'authenticated'),
      ('public.sync_pull_table(text, text)', 'authenticated'),
      ('public.sync_apply_event(text, text, uuid, uuid, text, jsonb)', 'authenticated')
    ) as grants(function_signature, grantees)
  loop
    begin
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

-- Internal helpers, triggers, and RLS functions stay revoked from anon/authenticated.
-- They remain callable from other SECURITY DEFINER functions and via service_role.
--
-- If get_office_by_code is missing, run first:
--   supabase/migrations/004_auth_redesign_offices_profiles.sql
--   supabase/migrations/007_firm_codes.sql
