import JSZip from 'jszip';
import type {
  CaseFinancialSummary,
  CasePayment,
  CaseRecord,
  CaseTimelineEvent,
  DocumentItem,
  ReceiptVoucher,
  SessionItem
} from '../types/app';
import { getDocumentDownloadUrl } from './api';
import { fetchCaseFinancialSummary, fetchCasePayments } from './caseFinancials';
import { fetchCaseTimeline } from './caseTimeline';
import { fetchCaseReceipts } from './receiptVoucher';

const EVENT_TYPE_LABELS: Record<string, string> = {
  case_created: 'إنشاء القضية',
  case_updated: 'تحديث القضية',
  status_changed: 'تغيير الحالة',
  document_uploaded: 'رفع مستند',
  payment_received: 'استلام دفعة',
  receipt_printed: 'طباعة سند',
  session_added: 'إضافة جلسة',
  session_updated: 'تحديث جلسة',
  note_added: 'ملاحظة',
  lawyer_assigned: 'تغيير المحامي',
  permission_changed: 'تغيير صلاحية',
  system: 'حدث نظام'
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'ملف';
}

function exportFilename(caseTitle: string, ext: string): string {
  const safeName = caseTitle.replace(/[^\w\u0600-\u06FF\s-]/g, '').trim() || 'case';
  return `قضية-${safeName}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function guessExtension(mime: string): string {
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('png')) return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('word')) return '.docx';
  return '';
}

/** تنزيل مستند واحد إلى الجهاز */
export async function downloadCaseDocument(doc: DocumentItem): Promise<void> {
  const url = await getDocumentDownloadUrl(doc.id);
  const response = await fetch(url);
  if (!response.ok) throw new Error('فشل تحميل المستند');

  const blob = await response.blob();
  const ext = doc.title.includes('.') ? '' : guessExtension(blob.type);
  const filename = ext && !doc.title.endsWith(ext) ? `${doc.title}${ext}` : doc.title;
  triggerBlobDownload(blob, filename);
}

export interface CaseExportBundle {
  caseRecord: CaseRecord;
  firmName: string;
  sessions: SessionItem[];
  documents: DocumentItem[];
  summary: CaseFinancialSummary | null;
  payments: CasePayment[];
  timeline: CaseTimelineEvent[];
  receipts: ReceiptVoucher[];
}

export async function fetchCaseExportBundle(
  caseId: string,
  caseRecord: CaseRecord,
  firmName: string,
  sessions: SessionItem[],
  documents: DocumentItem[]
): Promise<CaseExportBundle> {
  const [summary, payments, timeline, receipts] = await Promise.all([
    fetchCaseFinancialSummary(caseId),
    fetchCasePayments(caseId),
    fetchCaseTimeline(caseId),
    fetchCaseReceipts(caseId)
  ]);

  return {
    caseRecord,
    firmName,
    sessions: sessions.filter((s) => s.caseId === caseId),
    documents: documents.filter((d) => d.caseId === caseId),
    summary,
    payments,
    timeline,
    receipts
  };
}

function tableRow(cells: string[]): string {
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
}

function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

function chronologicalTimeline(timeline: CaseTimelineEvent[]): CaseTimelineEvent[] {
  return [...timeline].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function buildCaseExportHtml(bundle: CaseExportBundle): string {
  const { caseRecord: c, firmName, sessions, documents, summary, payments, timeline, receipts } = bundle;
  const exportedAt = new Date().toLocaleString('ar-YE');
  const orderedTimeline = chronologicalTimeline(timeline);
  const lawyerChanges = orderedTimeline.filter((ev) => ev.eventType === 'lawyer_assigned');

  const sessionsRows = sessions.length
    ? sessions.map((s) =>
        tableRow([
          escapeHtml(s.date),
          escapeHtml(s.time),
          escapeHtml(s.status),
          escapeHtml(s.court),
          escapeHtml(s.type || '—'),
          escapeHtml(s.judgeName || '—'),
          escapeHtml(s.sessionOutcome ? stripHtml(s.sessionOutcome) : '—')
        ])
      ).join('')
    : tableRow(['—', '—', '—', '—', '—', '—', 'لا توجد جلسات']);

  const docsRows = documents.length
    ? documents.map((d) =>
        tableRow([
          escapeHtml(d.title),
          escapeHtml(d.category),
          escapeHtml(d.dateUploaded),
          escapeHtml(d.size || '—')
        ])
      ).join('')
    : tableRow(['—', '—', '—', 'لا توجد مستندات']);

  const paymentsRows = payments.length
    ? payments.map((p) =>
        tableRow([
          escapeHtml(p.paymentDate),
          escapeHtml(p.amount.toLocaleString('ar-YE')),
          escapeHtml(p.paymentMethod),
          escapeHtml(p.notes || '—')
        ])
      ).join('')
    : tableRow(['—', '—', '—', 'لا توجد دفعات']);

  const receiptsRows = receipts.length
    ? receipts.map((r) =>
        tableRow([
          escapeHtml(r.receiptNumber),
          escapeHtml(r.amount.toLocaleString('ar-YE')),
          escapeHtml(r.paymentMethod || '—'),
          escapeHtml(new Date(r.printedAt).toLocaleString('ar-YE'))
        ])
      ).join('')
    : tableRow(['—', '—', '—', 'لا توجد سندات']);

  const lawyerRows = lawyerChanges.length
    ? lawyerChanges.map((ev) =>
        tableRow([
          escapeHtml(new Date(ev.createdAt).toLocaleString('ar-YE')),
          escapeHtml(ev.title),
          escapeHtml(ev.details || '—'),
          escapeHtml(ev.actorName || '—')
        ])
      ).join('')
    : tableRow(['—', '—', '—', 'لم يُسجَّل تغيير للمحامي بعد']);

  const timelineRows = orderedTimeline.length
    ? orderedTimeline.map((ev) =>
        tableRow([
          escapeHtml(new Date(ev.createdAt).toLocaleString('ar-YE')),
          escapeHtml(formatEventType(ev.eventType)),
          escapeHtml(ev.title),
          escapeHtml(ev.details || '—'),
          escapeHtml(ev.actorName || '—')
        ])
      ).join('')
    : tableRow(['—', '—', '—', '—', 'لا توجد أحداث']);

  const financialBlock = summary
    ? `<ul>
        <li><strong>قيمة العقد:</strong> ${summary.contractTotal.toLocaleString('ar-YE')} ${escapeHtml(summary.currency)}</li>
        <li><strong>المدفوع:</strong> ${summary.totalPaid.toLocaleString('ar-YE')} ${escapeHtml(summary.currency)}</li>
        <li><strong>المتبقي:</strong> ${summary.remaining.toLocaleString('ar-YE')} ${escapeHtml(summary.currency)}</li>
        <li><strong>نسبة السداد:</strong> ${summary.paymentPercentage}%</li>
        <li><strong>تاريخ العقد:</strong> ${escapeHtml(summary.contractDate ?? '—')}</li>
      </ul>`
    : '<p>لا تتوفر بيانات مالية.</p>';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>ملف القضية — ${escapeHtml(c.title)}</title>
  <style>
    body{font-family:Tahoma,Arial,sans-serif;padding:28px;color:#111;line-height:1.6;max-width:960px;margin:0 auto}
    h1{font-size:22px;color:#7A1F2B;margin:0 0 4px}
    h2{font-size:16px;color:#7A1F2B;border-bottom:2px solid #7A1F2B;padding-bottom:6px;margin:28px 0 12px}
    .meta{color:#64748b;font-size:13px;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:8px}
    .grid div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}
    .grid span{display:block;font-size:11px;color:#64748b}
    .grid strong{font-size:14px;color:#0f172a}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
    th,td{border:1px solid #cbd5e1;padding:8px;text-align:right;vertical-align:top}
    th{background:#f1f5f9;font-weight:bold}
    ul{margin:0;padding-right:20px}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
    @media print{
      body{padding:12px}
      .no-print{display:none}
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(c.title)}</h1>
  <p class="meta">${escapeHtml(firmName)} • ${escapeHtml(c.court_case_number)} • ${escapeHtml(c.clientName)}</p>
  <p class="meta">تاريخ التصدير: ${escapeHtml(exportedAt)}</p>

  <h2>بيانات القضية</h2>
  <div class="grid">
    <div><span>المحكمة</span><strong>${escapeHtml(c.court)}</strong></div>
    <div><span>نوع القضية</span><strong>${escapeHtml(c.case_type)}</strong></div>
    <div><span>المرحلة</span><strong>${escapeHtml(c.case_stage)}</strong></div>
    <div><span>الحالة</span><strong>${escapeHtml(c.status)}</strong></div>
    <div><span>المحامي الحالي</span><strong>${escapeHtml(c.lawyerName ?? '—')}</strong></div>
    <div><span>تاريخ الفتح</span><strong>${escapeHtml(c.dateStarted)}</strong></div>
  </div>
  ${c.description ? `<p><strong>الوصف:</strong> ${escapeHtml(c.description)}</p>` : ''}
  ${c.notes ? `<p><strong>ملاحظات:</strong> ${escapeHtml(c.notes)}</p>` : ''}

  <h2>الملخص المالي</h2>
  ${financialBlock}

  <h2>تغييرات المحامي (${lawyerChanges.length})</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>الحدث</th><th>التفاصيل</th><th>بواسطة</th></tr></thead>
    <tbody>${lawyerRows}</tbody>
  </table>

  <h2>الجلسات (${sessions.length})</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>الوقت</th><th>الحالة</th><th>المحكمة</th><th>النوع</th><th>القاضي</th><th>نتيجة الجلسة</th></tr></thead>
    <tbody>${sessionsRows}</tbody>
  </table>

  <h2>المستندات (${documents.length})</h2>
  <table>
    <thead><tr><th>العنوان</th><th>التصنيف</th><th>تاريخ الرفع</th><th>الحجم</th></tr></thead>
    <tbody>${docsRows}</tbody>
  </table>

  <h2>الدفعات (${payments.length})</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>المبلغ (ر.ي)</th><th>طريقة الدفع</th><th>ملاحظات</th></tr></thead>
    <tbody>${paymentsRows}</tbody>
  </table>

  <h2>سندات القبض (${receipts.length})</h2>
  <table>
    <thead><tr><th>رقم السند</th><th>المبلغ (ر.ي)</th><th>طريقة الدفع</th><th>تاريخ الطباعة</th></tr></thead>
    <tbody>${receiptsRows}</tbody>
  </table>

  <h2>سجل الأحداث الكامل — من البداية حتى الآن (${orderedTimeline.length})</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>النوع</th><th>الحدث</th><th>التفاصيل</th><th>بواسطة</th></tr></thead>
    <tbody>${timelineRows}</tbody>
  </table>

  <div class="footer">LegalMind Yemen — ملف القضية الكامل</div>
</body>
</html>`;
}

