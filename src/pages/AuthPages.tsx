import type { UserRole } from '../types/app';
import { Briefcase, Scale } from 'lucide-react';

interface AuthPagesProps {
  currentPage: 'login' | 'register' | 'forgot';
  role: UserRole;
  setRole: (role: UserRole) => void;
  onNavigate: (page: 'login' | 'register' | 'forgot') => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (name: string, email: string, company: string) => void;
}

export function AuthPages({ currentPage, role, setRole, onNavigate, onLogin, onRegister }: AuthPagesProps) {
  if (currentPage === 'register') {
    return (
      <div className="max-w-lg mx-auto mt-16 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-6">
            <div className="bg-indigo-900 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-3 shadow">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">إنشاء حساب مكتب محاماة جديد</h2>
            <p className="text-xs text-slate-500 mt-1">ابدأ بتهيئة النظام الرقمي لمكتبك القانوني بثوانٍ معدودة</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              onRegister(data.get('name') as string, data.get('email') as string, data.get('company') as string);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المحامي الشريك / المدير</label>
                <input name="name" type="text" required placeholder="مثال: أ. يحيى السنيدار" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم مكتب المحاماة / الشركة القانونية</label>
                <input name="company" type="text" required placeholder="مثال: شركة المتحدون للمحاماة" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للمكتب</label>
              <input name="email" type="email" required placeholder="office@firm.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" />
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-md mt-2">
              تأكيد تسجيل المكتب والبدء مجاناً
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentPage === 'forgot') {
    return (
      <div className="max-w-md mx-auto mt-24 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900">استعادة كلمة المرور</h2>
            <p className="text-xs text-slate-500 mt-2">أدخل بريدك الإلكتروني وسيرسل لك رابط آمن لاستعادة كلمة المرور.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني المسجل بالمكتب</label>
              <input type="email" placeholder="name@firm.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm text-right" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              إرسال كود الاسترجاع
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <div className="bg-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 mx-auto mb-3 shadow">
            <Scale className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">تسجيل الدخول للمنصة</h2>
          <p className="text-xs text-slate-500 mt-1">الالتحاق بالنظام لإدارة مكاتب المحاماة في اليمن</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onLogin(data.get('email') as string, data.get('password') as string);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني المهني</label>
            <input
              name="email"
              type="email"
              defaultValue="n.sharaee@legalmind.ye"
              placeholder="name@firm.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm text-right"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">كلمة المرور السرية</label>
              <button type="button" onClick={() => onNavigate('forgot')} className="text-[10px] text-indigo-700 hover:underline font-bold">
                نسيت كلمة المرور؟
              </button>
            </div>
            <input
              name="password"
              type="password"
              defaultValue="yemenLaw2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تحديد دورك الافتراضي للتجربة</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-white"
            >
              <option value="firm_manager">مدير مكتب شركاء (صلاحيات كاملة)</option>
              <option value="lawyer">محامٍ ممارس</option>
              <option value="admin">مدير نظام</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-md mt-2">
            تسجيل الدخول الآمن
          </button>
        </form>

        <div className="border-t border-slate-100 my-6 pt-4 text-center">
          <span className="text-xs text-slate-500">ليس لديك حساب مكتب مفعّل؟</span>{' '}
          <button type="button" onClick={() => onNavigate('register')} className="text-xs text-indigo-700 font-bold hover:underline">
            سجل مكتبك الآن مجاناً
          </button>
        </div>
      </div>
    </div>
  );
}
