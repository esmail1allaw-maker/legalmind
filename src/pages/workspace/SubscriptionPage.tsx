import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { SubscriptionUpgradeModal } from '../../components/SubscriptionUpgradeModal';
import { SubscriptionFeatureList } from '../../components/SubscriptionFeatureList';
import { subscriptionQueryKeys, useFirmSubscription, useSubscriptionRequests } from '../../hooks/useSubscription';
import { SUBSCRIPTION_PLANS, getPlanLabel } from '../../constants/subscription';
import { submitSubscriptionRequest } from '../../lib/subscription';
import type { SubscriptionPlan } from '../../types/app';
export function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: subscriptionLoading, isError: subscriptionError } = useFirmSubscription();
  const { data: requests = [], isLoading: requestsLoading } = useSubscriptionRequests();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const pending = requests.find((r) => r.status === 'pending');

  const handleSubmit = async (payload: { transferReference: string; receiptFile: File }) => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      await submitSubscriptionRequest({
        plan: selectedPlan.id,
        amountYer: selectedPlan.amountYer,
        transferReference: payload.transferReference,
        receiptFile: payload.receiptFile
      });
      setFeedback('تم إرسال طلب التجديد. سيتم مراجعته وتفعيل حسابك قريباً.');
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.requests });
      setSelectedPlan(null);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'فشل إرسال طلب التجديد.');
    } finally {
      setSubmitting(false);
    }
  };

  if (subscriptionLoading || requestsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 mt-10 flex justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8 text-right">
      <div className="bg-gradient-to-l from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-2xl text-white shadow-lg space-y-4">
        <div className="flex items-start gap-3 justify-end">
          <div className="text-right flex-1">
            <h1 className="text-2xl font-black">اشتراك LegalMind Yemen</h1>
            <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed max-w-2xl mr-auto">
              منصة سحابية متكاملة لإدارة المكاتب القانونية في اليمن — قضايا، موكلين، تنفيذ، تقارير، وفريق عمل في مكان واحد.
            </p>
          </div>
          <div className="shrink-0 w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
        </div>
        {subscription ? (
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 font-bold">
              الباقة: {getPlanLabel(subscription.plan)}
            </span>
            <span className={`rounded-full px-3 py-1 font-bold ${subscription.isActive ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'}`}>
              {subscription.isActive ? 'نشط' : subscription.status === 'trial' ? 'شهر مجاني' : 'منتهي / مقفل'}
            </span>
            {subscription.expiresAt ? (
              <span className="rounded-full bg-amber-500/20 text-amber-100 border border-amber-400/30 px-3 py-1 font-bold">
                ينتهي في: {subscription.expiresAt.split('T')[0]}
              </span>
            ) : null}
          </div>
        ) : null}
        {pending ? (
          <p className="text-xs text-indigo-100 font-bold bg-white/10 border border-white/15 rounded-xl px-3 py-2">
            طلب تجديد قيد المراجعة (رقم الحوالة: {pending.transferReference})
          </p>
        ) : null}
        {feedback ? (
          <p className={`text-xs font-bold ${feedback.includes('فشل') ? 'text-rose-700' : 'text-emerald-200'}`}>{feedback}</p>
        ) : null}
        {subscriptionError ? (
          <p className="text-xs text-rose-200 font-bold">تعذر تحميل حالة الاشتراك. تحقق من الاتصال بالإنترنت.</p>
        ) : null}
        <p className="text-[10px] text-slate-400">التحويل عبر بنك الكريمي — جميع الباقات تشمل المميزات الأساسية الكاملة.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-2xl border p-6 sm:p-8 flex flex-col relative transition-shadow hover:shadow-xl ${plan.color}`}>
            {plan.badge ? (
              <span className="absolute -top-3 right-6 bg-gradient-to-l from-amber-500 to-amber-400 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md">
                {plan.badge}
              </span>
            ) : null}
            <div className="flex-1">
              <div className="space-y-1 mb-4">
                <h3 className="font-black text-lg text-slate-900">{plan.name}</h3>
                {plan.tagline ? <p className="text-[11px] text-slate-500 font-medium">{plan.tagline}</p> : null}
              </div>
              <div className="mb-1">
                <span className="text-3xl font-black text-slate-900 font-sans tracking-tight">{plan.price}</span>
                <span className="text-xs text-slate-400 mr-2 font-bold">ريال يمني — {plan.period}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {plan.monthlyEquivalent ? (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                    {plan.monthlyEquivalent}
                  </span>
                ) : null}
                {plan.savingsLabel ? (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                    {plan.savingsLabel}
                  </span>
                ) : null}
              </div>
              <div className="border-t border-slate-100 pt-5">
                <SubscriptionFeatureList features={plan.features} />
              </div>
            </div>
            <button
              type="button"
              disabled={Boolean(pending)}
              onClick={() => setSelectedPlan(plan)}
              className={`mt-8 w-full font-bold py-3 px-4 rounded-xl text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                plan.id === 'quarterly'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : plan.id === 'annual'
                    ? 'bg-indigo-950 hover:bg-indigo-900 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {pending ? 'طلب قيد المراجعة' : 'اشتراك / تجديد الآن'}
            </button>
          </div>
        ))}
      </div>

      <SubscriptionUpgradeModal
        open={Boolean(selectedPlan)}
        plan={selectedPlan}
        submitting={submitting}
        onClose={() => setSelectedPlan(null)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
