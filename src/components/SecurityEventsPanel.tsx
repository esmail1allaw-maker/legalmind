import { ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchSecurityEvents, type SecurityEventRow } from '../lib/securityEvents';

const EVENT_LABELS: Record<string, string> = {
  login_success: 'تسجيل دخول ناجح',
  login_failed: 'محاولة دخول فاشلة',
  logout: 'تسجيل خروج',
  session_expired: 'انتهاء الجلسة',
  mfa_required: 'طلب تحقق ثنائي',
  mfa_success: 'تحقق ثنائي ناجح',
  permission_denied: 'رفض صلاحية',
  registration_attempt: 'محاولة تسجيل',
  password_reset_request: 'طلب إعادة كلمة مرور'
};

const SEVERITY_CLASS: Record<string, string> = {
  info: 'bg-slate-100 text-slate-700',
  warning: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-YE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SecurityEventsPanel() {
  const [events, setEvents] = useState<SecurityEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSecurityEvents(50)
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'تعذر تحميل سجل الأمان');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <ShieldAlert className="h-4 w-4 text-[#7A1F2B]" />
        <h3 className="font-black text-slate-900 text-sm">سجل أحداث الأمان</h3>
      </div>
      {loading ? (
        <p className="text-xs text-slate-400 p-4">جاري التحميل...</p>
      ) : error ? (
        <p className="text-xs text-red-600 p-4">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-slate-400 p-4">لا توجد أحداث مسجّلة بعد.</p>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {events.map((ev) => (
            <li key={ev.id} className="px-4 py-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800">
                  {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SEVERITY_CLASS[ev.severity] ?? SEVERITY_CLASS.info}`}>
                  {ev.severity}
                </span>
              </div>
              <p className="text-slate-400 mt-0.5">{formatTime(ev.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
