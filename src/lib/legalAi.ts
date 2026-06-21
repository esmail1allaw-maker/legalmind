import { supabase } from './supabaseClient';

export type LegalAiAction = 'summarize' | 'contract_draft' | 'legal_research';

export interface SummarizePayload {
  action: 'summarize';
  text: string;
}

export interface ContractDraftPayload {
  action: 'contract_draft';
  contractType: string;
  firstParty: string;
  secondParty: string;
  subject: string;
  amount?: string;
  duration?: string;
  specialTerms?: string;
  jurisdiction?: string;
}

export interface LegalResearchPayload {
  action: 'legal_research';
  query: string;
}

export type LegalAiPayload = SummarizePayload | ContractDraftPayload | LegalResearchPayload;

export interface LegalAiResponse {
  result: string;
  action: LegalAiAction;
}

export const CONTRACT_TYPES = [
  'عقد أتعاب محاماة',
  'عقد توكيل قانوني',
  'عقد عمل',
  'عقد إيجار',
  'عقد بيع',
  'اتفاقية صلح',
  'اتفاقية سرية',
  'عقد شراكة'
] as const;

const MAX_TEXT_FILE_BYTES = 512_000;

export async function callLegalAi(payload: LegalAiPayload): Promise<LegalAiResponse> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    throw new Error('يجب تسجيل الدخول لاستخدام المساعد القانوني.');
  }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error('إعدادات Supabase غير مكتملة.');
  }

  const response = await fetch(`${baseUrl}/functions/v1/legal-ai`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
      apikey: anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => ({}))) as { result?: string; error?: string; action?: LegalAiAction };

  if (!response.ok) {
    throw new Error(data.error ?? 'فشل طلب المساعد القانوني.');
  }

  if (!data.result) {
    throw new Error('لم يُرجع المساعد نتيجة.');
  }

  return { result: data.result, action: data.action ?? payload.action };
}

export async function readTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error('حجم الملف كبير. الحد الأقصى 500 كيلوبايت للملفات النصية.');
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!['txt', 'md', 'csv', 'json'].includes(ext)) {
    throw new Error('ارفع ملفاً نصياً (.txt أو .md) أو الصق نص المستند مباشرة. ملفات PDF تحتاج نسخ النص يدوياً.');
  }
  return (await file.text()).trim();
}

export async function checkLegalAiAccess(): Promise<boolean> {
  const { data, error } = await supabase.rpc('assert_ai_assistant_access');
  if (error) return false;
  return Boolean(data);
}
