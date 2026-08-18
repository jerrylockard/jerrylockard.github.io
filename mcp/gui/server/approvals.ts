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
  timer: ReturnType<typeof setTimeout>;
}

/**
 * How long a risky-tool request waits for a human click before it's treated
 * as denied. Without this, a persona mid @mention-chain that hits a tool
 * needing approval — with nobody watching to click Approve/Deny — hangs the
 * whole chain forever: the SDK turn never resolves, so runMentionChain's
 * `await` on that hop never returns and every hop after it just never runs.
 * Timing out to a deny is always safe (never auto-allows), and it's the
 * exact behavior canUseTool already has for an explicit deny.
 */
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;

const waiters = new Map<string, Waiter>();
let counter = 0;

export type ApprovalListener = (approval: PendingApproval) => void;
const requestListeners = new Set<ApprovalListener>();

export type ResolutionListener = (id: string, approved: boolean, timedOut: boolean) => void;
const resolutionListeners = new Set<ResolutionListener>();

export function onApprovalRequested(listener: ApprovalListener): () => void {
  requestListeners.add(listener);
  return () => requestListeners.delete(listener);
}

export function onApprovalResolved(listener: ResolutionListener): () => void {
  resolutionListeners.add(listener);
  return () => resolutionListeners.delete(listener);
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
    const timer = setTimeout(() => settle(approval.id, false, true), APPROVAL_TIMEOUT_MS);
    waiters.set(approval.id, { approval, resolve, timer });
    for (const listener of requestListeners) listener(approval);
  });
}

function settle(id: string, approved: boolean, timedOut: boolean): boolean {
  const waiter = waiters.get(id);
  if (!waiter) return false;
  waiters.delete(id);
  clearTimeout(waiter.timer);
  waiter.resolve(approved);
  for (const listener of resolutionListeners) listener(id, approved, timedOut);
  return true;
}

export function resolveApproval(id: string, approved: boolean): boolean {
  return settle(id, approved, false);
}

export function listPendingApprovals(): PendingApproval[] {
  return Array.from(waiters.values()).map((w) => w.approval);
}
