import { runPersonaChain } from "../../agents/src/handoff.js";
import { isPersonaBusy } from "../../agents/src/turn-lock.js";
import { createWorkLogEntry } from "../../server/src/worklog.js";
import { requestApproval, onApprovalResolved } from "./approvals.js";
import { appendTranscriptEvent } from "./transcript.js";
import {
  listSchedules,
  isAutomationPaused,
  isRunBudgetExceeded,
  isDue,
  recordRunStart,
  recordRunOutcome,
  type Schedule,
  type ScheduleOutcome,
} from "./schedules.js";
import type { ChainEvent } from "./run-persona.js";

const CHECK_INTERVAL_MS = 60_000;
const inFlight = new Set<string>();

export type SchedulerBroadcast = (event: (ChainEvent & { channel?: string }) | { type: "schedule_run_started"; scheduleId: string } | { type: "schedule_run_finished"; scheduleId: string; outcome: ScheduleOutcome }) => void;

/** Starts the tick loop inside the already-persistent mcp-gui process. Returns a stop function (used by tests; the real process just lets this run for its lifetime). */
export function startScheduler(broadcast: SchedulerBroadcast): () => void {
  const timer = setInterval(() => void tick(broadcast), CHECK_INTERVAL_MS);
  return () => clearInterval(timer);
}

async function tick(broadcast: SchedulerBroadcast): Promise<void> {
  if (isAutomationPaused()) return;
  const now = new Date();
  for (const schedule of listSchedules()) {
    if (!schedule.enabled) continue;
    if (inFlight.has(schedule.id)) continue;
    if (isPersonaBusy(schedule.personaId)) continue;
    if (isRunBudgetExceeded(schedule.id)) continue;
    if (!isDue(schedule, now)) continue;
    void runScheduleNow(schedule, broadcast);
  }
}

export function isScheduleInFlight(id: string): boolean {
  return inFlight.has(id);
}

/** Shared by the tick loop and the dashboard's "Run Now" action — bypasses cadence/cooldown/daily-cap, never bypasses global pause, persona-busy, or the approval gate. */
export async function runScheduleNow(schedule: Schedule, broadcast: SchedulerBroadcast): Promise<void> {
  if (inFlight.has(schedule.id)) return;
  inFlight.add(schedule.id);
  recordRunStart(schedule.id, new Date());
  try {
    await runScheduledTurn(schedule, broadcast);
  } finally {
    inFlight.delete(schedule.id);
  }
}

async function runScheduledTurn(schedule: Schedule, broadcast: SchedulerBroadcast): Promise<void> {
  const channel = schedule.personaId; // never "team" — a scheduled run never masquerades as something Jerry typed
  broadcast({ type: "schedule_run_started", scheduleId: schedule.id });

  let outcome: ScheduleOutcome = "success";
  let summary = "";
  let timedOutOnApproval = false;
  const unsubscribe = onApprovalResolved((_id, _approved, timedOut) => {
    if (timedOut) timedOutOnApproval = true;
  });

  try {
    await runPersonaChain({
      personaId: schedule.personaId,
      message: schedule.prompt,
      requestApproval,
      readOnly: schedule.readOnly,
      onEvent: (event) => {
        appendTranscriptEvent(channel, event);
        broadcast({ ...event, channel });
        if (event.type === "error") outcome = "error";
        if (event.type === "done" && event.result) summary = event.result.slice(0, 500);
      },
    });
  } catch (error) {
    outcome = "error";
    summary = error instanceof Error ? error.message : String(error);
  } finally {
    unsubscribe();
  }
  if (timedOutOnApproval && outcome === "success") outcome = "timeout";

  recordRunOutcome(schedule.id, outcome);
  createWorkLogEntry({
    by: schedule.personaId,
    kind: outcome === "success" ? "update" : "decision",
    summary: summary || `Schedule "${schedule.name}" ${outcome}.`,
    rationale: `Scheduled run (${schedule.name}), outcome: ${outcome}.`,
  });
  broadcast({ type: "schedule_run_finished", scheduleId: schedule.id, outcome });
}
