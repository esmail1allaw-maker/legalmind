import { Plus, Trash2, Edit3 } from 'lucide-react';
import type { SessionsPageProps } from './types';

export function SessionsPage({ sessions, onCreateSession, onEditSession, onDeleteSession }: SessionsPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900">أجندة مواعيد وجلسات المحاكم</h1>
          <p className="text-xs text-slate-500 font-medium">متابعة دقيقة لمواعيد الحضور والمرافعة وتقديم الدفوع.</p>
        </div>
        <button type="button" onClick={onCreateSession} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow">
          <Plus className="w-4 h-4 stroke-[2.5]" /> جدولة جلسة جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">القضية</th>
                <th className="py-3 px-4 font-bold">المحكمة</th>
                <th className="py-3 px-4 font-bold">التاريخ</th>
                <th className="py-3 px-4 font-bold">الوقت</th>
                <th className="py-3 px-4 font-bold">نوع الجلسة</th>
                <th className="py-3 px-4 font-bold">الملاحظات</th>
                <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800 max-w-xs">{session.caseTitle}</td>
                  <td className="py-4 px-4 text-slate-600">{session.court}</td>
                  <td className="py-4 px-4 font-bold text-indigo-800">{session.date}</td>
                  <td className="py-4 px-4"><span className="bg-amber-100 text-amber-900 font-mono font-bold px-2 py-1 rounded text-xs">{session.time}</span></td>
                  <td className="py-4 px-4 text-slate-700 font-semibold">{session.type}</td>
                  <td className="py-4 px-4 text-slate-500 max-w-xs">{session.notes || '—'}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => onEditSession(session)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit3 className="w-4.5 h-4.5" /></button>
                      <button type="button" onClick={() => onDeleteSession(session.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 className="w-4.5 h-4.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
