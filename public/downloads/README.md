# Android APK Hosting

Place release APK files in this folder. Update `public/app-release.json` when publishing a new version:

1. Copy the signed APK here, e.g. `legalmind-yemen-1.0.0.apk`
2. Update `version`, `versionCode`, `releasedAt`, `apkFileName`, `apkUrl`, and `changelog` in `app-release.json`
3. Deploy to Vercel — the Download Center at `/download` will serve the latest version automatically

The download button always reads from `/app-release.json` at runtime.
