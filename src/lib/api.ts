import { supabase } from './supabaseClient';
import type {
  CaseRecord,
  Client,
  DocumentItem,
  Employee,
  Lawyer,
  NotificationItem,
  SessionItem
} from '../types/app';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) throw error;
  return data as Client[];
}

export async function fetchCases(): Promise<CaseRecord[]> {
  const { data, error } = await supabase.from('cases').select('*');
  if (error) throw error;
  return data as CaseRecord[];
}

export async function fetchArchivedCases(): Promise<CaseRecord[]> {
  const { data, error } = await supabase.from('cases').select('*').in('status', ['archived', 'closed']);
  if (error) throw error;
  return data as CaseRecord[];
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) throw error;
  return data as Employee[];
}

export async function fetchSessions(): Promise<SessionItem[]> {
  const { data, error } = await supabase.from('sessions').select('*');
  if (error) throw error;
  return data as SessionItem[];
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const { data, error } = await supabase.from('documents').select('*');
  if (error) throw error;
  return data as DocumentItem[];
}

export async function fetchLawyers(): Promise<Lawyer[]> {
  const { data, error } = await supabase.from('lawyers').select('*');
  if (error) throw error;
  return data as Lawyer[];
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data as NotificationItem[];
}

export async function createClient(payload: Omit<Client, 'id' | 'casesCount' | 'createdAt'>): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert([{ ...payload, cases_count: 0 }]).select().single();
  if (error) throw error;
  return data as Client;
}

export async function updateClientRecord(payload: Client): Promise<Client> {
  const { id, ...changes } = payload;
  const { data, error } = await supabase.from('clients').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as Client;
}

export async function createCase(payload: Omit<CaseRecord, 'id' | 'dateStarted' | 'remaining_amount' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<CaseRecord> {
  const { data, error } = await supabase.from('cases').insert([{ ...payload }]).select().single();
  if (error) throw error;
  return data as CaseRecord;
}

export async function updateCaseRecord(payload: CaseRecord): Promise<CaseRecord> {
  const { id, ...changes } = payload;
  const { data, error } = await supabase.from('cases').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as CaseRecord;
}

export async function restoreCaseRecord(caseId: string): Promise<CaseRecord> {
  const { data, error } = await supabase.from('cases').update({ status: 'active', archive_date: null }).eq('id', caseId).select().single();
  if (error) throw error;
  return data as CaseRecord;
}

export async function deleteCaseRecord(caseId: string): Promise<{ id: string }> {
  const { data, error } = await supabase.from('cases').delete().eq('id', caseId).select('id').single();
  if (error) throw error;
  return data as { id: string };
}

export async function createSession(payload: Omit<SessionItem, 'id' | 'caseTitle'>): Promise<SessionItem> {
  const { data, error } = await supabase.from('sessions').insert([{ ...payload }]).select().single();
  if (error) throw error;
  return data as SessionItem;
}

export async function updateSessionRecord(payload: SessionItem): Promise<SessionItem> {
  const { id, ...changes } = payload;
  const { data, error } = await supabase.from('sessions').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as SessionItem;
}

export async function deleteSessionRecord(sessionId: string): Promise<{ id: string }> {
  const { data, error } = await supabase.from('sessions').delete().eq('id', sessionId).select('id').single();
  if (error) throw error;
  return data as { id: string };
}

export async function createEmployee(payload: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').insert([{ ...payload }]).select().single();
  if (error) throw error;
  return data as Employee;
}

export async function updateEmployeeRecord(payload: Employee): Promise<Employee> {
  const { id, ...changes } = payload;
  const { data, error } = await supabase.from('employees').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as Employee;
}

export async function toggleEmployeeStatusRecord(employeeId: string, nextStatus: string): Promise<Employee> {
  const { data, error } = await supabase.from('employees').update({ status: nextStatus }).eq('id', employeeId).select().single();
  if (error) throw error;
  return data as Employee;
}

export async function deleteEmployeeRecord(employeeId: string): Promise<{ id: string }> {
  const { data, error } = await supabase.from('employees').delete().eq('id', employeeId).select('id').single();
  if (error) throw error;
  return data as { id: string };
}

export async function uploadDocumentFile(file: File, caseId: string): Promise<DocumentItem> {
  const folder = `case-documents/${caseId}`;
  const path = `${folder}/${Date.now()}-${file.name}`;
  const { data: storageData, error: storageError } = await supabase.storage.from('case-documents').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (storageError) throw storageError;
  const { data: publicUrlData, error: publicUrlError } = supabase.storage.from('case-documents').getPublicUrl(path);
  if (publicUrlError) throw publicUrlError;
  const { data, error } = await supabase.from('documents').insert([
    {
      case_id: caseId,
      title: file.name,
      category: file.type,
      file_type: file.type as any,
      file_size: file.size,
      storage_path: path,
      url: publicUrlData.publicUrl,
      uploaded_at: new Date().toISOString()
    }
  ]).select().single();
  if (error) throw error;
  return data as DocumentItem;
}

export async function createDocumentMetadata(payload: Omit<DocumentItem, 'id' | 'caseTitle'>): Promise<DocumentItem> {
  const { data, error } = await supabase.from('documents').insert([{ ...payload }]).select().single();
  if (error) throw error;
  return data as DocumentItem;
}

export async function createNotification(payload: Omit<NotificationItem, 'id' | 'read'>): Promise<NotificationItem> {
  const { data, error } = await supabase.from('notifications').insert([{ ...payload, read: false }]).select().single();
  if (error) throw error;
  return data as NotificationItem;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).select().single();
  if (error) throw error;
  return data as NotificationItem;
}

export async function markAllNotificationsRead(): Promise<NotificationItem[]> {
  const { data, error } = await supabase.from('notifications').update({ read: true }).neq('read', true).select();
  if (error) throw error;
  return data as NotificationItem[];
}
