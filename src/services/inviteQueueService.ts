import type { InviteUserPayload } from '../lib/api';

const INVITE_QUEUE_KEY = 'legalmind.inviteQueue';

export interface QueuedInviteRequest extends InviteUserPayload {
  id: string;
  queuedAt: string;
}

function readQueue(): QueuedInviteRequest[] {
  try {
    const value = localStorage.getItem(INVITE_QUEUE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as QueuedInviteRequest[] : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedInviteRequest[]) {
  localStorage.setItem(INVITE_QUEUE_KEY, JSON.stringify(queue));
}

export function queueInvite(payload: InviteUserPayload): QueuedInviteRequest {
  const queuedInvite: QueuedInviteRequest = {
    ...payload,
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString()
  };

  writeQueue([...readQueue(), queuedInvite]);
  return queuedInvite;
}

export function listQueuedInvites(): QueuedInviteRequest[] {
  return readQueue();
}

export function removeQueuedInvite(id: string): void {
  writeQueue(readQueue().filter((invite) => invite.id !== id));
}

export function clearInviteQueue(): void {
  writeQueue([]);
}
