import { useCallback, useState } from 'react';
import {
  Bot,
  Copy,
  FileText,
  Loader2,
  Scale,
  ScrollText,
  Sparkles,
  Upload
} from 'lucide-react';
import { RichTextContent } from '../../components/ui/RichTextEditor';
import {
  callLegalAi,
  CONTRACT_TYPES,
  readTextFromFile,
  type LegalAiAction
} from '../../lib/legalAi';
import { sanitizeHtml } from '../../lib/sanitizeHtml';

type TabId = LegalAiAction;

const TABS: Array<{ id: TabId; label: string; icon: typeof FileText; desc: string }> = [
  { id: 'summarize', label: 'تلخيص مستندات', icon: FileText, desc: 'لخص مذكرات وعقود ومراسلات قانونية' },
  { id: 'contract_draft', label: 'مسودات عقود', icon: ScrollText, desc: 'أنشئ مسودة عقد جاهزة للمراجعة' },
  { id: 'legal_research', label: 'بحث قانوني', icon: Scale, desc: 'استفسارات وإطار قانوني يمني' }
];

function ResultPanel({
  result,
  onCopy
}: {
  result: string;
  onCopy: () => void;
}) {
  const html = sanitizeHtml(result.replace(/\n/g, '<br/>'));
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
      <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-2.5">
        <span className="text-xs font-black text-emerald-800">النتيجة</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-800 shadow-sm hover:bg-emerald-100"
        >
          <Copy className="h-3 w-3" />
          نسخ
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-4 text-sm leading-relaxed text-slate-800">
        <RichTextContent html={html} />
      </div>
    </div>
  );
}

export function LegalAiPage() {
  const [tab, setTab] = useState<TabId>('summarize');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Summarize
  const [docText, setDocText] = useState('');

  // Contract
  const [contractType, setContractType] = useState<string>(CONTRACT_TYPES[0]);
  const [firstParty, setFirstParty] = useState('');
  const [secondParty, setSecondParty] = useState('');
  const [subject, setSubject] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [specialTerms, setSpecialTerms] = useState('');
  const [jurisdiction, setJurisdiction] = useState('الجمهورية اليمنية');

  // Research
  const [query, setQuery] = useState('');

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    try {
      const text = await readTextFromFile(file);
      setDocText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر قراءة الملف');
    }
  }, []);

  const runAction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let response;
      if (tab === 'summarize') {
        response = await callLegalAi({ action: 'summarize', text: docText });
      } else if (tab === 'contract_draft') {
        response = await callLegalAi({
          action: 'contract_draft',
          contractType,
          firstParty: firstParty || 'الطرف الأول',
          secondParty: secondParty || 'الطرف الثاني',
          subject,
          amount: amount || undefined,
          duration: duration || undefined,
          specialTerms: specialTerms || undefined,
          jurisdiction
        });
      } else {
        response = await callLegalAi({ action: 'legal_research', query });
      }
      setResult(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-5xl space-y-6 px-4 pb-12 text-right" dir="rtl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-l from-[#7A1F2B] via-[#8B2433] to-indigo-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              مدعوم بالذكاء الاصطناعي
            </div>
            <h1 className="text-2xl font-black">المساعد القانوني الذكي</h1>
            <p className="mt-1 max-w-xl text-xs text-white/80 leading-relaxed">
              تلخيص مستندات، إعداد مسودات عقود، وبحث قانوني — للمساعدة في عمل المكتب. المخرجات مسودات
              للمراجعة من محامٍ مرخّص وليست استشارة ملزمة.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <Bot className="h-10 w-10 text-amber-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError(null);
                setResult(null);
              }}
              className={`rounded-xl border p-3 text-right transition-all ${
                active
                  ? 'border-[#7A1F2B] bg-[#FFF9FA] shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <Icon className={`mb-1.5 h-5 w-5 ${active ? 'text-[#7A1F2B]' : 'text-slate-400'}`} />
              <p className="text-xs font-black text-slate-900">{t.label}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {tab === 'summarize' && (
          <>
            <label className="block text-xs font-bold text-slate-700">نص المستند</label>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              rows={10}
              placeholder="الصق نص المذكرة أو العقد أو المراسلة هنا..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              رفع ملف نصي (.txt / .md)
              <input
                type="file"
                accept=".txt,.md,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFileUpload(f);
                  e.target.value = '';
                }}
              />
            </label>
          </>
        )}

        {tab === 'contract_draft' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">نوع العقد</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الطرف الأول</label>
              <input
                value={firstParty}
                onChange={(e) => setFirstParty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="اسم الموكل / الشركة"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الطرف الثاني</label>
              <input
                value={secondParty}
                onChange={(e) => setSecondParty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="اسم الطرف الآخر"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">موضوع العقد *</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="مثال: تمثيل قانوني في قضية تجارية"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المبلغ / القيمة</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="اختياري"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المدة</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="مثال: سنة واحدة"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">شروط خاصة</label>
              <textarea
                value={specialTerms}
                onChange={(e) => setSpecialTerms(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="أي بنود إضافية تريد تضمينها"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">الاختصاص القضائي</label>
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {tab === 'legal_research' && (
          <>
            <label className="block text-xs font-bold text-slate-700">موضوع البحث أو السؤال</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={8}
              placeholder="مثال: ما إجراءات رفع دعوى تعويض في القانون اليمني؟ ما الأوراق المطلوبة؟"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
            />
          </>
        )}

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => void runAction()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7A1F2B] px-6 py-2.5 text-xs font-black text-white hover:bg-[#641923] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'جاري المعالجة...' : tab === 'summarize' ? 'تلخيص المستند' : tab === 'contract_draft' ? 'إنشاء مسودة العقد' : 'بدء البحث القانوني'}
        </button>
      </div>

      {result ? <ResultPanel result={result} onCopy={() => void copyResult()} /> : null}

      <p className="text-[10px] leading-relaxed text-slate-400">
        تنبيه: المخرجات مولّدة آلياً وقد تحتوي على أخطاء. يجب مراجعتها من محامٍ مرخّص قبل الاعتماد أو
        التقديم للمحاكم. لا تشارك بيانات سرية للغاية دون موافقة الموكل.
      </p>
    </div>
  );
}
