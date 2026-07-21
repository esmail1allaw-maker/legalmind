import { useCallback, useEffect, useState } from 'react';
import { subscribeNativeNetwork } from '../lib/platform/initNativeApp';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  retryCount: number;
}

export function useNetworkStatus(): NetworkStatus & { retry: () => void } {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    void subscribeNativeNetwork(
      () => {
        setIsOnline(true);
        setRetryCount((c) => c + 1);
      },
      () => {
        setIsOnline(false);
        setWasOffline(true);
      }
    ).then((fn) => {
      unsub = fn;
    });

    return () => unsub?.();
  }, []);

  return { isOnline, wasOffline, retryCount, retry };
}
