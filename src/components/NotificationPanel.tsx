import { Calendar, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NotificationItem, PageId, SessionItem } from '../types/app';
import {
  formatSessionWhen,
  getSessionUrgency,
  sessionAlertTitle
} from '../lib/sessionAlerts';

interface NotificationPanelProps {
  notifications: NotificationItem[];
  upcomingSessions: SessionItem[];
  sessionsLoading?: boolean;
  onNavigate: (page: PageId) => void;
  onClose: () => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
}

function urgencyClasses(urgency: ReturnType<typeof getSessionUrgency>): string {
  if (urgency === 'today') return 'bg-rose-50 border-rose-100 text-rose-800';
  if (urgency === 'tomorrow') return 'bg-amber-50 border-amber-100 text-amber-900';
  return 'bg-sky-50 border-sky-100 text-sky-900';
}

function useMobilePanelLayout(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function NotificationPanel({
  notifications,
  upcomingSessions,
  sessionsLoading = false,
  onNavigate,
  onClose,
  markAllNotificationsRead,
  markNotificationRead
}: NotificationPanelProps) {
  const isMobile = useMobilePanelLayout();
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const totalAlerts = unreadNotifications + upcomingSessions.length;

  const panelBody = (
    <div
      dir="rtl"
      className={
        isMobile
          ? 'fixed z-[70] overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-2xl inset-x-3 top-[4.25rem] w-auto'
          : 'absolute end-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-2xl'
      }
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-xs font-bold text-slate-700">
          التنبيهات {totalAlerts > 0 ? `(${totalAlerts})` : ''}
        </span>
        <div className="flex items-center gap-2">
          {unreadNotifications > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-[11px] font-bold text-indigo-700 hover:underline"
            >
              تعيين الكل كمقروء
            </button>
          ) : null}
          {isMobile ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain">
        <div className="border-b border-slate-100 px-3 py-2 sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-slate-700">الجلسات القادمة</span>
            <button
              type="button"
              onClick={() => {
                onNavigate('sessions');
                onClose();
              }}
              className="shrink-0 text-[10px] font-bold text-indigo-700 hover:underline"
            >
              كل الجلسات
            </button>
          </div>

          {sessionsLoading ? (
            <p className="py-3 text-center text-[11px] text-slate-400">جاري تحميل الجلسات…</p>
          ) : upcomingSessions.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-slate-400">لا توجد جلسات مجدولة قريباً.</p>
          ) : (
            upcomingSessions.map((session) => {
              const urgency = getSessionUrgency(session);
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    onNavigate('sessions');
                    onClose();
                  }}
                  className={`mb-2 w-full rounded-xl border p-3 text-right transition-colors hover:opacity-90 ${urgencyClasses(urgency)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 text-xs font-black">{sessionAlertTitle(session)}</span>
                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </div>
                  <p className="mt-1 break-words text-[11px] font-bold leading-snug">{session.caseTitle}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1 break-words text-[10px] opacity-80">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatSessionWhen(session)}</span>
                    {session.court ? <span>• {session.court}</span> : null}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="px-1 py-1">
            <p className="px-3 py-1 text-[11px] font-black text-slate-700">إشعارات النظام</p>
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  markNotificationRead(notif.id);
                  onClose();
                }}
                className={`w-full border-b border-slate-50 p-3 text-right transition-colors hover:bg-slate-50 ${notif.read ? '' : 'bg-amber-50/40'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 break-words text-xs font-bold text-slate-800">{notif.title}</span>
                  <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">{notif.time}</span>
                </div>
                <p className="mt-1 break-words text-[11px] leading-relaxed text-slate-600">{notif.message}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (isMobile && typeof document !== 'undefined') {
    return createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/25"
          onClick={onClose}
          aria-label="إغلاق التنبيهات"
        />
        {panelBody}
      </>,
      document.body
    );
  }

  return panelBody;
}
