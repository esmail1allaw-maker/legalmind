# Firm Code System — LegalMind Yemen

Production-ready multi-tenant firm join codes for law firm registration and lawyer onboarding.

## Format

| Rule | Value |
|------|--------|
| Pattern | `ABC-1234` |
| Prefix | 3 uppercase letters from firm name |
| Suffix | 4 random digits |
| Length | 8 characters (6–12 with separator) |
| Case | Uppercase only |
| Uniqueness | Global across all firms |

### Examples

| Firm Name | Generated Code |
|-----------|----------------|
| Al Huda Law Firm | `HUD-4829` |
| Legal Experts | `LEG-7351` |
| Yemen Justice Office | `YEM-9248` |

## Architecture

```
Office Registration                    Lawyer Registration
       │                                        │
       ▼                                        ▼
  INSERT firms                         Enter firm code
       │                                        │
  TRIGGER trg_set_firm_code              RPC get_office_by_code
       │                                        │
  generate_firm_code()                   signUp (lawyer flow)
  + advisory lock                        handle_new_user → profile
       │                                        │
  firm_code saved                        role = lawyer
```

## Database (PostgreSQL / Supabase)

| File | Purpose |
|------|---------|
| `migrations/007_firm_codes.sql` | Initial firm code column, functions, trigger |
| `migrations/010_get_office_by_code.sql` | Restore lookup RPC |
| `migrations/013_firm_codes_production.sql` | Production hardening (search_path, validation) |
| `migrations/017_firm_codes_consolidated.sql` | Arabic prefixes, consolidated grants, lawyer validation |

See also: **`FIRM_CODES_IMPLEMENTATION_REPORT.md`** for the full architecture document.

### Key objects

- `firm_code_prefix(name)` — derives 3-letter prefix
- `generate_firm_code(name)` — collision-safe generation with `pg_advisory_xact_lock`
- `set_firm_code()` — `BEFORE INSERT` trigger on `firms`
- `is_valid_firm_code_format(code)` — check constraint helper
- `get_office_by_code(input)` — SECURITY DEFINER lookup (anon + authenticated)
- `office_code_exists(input)` — uniqueness check for TS backend generator

### Constraints

```sql
firm_code VARCHAR(12) NOT NULL
UNIQUE INDEX firms_firm_code_unique_idx
CHECK (firm_code ~ '^[A-Z]{3}-[0-9]{4}$')
```

## TypeScript

| File | Purpose |
|------|---------|
| `src/lib/firmCode.ts` | Normalize, validate, generate, check availability |
| `src/lib/auth.ts` | `verifyOfficeCode`, `registerLawyer` with firm code |
| `src/components/FirmCodeCard.tsx` | Dashboard copy UI |
| `src/pages/AuthPages.tsx` | Lawyer validation + office code display |
| `src/pages/WorkspacePages.tsx` | Admin dashboard firm code section |

### Backend generation (optional)

Use when inserting firms outside PostgreSQL trigger:

```typescript
import { generateUniqueFirmCode } from './lib/firmCode';

const code = await generateUniqueFirmCode('Al Huda Law Firm');
// → HUD-4829 (after uniqueness RPC checks)
```

Primary path: **database trigger** on `INSERT` (recommended for SaaS).

## Security

| Layer | Control |
|-------|---------|
| RLS | Firms isolated by `firm_id`; no public table scan |
| Lookup | Only via SECURITY DEFINER RPCs with format validation |
| Registration | Lawyers must provide valid existing code |
| Concurrency | `pg_advisory_xact_lock` on code generation |
| Functions | `SET search_path = public` (migration 013) |

## Deployment checklist

1. Run migrations `001` → `013` in order (or `complete_schema.sql` for fresh DB)
2. Verify: `select id, name, firm_code from firms limit 5;`
3. Test RPC: `select * from get_office_by_code('HUD-4829');`
4. Register office → confirm code on dashboard
5. Register lawyer with code → confirm firm link

## UI

- **Dashboard (admin):** `FirmCodeCard` with copy button + toast
- **Lawyer signup:** live code validation + firm name preview
- **Office signup:** displays generated code after successful registration
