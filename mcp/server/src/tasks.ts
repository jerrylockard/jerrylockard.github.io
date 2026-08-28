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
import { getPersona } from "../../agents/src/personas.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const tasksPath = join(rememberDir, "tasks.json");
const tasksLockPath = join(rememberDir, "tasks.lock");
const LOCK_TIMEOUT_MS = 250;
const lockWaitBuffer = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

interface TaskLock {
  token: string;
  ownerPath: string;
}

interface RecoveryClaim {
  path: string;
  token: string;
  ancestors: Array<{ path: string; token: string }>;
}

/**
 * Stored status values, which are NOT the labels the dashboard shows.
 *
 * Jerry's framing for the Tasks view is "current work, future work, and things I
 * can't get to" — so the UI reads Now / Next / On hold. The stored strings keep
 * their original names because tasks.json already holds them and renaming an
 * enum on disk to improve a label is how you lose a board.
 *
 *   in-progress -> "Now"
 *   backlog     -> "Next"
 *   on-hold     -> "On hold"   (new: started but parked, or deliberately deferred)
 *   done        -> leaves the Tasks view entirely and surfaces in the Changelog
 */
export type TaskStatus = "backlog" | "in-progress" | "on-hold" | "done";

export const TASK_STATUSES: TaskStatus[] = ["backlog", "in-progress", "on-hold", "done"];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as string[]).includes(value);
}
export type TaskPriority = "low" | "normal" | "high";

/**
 * Category is intentionally an open string, not a fixed enum — the board is meant to grow
 * categories over time (new site sections, new project types) without a schema change.
 * `propose_task_category` is how an agent suggests a new one; `list_task_categories` is how
 * the dashboard discovers what already exists to render as board swimlanes/filters.
 */
export interface Task {
  id: string;
  title: string;
  detail: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assignee: string | null; // persona id, or null if unassigned
  createdBy: string; // persona id, or "jerry"
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  activity: TaskActivityEntry[];
}

export interface TaskActivityEntry {
  at: string;
  by: string; // persona id, or "jerry"
  note: string;
}

interface TasksFile {
  tasks: Task[];
  categories: string[];
}

const DEFAULT_CATEGORIES = ["design", "content", "infra", "qa", "docs", "press", "general"];

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase() || "general";
}

export function isTaskActor(value: string): boolean {
  return value === "jerry" || Boolean(getPersona(value));
}

export function isTaskDueDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export class TaskStatusConflictError extends Error {
  constructor(readonly currentStatus: TaskStatus) {
    super(`Task status changed to ${currentStatus}; refresh before moving it again.`);
    this.name = "TaskStatusConflictError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === "string" ? error.code : undefined;
}

function parseTask(value: unknown, index: number): Task {
  if (!isRecord(value)) throw new Error(`Task store entry ${index} is not an object.`);
  const requiredStrings = ["id", "title", "detail", "category", "createdBy", "createdAt", "updatedAt"] as const;
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string") throw new Error(`Task store entry ${index} has an invalid ${key}.`);
  }
  if (!isTaskStatus(value.status)) {
    throw new Error(`Task store entry ${index} has an invalid status.`);
  }
  if (value.priority !== "low" && value.priority !== "normal" && value.priority !== "high") {
    throw new Error(`Task store entry ${index} has an invalid priority.`);
  }
  if (value.assignee !== null && (typeof value.assignee !== "string" || !getPersona(value.assignee))) {
    throw new Error(`Task store entry ${index} has an invalid assignee.`);
  }
  if (!isTaskActor(value.createdBy as string)) {
    throw new Error(`Task store entry ${index} has an invalid creator.`);
  }
  if (value.dueDate !== undefined && typeof value.dueDate !== "string") {
    throw new Error(`Task store entry ${index} has an invalid due date.`);
  }
  if (typeof value.dueDate === "string" && !isTaskDueDate(value.dueDate)) {
    throw new Error(`Task store entry ${index} has a due date outside YYYY-MM-DD.`);
  }
  if (value.completedAt !== undefined && typeof value.completedAt !== "string") {
    throw new Error(`Task store entry ${index} has an invalid completion date.`);
  }
  if (!Array.isArray(value.activity)) throw new Error(`Task store entry ${index} has an invalid activity log.`);
  const activity = value.activity.map((entry, activityIndex): TaskActivityEntry => {
    if (
      !isRecord(entry) ||
      typeof entry.at !== "string" ||
      typeof entry.by !== "string" ||
      !isTaskActor(entry.by) ||
      typeof entry.note !== "string"
    ) {
      throw new Error(`Task store entry ${index} has an invalid activity item at ${activityIndex}.`);
    }
    return { at: entry.at, by: entry.by, note: entry.note };
  });

  return {
    id: value.id as string,
    title: value.title as string,
    detail: value.detail as string,
    status: value.status,
    priority: value.priority,
    category: normalizeCategory(value.category as string),
    assignee: value.assignee,
    createdBy: value.createdBy as string,
    createdAt: value.createdAt as string,
    updatedAt: value.updatedAt as string,
    ...(value.dueDate ? { dueDate: value.dueDate } : {}),
    ...(value.completedAt ? { completedAt: value.completedAt } : {}),
    activity,
  };
}

