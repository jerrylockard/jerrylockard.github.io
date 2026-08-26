import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getPersona } from "../../agents/src/personas.js";

const guiDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(guiDir, ".data");
const schedulesPath = join(dataDir, "schedules.json");

/**
 * Three cadence kinds only — no cron-expression parser. Adding one means a new dependency,
 * which itself trips the existing dependency-change risk gate (risk.ts) and needs Jerry's
 * approval; these three cover every real case (a daily check, a weekly sweep, a periodic
 * poll) without one. Local time, fixed reference timezone — see SCHEDULER_TIMEZONE below.
 */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleCadence =
  | { kind: "daily"; hour: number; minute: number }
  | { kind: "weekly"; dayOfWeek: WeekDay; hour: number; minute: number }
  | { kind: "interval"; minutes: number };

export type ScheduleOutcome = "success" | "error" | "timeout";

export interface Schedule {
  id: string;
  name: string;
  personaId: string;
  prompt: string;
  cadence: ScheduleCadence;
  enabled: boolean;
  /** Hard floor between run-starts, independent of cadence. Minimum enforced: 30. */
  cooldownMinutes: number;
  maxRunsPerDay: number;
  /** Idle/brainstorm schedules only — see tools.ts's readOnly mode. */
  readOnly?: boolean;
  createdAt: string;
  lastRunAt?: string;
  lastRunOutcome?: ScheduleOutcome;
  runsToday: number;
  runsTodayDate: string; // "YYYY-MM-DD" in SCHEDULER_TIMEZONE
}

interface SchedulesFile {
  paused: boolean;
  globalRunsToday: number;
  globalRunsTodayDate: string;
  schedules: Schedule[];
}

const DEFAULT_FILE: SchedulesFile = { paused: false, globalRunsToday: 0, globalRunsTodayDate: "", schedules: [] };

/** Covington, KY. This is Jerry's own personal automation, not a multi-tenant service — one fixed zone, no per-schedule timezone field to carry unused. */
export const SCHEDULER_TIMEZONE = "America/New_York";
export const GLOBAL_MAX_RUNS_PER_DAY = 20;
const MIN_COOLDOWN_MINUTES = 30;
const MIN_INTERVAL_MINUTES = 60;
const DEFAULT_COOLDOWN_MINUTES = 60;
const DEFAULT_MAX_RUNS_PER_DAY = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Constructed once. Building an Intl.DateTimeFormat is expensive relative to using one, and
// computeNextRunAt calls both of these thousands of times per request while scanning forward.
const DATE_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHEDULER_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const CLOCK_PARTS_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHEDULER_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

function dateKeyInTimezone(date: Date): string {
  return DATE_KEY_FORMAT.format(date);
}

function parseCadence(value: unknown): ScheduleCadence {
  if (!isRecord(value)) throw new Error("Schedule cadence must be an object.");
  if (value.kind === "daily") {
    const hour = Number(value.hour);
    const minute = Number(value.minute);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("daily cadence hour must be 0-23.");
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("daily cadence minute must be 0-59.");
    return { kind: "daily", hour, minute };
  }
  if (value.kind === "weekly") {
    const dayOfWeek = Number(value.dayOfWeek);
    const hour = Number(value.hour);
    const minute = Number(value.minute);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) throw new Error("weekly cadence dayOfWeek must be 0-6.");
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("weekly cadence hour must be 0-23.");
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("weekly cadence minute must be 0-59.");
    return { kind: "weekly", dayOfWeek: dayOfWeek as WeekDay, hour, minute };
  }
  if (value.kind === "interval") {
    const minutes = Number(value.minutes);
    if (!Number.isFinite(minutes)) throw new Error("interval cadence minutes must be a number.");
    return { kind: "interval", minutes: Math.max(MIN_INTERVAL_MINUTES, Math.floor(minutes)) };
  }
  throw new Error(`Unknown cadence kind: ${String((value as { kind?: unknown }).kind)}`);
}

