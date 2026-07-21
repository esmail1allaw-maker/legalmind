# LegalMind Yemen — Web + Android Platform Guide

Single codebase for **Vercel (Web)** and **Android (APK/AAB)** using React 19 + Vite + Capacitor.

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Android Studio | Latest (for emulator/device) |
| JDK | 17 (bundled with Android Studio) |

---

## Environment variables

Create `.env` in the project root (same for web and app):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://www.legalmindyemen.com
```

---

## Run the website (Vercel / local)

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # output: dist/
npm run preview      # preview production build
```

The website is unchanged — deploy `dist/` to Vercel as before.

**Download Center:** https://your-domain/download

---

## Run the Android app (development)

```bash
npm install
npm run build
npx cap sync android
npx cap open android          # opens Android Studio
```

In Android Studio: Run ▶ on emulator or USB device.

Or from CLI:

```bash
npm run cap:run
```

The app loads the **bundled React build** from `dist/` inside the APK (not a remote WebView URL).

---

## Build Android artifacts

### Quick commands

| Command | Output |
|---------|--------|
| `npm run build:android:debug` | Debug APK |
| `npm run build:android:release` | Release APK |
| `npm run build:android:aab` | Release AAB (Play Store) |

APK copies are placed in `public/downloads/` for hosting on the website.

### Manual Gradle

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
./gradlew assembleRelease
./gradlew bundleRelease
```

Outputs:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Publish a new app version

1. Bump version in `package.json` (e.g. `1.0.1`)
2. Update `public/app-release.json`:
   - `version`, `versionCode`, `releasedAt`, `apkUrl`, `changelog`
3. Build release APK: `npm run build:android:release`
4. Place/copy APK to `public/downloads/legalmind-yemen-1.0.1.apk`
5. Deploy website to Vercel
6. Users on old app versions get an in-app **"يتوفر إصدار جديد"** prompt with **تحديث الآن**

### versionCode rule

Auto-calculated in Vite from semver: `major*100 + minor*10 + patch`  
Example: `1.0.0` → `100`, `1.0.1` → `101`

Keep `android/app/build.gradle` `versionCode` / `versionName` in sync when releasing.

---

## Project structure (mobile)

```
capacitor.config.ts          Capacitor config (bundled assets, splash, plugins)
android/                     Native Android project (commit to git)
public/
  app-release.json           Version manifest for update checker + download page
  downloads/                 Hosted APK/AAB files
src/
  lib/platform/              Native detection, init, camera/share/download bridge
  hooks/useNetworkStatus.ts  Offline detection
  hooks/useAndroidBackButton.ts
  hooks/useAppUpdateChecker.ts
  pages/DownloadPage.tsx     /download
  components/mobile/         FAB, offline screen, update modal
```

---

## Features

### Performance
- Inline boot splash (no white screen)
- Lazy-loaded routes (existing)
- Font subset on native (400/600/700 only)
- Vite code splitting (vendor, supabase, query, …)

### Native Android
- Portrait-only, full screen, edge-to-edge safe areas
- Smart back button (navigate back / confirm exit on home)
- Offline screen with auto-resume
- Camera, Share, Clipboard, Filesystem
- Notifications permission declared (ready for future FCM)

### Security
- HTTPS only (`networkSecurityConfig`)
- Backup disabled for app data
- ProGuard on release builds
- Supabase session in WebView storage (isolated per app install)

---

## Capacitor sync workflow

After any web code change:

```bash
npm run build
npx cap sync android
```

Or use the shortcut:

```bash
npm run cap:sync
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| White screen on launch | Run `npm run build && npx cap sync` |
| Gradle fails | Open Android Studio → SDK Manager → install SDK 34+ |
| Plugins not found | `npx cap sync android` |
| Update checker silent | Check `VITE_APP_URL` and `public/app-release.json` on live site |

---

## All npm scripts (mobile-related)

```bash
npm run build:web              # Web production build
npm run cap:sync               # build + cap sync android
npm run cap:open               # open Android Studio
npm run cap:run                # build, sync, run on device
npm run build:android          # release APK (default)
npm run build:android:debug    # debug APK
npm run build:android:release  # release APK
npm run build:android:aab      # Play Store AAB
```

---

## Website vs App

| | Website (Vercel) | Android App |
|--|------------------|-------------|
| Code | Same `src/` | Same `src/` |
| Deploy | `npm run build` → Vercel | `cap sync` → Gradle |
| Updates | Instant (deploy) | APK download from `/download` |
| Offline | Tauri desktop only | Native offline UI + existing sync hooks |

Tauri desktop (`npm run tauri:dev`) remains available and is **not** affected by Capacitor.
