import { useState, type FormEvent } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { AuthShell } from '../components/auth/AuthShell';
import { usePasswordRecoverySession } from '../hooks/usePasswordRecoverySession';
import { isStrongPassword, PASSWORD_REQUIREMENTS_AR } from '../lib/sanitize';
import type { AuthResult } from '../lib/auth';

interface ResetPasswordPageProps {
  onSubmit: (password: string) => Promise<AuthResult>;
  onNavigateForgot: () => void;
  onNavigateLogin: () => void;
  onSuccess: () => void;
}

export function ResetPasswordPage({
  onSubmit,
  onNavigateForgot,
  onNavigateLogin,
  onSuccess
}: ResetPasswordPageProps) {
  const { ready, hasSession } = usePasswordRecoverySession(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = fd.get('password') as string;
    const confirm = fd.get('confirm') as string;

    if (!isStrongPassword(password)) {
      setError(PASSWORD_REQUIREMENTS_AR);
      setSuccess('');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onSubmit(password);
      if (!result.success) {
        setError(result.error ?? 'تعذر تحديث كلمة المرور.');
        return;
      }
      setSuccess('تم تحديث كلمة المرور بنجاح! جاري تحويلك إلى لوحة التحكم...');
      window.setTimeout(() => onSuccess(), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A1F2B]" aria-hidden="true" />
        <p className="text-sm text-slate-500 mt-3">جاري التحقق من رابط الاستعادة...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell
        title="رابط غير صالح أو منتهٍ"
        subtitle="يبدو أن رابط إعادة التعيين لم يعد صالحاً. اطلب رابطاً جديداً من صفحة نسيت كلمة المرور."
        icon={KeyRound}
      >
        <button
          type="button"
          onClick={onNavigateForgot}
          className="w-full bg-[#7A1F2B] hover:bg-[#651922] text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          طلب رابط جديد
        </button>
        <button
          type="button"
          onClick={onNavigateLogin}
          className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mt-3"
        >
          العودة لتسجيل الدخول
        </button>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="تم بنجاح" subtitle="كلمة المرور الجديدة جاهزة للاستخدام." icon={CheckCircle2}>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 font-medium text-center" role="status">
          {success}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="إعادة تعيين كلمة المرور"
      subtitle="اختر كلمة مرور قوية جديدة لحسابك في LegalMind."
      icon={KeyRound}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-xs font-bold text-slate-700 mb-1.5">
            كلمة المرور الجديدة
          </label>
          <input
            id="reset-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 outline-none text-sm"
          />
          <p className="text-[10px] text-slate-400 mt-1.5">{PASSWORD_REQUIREMENTS_AR}</p>
        </div>

        <div>
          <label htmlFor="reset-confirm" className="block text-xs font-bold text-slate-700 mb-1.5">
            تأكيد كلمة المرور
          </label>
          <input
            id="reset-confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 outline-none text-sm"
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
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          حفظ كلمة المرور الجديدة
        </button>
      </form>
    </AuthShell>
  );
}
