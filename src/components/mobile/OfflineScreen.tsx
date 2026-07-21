import { RefreshCw, WifiOff } from 'lucide-react';
import { AppLogo } from '../AppLogo';

interface OfflineScreenProps {
  onRetry: () => void;
}

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-[#7A1F2B] to-[#4a1219] px-6 text-white"
      dir="rtl"
    >
      <div className="mb-8 rounded-3xl bg-white/10 p-6 backdrop-blur-sm">
        <AppLogo className="h-16 w-16" />
      </div>
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
        <WifiOff className="h-10 w-10 text-white/90" aria-hidden />
      </div>
      <h1 className="mb-2 text-2xl font-black">لا يوجد اتصال بالإنترنت</h1>
      <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-white/80">
        تحقق من شبكة Wi‑Fi أو بيانات الهاتف. سنعيد الاتصال تلقائياً عند عودة الإنترنت.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#7A1F2B] shadow-lg transition hover:bg-white/95 active:scale-[0.98]"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        إعادة المحاولة
      </button>
    </div>
  );
}
