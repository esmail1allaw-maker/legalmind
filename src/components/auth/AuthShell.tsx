import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AppLogo } from '../AppLogo';

interface AuthShellProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, icon: Icon, children }: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 via-white to-amber-50/40">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="text-center mb-6">
            <AppLogo variant="law" size="md" className="mx-auto mb-4 shadow-md" />
            {Icon ? <Icon className="w-9 h-9 text-[#7A1F2B] mx-auto mb-3" aria-hidden="true" /> : null}
            <h1 className="text-2xl font-black text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{subtitle}</p>
          </div>
          {children}
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4">LegalMind Yemen — منصة إدارة مكاتب المحاماة</p>
      </div>
    </div>
  );
}
