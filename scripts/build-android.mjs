#!/usr/bin/env node
/**
 * Build LegalMind Yemen Android artifacts (APK debug/release, AAB release).
 * Usage:
 *   node scripts/build-android.mjs [--debug|--release|--aab]
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const androidDir = join(root, 'android');
const downloadsDir = join(root, 'public', 'downloads');

const mode = process.argv.includes('--aab')
  ? 'aab'
  : process.argv.includes('--debug')
    ? 'debug'
    : 'release';

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
  return pkg.version;
}

if (!existsSync(androidDir)) {
  console.error('Android project not found. Run: npx cap add android && npm run cap:sync');
  process.exit(1);
}

run('npm run build');
run('npx cap sync android');

if (mode === 'aab') {
  run('cd android && ./gradlew bundleRelease');
  const version = readVersion();
  const aabSrc = join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  mkdirSync(downloadsDir, { recursive: true });
  const aabDest = join(downloadsDir, `legalmind-yemen-${version}.aab`);
  if (existsSync(aabSrc)) {
    cpSync(aabSrc, aabDest);
    console.log(`\nAAB copied to ${aabDest}`);
  }
} else if (mode === 'debug') {
  run(process.platform === 'win32' ? 'cd android && gradlew.bat assembleDebug' : 'cd android && ./gradlew assembleDebug');
  const version = readVersion();
  const apkSrc = join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  mkdirSync(downloadsDir, { recursive: true });
  const apkDest = join(downloadsDir, `legalmind-yemen-${version}-debug.apk`);
  if (existsSync(apkSrc)) {
    cpSync(apkSrc, apkDest);
    console.log(`\nDebug APK copied to ${apkDest}`);
  }
} else {
  run(process.platform === 'win32' ? 'cd android && gradlew.bat assembleRelease' : 'cd android && ./gradlew assembleRelease');
  const version = readVersion();
  const apkSrc = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  mkdirSync(downloadsDir, { recursive: true });
  const apkDest = join(downloadsDir, `legalmind-yemen-${version}.apk`);
  if (existsSync(apkSrc)) {
    cpSync(apkSrc, apkDest);
    console.log(`\nRelease APK copied to ${apkDest}`);
    console.log('Update public/app-release.json with the new version and apkUrl.');
  }
}

console.log('\nAndroid build finished.');
