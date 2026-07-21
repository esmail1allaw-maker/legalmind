import { useCallback, useEffect, useState } from 'react';
import {
  fetchAppReleaseManifest,
  isUpdateAvailable,
  resolveApkDownloadUrl,
  type AppReleaseManifest
} from '../lib/appRelease';
import { APP_VERSION, APP_VERSION_CODE } from '../constants/appVersion';
import { isNativeApp } from '../lib/platform';
import { openApkDownload } from '../lib/platform/nativeBridge';

export interface AppUpdateState {
  checking: boolean;
  updateAvailable: boolean;
  manifest: AppReleaseManifest | null;
  currentVersion: string;
  currentVersionCode: number;
  dismiss: () => void;
  downloadUpdate: () => void;
}

const DISMISS_KEY = 'legalmind:update-dismissed';

export function useAppUpdateChecker(enabled = true): AppUpdateState {
  const [checking, setChecking] = useState(false);
  const [manifest, setManifest] = useState<AppReleaseManifest | null>(null);
  const [dismissedVersionCode, setDismissedVersionCode] = useState(() => {
    try {
      const raw = sessionStorage.getItem(DISMISS_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { versionCode: number };
      return parsed.versionCode ?? 0;
    } catch {
      return 0;
    }
  });

  const check = useCallback(async () => {
    if (!enabled) return;
    setChecking(true);
    try {
      const latest = await fetchAppReleaseManifest();
      setManifest(latest);
    } finally {
      setChecking(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void check();
    const timer = window.setInterval(() => void check(), 6 * 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [check, enabled]);

  const updateAvailable =
    Boolean(manifest) &&
    isUpdateAvailable(APP_VERSION_CODE, manifest!.versionCode) &&
    manifest!.versionCode > dismissedVersionCode;

  const dismiss = useCallback(() => {
    if (!manifest) return;
    setDismissedVersionCode(manifest.versionCode);
    sessionStorage.setItem(
      DISMISS_KEY,
      JSON.stringify({ versionCode: manifest.versionCode })
    );
  }, [manifest]);

  const downloadUpdate = useCallback(() => {
    if (!manifest) return;
    const url = resolveApkDownloadUrl(manifest);
    void openApkDownload(url);
  }, [manifest]);

  return {
    checking,
    updateAvailable,
    manifest,
    currentVersion: APP_VERSION,
    currentVersionCode: APP_VERSION_CODE,
    dismiss,
    downloadUpdate
  };
}

export function useShowUpdateChecker(): boolean {
  return isNativeApp();
}