function readAll(): SchedulesFile {
  if (!existsSync(schedulesPath)) return { ...DEFAULT_FILE };
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(schedulesPath, "utf-8"));
  } catch {
    return { ...DEFAULT_FILE };
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.schedules)) return { ...DEFAULT_FILE };
  return {
    paused: Boolean(parsed.paused),
    globalRunsToday: typeof parsed.globalRunsToday === "number" ? parsed.globalRunsToday : 0,
    globalRunsTodayDate: typeof parsed.globalRunsTodayDate === "string" ? parsed.globalRunsTodayDate : "",
    schedules: parsed.schedules as Schedule[],
  };
}

function writeAll(file: SchedulesFile): void {
  mkdirSync(dataDir, { recursive: true });
  const temporaryPath = `${schedulesPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(file, null, 2), "utf-8");
    renameSync(temporaryPath, schedulesPath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

/**
 * mcp/gui/server is the only process that ever writes this file, and only from HTTP handlers
 * and the scheduler's own tick — unlike tasks.json (written by both the MCP server and the
 * GUI as separate processes), there's no cross-process race here, so no lock is needed.
 */
function mutateAll<T>(mutate: (file: SchedulesFile) => T): T {
  const file = readAll();
  const result = mutate(file);
  writeAll(file);
  return result;
}

function rolloverIfNeeded(schedule: Schedule, now: Date): void {
  const today = dateKeyInTimezone(now);
  if (schedule.runsTodayDate !== today) {
    schedule.runsTodayDate = today;
    schedule.runsToday = 0;
  }
}

export function listSchedules(): Schedule[] {
  return readAll().schedules;
}

export function getSchedule(id: string): Schedule | undefined {
  return readAll().schedules.find((s) => s.id === id);
}

export interface CreateScheduleInput {
  name: string;
  personaId: string;
  prompt: string;
  cadence: ScheduleCadence;
  cooldownMinutes?: number;
  maxRunsPerDay?: number;
  readOnly?: boolean;
}

export function createSchedule(input: CreateScheduleInput): Schedule {
  const name = input.name.trim();
  const prompt = input.prompt.trim();
  if (!name) throw new Error("Schedule needs a name.");
  if (!prompt) throw new Error("Schedule needs a prompt.");
  if (!getPersona(input.personaId)) throw new Error("Schedule personaId must be a current persona id.");
  const cadence = parseCadence(input.cadence);
  return mutateAll((file) => {
    const now = new Date();
    const schedule: Schedule = {
      id: `sch-${randomUUID()}`,
      name,
      personaId: input.personaId,
      prompt,
      cadence,
      enabled: true,
      cooldownMinutes: Math.max(MIN_COOLDOWN_MINUTES, Math.floor(input.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES)),
      maxRunsPerDay: Math.max(1, Math.floor(input.maxRunsPerDay ?? DEFAULT_MAX_RUNS_PER_DAY)),
      ...(input.readOnly ? { readOnly: true } : {}),
      createdAt: now.toISOString(),
      runsToday: 0,
      runsTodayDate: dateKeyInTimezone(now),
    };
    file.schedules.push(schedule);
    return schedule;
  });
}

export type ScheduleUpdate = Partial<Pick<Schedule, "name" | "prompt" | "cadence" | "enabled" | "cooldownMinutes" | "maxRunsPerDay" | "readOnly">>;

export function updateSchedule(id: string, patch: ScheduleUpdate): Schedule | undefined {
  return mutateAll((file) => {
    const schedule = file.schedules.find((s) => s.id === id);
    if (!schedule) return undefined;
    if (patch.name !== undefined) schedule.name = patch.name.trim() || schedule.name;
    if (patch.prompt !== undefined) schedule.prompt = patch.prompt.trim() || schedule.prompt;
    if (patch.cadence !== undefined) schedule.cadence = parseCadence(patch.cadence);
    if (patch.enabled !== undefined) schedule.enabled = patch.enabled;
    if (patch.cooldownMinutes !== undefined) schedule.cooldownMinutes = Math.max(MIN_COOLDOWN_MINUTES, Math.floor(patch.cooldownMinutes));
    if (patch.maxRunsPerDay !== undefined) schedule.maxRunsPerDay = Math.max(1, Math.floor(patch.maxRunsPerDay));
    if (patch.readOnly !== undefined) schedule.readOnly = patch.readOnly;
    return schedule;
  });
}

export function deleteSchedule(id: string): boolean {
  return mutateAll((file) => {
    const before = file.schedules.length;
    file.schedules = file.schedules.filter((s) => s.id !== id);
    return file.schedules.length < before;
  });
}

export function isAutomationPaused(): boolean {
  return readAll().paused;
}

export function setAutomationPaused(paused: boolean): void {
  mutateAll((file) => {
    file.paused = paused;
  });
}

/** True if this run would exceed either the per-schedule or the global daily cap. */
export function isRunBudgetExceeded(scheduleId: string): boolean {
  const file = readAll();
  const now = new Date();
  const today = dateKeyInTimezone(now);
  const schedule = file.schedules.find((s) => s.id === scheduleId);
  if (!schedule) return true;
  const scheduleRunsToday = schedule.runsTodayDate === today ? schedule.runsToday : 0;
  const globalRunsToday = file.globalRunsTodayDate === today ? file.globalRunsToday : 0;
  return scheduleRunsToday >= schedule.maxRunsPerDay || globalRunsToday >= GLOBAL_MAX_RUNS_PER_DAY;
}

/** Persisted the instant a run STARTS (not when it finishes), so a crash mid-turn can't cause a duplicate fire on restart. */
export function recordRunStart(id: string, at: Date): void {
  mutateAll((file) => {
    const schedule = file.schedules.find((s) => s.id === id);
    if (!schedule) return;
    rolloverIfNeeded(schedule, at);
    schedule.lastRunAt = at.toISOString();
    schedule.runsToday += 1;

    const today = dateKeyInTimezone(at);
    if (file.globalRunsTodayDate !== today) {
      file.globalRunsTodayDate = today;
      file.globalRunsToday = 0;
    }
    file.globalRunsToday += 1;
  });
}

export function recordRunOutcome(id: string, outcome: ScheduleOutcome): void {
  mutateAll((file) => {
    const schedule = file.schedules.find((s) => s.id === id);
    if (!schedule) return;
    schedule.lastRunOutcome = outcome;
  });
}

function partsInTimezone(date: Date): { hour: number; minute: number; dayOfWeek: number; dateKey: string } {
  const parts = CLOCK_PARTS_FORMAT.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    dayOfWeek: weekdayMap[get("weekday")] ?? 0,
    dateKey: dateKeyInTimezone(date),
  };
}

/** Pure — used by both the scheduler's tick and the dashboard's "next run" display. */
export function isDue(schedule: Schedule, now: Date): boolean {
  if (schedule.lastRunAt) {
    const sinceMs = now.getTime() - new Date(schedule.lastRunAt).getTime();
    if (sinceMs < schedule.cooldownMinutes * 60_000) return false;
  }
  const cadence = schedule.cadence;
  if (cadence.kind === "interval") {
    if (!schedule.lastRunAt) return true;
    return now.getTime() - new Date(schedule.lastRunAt).getTime() >= cadence.minutes * 60_000;
  }
  const parts = partsInTimezone(now);
  const reachedTimeOfDay = parts.hour > cadence.hour || (parts.hour === cadence.hour && parts.minute >= cadence.minute);
  if (!reachedTimeOfDay) return false;
  if (cadence.kind === "weekly" && parts.dayOfWeek !== cadence.dayOfWeek) return false;
  // Already run today (daily) / this week (weekly, approximated by "already ran today and today is the target day")?
  const lastRunDateKey = schedule.lastRunAt ? dateKeyInTimezone(new Date(schedule.lastRunAt)) : "";
  return lastRunDateKey !== parts.dateKey;
}

export function computeNextRunAt(schedule: Schedule, now: Date): Date | null {
  // Best-effort display value: scans forward a minute at a time for up to 8 days (enough to cover
  // the weekly cadence). That's ~11.5k isDue() calls per schedule, which is only viable because
  // both Intl formatters above are module-level singletons — constructing them per call instead
  // made GET /api/schedules take upwards of 15 seconds. Keep them hoisted.
  const probe = new Date(now.getTime());
  for (let i = 0; i < 60 * 24 * 8; i += 1) {
    if (isDue(schedule, probe)) return probe;
    probe.setMinutes(probe.getMinutes() + 1);
  }
  return null;
}
