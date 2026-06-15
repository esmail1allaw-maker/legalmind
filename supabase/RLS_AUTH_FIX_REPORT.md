# Supabase Auth, RLS & Permissions — Analysis & Fix Report

**Project:** LegalMind Yemen  
**Date:** 2026-06-14  
**Migration:** `supabase/migrations/015_fix_rls_grants_permissions.sql`  
**Prerequisite migrations:** `001` → `014`

---

## Executive Summary

The app showed **403 Forbidden** on `firms`, `profiles`, `employees`, and `invitations`, plus **`permission denied for function get_current_firm_id()`** and **400 Bad Request** on RPCs.

**Root cause:** Migration `009_security_hardening.sql` revoked `EXECUTE` on **all** public functions from `authenticated`, including functions referenced inside **RLS policy expressions**. PostgreSQL requires the session role to have `EXECUTE` on functions used in policies — without it, queries fail with `42501` (often surfaced as 403/500 via PostgREST).

Secondary causes: incomplete profile↔employee links, dual admin checks (`profiles.role` vs `employees.role`), and client code resolving firm context only via `employees`.

---

## Problems Found

### 1. Function EXECUTE revoked (Critical)

| Function | Used by | Symptom |
|----------|---------|---------|
| `get_current_firm_id()` | RLS on firms, profiles, employees, invitations, cases… | `permission denied for function get_current_firm_id` |
| `get_current_employee_id()` | audit/sync triggers, invitation RPCs | Same |
| `get_current_role()` | employee admin RLS | 403 on employee CRUD |
| `get_current_profile_role()` | profile admin RLS | 403 on invitations |
| `is_office_profile_admin()` | invitation/firm update policies | 403 for admins |
| `is_office_admin()` | employee policies | 403 for firm_manager |
| `insert_audit_log()` | audit triggers | insert failures on audited tables |
| `update_client_cases_count()` | cases trigger | case insert/delete failures |

**Source:** `009_security_hardening.sql` lines 21–37 revoke all grants; only 11 RPCs were re-granted.

### 2. RLS policy gaps

| Table | Issue |
|-------|-------|
| `firms` | SELECT used `get_current_firm_id()` only — fails when function not executable |
| `profiles` | No `profiles_update_own` — users could not update own row |
| `employees` | Admin insert required `is_office_admin()` but profile-only admins failed |
| `invitations` | Required `is_office_profile_admin()` only — `firm_manager` employee role blocked |
| `lawyers` | Signup insert blocked without `lawyers_insert_self` |

### 3. Data integrity

- `profiles.employee_id` NULL while `employees.auth_uid` linked → `get_current_role()` returned NULL → admin policies failed.
- `accept_invitation_for_auth_user` created employee but **not** profile → login "profile incomplete".

### 4. Client-side issues

| File | Issue |
|------|-------|
| `src/lib/api.ts` | `getCurrentFirmId()` queried **employees only** |
| `src/lib/api.ts` | `fetchInvitations()` had no `firm_id` filter |
| `src/lib/auth.ts` | Employee fallback set `User.id = employee.id` instead of `auth.uid()` |
| `src/lib/supabaseClient.ts` | No explicit auth session options |

### 5. RPC 400 errors

| RPC | Typical cause |
|-----|---------------|
| `create_office_invitation` | Caller not profile `admin` |
| `cancel_office_invitation` / `resend_office_invitation` | Same admin mismatch |
| `get_office_by_code` | Function missing or revoked EXECUTE |

---

## Fixes Applied

### SQL — `015_fix_rls_grants_permissions.sql`

1. Recreated helper functions with improved fallbacks + `is_firm_manager()`
2. Data repair: link `profiles.employee_id` and `profiles.firm_id`
3. Full RLS policy set for firms, profiles, employees, invitations, lawyers
4. Updated invitation RPCs to use `is_firm_manager()` and create profiles on accept
5. `GRANT EXECUTE` on all RLS helpers, trigger functions, and RPC whitelist

### TypeScript

- `getCurrentFirmId()` — profiles first, then employees
- `fetchInvitations()` — explicit `firm_id` filter
- `buildAppUser()` — correct auth UID on employee fallback
- `supabaseClient.ts` — explicit auth options

---

## Deployment

Run in Supabase SQL Editor:

```
014 → 015
```

(Full chain: `001` through `015` if starting fresh.)

### Verify

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('firms','profiles','employees','invitations')
ORDER BY tablename, policyname;
```

---

## Files Changed

| Path | Type |
|------|------|
| `supabase/migrations/015_fix_rls_grants_permissions.sql` | New migration |
| `supabase/RLS_AUTH_FIX_REPORT.md` | This report |
| `src/lib/api.ts` | Client fix |
| `src/lib/auth.ts` | Client fix |
| `src/lib/supabaseClient.ts` | Client fix |
