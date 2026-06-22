import { supabase } from './supabaseClient';
import { getCurrentFirmId } from './api';
import { throwIfSupabaseError } from './supabaseQueryHelpers';
import type { ReceiptVoucher } from '../types/app';

function mapVoucher(row: Record<string, unknown>): ReceiptVoucher {
  const casesRel = row.cases as { title?: string } | { title?: string }[] | null | undefined;
  const printerRel = row.printer as { full_name?: string } | { full_name?: string }[] | null | undefined;
  const caseTitle = Array.isArray(casesRel) ? casesRel[0]?.title : casesRel?.title;
  const printedByName = Array.isArray(printerRel) ? printerRel[0]?.full_name : printerRel?.full_name;

  return {
    id: row.id as string,
    caseId: row.case_id as string,
    casePaymentId: row.case_payment_id as string,
    receiptNumber: String(row.receipt_number),
    amount: Number(row.amount),
    clientName: (row.client_name as string) ?? undefined,
    caseNumber: (row.case_number as string) ?? undefined,
    contractTotal: row.contract_total != null ? Number(row.contract_total) : undefined,
    remainingBalance: row.remaining_balance != null ? Number(row.remaining_balance) : undefined,
    paymentMethod: (row.payment_method as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    qrPayload: (row.qr_payload as string) ?? undefined,
    printedAt: String(row.printed_at),
    reprintCount: Number(row.reprint_count ?? 0),
    caseTitle: caseTitle ?? undefined,
    printedByName: printedByName ?? undefined
  };
}

export async function createReceiptVoucher(paymentId: string): Promise<ReceiptVoucher> {
  const { data, error } = await supabase.rpc('create_receipt_voucher', {
    p_payment_id: paymentId
  });
  throwIfSupabaseError(error);
  const result = data as { voucher_id?: string; receipt_number?: string; qr_payload?: string };
  if (!result?.voucher_id) throw new Error('تعذر إنشاء سند القبض.');

  const firmId = await getCurrentFirmId();
  const { data: row, error: fetchError } = await supabase
    .from('receipt_vouchers')
    .select('*')
    .eq('id', result.voucher_id)
    .eq('firm_id', firmId)
    .single();
  throwIfSupabaseError(fetchError);
  return mapVoucher(row as Record<string, unknown>);
}

export async function fetchCaseReceipts(caseId: string): Promise<ReceiptVoucher[]> {
  const firmId = await getCurrentFirmId();
  const { data, error } = await supabase
    .from('receipt_vouchers')
    .select(`
      *,
      cases(title),
      printer:employees!receipt_vouchers_printed_by_fkey(full_name)
    `)
    .eq('firm_id', firmId)
    .eq('case_id', caseId)
    .order('printed_at', { ascending: false });
  throwIfSupabaseError(error);
  return (data ?? []).map(mapVoucher);
}

export async function fetchFirmReceiptVouchers(year: number): Promise<ReceiptVoucher[]> {
  const firmId = await getCurrentFirmId();
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${year + 1}-01-01T00:00:00.000Z`;
  const { data, error } = await supabase
    .from('receipt_vouchers')
    .select(`
      *,
      cases(title),
      printer:employees!receipt_vouchers_printed_by_fkey(full_name)
    `)
    .eq('firm_id', firmId)
    .gte('printed_at', start)
    .lt('printed_at', end)
    .order('printed_at', { ascending: false });
  throwIfSupabaseError(error);
  return (data ?? []).map(mapVoucher);
}

export async function reprintReceiptVoucher(voucherId: string): Promise<string> {
  const { data, error } = await supabase.rpc('reprint_receipt_voucher', {
    p_voucher_id: voucherId
  });
  throwIfSupabaseError(error);
  return String((data as { receipt_number?: string })?.receipt_number ?? '');
}
