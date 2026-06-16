// ─── Shared application-wide constants ────────────────────────────────────────
// Keep magic strings and numbers here so they are defined once and typed.

import type { CaseStatus, CaseType, CaseStage, SessionStatus } from '../types/app';

// ─── Filters ──────────────────────────────────────────────────────────────────
export const FILTER_ALL = 'الكل' as const;

// ─── Case ─────────────────────────────────────────────────────────────────────
export const CASE_STATUSES: { value: CaseStatus; label: string }[] = [
  { value: 'active',   label: 'نشطة'    },
  { value: 'archived', label: 'مؤرشفة'  },
  { value: 'closed',   label: 'مغلقة'   },
];

export const CASE_TYPES: CaseType[] = [
  'مدنية', 'تجارية', 'أحوال شخصية', 'عمالية', 'مستعجلة', 'جنائية',
];

export const CASE_STAGES: CaseStage[] = [
  'ابتدائي مدني', 'ابتدائي شخصي', 'ابتدائي جنائي', 'استئناف', 'نقض',
];

// ─── Session ──────────────────────────────────────────────────────────────────
export const SESSION_STATUSES: SessionStatus[] = [
  'مجدولة', 'منعقدة', 'مؤجلة', 'ملغاة',
];

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FETCH_SIZE    = 1000;

// ─── Stale-time presets (milliseconds) ───────────────────────────────────────
export const STALE_LONG  = 60_000;   // office, documents, profile
export const STALE_SHORT = 30_000;   // clients, cases, lawyers

// ─── Date/time ────────────────────────────────────────────────────────────────
export const TODAY_ISO = (): string => new Date().toISOString().split('T')[0]!;
