import { Check } from 'lucide-react';
import type { PlanFeature } from '../types/app';
import { groupPlanFeatures } from '../constants/planFeatures';

interface SubscriptionFeatureListProps {
  features: PlanFeature[];
  compact?: boolean;
}

export function SubscriptionFeatureList({ features, compact = false }: SubscriptionFeatureListProps) {
  const groups = groupPlanFeatures(features);

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-2.5">{group.title}</p>
          <ul className={compact ? 'space-y-2.5' : 'space-y-3'}>
            {group.items.map((feature) => (
              <li key={`${group.title}-${feature.label}`} className="flex items-start gap-2.5 text-right">
                <span
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${
                    feature.highlight
                      ? 'bg-amber-50 border-amber-300 text-amber-600'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`leading-snug ${feature.highlight ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {feature.label}
                  </p>
                  {feature.description && !compact ? (
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{feature.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
