import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  unwatchFile,
  watchFile,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { isTaskActor } from "./tasks.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const worklogPath = join(rememberDir, "worklog.json");
const worklogLockPath = join(rememberDir, "worklog.lock");
const LOCK_TIMEOUT_MS = 250;
const lockWaitBuffer = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

interface WorklogLock {
  token: string;
  ownerPath: string;
}

interface RecoveryClaim {
  path: string;
  token: string;
  ancestors: Array<{ path: string; token: string }>;
}

export type WorkLogKind = "update" | "add-on" | "decision" | "plan" | "brainstorm";

export interface WorkLogSignOff {
  by: string; // "jerry" or a persona id — metadata only, grants no permission
  at: string;
  note?: string;
}

export interface WorkLogEntry {
  id: string;
  at: string;
  by: string; // persona id, or "jerry"
  kind: WorkLogKind;
  summary: string;
  rationale?: string;
  taskId?: string;
  tag?: string;
  relatedIds?: string[];
  signOff: WorkLogSignOff | null;
  updatedAt: string;
}

interface WorklogFile {
  entries: WorkLogEntry[];
}

const KINDS: WorkLogKind[] = ["update", "add-on", "decision", "plan", "brainstorm"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === "string" ? error.code : undefined;
}

function isWorkLogKind(value: unknown): value is WorkLogKind {
  return typeof value === "string" && (KINDS as string[]).includes(value);
}

function parseSignOff(value: unknown, index: number): WorkLogSignOff | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || typeof value.by !== "string" || !isTaskActor(value.by) || typeof value.at !== "string") {
    throw new Error(`Work-log entry ${index} has an invalid sign-off.`);
  }
  return { by: value.by, at: value.at, ...(typeof value.note === "string" && value.note ? { note: value.note } : {}) };
}

function parseEntry(value: unknown, index: number): WorkLogEntry {
  if (!isRecord(value)) throw new Error(`Work-log entry ${index} is not an object.`);
  const requiredStrings = ["id", "at", "by", "summary", "updatedAt"] as const;
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string") throw new Error(`Work-log entry ${index} has an invalid ${key}.`);
  }
  if (!isTaskActor(value.by as string)) throw new Error(`Work-log entry ${index} has an invalid author.`);
  if (!isWorkLogKind(value.kind)) throw new Error(`Work-log entry ${index} has an invalid kind.`);
  if (value.rationale !== undefined && typeof value.rationale !== "string") {
    throw new Error(`Work-log entry ${index} has an invalid rationale.`);
  }
  if (value.taskId !== undefined && typeof value.taskId !== "string") {
    throw new Error(`Work-log entry ${index} has an invalid taskId.`);
  }
  if (value.tag !== undefined && typeof value.tag !== "string") {
    throw new Error(`Work-log entry ${index} has an invalid tag.`);
  }
  if (value.relatedIds !== undefined && (!Array.isArray(value.relatedIds) || value.relatedIds.some((id) => typeof id !== "string"))) {
    throw new Error(`Work-log entry ${index} has an invalid relatedIds list.`);
  }

  return {
    id: value.id as string,
    at: value.at as string,
    by: value.by as string,
    kind: value.kind,
    summary: value.summary as string,
    ...(value.rationale ? { rationale: value.rationale as string } : {}),
    ...(value.taskId ? { taskId: value.taskId as string } : {}),
    ...(value.tag ? { tag: value.tag as string } : {}),
    ...(value.relatedIds ? { relatedIds: value.relatedIds as string[] } : {}),
    signOff: parseSignOff(value.signOff, index),
    updatedAt: value.updatedAt as string,
  };
}

function readAll(): WorklogFile {
  if (!existsSync(worklogPath)) return { entries: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(worklogPath, "utf-8"));
  } catch (error) {
    throw new Error("Work log contains invalid JSON; refusing to replace it with an empty log.", { cause: error });
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
    throw new Error("Work log has an invalid shape; refusing to replace it with an empty log.");
  }
  return { entries: parsed.entries.map(parseEntry) };
}

