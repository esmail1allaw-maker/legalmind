import type {
  CaseRecord,
  Client,
  DocumentItem,
  Employee,
  Invitation,
  Lawyer,
  NotificationItem,
  Office,
  SessionItem
} from '../../types/app';

export interface ClientRepository {
  list(): Promise<Client[]>;
  create(payload: Omit<Client, 'id' | 'casesCount' | 'createdAt'>): Promise<Client>;
  update(payload: Client): Promise<Client>;
  softDelete(id: string): Promise<void>;
}

export interface CaseRepository {
  list(): Promise<CaseRecord[]>;
  listArchived(): Promise<CaseRecord[]>;
  create(payload: Omit<CaseRecord, 'id' | 'clientName' | 'dateStarted' | 'remaining_amount'>): Promise<CaseRecord>;
  update(payload: CaseRecord): Promise<CaseRecord>;
  restore(id: string): Promise<CaseRecord>;
  softDelete(id: string): Promise<{ id: string }>;
}

export interface SessionRepository {
  list(): Promise<SessionItem[]>;
  create(payload: Omit<SessionItem, 'id' | 'caseTitle'>): Promise<SessionItem>;
  update(payload: SessionItem): Promise<SessionItem>;
  softDelete(id: string): Promise<{ id: string }>;
}

export interface DocumentRepository {
  list(): Promise<DocumentItem[]>;
  upload(file: File, caseId: string): Promise<DocumentItem>;
}

export interface OfficeRepository {
  get(): Promise<Office>;
  update(payload: Office): Promise<Office>;
}

export interface EmployeeRepository {
  list(): Promise<Employee[]>;
  create(payload: Omit<Employee, 'id' | 'created_at'>): Promise<Employee>;
  update(payload: Employee): Promise<Employee>;
  toggleStatus(id: string, status: Employee['status']): Promise<Employee>;
  softDelete(id: string): Promise<{ id: string }>;
  invite(payload: { email: string; fullName: string; phone: string; role: 'admin' | 'lawyer' | 'assistant' }): Promise<Invitation>;
  revokeInvitation(id: string): Promise<Invitation>;
  listInvitations(): Promise<Invitation[]>;
}

export interface PeopleRepository {
  listLawyers(): Promise<Lawyer[]>;
}

export interface NotificationRepository {
  list(): Promise<NotificationItem[]>;
  create(payload: Omit<NotificationItem, 'id' | 'read' | 'time'>): Promise<NotificationItem>;
  markRead(id: string): Promise<NotificationItem>;
  markAllRead(): Promise<void>;
}
