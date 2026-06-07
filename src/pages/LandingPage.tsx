import { Award, ArrowRight, Briefcase, Calendar, Bell, FileText, Shield, TrendingUp, Scale } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'login' | 'register') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl text-indigo-950">
            <Scale className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">LegalMind <span className="text-amber-400">Yemen</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-slate-200 hover:text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-800/40 transition-colors"
          >
            دخول المحامين
          </button>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-lg hover:shadow-amber-500/15"
          >
            اشترك الآن مجاناً
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center md:text-right grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-6">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
            <Award className="w-3.5 h-3.5" />
            المنصة الرقمية الأولى للمحاماة في اليمن لعام 2026
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
            أدر مكتب المحاماة الخاص بك <br />
            <span className="text-amber-400 bg-clip-text">بذكاء وسرية مطلقة</span>
          </h1>
          <p className="text-base sm:text-lg text-indigo-200 max-w-2xl leading-relaxed">
            نظام حوسبة قانوني متكامل يمني الطابع؛ يُنظم لك القضايا والعملاء، ويجدول الجلسات والمرافعات، ويحفظ المستندات بسحابة آمنة، لتتفرغ لتطبيق العدالة وصناعة الفارق.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-start">
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-4 rounded-xl text-base shadow-xl hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>ابدأ الفترة التجريبية لمكتبك</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="border border-indigo-700 hover:bg-indigo-800 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors"
            >
              عرض الدخول التجريبي السريع
            </button>
          </div>
        </div>

        <div className="md:col-span-5 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl rotate-3 opacity-10 blur-xl" />
          <div className="relative bg-indigo-950/80 backdrop-blur-md border border-indigo-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-indigo-900 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-indigo-300 font-mono">لوحة تحكم القانوني - نسخة تجريبية</span>
            </div>
            <div className="space-y-4">
              <div className="bg-indigo-900/50 p-4 rounded-xl border border-indigo-800/40 text-right">
                <div className="flex justify-between text-xs text-indigo-300 mb-1">
                  <span>إحصائيات القضايا المنظورة</span>
                  <span className="text-amber-400 font-bold">87% نسبة نجاح الأحكام</span>
                </div>
                <div className="w-full bg-indigo-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[87%] rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="bg-indigo-900/30 p-3 rounded-xl">
                  <span className="text-[11px] text-indigo-300 block">الجلسات القادمة اليوم</span>
                  <span className="text-xl font-black text-amber-400 font-sans">3 جلسات</span>
                </div>
                <div className="bg-indigo-900/30 p-3 rounded-xl">
                  <span className="text-[11px] text-indigo-300 block">العملاء النشطون بالمكتب</span>
                  <span className="text-xl font-black text-white font-sans">4 عملاء</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 py-24 border-t border-indigo-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-black">لماذا يعتمد المحامون اليمنيون على LegalMind؟</h2>
            <p className="text-slate-400 text-sm">تم بناء منصتنا بالتشاور مع خبراء قانونيين وقضاة في اليمن لتطابق طبيعة المحاكمات والتوثيقات وإدارة مكاتب المحاماة بشكل مثالي.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
            {[
              { title: 'إدارة ملفات القضايا الرقمية', desc: 'تنظيم قضاياك وتاريخ المذكرات مع ربطها التلقائي بالعميل والمحامي الممارس.', icon: Briefcase },
              { title: 'أجندة الجلسات الذكية', desc: 'نظام لتنبيهك بكل جلسة قادمة ومحكمة الانعقاد في عموم المحافظات.', icon: Calendar },
              { title: 'خزانة سحابة آمنة', desc: 'ارفع العرائض والمذكرات بأمان تام مع تشفير لحظي.', icon: FileText },
              { title: 'صلاحيات الفريق والأدوار', desc: 'وزع الأدوار بين المحامي الشريك والمستشار والمتدرب للحفاظ على السرية.', icon: Shield },
              { title: 'تقارير الأداء المالي', desc: 'احصل على تحليل دقيق للإيرادات والمدفوعات.', icon: TrendingUp },
              { title: 'تنبيهات فورية لحظية', desc: 'لا تفوت جلسة أو موعد تقديم عريضة استئناف.', icon: Bell }
            ].map((feature) => (
              <div key={feature.title} className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl hover:border-amber-500/30 transition-all hover:-translate-y-1">
                <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-amber-400 mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
