import { supabase } from './supabaseClient';
import {
  getLocalSyncStatus,
  listOutboxEvents,
  markOutboxEventSynced,
  recordSyncConflict,
  updateSyncCursor,
  upsertLocalRow,
  type LocalTable,
  type OutboxEvent,
  type SyncStatus
} from './localDbClient';

export const SYNC_TABLES: LocalTable[] = [
  'firms',
  'employees',
  'invitations',
  'clients',
  'cases',
  'sessions',
  'documents',
  'case_attachments',
  'lawyers',
  'notifications',
  'audit_logs'
];

export interface SyncResult extends SyncStatus {
  pushed: number;
  pulled: number;
}

let syncInFlight = false;

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export async function pushOutboxEvent(event: OutboxEvent): Promise<void> {
  const { error } = await supabase.rpc('sync_apply_event', {
    event_id: event.id,
    table_name: event.tableName,
    record_id: event.recordId,
    firm_id: event.firmId ?? null,
    event_type: event.eventType,
    payload: event.payload
  });
  if (error) throw error;
  await markOutboxEventSynced(event.id);
}

export async function pullRemoteChanges(tableName: LocalTable): Promise<number> {
  const { data, error } = await supabase.rpc('sync_pull_table', {
    table_name: tableName,
    since_cursor: localStorage.getItem(`legalmind.sync.cursor.${tableName}`)
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [];

  for (const row of rows) {
    const id = row.id;
    if (typeof id !== 'string') continue;
    try {
      await upsertLocalRow({
        table: tableName,
        eventType: `${tableName}.pulled`,
        row
      });
    } catch (err) {
      await recordSyncConflict(
        tableName,
        id,
        {},
        row,
        err instanceof Error ? err.message : 'Failed to apply remote row locally'
      );
    }
  }

  const nextCursor = rows.reduce<string | null>((cursor, row) => {
    const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;
    if (!updatedAt) return cursor;
    return !cursor || updatedAt > cursor ? updatedAt : cursor;
  }, null);

  if (nextCursor) {
    localStorage.setItem(`legalmind.sync.cursor.${tableName}`, nextCursor);
    await updateSyncCursor(tableName, nextCursor);
  }

  return rows.length;
}

export async function runSyncCycle(): Promise<SyncResult> {
  if (syncInFlight) {
    const status = await getLocalSyncStatus();
    return { ...status, pushed: 0, pulled: 0 };
  }
  if (!isOnline()) {
    const status = await getLocalSyncStatus();
    return { ...status, pushed: 0, pulled: 0 };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const status = await getLocalSyncStatus();
    return { ...status, pushed: 0, pulled: 0 };
  }

  syncInFlight = true;
  try {
    const outbox = await listOutboxEvents(100);
    let pushed = 0;
    for (const event of outbox) {
      await pushOutboxEvent(event);
      pushed += 1;
    }

    let pulled = 0;
    for (const tableName of SYNC_TABLES) {
      pulled += await pullRemoteChanges(tableName);
    }

    const status = await getLocalSyncStatus();
    return { ...status, pushed, pulled };
  } finally {
    syncInFlight = false;
  }
}
