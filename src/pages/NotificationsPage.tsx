import type { NotificationItem } from '../types/app';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsPage({ notifications, onMarkRead, onMarkAllRead }: NotificationsPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 text-right space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">سجل الإشعارات والمنبهات الذكية</h1>
            <p className="text-xs text-slate-500 mt-1">تابع تنبيهات الجلسات والمستندات والتحديثات القانونية في الوقت الفعلي.</p>
          </div>
          <button type="button" onClick={onMarkAllRead} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-all">
            <CheckCircle2 className="w-4 h-4" /> تعليم الكل كمقروء
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-slate-500">لا توجد إشعارات جديدة في الوقت الحالي.</div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={`bg-white p-5 rounded-3xl border ${item.read ? 'border-slate-100' : 'border-amber-200 bg-amber-50'} shadow-sm`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Bell className="w-4 h-4 text-indigo-700" /> {item.title}
                  </div>
                  <p className="text-[12px] text-slate-500 mt-2">{item.message}</p>
                </div>
                <div className="text-right space-y-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.time}</span>
                  {!item.read && (
                    <button type="button" onClick={() => onMarkRead(item.id)} className="text-amber-600 text-[11px] font-bold hover:underline">تمييز كمقروء</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