/** طباعة ملف القضية الكامل */
export function printCaseFullReport(bundle: CaseExportBundle): void {
  const html = buildCaseExportHtml(bundle);
  const win = window.open('', '_blank', 'width=960,height=900');
  if (!win) throw new Error('تعذر فتح نافذة الطباعة — تحقق من حظر النوافذ المنبثقة.');

  win.document.open();
  win.document.write(`${html.replace('</body>', '<script>window.onload=function(){window.print();}</script></body>')}`);
  win.document.close();
}

/** تنزيل أرشيف ZIP: تقرير HTML + مجلد المستندات */
export async function downloadCaseFullArchive(bundle: CaseExportBundle): Promise<{ documentsIncluded: number; documentsTotal: number }> {
  const zip = new JSZip();
  zip.file('ملف-القضية.html', buildCaseExportHtml(bundle));

  const docsFolder = zip.folder('المستندات');
  let documentsIncluded = 0;

  for (const doc of bundle.documents) {
    try {
      const url = await getDocumentDownloadUrl(doc.id);
      const response = await fetch(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      const ext = doc.title.includes('.') ? '' : guessExtension(blob.type);
      const filename = safeFilename(doc.title) + ext;
      docsFolder?.file(filename, blob);
      documentsIncluded += 1;
    } catch {
      // skip failed document
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(content, exportFilename(bundle.caseRecord.title, 'zip'));
  return { documentsIncluded, documentsTotal: bundle.documents.length };
}
