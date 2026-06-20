import type { LawyersPageProps } from './types';
export function LawyersPage({ lawyers }: LawyersPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900">أعضاء المكتب والشركاء الممارسين</h1>
          <p className="text-xs text-slate-500 font-medium">قائمة المحامين والشركاء في المكتب القانوني لإدارة المرافعات.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
        {lawyers.map((lawyer) => (
          <div key={lawyer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-slate-100 flex items-center justify-center text-indigo-950 font-bold mx-auto text-lg">{lawyer.name.substring(3, 5)}</div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">{lawyer.name}</h3>
              <p className="text-[10px] text-amber-600 font-bold">{lawyer.role}</p>
              <p className="text-[11px] text-slate-500 mt-1">{lawyer.specialization}</p>
            </div>
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1 text-[11px] text-slate-400">
              <span className="font-mono">{lawyer.email}</span>
              <span className="font-mono">{lawyer.phone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

