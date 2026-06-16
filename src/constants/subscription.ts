import type { SubscriptionPlan, SubscriptionPlanId } from '../types/app';
import {
  ANNUAL_BONUS_FEATURES,
  BASE_PLAN_FEATURES,
  QUARTERLY_BONUS_FEATURES
} from './planFeatures';

export const KARIMI_BANK = {
  bankName: 'بنك الكريمي للتمويل الأصغر الإسلامي',
  accountName: 'LegalMind Yemen — [اسم المكتب/الشركة]',
  accountNumber: '0000-0000-0000-0000',
  iban: 'YE00BKRM00000000000000000000',
  note: 'يرجى كتابة اسم المكتب في خانة الملاحظات عند التحويل.'
} as const;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'اشتراك شهري',
    tagline: 'مرونة كاملة — تجديد كل شهر',
    price: '6,000',
    amountYer: 6000,
    period: 'شهر واحد',
    durationDays: 30,
    monthlyEquivalent: '6,000 ر.ي / شهر',
    features: [...BASE_PLAN_FEATURES],
    color: 'border-slate-200 hover:border-slate-300'
  },
  {
    id: 'quarterly',
    name: 'اشتراك 3 أشهر',
    tagline: 'الخيار المتوازن للمكاتب النشطة',
    price: '15,000',
    amountYer: 15000,
    period: '3 أشهر',
    durationDays: 90,
    monthlyEquivalent: '≈ 5,000 ر.ي / شهر',
    savingsLabel: 'وفر 17%',
    features: [...BASE_PLAN_FEATURES, ...QUARTERLY_BONUS_FEATURES],
    color: 'border-amber-400 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/25',
    badge: 'الأكثر طلباً'
  },
  {
    id: 'annual',
    name: 'اشتراك سنوي',
    tagline: 'أقل تكلفة — استقرار لعام كامل',
    price: '50,000',
    amountYer: 50000,
    period: '12 شهراً',
    durationDays: 365,
    monthlyEquivalent: '≈ 4,166 ر.ي / شهر',
    savingsLabel: 'وفر 31%',
    features: [...BASE_PLAN_FEATURES, ...ANNUAL_BONUS_FEATURES],
    color: 'border-indigo-700 shadow-md shadow-indigo-900/10',
    badge: 'أفضل توفير'
  }
];

export const PLAN_LABELS: Record<SubscriptionPlanId, string> = {
  trial: 'شهر مجاني',
  monthly: 'اشتراك شهري',
  quarterly: 'اشتراك 3 أشهر',
  annual: 'اشتراك سنوي'
};

export function getPlanById(id: SubscriptionPlanId): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

export function getPlanLabel(id: SubscriptionPlanId): string {
  return PLAN_LABELS[id] ?? id;
}

export function getPlanDurationDays(id: SubscriptionPlanId): number {
  const paid = getPlanById(id as Exclude<SubscriptionPlanId, 'trial'>);
  if (paid) return paid.durationDays;
  return 30;
}
