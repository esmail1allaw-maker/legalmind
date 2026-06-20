import { isSupabaseConfigured } from './supabaseClient';
import { isOnline } from './syncEngine';

export function shouldUseRemoteBackend(): boolean {
  return isSupabaseConfigured() && isOnline();
}

/** When online + Supabase configured, remote failures propagate — no silent local fallback. */
export async function mutateRemoteOrLocal<T>(
  remoteFn: () => Promise<T>,
  localFn: () => Promise<T>
): Promise<T> {
  if (shouldUseRemoteBackend()) {
    return remoteFn();
  }
  return localFn();
}
