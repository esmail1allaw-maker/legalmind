import type { PostgrestError } from '@supabase/supabase-js';

export class SupabaseQueryError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(error: PostgrestError) {
    super(error.message);
    this.name = 'SupabaseQueryError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export function throwIfSupabaseError(error: PostgrestError | null): void {
  if (error) throw new SupabaseQueryError(error);
}

export function normalizeMaybeSingle<T>(data: T | null): T | null {
  return data ?? null;
}

export function requireRow<T>(data: T | null, message = 'Record not found.'): T {
  if (!data) throw new Error(message);
  return data;
}
