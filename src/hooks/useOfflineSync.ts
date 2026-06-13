import { useCallback, useEffect, useState } from 'react';
import { initializeLocalDatabase, getLocalSyncStatus, type SyncStatus } from '../lib/localDbClient';
import { isOnline, runSyncCycle, type SyncResult } from '../lib/syncEngine';

export interface OfflineSyncState extends SyncStatus {
  online: boolean;
  syncing: boolean;
  lastResult?: SyncResult;
  error?: string;
}

export function useOfflineSync(enabled: boolean) {
  const [state, setState] = useState<OfflineSyncState>({
    online: isOnline(),
    syncing: false,
    pendingEvents: 0,
    conflicts: 0
  });

  const refreshStatus = useCallback(async () => {
    const status = await getLocalSyncStatus();
    setState((current) => ({ ...current, ...status, online: isOnline() }));
  }, []);

  const syncNow = useCallback(async () => {
    if (!enabled) return;
    setState((current) => ({ ...current, syncing: true, error: undefined }));
    try {
      const result = await runSyncCycle();
      setState((current) => ({
        ...current,
        ...result,
        lastResult: result,
        online: isOnline(),
        syncing: false
      }));
    } catch (err) {
      setState((current) => ({
        ...current,
        online: isOnline(),
        syncing: false,
        error: err instanceof Error ? err.message : 'فشلت المزامنة'
      }));
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    initializeLocalDatabase()
      .then((status) => setState((current) => ({ ...current, ...status, online: isOnline() })))
      .catch((err) => setState((current) => ({ ...current, error: err instanceof Error ? err.message : String(err) })));
  }, [enabled]);

  useEffect(() => {
    const updateOnline = () => {
      setState((current) => ({ ...current, online: isOnline() }));
      if (isOnline()) void syncNow();
    };
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [syncNow]);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => {
      if (isOnline()) void syncNow();
      else void refreshStatus();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [enabled, refreshStatus, syncNow]);

  return { ...state, syncNow, refreshStatus };
}
