import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  desc: string;
  change: string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  borderStyle: string;
}

export function StatCard({ title, value, desc, change, icon: Icon, iconBg, iconText, borderStyle }: StatCardProps) {
  return (
    <div className={`bg-white p-5 rounded-2xl border ${borderStyle} shadow-sm hover:shadow-md transition-all duration-300 text-right space-y-3`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] text-slate-400 font-bold">{title}</span>
        <div className={`${iconBg} ${iconText} p-2 rounded-xl`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <span className="text-3xl font-black text-slate-800 tracking-tight block font-sans">{value}</span>
        <span className="text-[10px] text-slate-500 mt-1 block">{desc}</span>
      </div>
      <div className="border-t border-slate-100 pt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <span>{change}</span>
      </div>
    </div>
  );
}
