import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { AuthShell } from '../components/auth/AuthShell';
import { isValidEmail } from '../lib/sanitize';
import type { AuthResult } from '../lib/auth';

interface ForgotPasswordPageProps {
  onSubmit: (email: string) => Promise<AuthResult>;
  onNavigateLogin: () => void;
}

export function ForgotPasswordPage({ onSubmit, onNavigateLogin }: ForgotPasswordPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email') as string;

    if (!isValidEmail(email)) {
      setError('البريد الإلكتروني غير صالح.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onSubmit(email.trim().toLowerCase());
      if (!result.success) {
        setError(result.error ?? 'تعذر إرسال رابط الاستعادة. حاول مرة أخرى.');
        return;
      }
      setEmailSent(email.trim().toLowerCase());
      setSuccess('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوبة.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="تحقق من بريدك"
        subtitle="إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحتوي على رابط آمن لإعادة تعيين كلمة المرور."
        icon={CheckCircle2}
      >
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 font-medium text-center" role="status">
          {success}
        </div>
        {emailSent ? (
          <p className="text-xs text-slate-500 text-center mt-3 break-all" dir="ltr">
            {emailSent}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          العودة لتسجيل الدخول
          <ArrowRight className="w-4 h-4 rotate-180" aria-hidden="true" />
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="نسيت كلمة المرور؟"
      subtitle="أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور."
      icon={Mail}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
            البريد الإلكتروني المسجل
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@firm.com"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 outline-none text-sm text-right"
          />
        </div>

        {error ? (
          <p className="text-rose-600 text-xs font-bold rounded-lg bg-rose-50 border border-rose-100 px-3 py-2" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7A1F2B] hover:bg-[#651922] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          إرسال رابط إعادة التعيين
        </button>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1"
        >
          العودة لتسجيل الدخول
        </button>
      </form>
    </AuthShell>
  );
}
