/** App version baked at build time (matches package.json / app-release.json). */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION as string;
export const APP_VERSION_CODE = Number(import.meta.env.VITE_APP_VERSION_CODE ?? '100');

export const APP_RELEASE_MANIFEST_URL =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://www.legalmindyemen.com');

export const APP_RELEASE_JSON_PATH = '/app-release.json';
