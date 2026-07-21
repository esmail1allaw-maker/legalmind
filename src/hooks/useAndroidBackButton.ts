import { useEffect } from 'react';
import type { PageId } from '../types/app';
import { confirmExitApp, registerAndroidBackButton } from '../lib/platform/initNativeApp';
import { resolvePageFromLocation } from '../lib/appRoutes';

const ROOT_PAGES: PageId[] = ['dashboard', 'landing'];

export function useAndroidBackButton(
  currentPage: PageId,
  isAuthenticated: boolean,
  onNavigate: (page: PageId) => void
): void {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void registerAndroidBackButton(async () => {
      if (currentPage === 'case-detail') {
        onNavigate('cases');
        window.history.back();
        return true;
      }

      const root = isAuthenticated ? 'dashboard' : 'landing';
      if (ROOT_PAGES.includes(currentPage)) {
        const confirmed = await confirmExitApp('هل تريد الخروج من التطبيق؟');
        if (confirmed) return false;
        return true;
      }

      if (window.history.length > 1) {
        window.history.back();
        const next = resolvePageFromLocation();
        if (next.page) onNavigate(next.page);
        return true;
      }

      onNavigate(root);
      return true;
    }).then((fn) => {
      cleanup = fn;
    });

    return () => cleanup?.();
  }, [currentPage, isAuthenticated, onNavigate]);
}
