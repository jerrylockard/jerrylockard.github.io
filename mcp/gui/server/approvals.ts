export interface PendingApproval {
  id: string;
  personaId: string;
  toolName: string;
  reason: string;
  detail: string;
  createdAt: string;
}

interface Waiter {
  approval: PendingApproval;
  resolve: (approved: boolean) => void;
}

const waiters = new Map<string, Waiter>();
let counter = 0;

export type ApprovalListener = (approval: PendingApproval) => void;
const listeners = new Set<ApprovalListener>();

export function onApprovalRequested(listener: ApprovalListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestApproval(personaId: string, toolName: string, reason: string, detail: string): Promise<boolean> {
  counter += 1;
  const approval: PendingApproval = {
    id: `${Date.now()}-${counter}`,
    personaId,
    toolName,
    reason,
    detail,
    createdAt: new Date().toISOString(),
  };
  return new Promise<boolean>((resolve) => {
    waiters.set(approval.id, { approval, resolve });
    for (const listener of listeners) listener(approval);
  });
}

export function resolveApproval(id: string, approved: boolean): boolean {
  const waiter = waiters.get(id);
  if (!waiter) return false;
  waiters.delete(id);
  waiter.resolve(approved);
  return true;
}

export function listPendingApprovals(): PendingApproval[] {
  return Array.from(waiters.values()).map((w) => w.approval);
}
