import { useEffect, useState } from 'react';
import { isAndroidDevice, isNativeApp } from '../../lib/platform';

interface AppDownloadFabProps {
  onNavigateDownload: () => void;
}

const DISMISS_UNTIL_KEY = 'legalmind:download-fab-dismissed-until';

export function AppDownloadFab({ onNavigateDownload }: AppDownloadFabProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNativeApp() || !isAndroidDevice()) {
      setVisible(false);
      return;
    }
    try {
      const until = Number(localStorage.getItem(DISMISS_UNTIL_KEY) ?? '0');
      setVisible(Date.now() > until);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onNavigateDownload}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-[#7A1F2B] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-[#7A1F2B]/30 transition hover:scale-[1.02] active:scale-[0.98] native-app:hidden"
      aria-label="تحميل التطبيق"
    >
      <span aria-hidden>📱</span>
      تحميل التطبيق
    </button>
  );
}

export function dismissDownloadFabForDays(days = 7): void {
  localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + days * 86400000));
}
