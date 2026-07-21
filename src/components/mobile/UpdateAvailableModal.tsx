import { Download, Sparkles, X } from 'lucide-react';
import type { AppReleaseManifest } from '../../lib/appRelease';

interface UpdateAvailableModalProps {
  manifest: AppReleaseManifest;
  currentVersion: string;
  onDismiss: () => void;
  onUpdate: () => void;
}

export function UpdateAvailableModal({
  manifest,
  currentVersion,
  onDismiss,
  onUpdate
}: UpdateAvailableModalProps) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/50 p-4 sm:items-center" dir="rtl">
      <div
        role="dialog"
        aria-labelledby="update-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7A1F2B]/10 text-[#7A1F2B]">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 id="update-title" className="text-lg font-black text-slate-900 dark:text-white">
                يتوفر إصدار جديد
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentVersion} ← {manifest.version}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {manifest.changelog.length > 0 ? (
          <ul className="mb-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {manifest.changelog.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#7A1F2B]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onUpdate}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7A1F2B] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-[#6a1a25]"
          >
            <Download className="h-4 w-4" aria-hidden />
            تحديث الآن
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