function readAll(): TasksFile {
  if (!existsSync(tasksPath)) return { tasks: [], categories: [...DEFAULT_CATEGORIES] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(tasksPath, "utf-8"));
  } catch (error) {
    throw new Error("Task store contains invalid JSON; refusing to replace it with an empty board.", { cause: error });
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.categories)) {
    throw new Error("Task store has an invalid shape; refusing to replace it with an empty board.");
  }
  if (parsed.categories.some((category) => typeof category !== "string")) {
    throw new Error("Task store contains an invalid category.");
  }
  const tasks = parsed.tasks.map(parseTask);
  const categories = parsed.categories.length
    ? [...new Set(parsed.categories.map((category) => normalizeCategory(category as string)))]
    : [...DEFAULT_CATEGORIES];
  for (const task of tasks) {
    if (!categories.includes(task.category)) categories.push(task.category);
  }
  return { tasks, categories };
}

function writeAll(file: TasksFile): void {
  mkdirSync(rememberDir, { recursive: true });
  const temporaryPath = `${tasksPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(file, null, 2), "utf-8");
    renameSync(temporaryPath, tasksPath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

function nextId(): string {
  return `t-${randomUUID()}`;
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

function taskLockOwnerPath(ownerNonce: string): string {
  return `${tasksLockPath}.owner-${ownerNonce}`;
}

function removeOwnedRecord(path: string, token: string, label: string): void {
  try {
    if (readFileSync(path, "utf-8").trim() === token) unlinkSync(path);
  } catch (error) {
    if (errorCode(error) !== "ENOENT") console.error(`Could not clean up ${label}.`);
  }
}

function recoveryClaimPath(ownerNonce: string, parentNonce?: string): string {
  return `${tasksLockPath}.recover-${ownerNonce}-${parentNonce ?? "root"}`;
}

function acquireRecoveryClaim(ownerPid: number, ownerNonce: string): RecoveryClaim | null {
  let parentNonce: string | undefined;
  const ancestors: Array<{ path: string; token: string }> = [];
  for (let depth = 0; depth < 32; depth += 1) {
    const claimPath = recoveryClaimPath(ownerNonce, parentNonce);
    const claimNonce = randomUUID();
    const claimToken = `${process.pid}:${claimNonce}:${ownerPid}:${ownerNonce}`;
    const candidatePath = `${tasksLockPath}.recovery-candidate-${claimNonce}`;

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

function tryRecoverOrphanedTaskLock(): boolean {
  let ownerToken: string;
  try {
    ownerToken = readFileSync(tasksLockPath, "utf-8").trim();
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
      currentToken = readFileSync(tasksLockPath, "utf-8").trim();
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
      unlinkSync(tasksLockPath);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }
    recoveryComplete = true;
    return true;
  } finally {
    removeOwnedRecord(claim.path, claim.token, "the task-lock recovery claim");
    if (recoveryComplete) {
      for (const ancestor of claim.ancestors.reverse()) {
        removeOwnedRecord(ancestor.path, ancestor.token, "an obsolete task-lock recovery claim");
      }
      removeOwnedRecord(taskLockOwnerPath(owner[2]), ownerToken, "an orphaned task-lock owner record");
    }
  }
}

function acquireTaskLock(): TaskLock {
  mkdirSync(rememberDir, { recursive: true });
  const startedAt = Date.now();
  while (true) {
    const ownerNonce = randomUUID();
    const token = `${process.pid}:${ownerNonce}`;
    const ownerPath = taskLockOwnerPath(ownerNonce);
    try {
      writeFileSync(ownerPath, `${token}\n`, { encoding: "utf-8", flag: "wx" });
    } catch (error) {
      if (errorCode(error) === "EEXIST") continue;
      throw error;
    }

    try {
      // A hard link publishes only the already-complete owner record. A process
      // crash before this point leaves an unreferenced file that cannot block work.
      linkSync(ownerPath, tasksLockPath);
      return { token, ownerPath };
    } catch (error) {
      removeOwnedRecord(ownerPath, token, "an unpublished task-lock owner record");
      if (errorCode(error) !== "EEXIST") throw error;
      if (tryRecoverOrphanedTaskLock()) continue;
      if (Date.now() - startedAt >= LOCK_TIMEOUT_MS) {
        let owner = "unknown";
        try {
          owner = readFileSync(tasksLockPath, "utf-8").trim() || owner;
        } catch (readError) {
          if (errorCode(readError) === "ENOENT") continue;
        }
        throw new Error(`Task store is busy (lock owner ${owner}); no changes were written.`);
      }
      Atomics.wait(lockWaitBuffer, 0, 0, 10);
    }
  }
}

function releaseTaskLock(lock: TaskLock): void {
  try {
    const currentToken = readFileSync(tasksLockPath, "utf-8").trim();
    if (currentToken === lock.token) unlinkSync(tasksLockPath);
    else console.error("Refusing to remove a task-store lock owned by another writer.");
  } catch (error) {
    if (errorCode(error) !== "ENOENT") console.error("Could not release the task-store lock.");
  } finally {
    removeOwnedRecord(lock.ownerPath, lock.token, "the task-lock owner record");
  }
}

function mutateAll<T>(mutate: (file: TasksFile) => T): T {
  const lock = acquireTaskLock();
  try {
    const file = readAll();
    const result = mutate(file);
    writeAll(file);
    return result;
  } finally {
    releaseTaskLock(lock);
  }
}

export function watchTaskStore(onChange: () => void): () => void {
  const listener = (current: { mtimeMs: number; size: number }, previous: { mtimeMs: number; size: number }) => {
    if (current.mtimeMs !== previous.mtimeMs || current.size !== previous.size) onChange();
  };
  watchFile(tasksPath, { interval: 500 }, listener);
  return () => unwatchFile(tasksPath, listener);
}

export interface CreateTaskInput {
  title: string;
  detail: string;
  category: string;
  priority?: TaskPriority;
  assignee?: string | null;
  createdBy: string;
  dueDate?: string;
}

export function createTask(input: CreateTaskInput): Task {
  const dueDate = input.dueDate?.trim();
  if (dueDate && !isTaskDueDate(dueDate)) throw new Error("Task due date must be a real date in YYYY-MM-DD format.");
  if (!isTaskActor(input.createdBy)) throw new Error("Task creator must be Jerry or a current persona id.");
  if (input.assignee != null && !getPersona(input.assignee)) throw new Error("Task assignee must be a current persona id.");
  return mutateAll((file) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: nextId(),
      title: input.title.trim(),
      detail: input.detail.trim(),
      status: "backlog",
      priority: input.priority ?? "normal",
      category: normalizeCategory(input.category),
      assignee: input.assignee ?? null,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      ...(dueDate ? { dueDate } : {}),
      activity: [{ at: now, by: input.createdBy, note: "Created" }],
    };
    if (!file.categories.includes(task.category)) file.categories.push(task.category);
    file.tasks.push(task);
    return task;
  });
}

export function listTasks(filter?: { status?: TaskStatus; assignee?: string; category?: string }): Task[] {
  const { tasks } = readAll();
  const category = filter?.category ? normalizeCategory(filter.category) : undefined;
  return tasks
    .filter((t) => (filter?.status ? t.status === filter.status : true))
    .filter((t) => (filter?.assignee ? t.assignee === filter.assignee : true))
    .filter((t) => (category ? normalizeCategory(t.category) === category : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTask(id: string): Task | undefined {
  return readAll().tasks.find((t) => t.id === id);
}

export interface Board {
  backlog: Task[];
  "in-progress": Task[];
  "on-hold": Task[];
  done: Task[];
  categories: string[];
}

export function getBoard(): Board {
  const { tasks, categories } = readAll();
  return {
    backlog: tasks.filter((t) => t.status === "backlog").sort(compareUpcoming),
    "in-progress": tasks.filter((t) => t.status === "in-progress").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    "on-hold": tasks.filter((t) => t.status === "on-hold").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    done: tasks.filter((t) => t.status === "done").sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt)),
    categories,
  };
}

export function updateTaskStatus(
  id: string,
  status: TaskStatus,
  by: string,
  note?: string,
  expectedStatus?: TaskStatus,
): Task | undefined {
  if (!isTaskActor(by)) throw new Error("Task activity actor must be Jerry or a current persona id.");
  return mutateAll((file) => {
    const task = file.tasks.find((candidate) => candidate.id === id);
    if (!task) return undefined;
    if (expectedStatus && task.status !== expectedStatus) throw new TaskStatusConflictError(task.status);
    const now = new Date().toISOString();
    const cleanNote = note?.trim();
    if (task.status === status) {
      if (cleanNote) {
        task.updatedAt = now;
        task.activity.push({ at: now, by, note: cleanNote });
      }
      return task;
    }
    task.status = status;
    task.updatedAt = now;
    // Cleared on the way out of done as well as set on the way in. The Changelog
    // is built from completedAt, so a reopened task that kept its old stamp would
    // go on appearing as finished work in a published CHANGELOG.md.
    if (status === "done") task.completedAt = now;
    else delete task.completedAt;
    task.activity.push({ at: now, by, note: cleanNote || `Moved to ${status}` });
    return task;
  });
}

export function assignTask(id: string, assignee: string | null, by: string): Task | undefined {
  if (!isTaskActor(by)) throw new Error("Task activity actor must be Jerry or a current persona id.");
  if (assignee != null && !getPersona(assignee)) throw new Error("Task assignee must be a current persona id.");
  return mutateAll((file) => {
    const task = file.tasks.find((candidate) => candidate.id === id);
    if (!task) return undefined;
    const now = new Date().toISOString();
    task.assignee = assignee;
    task.updatedAt = now;
    task.activity.push({ at: now, by, note: assignee ? `Assigned to ${assignee}` : "Unassigned" });
    return task;
  });
}

export function addTaskNote(id: string, by: string, note: string): Task | undefined {
  if (!isTaskActor(by)) throw new Error("Task activity actor must be Jerry or a current persona id.");
  return mutateAll((file) => {
    const task = file.tasks.find((candidate) => candidate.id === id);
    if (!task) return undefined;
    const cleanNote = note.trim();
    if (!cleanNote) return task;
    const now = new Date().toISOString();
    task.updatedAt = now;
    task.activity.push({ at: now, by, note: cleanNote });
    return task;
  });
}

export function listTaskCategories(): string[] {
  return readAll().categories;
}

export function proposeTaskCategory(category: string): string[] {
  return mutateAll((file) => {
    const clean = normalizeCategory(category);
    if (!file.categories.includes(clean)) file.categories.push(clean);
    return file.categories;
  });
}

/**
 * A rollup of what's assigned to whom right now, for the roster view — "what is each
 * person actually doing" rather than the full board. Agents with no in-progress task show
 * up with an empty array, which the dashboard renders as "no active work assigned".
 */
export function tasksByAssignee(): Record<string, Task[]> {
  const { tasks } = readAll();
  const byAssignee = Object.create(null) as Record<string, Task[]>;
  for (const t of tasks) {
    if (!t.assignee || t.status === "done" || t.status === "on-hold") continue;
    (byAssignee[t.assignee] ??= []).push(t);
  }
  return byAssignee;
}

/**
 * Everything completed within the given number of days, newest first — the data source for
 * the dashboard's calendar/activity view's "what's been done" side.
 */
export function recentlyCompleted(days = 30): Task[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return listTasks({ status: "done" })
    .filter((task) => task.completedAt && new Date(task.completedAt).getTime() >= cutoff)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}

function compareUpcoming(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  const priorityRank: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };
  return priorityRank[a.priority] - priorityRank[b.priority] || b.updatedAt.localeCompare(a.updatedAt);
}

/** In-progress work first, then backlog; due dates and priority determine order within each group. */
export function upcomingWork(): Task[] {
  const board = getBoard();
  // on-hold is deliberately excluded: "what's coming up" should not include the
  // things Jerry has already said he cannot get to.
  return [...board["in-progress"].sort(compareUpcoming), ...board.backlog.sort(compareUpcoming)];
}
