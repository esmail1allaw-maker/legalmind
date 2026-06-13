import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface SupabaseHealthResult {
  configured: boolean;
  authenticated: boolean;
  reachable: boolean;
  error?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      authenticated: false,
      reachable: false,
      error: 'Supabase environment variables are not configured.'
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase.from('profiles').select('id').limit(1);

    return {
      configured: true,
      authenticated: Boolean(sessionData.session),
      reachable: !error,
      error: error?.message
    };
  } catch (err) {
    return {
      configured: true,
      authenticated: false,
      reachable: false,
      error: err instanceof Error ? err.message : 'Unknown Supabase health check error.'
    };
  }
}
