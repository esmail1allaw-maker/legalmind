import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Download,
  RefreshCw,
  Shield,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { AnimatedAppBackground } from '../components/AnimatedAppBackground';
import {
  fetchAppReleaseManifest,
  isUpdateAvailable,
  resolveApkDownloadUrl,
  type AppReleaseManifest
} from '../lib/appRelease';
import { APP_VERSION, APP_VERSION_CODE } from '../constants/appVersion';
import { isAndroidDevice, isNativeApp } from '../lib/platform';
import { openApkDownload } from '../lib/platform/nativeBridge';

interface DownloadPageProps {
  onNavigate: (page: 'landing' | 'login') => void;
}

export function DownloadPage({ onNavigate }: DownloadPageProps) {
  const [manifest, setManifest] = useState<AppReleaseManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAppReleaseManifest()
      .then((data) => {
        if (!data) setError('تعذّر تحميل معلومات الإصدار. حاول لاحقاً.');
        setManifest(data);
      })
      .catch(() => setError('تعذّر تحميل معلومات الإصدار.'))
      .finally(() => setLoading(false));
  }, []);

  const needsUpdate = useMemo(
    () => (manifest ? isUpdateAvailable(APP_VERSION_CODE, manifest.versionCode) : false),
    [manifest]
  );

  const handleDownload = () => {
    if (!manifest) return;
    openApkDownload(resolveApkDownloadUrl(manifest));
  };

  const displayVersion = manifest?.version ?? APP_VERSION;
  const releasedAt = manifest?.releasedAt
    ? new Date(manifest.releasedAt).toLocaleDateString('ar-YE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '—';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950" dir="rtl">
      <AnimatedAppBackground variant="landing" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="mb-8 inline-flex items-center gap-1 text-sm font-bold text-[#7A1F2B] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          العودة للرئيسية
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="bg-gradient-to-l from-[#7A1F2B] to-[#9b2d3c] px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-right">
              <div className="rounded-2xl bg-white/15 p-4">
                <AppLogo className="h-14 w-14" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">LegalMind Yemen</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">تحميل تطبيق Android</h1>
                <p className="mt-2 text-sm text-white/85">
                  نفس تجربة الموقع — محسّنة للهاتف، مع عمل دون اتصال ومزامنة تلقائية.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-10">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin" />
                جاري التحميل…
              </div>
            ) : error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoCard label="الإصدار الحالي" value={`v${displayVersion}`} icon={Sparkles} />
                  <InfoCard label="آخر تحديث" value={releasedAt} icon={Smartphone} />
                  <InfoCard
                    label="حالة جهازك"
                    value={
                      isNativeApp()
                        ? needsUpdate
                          ? 'تحديث متاح'
                          : 'محدّث'
                        : isAndroidDevice()
                          ? 'متصفح Android'
                          : 'ويب'
                    }
                    icon={Shield}
                  />
                </div>

                {needsUpdate && isNativeApp() ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    لديك إصدار قديم ({APP_VERSION}). يتوفر إصدار {manifest?.version}.
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!manifest}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#7A1F2B] px-6 py-4 text-base font-black text-white shadow-lg shadow-[#7A1F2B]/25 transition hover:bg-[#6a1a25] disabled:opacity-50"
                >
                  <Download className="h-5 w-5" />
                  {needsUpdate ? 'تحديث التطبيق الآن' : 'تحميل APK للأندرويد'}
                </button>

                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                    <Sparkles className="h-5 w-5 text-[#7A1F2B]" />
                    ما الجديد
                  </h2>
                  <ul className="space-y-3">
                    {(manifest?.changelog ?? []).map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/40">
                  <h2 className="mb-3 text-base font-black text-slate-900 dark:text-white">
                    طريقة التثبيت لأول مرة
                  </h2>
                  <ol className="list-decimal space-y-2 pr-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <li>اضغط «تحميل APK» وانتظر اكتمال التنزيل.</li>
                    <li>افتح مدير الملفات أو إشعار التحميل.</li>
                    <li>
                      إذا طُلب منك ذلك، فعّل «السماح من هذا المصدر» في إعدادات Android.
                    </li>
                    <li>اضغط «تثبيت» ثم افتح LegalMind Yemen.</li>
                  </ol>
                  {manifest?.installNotes ? (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{manifest.installNotes}</p>
                  ) : null}
                </section>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          الموقع يعمل على{' '}
          <button type="button" className="font-bold text-[#7A1F2B] hover:underline" onClick={() => onNavigate('login')}>
            legalmindyemen.com
          </button>
          {' '}— التطبيق نسخة محمولة من نفس المنصة.
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#7A1F2B]/10 text-[#7A1F2B]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
