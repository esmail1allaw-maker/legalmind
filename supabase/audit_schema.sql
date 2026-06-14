-- LegalMind Yemen — Schema audit queries (Supabase SQL Editor)
-- Run each section separately or all at once.

-- ─── 1) Core tables exist? ───────────────────────────────────────────────────
select
  expected.name as table_name,
  exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = expected.name
  ) as table_exists
from (values
  ('firms'),
  ('profiles'),
  ('employees'),
  ('invitations'),
  ('sync_events'),
  ('clients'),
  ('cases')
) as expected(name);

-- ─── 2) firms columns ──────────────────────────────────────────────────────────
select column_name, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'firms'
order by ordinal_position;

-- ─── 3) Missing firms columns (004 + 003) ─────────────────────────────────────
select
  expected.column_name,
  exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'firms'
      and c.column_name = expected.column_name
  ) as column_exists
from (values
  ('owner_full_name'),
  ('email'),
  ('phone'),
  ('firm_code'),
  ('deleted_at'),
  ('sync_version'),
  ('updated_by'),
  ('device_id')
) as expected(column_name);

-- ─── 4) invitations columns from migration 005 ───────────────────────────────
select
  expected.column_name,
  exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'invitations'
      and c.column_name = expected.column_name
  ) as column_exists
from (values
  ('invite_url'),
  ('resent_at'),
  ('cancelled_at')
) as expected(column_name);

-- ─── 5) profiles columns ───────────────────────────────────────────────────────
select column_name, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- ─── 6) firm_code health ───────────────────────────────────────────────────────
select
  count(*) as total_firms,
  count(firm_code) as with_code,
  count(*) filter (where firm_code is null) as missing_code,
  count(*) filter (where firm_code ~ '^[A-Z]{3}-[0-9]{4}$') as valid_format
from firms;

-- ─── 7) Key RPC functions exist? ─────────────────────────────────────────────
select
  expected.routine_name as function_name,
  exists (
    select 1
    from information_schema.routines r
    where r.routine_schema = 'public'
      and r.routine_name = expected.routine_name
  ) as function_exists
from (values
  ('get_current_firm_id'),
  ('get_current_profile_role'),
  ('is_office_profile_admin'),
  ('get_current_profile_context'),
  ('office_code_exists'),
  ('get_office_by_code'),
  ('get_invitation_by_token')
) as expected(routine_name);
