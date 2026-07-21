import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './index';

/** Non-sensitive app preferences (never store tokens/passwords here). */
export async function setAppPreference(key: string, value: string): Promise<void> {
  const namespaced = `legalmind.${key}`;
  if (isNativeApp()) {
    await Preferences.set({ key: namespaced, value });
    return;
  }
  try {
    localStorage.setItem(namespaced, value);
  } catch {
    /* quota / private mode */
  }
}

export async function getAppPreference(key: string): Promise<string | null> {
  const namespaced = `legalmind.${key}`;
  if (isNativeApp()) {
    const { value } = await Preferences.get({ key: namespaced });
    return value;
  }
  try {
    return localStorage.getItem(namespaced);
  } catch {
    return null;
  }
}

export async function removeAppPreference(key: string): Promise<void> {
  const namespaced = `legalmind.${key}`;
  if (isNativeApp()) {
    await Preferences.remove({ key: namespaced });
    return;
  }
  try {
    localStorage.removeItem(namespaced);
  } catch {
    /* ignore */
  }
}
