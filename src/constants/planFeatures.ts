import type { PlanFeature } from '../types/app';

const G = {
  legal: 'إدارة المكتب القانوني',
  clients: 'التواصل مع الموكلين',
  team: 'الفريق والأمان',
  platform: 'البنية التحتية والدعم'
} as const;

/** Core capabilities included in every paid plan. */
export const BASE_PLAN_FEATURES: PlanFeature[] = [
  {
    group: G.legal,
    label: 'إدارة القضايا والأرشيف',
    description: 'فتح، متابعة، وأرشفة ملفات القضايا أمام المحاكم اليمنية'
  },
  {
    group: G.legal,
    label: 'إدارة العملاء والموكلين',
    description: 'سجل موحد للأفراد والشركات مع ربط القضايا والنشاط'
  },
  {
    group: G.legal,
    label: 'إدارة طلبات التنفيذ',
    description: 'تسجيل ومتابعة طلبات التنفيذ وربطها بالقضية والموكل'
  },
  {
    group: G.legal,
    label: 'جدولة الجلسات والمواعيد',
    description: 'تقويم جلسات مع حالة المحكمة وملاحظات المتابعة'
  },
  {
    group: G.legal,
    label: 'خزانة المستندات السحابية',
    description: 'رفع وتصنيف المستندات القانونية ضمن مساحة المكتب'
  },
  {
    group: G.clients,
    label: 'إرسال التقارير عبر WhatsApp',
    description: 'تقارير مختصرة للموكل بنقرة واحدة عبر واتساب',
    highlight: true
  },
  {
    group: G.clients,
    label: 'إرسال التقارير عبر SMS',
    description: 'إشعارات نصية للموكلين حتى بدون إنترنت',
    highlight: true
  },
  {
    group: G.clients,
    label: 'التذكيرات الذكية',
    description: 'تنبيهات الجلسات والمواعيد للفريق والموكلين'
  },
  {
    group: G.team,
    label: 'إدارة المحامين والموظفين',
    description: 'أدوار وصلاحيات: مدير مكتب، محامٍ، مساعد، متدرب'
  },
  {
    group: G.team,
    label: 'التقارير المالية ولوحة الأداء',
    description: 'إيرادات، معدلات الفوز، وإحصائيات المكتب لحظياً'
  },
  {
    group: G.team,
    label: 'مساحة عمل معزولة لكل مكتب',
    description: 'فصل تام للبيانات بين المكاتب مع حماية RLS'
  },
  {
    group: G.team,
    label: 'مصادقة ثنائية (MFA)',
    description: 'طبقة أمان إضافية لحسابات المستخدمين'
  },
  {
    group: G.platform,
    label: 'مزامنة سحابية وعمل دون اتصال',
    description: 'العمل أونلاين وأوفلاين مع مزامنة تلقائية للبيانات'
  },
  {
    group: G.platform,
    label: 'نسخ احتياطي واسترداد',
    description: 'حماية بيانات المكتب على بنية Supabase السحابية'
  },
  {
    group: G.platform,
    label: 'دعم فني باللغة العربية',
    description: 'مساعدة في التفعيل، الإعداد، والاستخدام اليومي'
  }
];

export const QUARTERLY_BONUS_FEATURES: PlanFeature[] = [
  {
    group: G.platform,
    label: 'أولوية في مراجعة طلبات التفعيل',
    description: 'معالجة أسرع لطلبات التجديد بعد التحويل',
    highlight: true
  },
  {
    group: G.platform,
    label: 'توفير 17% مقارنة بالدفع الشهري',
    description: '5000 ر.ي شهرياً بدلاً من 6000 ر.ي',
    highlight: true
  }
];

export const ANNUAL_BONUS_FEATURES: PlanFeature[] = [
  {
    group: G.platform,
    label: 'أولوية دعم + مساعدة في الإعداد',
    description: 'مرافقة في تهيئة المكتب واستيراد البيانات الأولية',
    highlight: true
  },
  {
    group: G.platform,
    label: 'توفير 31% — أفضل قيمة',
    description: '4166 ر.ي شهرياً تقريباً — أقل تكلفة على المدى الطويل',
    highlight: true
  }
];

/** Flat list for trial / marketing snippets. */
export const SUBSCRIPTION_PLAN_FEATURE_LABELS = [
  'إدارة طلبات التنفيذ',
  'إدارة العملاء',
  'إرسال التقارير للعملاء عبر WhatsApp',
  'إرسال التقارير للعملاء عبر رسائل SMS'
] as const;

export const TRIAL_PLAN_FEATURES = [
  'شهر مجاني كامل — جميع المميزات',
  ...SUBSCRIPTION_PLAN_FEATURE_LABELS
] as const;

export function groupPlanFeatures(features: PlanFeature[]): { title: string; items: PlanFeature[] }[] {
  const order: string[] = [];
  const map = new Map<string, PlanFeature[]>();

  for (const feature of features) {
    const title = feature.group ?? 'المميزات';
    if (!map.has(title)) {
      map.set(title, []);
      order.push(title);
    }
    map.get(title)!.push(feature);
  }

  return order.map((title) => ({ title, items: map.get(title)! }));
}
