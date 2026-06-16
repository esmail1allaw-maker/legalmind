import { Copy, ExternalLink, MessageCircle, X } from 'lucide-react';
import type { Invitation } from '../types/app';
import { buildInvitationShareMessage, openInvitationWhatsApp } from '../lib/invitationShare';

interface InvitationLinkModalProps {
  open: boolean;
  invitation: Invitation | null;
  firmName?: string;
  onClose: () => void;
  onCopied?: (message: string) => void;
}

export function InvitationLinkModal({ open, invitation, firmName, onClose, onCopied }: InvitationLinkModalProps) {
  if (!open || !invitation?.inviteUrl) return null;

  const message = buildInvitationShareMessage(invitation.inviteUrl, firmName);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitation.inviteUrl!);
      onCopied?.('تم نسخ رابط الدعوة.');
    } catch {
      onCopied?.('تعذر نسخ الرابط. انسخه يدوياً من الحقل أدناه.');
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      onCopied?.('تم نسخ رسالة الدعوة.');
    } catch {
      onCopied?.('تعذر نسخ الرسالة.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg p-6 space-y-4 text-right">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-lg font-black text-slate-900">تم إنشاء الدعوة</h3>
            <p className="text-xs text-slate-500 mt-1">
              النظام <strong className="text-slate-700">لا يرسل بريداً تلقائياً</strong> حالياً. انسخ الرابط أو أرسله عبر واتساب للمدعو:
              <span className="font-mono text-indigo-700"> {invitation.email}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold text-slate-500 mb-1">رابط الدعوة</p>
          <p className="text-[11px] font-mono text-slate-800 break-all leading-relaxed" dir="ltr">
            {invitation.inviteUrl}
          </p>
        </div>

        <textarea
          readOnly
          value={message}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-right resize-none bg-white"
        />

        <div className="flex flex-wrap gap-2 justify-start">
          <button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
            <Copy className="w-3.5 h-3.5" /> نسخ الرابط
          </button>
          <button type="button" onClick={() => void copyMessage()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">
            <Copy className="w-3.5 h-3.5" /> نسخ الرسالة
          </button>
          {invitation.phone ? (
            <button
              type="button"
              onClick={() => openInvitationWhatsApp(invitation.phone, invitation.inviteUrl!, firmName)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              <MessageCircle className="w-3.5 h-3.5" /> واتساب
            </button>
          ) : null}
          <a
            href={invitation.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-50"
          >
            <ExternalLink className="w-3.5 h-3.5" /> فتح الرابط
          </a>
        </div>

        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
          لإرسال بريد تلقائي مستقبلاً: فعّل SMTP في Supabase → Authentication → Email، أو انشر Edge Function `invite-user`.
        </p>
      </div>
    </div>
  );
}
