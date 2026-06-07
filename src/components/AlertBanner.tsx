import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { AlertState } from '../types/app';

interface AlertBannerProps {
  alert: AlertState;
}

const iconMap = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info
};

export function AlertBanner({ alert }: AlertBannerProps) {
  const Icon = iconMap[alert.type];

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-slate-900 text-white py-3.5 px-6 rounded-xl shadow-2xl border-l-4 border-amber-500 transition-transform duration-300">
      <Icon className="w-5 h-5 text-slate-100" />
      <span className="text-sm font-medium">{alert.text}</span>
    </div>
  );
}
