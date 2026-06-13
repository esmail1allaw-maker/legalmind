import { invoke } from '@tauri-apps/api/core';

export type LocalTable =
  | 'firms'
  | 'employees'
  | 'invitations'
  | 'clients'
  | 'cases'
  | 'sessions'
  | 'documents'
  | 'case_attachments'
  | 'lawyers'
  | 'notifications'
  | 'audit_logs';

export interface LocalQueryPayload {
  table: LocalTable;
  id?: string;
  firmId?: string;
  includeDeleted?: boolean;
}

export interface LocalUpsertPayload<T> {
  table: LocalTable;
  row: T;
  eventType: string;
}

export interface LocalDeletePayload {
  table: LocalTable;
  id: string;
  firmId?: string;
}

export interface OutboxEvent {
  id: string;
  tableName: LocalTable;
  recordId: string;
  firmId?: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: string;
}

export interface SyncStatus {
  pendingEvents: number;
  conflicts: number;
  lastSyncAt?: string;
}

const memoryTables = new Map<LocalTable, Map<string, Record<string, unknown>>>();
const memoryOutbox: OutboxEvent[] = [];
let browserWarningShown = false;

export function isTauriRuntime(): boolean {
  return Boolean('__TAURI_INTERNALS__' in window);
}

function getMemoryTable(table: LocalTable) {
  const existing = memoryTables.get(table);
  if (existing) return existing;
  const next = new Map<string, Record<string, unknown>>();
  memoryTables.set(table, next);
  return next;
}

function warnBrowserFallback() {
  if (browserWarningShown || isTauriRuntime()) return;
  browserWarningShown = true;
  console.info('[OFFLINE] Running outside Tauri; using in-memory local DB fallback for development.');
}

export async function initializeLocalDatabase(): Promise<SyncStatus> {
  if (isTauriRuntime()) return invoke<SyncStatus>('initialize_local_database');
  warnBrowserFallback();
  return getLocalSyncStatus();
}

export async function listLocalRows<T>(payload: LocalQueryPayload): Promise<T[]> {
  if (isTauriRuntime()) return invoke<T[]>('list_local_rows', { payload });
  warnBrowserFallback();
  const rows = Array.from(getMemoryTable(payload.table).values());
  return rows.filter((row) => {
    const firmMatches = !payload.firmId || row.firm_id === payload.firmId;
    const deleteMatches = payload.includeDeleted || !row.deleted_at;
    return firmMatches && deleteMatches;
  }) as T[];
}

export async function getLocalRow<T>(payload: LocalQueryPayload): Promise<T | null> {
  if (isTauriRuntime()) return invoke<T | null>('get_local_row', { payload });
  warnBrowserFallback();
  if (!payload.id) return null;
  return (getMemoryTable(payload.table).get(payload.id) as T | undefined) ?? null;
}

export async function upsertLocalRow<T extends Record<string, unknown>>(payload: LocalUpsertPayload<T>): Promise<T> {
  if (isTauriRuntime()) return invoke<T>('upsert_local_row', { payload });
  warnBrowserFallback();
  const table = getMemoryTable(payload.table);
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...payload.row
  } as T & { id: string; firm_id?: string };
  table.set(row.id, row);
  memoryOutbox.push({
    id: crypto.randomUUID(),
    tableName: payload.table,
    recordId: row.id,
    firmId: row.firm_id,
    eventType: payload.eventType,
    payload: row,
    attempts: 0,
    createdAt: now
  });
  return row;
}

export async function softDeleteLocalRow(payload: LocalDeletePayload): Promise<void> {
  if (isTauriRuntime()) return invoke<void>('soft_delete_local_row', { payload });
  warnBrowserFallback();
  const table = getMemoryTable(payload.table);
  const row = table.get(payload.id);
  if (row) {
    row.deleted_at = new Date().toISOString();
    row.updated_at = row.deleted_at;
  }
}

export async function listOutboxEvents(limit = 100): Promise<OutboxEvent[]> {
  if (isTauriRuntime()) return invoke<OutboxEvent[]>('list_outbox_events', { limit });
  warnBrowserFallback();
  return memoryOutbox.slice(0, limit);
}

export async function markOutboxEventSynced(id: string): Promise<void> {
  if (isTauriRuntime()) return invoke<void>('mark_outbox_event_synced', { id });
  warnBrowserFallback();
  const index = memoryOutbox.findIndex((event) => event.id === id);
  if (index >= 0) memoryOutbox.splice(index, 1);
}

export async function recordSyncConflict(
  tableName: LocalTable,
  recordId: string,
  localRow: Record<string, unknown>,
  remoteRow: Record<string, unknown>,
  reason: string
): Promise<void> {
  if (isTauriRuntime()) {
    return invoke<void>('record_sync_conflict', { tableName, recordId, localRow, remoteRow, reason });
  }
  warnBrowserFallback();
}

export async function getLocalSyncStatus(): Promise<SyncStatus> {
  if (isTauriRuntime()) return invoke<SyncStatus>('get_sync_status');
  warnBrowserFallback();
  return { pendingEvents: memoryOutbox.length, conflicts: 0 };
}

export async function updateSyncCursor(tableName: LocalTable, cursor: string): Promise<void> {
  if (isTauriRuntime()) return invoke<void>('update_sync_cursor', { tableName, cursor });
  warnBrowserFallback();
}
