import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const billingAdminQueryKey = ['billing-admin-access'] as const;

export async function fetchIsBillingAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_billing_admin');
  if (error) {
    if (/is_billing_admin|42883|does not exist/i.test(error.message)) {
      return false;
    }
    throw error;
  }
  return Boolean(data);
}

export function useBillingAdmin(enabled = true) {
  return useQuery({
    queryKey: billingAdminQueryKey,
    queryFn: fetchIsBillingAdmin,
    enabled: enabled && isSupabaseConfigured(),
    staleTime: 30_000
  });
}
