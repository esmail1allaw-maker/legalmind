import { useQuery } from '@tanstack/react-query';
import { fetchMyPermissions, hasPermission } from '../lib/permissions';
import type { PermissionKey } from '../types/app';

export function useMyPermissions(enabled = true) {
  const query = useQuery({
    queryKey: ['my-permissions'],
    queryFn: fetchMyPermissions,
    enabled,
    staleTime: 60_000
  });

  const can = (key: PermissionKey, fallbackRole?: string) =>
    hasPermission(query.data, key, fallbackRole);

  return {
    permissions: query.data ?? {},
    isLoading: query.isLoading,
    can,
    refetch: query.refetch
  };
}
