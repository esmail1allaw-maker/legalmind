export interface AppReleaseManifest {
  version: string;
  versionCode: number;
  releasedAt: string;
  apkFileName: string;
  apkUrl: string;
  minAndroidSdk?: number;
  changelog: string[];
  installNotes?: string;
}

function resolveManifestUrl(): string {
  const base =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/app-release.json`;
}

export async function fetchAppReleaseManifest(): Promise<AppReleaseManifest | null> {
  try {
    const res = await fetch(resolveManifestUrl(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return (await res.json()) as AppReleaseManifest;
  } catch {
    return null;
  }
}

export function compareVersionCodes(current: number, latest: number): number {
  return current - latest;
}

export function isUpdateAvailable(currentCode: number, latestCode: number): boolean {
  return latestCode > currentCode;
}

export function resolveApkDownloadUrl(manifest: AppReleaseManifest): string {
  if (manifest.apkUrl.startsWith('http')) return manifest.apkUrl;
  const base =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${manifest.apkUrl.startsWith('/') ? manifest.apkUrl : `/${manifest.apkUrl}`}`;
}
