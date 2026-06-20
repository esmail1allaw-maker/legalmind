import { Search, Plus, Trash2, Edit3, Send } from 'lucide-react';
import type { ClientsPageProps } from './types';
export function ClientsPage({ clients, searchQuery, onSearch, onCreateClient, onEditClient, onDeleteClient, onSendReport, canSendReport }: ClientsPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1 text-right">
          <h1 className="text-2xl font-black text-slate-900">إدارة دليل الموكلين والعملاء</h1>
          <p className="text-xs text-slate-500 font-medium">سجل ببيانات الموكلين الأفراد وممثلي الشركات ومتابعة نشاطاتهم القانونية.</p>
        </div>
        <button type="button" onClick={onCreateClient} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow">
          <Plus className="w-4 h-4 stroke-[2.5]" /> إضافة عميل جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center">
        <div className="relative w-full">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن اسم العميل، رقم الهاتف، أو نوع الكيان..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-xs text-right"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 font-bold">اسم الموكل</th>
                <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                <th className="py-3.5 px-4 font-bold">البريد الإلكتروني</th>
                <th className="py-3.5 px-4 font-bold">نوع الكيان</th>
                <th className="py-3.5 px-4 font-bold">العنوان</th>
                <th className="py-3.5 px-4 font-bold">قضايا</th>
                <th className="py-3.5 px-4 font-bold text-center">خيارات</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">{client.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{client.phone}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{client.email || '—'}</td>
                  <td className="py-3.5 px-4"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${client.type === 'شركة تجارية' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>{client.type}</span></td>
                  <td className="py-3.5 px-4 text-slate-500">{client.address}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-700 font-mono text-sm">{client.casesCount}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canSendReport && onSendReport ? (
                        <button type="button" onClick={() => onSendReport(client)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="إرسال تقرير">
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      ) : null}
                      <button type="button" onClick={() => onEditClient(client)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="تعديل العميل"><Edit3 className="w-4.5 h-4.5" /></button>
                      <button type="button" onClick={() => onDeleteClient(client.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="حذف العميل"><Trash2 className="w-4.5 h-4.5" /></button>
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