function writeAll(file: WorklogFile): void {
  mkdirSync(rememberDir, { recursive: true });
  const temporaryPath = `${worklogPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(file, null, 2), "utf-8");
    renameSync(temporaryPath, worklogPath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

function nextId(): string {
  return `wl-${randomUUID()}`;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) !== "ESRCH";
  }
}

const LOCK_TOKEN_PATTERN = /^(\d+):([0-9a-f-]{36})$/i;
const RECOVERY_CLAIM_PATTERN = /^(\d+):([0-9a-f-]{36}):(\d+):([0-9a-f-]{36})$/i;

function worklogLockOwnerPath(ownerNonce: string): string {
  return `${worklogLockPath}.owner-${ownerNonce}`;
}

function removeOwnedRecord(path: string, token: string, label: string): void {
  try {
    if (readFileSync(path, "utf-8").trim() === token) unlinkSync(path);
  } catch (error) {
    if (errorCode(error) !== "ENOENT") console.error(`Could not clean up ${label}.`);
  }
}

function recoveryClaimPath(ownerNonce: string, parentNonce?: string): string {
  return `${worklogLockPath}.recover-${ownerNonce}-${parentNonce ?? "root"}`;
}

function acquireRecoveryClaim(ownerPid: number, ownerNonce: string): RecoveryClaim | null {
  let parentNonce: string | undefined;
  const ancestors: Array<{ path: string; token: string }> = [];
  for (let depth = 0; depth < 32; depth += 1) {
    const claimPath = recoveryClaimPath(ownerNonce, parentNonce);
    const claimNonce = randomUUID();
    const claimToken = `${process.pid}:${claimNonce}:${ownerPid}:${ownerNonce}`;
    const candidatePath = `${worklogLockPath}.recovery-candidate-${claimNonce}`;

    writeFileSync(candidatePath, `${claimToken}\n`, { encoding: "utf-8", flag: "wx" });
    try {
      // Publishing a complete record as a hard link to one fixed destination is
      // exclusive on both NTFS and POSIX filesystems. Exactly one contender wins.
      linkSync(candidatePath, claimPath);
      removeOwnedRecord(candidatePath, claimToken, "a recovery candidate");
      return { path: claimPath, token: claimToken, ancestors };
    } catch (error) {
      removeOwnedRecord(candidatePath, claimToken, "a recovery candidate");
      if (errorCode(error) !== "EEXIST") throw error;
    }

    let existingToken: string;
    try {
      existingToken = readFileSync(claimPath, "utf-8").trim();
    } catch (error) {
      if (errorCode(error) === "ENOENT") continue;
      return null;
    }

    const existing = RECOVERY_CLAIM_PATTERN.exec(existingToken);
    if (!existing || Number(existing[3]) !== ownerPid || existing[4] !== ownerNonce) return null;
    const claimantPid = Number(existing[1]);
    if (!Number.isSafeInteger(claimantPid) || claimantPid <= 0 || isProcessAlive(claimantPid)) return null;

    // A dead recovery owner is never unlinked out from under another contender.
    // Its nonce names the next fixed election point instead, so takeover is itself
    // crash-safe and does not depend on conditional deletion or rename semantics.
    ancestors.push({ path: claimPath, token: existingToken });
    parentNonce = existing[2];
  }
  return null;
}

function tryRecoverOrphanedWorklogLock(): boolean {
  let ownerToken: string;
  try {
    ownerToken = readFileSync(worklogLockPath, "utf-8").trim();
  } catch (error) {
    if (errorCode(error) === "ENOENT") return true;
    return false;
  }

  const owner = LOCK_TOKEN_PATTERN.exec(ownerToken);
  if (!owner) return false;
  const ownerPid = Number(owner[1]);
  if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0 || isProcessAlive(ownerPid)) return false;
  const claim = acquireRecoveryClaim(ownerPid, owner[2]);
  if (!claim) return false;
  let recoveryComplete = false;
  try {
    let currentToken: string;
    try {
      currentToken = readFileSync(worklogLockPath, "utf-8").trim();
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        recoveryComplete = true;
        return true;
      }
      throw error;
    }
    if (currentToken !== ownerToken) {
      recoveryComplete = true;
      return false;
    }
    try {
      unlinkSync(worklogLockPath);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }
    recoveryComplete = true;
    return true;
  } finally {
    removeOwnedRecord(claim.path, claim.token, "the worklog-lock recovery claim");
    if (recoveryComplete) {
      for (const ancestor of claim.ancestors.reverse()) {
        removeOwnedRecord(ancestor.path, ancestor.token, "an obsolete worklog-lock recovery claim");
      }
      removeOwnedRecord(worklogLockOwnerPath(owner[2]), ownerToken, "an orphaned worklog-lock owner record");
    }
  }
}

function acquireWorklogLock(): WorklogLock {
  mkdirSync(rememberDir, { recursive: true });
  const startedAt = Date.now();
  while (true) {
    const ownerNonce = randomUUID();
    const token = `${process.pid}:${ownerNonce}`;
    const ownerPath = worklogLockOwnerPath(ownerNonce);
    try {
      writeFileSync(ownerPath, `${token}\n`, { encoding: "utf-8", flag: "wx" });
    } catch (error) {
      if (errorCode(error) === "EEXIST") continue;
      throw error;
    }

    try {
      // A hard link publishes only the already-complete owner record. A process
      // crash before this point leaves an unreferenced file that cannot block work.
      linkSync(ownerPath, worklogLockPath);
      return { token, ownerPath };
    } catch (error) {
      removeOwnedRecord(ownerPath, token, "an unpublished worklog-lock owner record");
      if (errorCode(error) !== "EEXIST") throw error;
      if (tryRecoverOrphanedWorklogLock()) continue;
      if (Date.now() - startedAt >= LOCK_TIMEOUT_MS) {
        let owner = "unknown";
        try {
          owner = readFileSync(worklogLockPath, "utf-8").trim() || owner;
        } catch (readError) {
          if (errorCode(readError) === "ENOENT") continue;
        }
        throw new Error(`Work log is busy (lock owner ${owner}); no changes were written.`);
      }
      Atomics.wait(lockWaitBuffer, 0, 0, 10);
    }
  }
}

function releaseWorklogLock(lock: WorklogLock): void {
  try {
    const currentToken = readFileSync(worklogLockPath, "utf-8").trim();
    if (currentToken === lock.token) unlinkSync(worklogLockPath);
    else console.error("Refusing to remove a worklog lock owned by another writer.");
  } catch (error) {
    if (errorCode(error) !== "ENOENT") console.error("Could not release the worklog lock.");
  } finally {
    removeOwnedRecord(lock.ownerPath, lock.token, "the worklog-lock owner record");
  }
}

function mutateAll<T>(mutate: (file: WorklogFile) => T): T {
  const lock = acquireWorklogLock();
  try {
    const file = readAll();
    const result = mutate(file);
    writeAll(file);
    return result;
  } finally {
    releaseWorklogLock(lock);
  }
}

export function watchWorkLog(onChange: () => void): () => void {
  const listener = (current: { mtimeMs: number; size: number }, previous: { mtimeMs: number; size: number }) => {
    if (current.mtimeMs !== previous.mtimeMs || current.size !== previous.size) onChange();
  };
  watchFile(worklogPath, { interval: 500 }, listener);
  return () => unwatchFile(worklogPath, listener);
}

export interface CreateWorkLogEntryInput {
  by: string;
  kind: WorkLogKind;
  summary: string;
  rationale?: string;
  taskId?: string;
  tag?: string;
  relatedIds?: string[];
}

export function createWorkLogEntry(input: CreateWorkLogEntryInput): WorkLogEntry {
  if (!isTaskActor(input.by)) throw new Error("Work-log author must be 'jerry' or a current persona id.");
  const summary = input.summary.trim();
  if (!summary) throw new Error("Work-log entry needs a summary.");
  return mutateAll((file) => {
    const now = new Date().toISOString();
    const entry: WorkLogEntry = {
      id: nextId(),
      at: now,
      by: input.by,
      kind: input.kind,
      summary,
      ...(input.rationale?.trim() ? { rationale: input.rationale.trim() } : {}),
      ...(input.taskId ? { taskId: input.taskId } : {}),
      ...(input.tag?.trim() ? { tag: input.tag.trim().toLowerCase() } : {}),
      ...(input.relatedIds?.length ? { relatedIds: input.relatedIds } : {}),
      signOff: null,
      updatedAt: now,
    };
    file.entries.push(entry);
    return entry;
  });
}

export interface WorkLogFilter {
  taskId?: string;
  tag?: string;
  kind?: WorkLogKind;
  personaId?: string;
  limit?: number;
}

export function listWorkLog(filter?: WorkLogFilter): WorkLogEntry[] {
  const { entries } = readAll();
  const tag = filter?.tag?.trim().toLowerCase();
  const filtered = entries
    .filter((e) => (filter?.taskId ? e.taskId === filter.taskId : true))
    .filter((e) => (tag ? e.tag === tag : true))
    .filter((e) => (filter?.kind ? e.kind === filter.kind : true))
    .filter((e) => (filter?.personaId ? e.by === filter.personaId : true))
    .sort((a, b) => b.at.localeCompare(a.at));
  return filter?.limit ? filtered.slice(0, filter.limit) : filtered;
}

export function getWorkLogEntry(id: string): WorkLogEntry | undefined {
  return readAll().entries.find((e) => e.id === id);
}

/**
 * Sign-off is prose/metadata only — recorded for anyone to see who reviewed what and why.
 * It is never checked anywhere else in the system and grants no permission; Shepard has no
 * special code-level authority here or anywhere, matching every other tool in this codebase.
 */
export function signOffWorkLogEntry(id: string, by: string, note?: string): WorkLogEntry | undefined {
  if (!isTaskActor(by)) throw new Error("Sign-off actor must be 'jerry' or a current persona id.");
  return mutateAll((file) => {
    const entry = file.entries.find((candidate) => candidate.id === id);
    if (!entry) return undefined;
    const now = new Date().toISOString();
    entry.signOff = { by, at: now, ...(note?.trim() ? { note: note.trim() } : {}) };
    entry.updatedAt = now;
    return entry;
  });
}

export function listWorkLogTags(): string[] {
  const { entries } = readAll();
  return [...new Set(entries.map((e) => e.tag).filter((t): t is string => Boolean(t)))].sort();
}
