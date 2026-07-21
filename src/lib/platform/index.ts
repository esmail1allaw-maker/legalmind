import { Capacitor } from '@capacitor/core';

export type AppPlatform = 'web' | 'android' | 'ios' | 'unknown';

export function getAppPlatform(): AppPlatform {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') return 'android';
  if (platform === 'ios') return 'ios';
  if (platform === 'web') return 'web';
  return 'unknown';
}

/** True when running inside Capacitor native shell (APK), not mobile browser. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAndroidNative(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function isAndroidMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isNativeApp()) return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android/.test(ua) && /mobile|wv/.test(ua);
}

export function isAndroidDevice(): boolean {
  return isAndroidNative() || isAndroidMobileBrowser();
}

export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
