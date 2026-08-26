import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { PERSONAS, getPersona } from "../../agents/src/personas.js";
import { runMentionChain, runPersonaTurn, type ChainEvent } from "./run-persona.js";
import { parseMentions } from "./mentions.js";
import { onApprovalRequested, onApprovalResolved, resolveApproval, listPendingApprovals, type PendingApproval } from "./approvals.js";
import { checkPreviewStatus, startPreviewServer, PREVIEW_URL } from "./preview.js";
import { appendTranscriptEvent, clearTranscript, readTranscript } from "./transcript.js";
import {
  isIncognito,
  startIncognito,
  endIncognito,
  appendIncognitoEvent,
  readLatestSession,
  readLatestSessionLines,
  formatSessionTranscript,
  buildReviewPrompt,
} from "./incognito.js";
import { routeMessage } from "./router.js";
import { readProfile } from "../../server/src/profile.js";
import { readTeamUpdates, watchTeamUpdates } from "../../server/src/memory.js";
import {
  createTask,
  listTasks,
  getTask,
  getBoard,
  updateTaskStatus,
  assignTask,
  addTaskNote,
  setTaskDueDate,
  listTaskCategories,
  proposeTaskCategory,
  tasksByAssignee,
  recentlyCompleted,
  upcomingWork,
  watchTaskStore,
  isTaskDueDate,
  TaskStatusConflictError,
} from "../../server/src/tasks.js";
import {
  createWorkLogEntry,
  listWorkLog,
  getWorkLogEntry,
  signOffWorkLogEntry,
  listWorkLogTags,
  watchWorkLog,
  type WorkLogEntry,
} from "../../server/src/worklog.js";
import { isPersonaBusy } from "../../agents/src/turn-lock.js";
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  isAutomationPaused,
  setAutomationPaused,
  computeNextRunAt,
} from "./schedules.js";
import { startScheduler, runScheduleNow, isScheduleInFlight } from "./scheduler.js";
import { loadSampleData, clearSampleData } from "./sample-data.js";
import { TASK_TEMPLATES } from "./sample-content.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const app = express();

// Opt-in HTTP Basic Auth — inert unless DASHBOARD_PASSWORD is set, so the
// existing localhost-only workflow is unaffected. This gates the whole app,
// including /api/events (SSE): the browser challenges once on the initial
// page load, then attaches the cached credential to every same-origin
// request after that, EventSource included.
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
const DASHBOARD_USER = process.env.DASHBOARD_USER || "jerry";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

if (DASHBOARD_PASSWORD) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const [scheme, encoded] = (req.headers.authorization || "").split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const sep = decoded.indexOf(":");
      const user = sep === -1 ? decoded : decoded.slice(0, sep);
      const pass = sep === -1 ? "" : decoded.slice(sep + 1);
      if (safeEqual(user, DASHBOARD_USER) && safeEqual(pass, DASHBOARD_PASSWORD)) {
        next();
        return;
      }
    }
    res.setHeader("WWW-Authenticate", 'Basic realm="Lockard.tech Command Center"');
    res.status(401).send("Authentication required.");
  });
}

app.use(express.json());
app.use(express.static(publicDir));

type StreamEvent =
  | (ChainEvent & { channel?: string })
  | { type: "approval_requested"; approval: PendingApproval }
  | { type: "approval_resolved"; id: string; approved: boolean; timedOut: boolean }
  | { type: "dashboard_sync" }
  | { type: "board_updated"; reason: "sync" }
  | { type: "calendar_updated" }
  | { type: "worklog_updated" }
  | { type: "schedule_run_started"; scheduleId: string }
  | { type: "schedule_run_finished"; scheduleId: string; outcome: "success" | "error" | "timeout" }
  | { type: "schedule_paused"; paused: boolean }
  | { type: "schedule_updated" }
  | { type: "incognito_state"; personaId: string; active: boolean };

const clients = new Set<Response>();
type ReconcileState = "queued" | "working" | "waiting" | "complete" | "error";
interface ReconcileJob {
  id: string;
  channel: string;
  state: ReconcileState;
  startedAt: string;
  finishedAt?: string;
  message: string;
}

const reconcileJobs = new Map<string, ReconcileJob>();

function broadcast(event: StreamEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) res.write(payload);
}

watchTaskStore(() => {
  broadcast({ type: "board_updated", reason: "sync" });
  broadcast({ type: "calendar_updated" });
});
watchTeamUpdates(() => broadcast({ type: "calendar_updated" }));
watchWorkLog(() => {
  broadcast({ type: "worklog_updated" });
  broadcast({ type: "calendar_updated" });
});

onApprovalRequested((approval) => {
  for (const job of reconcileJobs.values()) {
    if (job.state === "working" && approval.personaId === "archie") {
      job.state = "waiting";
      job.message = "Archie is waiting for your approval.";
    }
  }
  broadcast({ type: "approval_requested", approval });
});
onApprovalResolved((id, approved, timedOut) => {
  for (const job of reconcileJobs.values()) {
    if (job.state === "waiting") {
      job.state = "working";
      job.message = approved ? "Approval received. Archie is continuing." : "Approval denied. Archie is wrapping up.";
    }
  }
  broadcast({ type: "approval_resolved", id, approved, timedOut });
});

app.get("/api/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  clients.add(res);
  res.write(`data: ${JSON.stringify({ type: "dashboard_sync" })}\n\n`);
  req.on("close", () => clients.delete(res));
});

app.get("/api/personas", (_req: Request, res: Response) => {
  // systemPrompt is deliberately never exposed — it's long, and the dashboard has no use for it.
  res.json(
    PERSONAS.map(({ id, name, role, department, tagline, color, email, scope, workingHours, focusAreas, tools, partnersWith, bio, startedAt }) => ({
      id,
      name,
      role,
      department,
      tagline,
      color,
      email,
      scope,
      workingHours,
      focusAreas,
      tools,
      partnersWith,
      bio,
      startedAt,
    })),
  );
});

app.get("/api/approvals", (_req: Request, res: Response) => {
  res.json(listPendingApprovals());
});

app.post("/api/approvals/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const approved = Boolean(req.body?.approve);
  const ok = resolveApproval(id, approved);
  if (!ok) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({ ok: true });
});

app.get("/api/profile", (_req: Request, res: Response) => {
  res.json(readProfile());
});

app.get("/api/transcript", (req: Request, res: Response) => {
  const channel = typeof req.query.channel === "string" ? req.query.channel : "team";
  res.json(readTranscript(channel));
});

app.post("/api/transcript/clear", (req: Request, res: Response) => {
  const channel = typeof req.body?.channel === "string" ? req.body.channel : "team";
  clearTranscript(channel);
  res.json({ ok: true, channel });
});

app.post("/api/transcript/reconcile", (req: Request, res: Response) => {
  const channel = typeof req.body?.channel === "string" ? req.body.channel : "team";
  const history = readTranscript(channel, 2000);
  if (!history.length) {
    res.status(400).json({ error: "No chat history to reconcile." });
    return;
  }

  const activeJob = Array.from(reconcileJobs.values()).find((job) => job.state === "queued" || job.state === "working" || job.state === "waiting");
  if (activeJob) {
    res.status(409).json({ error: "A reconciliation is already in progress.", job: activeJob });
    return;
  }

  const transcript = history
    .map(({ ts, event }) => `[${ts}] ${JSON.stringify(event)}`)
    .join("\n");
  const prompt = `Reconcile this old GUI chat history for the lockard-tech website. Treat the current repository, live rules, current MCP data, and current source files as authoritative over anything stale in the transcript. Inspect the relevant code and documentation. Correct stale names (including any old Lexi references when the current agent is Archie), update the appropriate project documentation and shared agent memory with only verified current information, and do not commit or push. Do not invent facts. When finished, report exactly what you corrected and where.\n\nChannel: ${channel}\nTranscript:\n${transcript}`;

  const job: ReconcileJob = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel,
    state: "queued",
    startedAt: new Date().toISOString(),
    message: "Queued for Archie.",
  };
  reconcileJobs.set(job.id, job);
  res.status(202).json({ ok: true, job });

  void (async () => {
    job.state = "working";
    job.message = "Archie is checking the current repository and shared context.";
    try {
      await runPersonaTurn("archie", prompt, () => undefined);
      clearTranscript(channel);
      job.state = "complete";
      job.message = "Archie reconciled the history and it was cleared.";
    } catch (err) {
      job.state = "error";
      job.message = err instanceof Error ? err.message : String(err);
    } finally {
      job.finishedAt = new Date().toISOString();
    }
  })();
});

app.get("/api/transcript/reconcile/:id", (req: Request, res: Response) => {
  const job = reconcileJobs.get(String(req.params.id));
  if (!job) {
    res.status(404).json({ error: "Reconciliation job not found." });
    return;
  }
  res.json(job);
});

app.post("/api/chat", async (req: Request, res: Response) => {
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  const channel = typeof req.body?.channel === "string" ? req.body.channel : "team";
  if (!message.trim()) {
    res.status(400).json({ error: "message required" });
    return;
  }

  const incognito = channel !== "team" && isIncognito(channel);

  // Persisted for transcript replay only — never broadcast, since the sender's
  // own tab already renders their message optimistically on submit.
  const recordUserMessage = (text: string) =>
    incognito ? appendIncognitoEvent(channel, { type: "user_message", text }) : appendTranscriptEvent(channel, { type: "user_message", text });

  const emit = (event: ChainEvent) => {
    if (incognito) {
      // Nothing from an incognito turn ever lands in the shared transcript — including a
      // team_update, which would otherwise leak a note about a private conversation to Team.
      appendIncognitoEvent(channel, event);
      broadcast({ ...event, channel });
      return;
    }
    // team_update is cross-cutting — always lives in Team, regardless of which
    // channel's turn produced it — so it never clutters a 1:1 persona channel.
    const eventChannel = event.type === "team_update" ? "team" : channel;
    appendTranscriptEvent(eventChannel, event);
    broadcast({ ...event, channel: eventChannel });
  };

  if (channel !== "team") {
    if (!getPersona(channel)) {
      res.status(400).json({ error: `Unknown channel: ${channel}` });
      return;
    }

    res.json({ ok: true, chain: [channel] });

    recordUserMessage(message);
    runPersonaTurn(channel, message, emit, { incognito }).catch((err: unknown) => {
      emit({ type: "error", personaId: channel, message: err instanceof Error ? err.message : String(err) });
    });
    return;
  }

  const { chain: parsedChain, cleanText } = parseMentions(message, PERSONAS);
  if (!cleanText) {
    res.status(400).json({ error: "Add some text along with the @mention." });
    return;
  }

  const routed = parsedChain.length === 0;
  const chain = routed ? await routeMessage(cleanText) : parsedChain;

  res.json({ ok: true, chain, routed });

  recordUserMessage(message);
  runMentionChain(chain, cleanText, emit, routed).catch((err: unknown) => {
    emit({ type: "error", personaId: chain[0], message: err instanceof Error ? err.message : String(err) });
  });
});

app.get("/api/incognito/:personaId/status", (req: Request, res: Response) => {
  const personaId = String(req.params.personaId);
  if (!getPersona(personaId)) {
    res.status(400).json({ error: `Unknown persona: ${personaId}` });
    return;
  }
  res.json({ active: isIncognito(personaId) });
});

// Only a 1:1 channel can go incognito — there's no such thing as a private Team conversation.
app.post("/api/incognito/:personaId/start", (req: Request, res: Response) => {
  const personaId = String(req.params.personaId);
  if (!getPersona(personaId)) {
    res.status(400).json({ error: `Unknown persona: ${personaId}` });
    return;
  }
  startIncognito(personaId);
  broadcast({ type: "incognito_state", personaId, active: true });
  res.json({ active: true });
});

/**
 * Ends the private conversation and, for Ryder specifically, immediately kicks off his
 * review turn — reading back the transcript that just ended and deciding what (if anything)
 * could become public content. That review turn itself runs normally (not incognito): its
 * output is meant to reach Jerry, in Ryder's regular channel, not disappear with the rest.
 */
app.post("/api/incognito/:personaId/end", (req: Request, res: Response) => {
  const personaId = String(req.params.personaId);
  const persona = getPersona(personaId);
  if (!persona) {
    res.status(400).json({ error: `Unknown persona: ${personaId}` });
    return;
  }

  const events = readLatestSession(personaId);
  endIncognito(personaId);
  broadcast({ type: "incognito_state", personaId, active: false });
  res.json({ active: false });

  if (personaId === "ryder") {
    const transcriptText = formatSessionTranscript(persona.name, events);
    const prompt = buildReviewPrompt(persona.name, transcriptText);
    const reviewEmit = (event: ChainEvent) => {
      const eventChannel = event.type === "team_update" ? "team" : personaId;
      appendTranscriptEvent(eventChannel, event);
      broadcast({ ...event, channel: eventChannel });
    };
    runPersonaTurn(personaId, prompt, reviewEmit).catch((err: unknown) => {
      reviewEmit({ type: "error", personaId, message: err instanceof Error ? err.message : String(err) });
    });
  }
});

app.get("/api/incognito/:personaId/transcript", (req: Request, res: Response) => {
  const personaId = String(req.params.personaId);
  if (!getPersona(personaId)) {
    res.status(400).json({ error: `Unknown persona: ${personaId}` });
    return;
  }
  res.json(readLatestSessionLines(personaId));
});

app.get("/api/preview/status", async (_req: Request, res: Response) => {
  const running = await checkPreviewStatus();
  res.json({ running, url: PREVIEW_URL });
});

app.post("/api/preview/start", async (_req: Request, res: Response) => {
  const result = await startPreviewServer();
  res.json(result);
});

// ---------- task board ----------
// REST surface over mcp/server/src/tasks.ts — the single shared store agents write to via
// MCP tools (create_task, update_task_status, etc.) and the dashboard reads/writes via these
// routes. Same data either way; there's no separate "GUI copy" of the board.

app.get("/api/board", (_req: Request, res: Response) => {
  res.json(getBoard());
});

app.get("/api/tasks", (req: Request, res: Response) => {
  const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
  if (rawStatus && rawStatus !== "backlog" && rawStatus !== "in-progress" && rawStatus !== "done") {
    res.status(400).json({ error: "status must be backlog, in-progress, or done" });
    return;
  }
  const status = rawStatus === "backlog" || rawStatus === "in-progress" || rawStatus === "done" ? rawStatus : undefined;
  const assignee = typeof req.query.assignee === "string" ? req.query.assignee : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  res.json(listTasks({ status, assignee, category }));
});

app.get("/api/tasks/:id", (req: Request, res: Response) => {
  const task = getTask(String(req.params.id));
  if (!task) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(task);
});

app.post("/api/tasks", (req: Request, res: Response) => {
  const { title, detail, category, priority, assignee, dueDate } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title required" });
    return;
  }
  if (assignee != null && (typeof assignee !== "string" || !getPersona(assignee))) {
    res.status(400).json({ error: "assignee must be a current persona id or null" });
    return;
  }
  if (dueDate != null && (typeof dueDate !== "string" || !isTaskDueDate(dueDate))) {
    res.status(400).json({ error: "dueDate must be a real date in YYYY-MM-DD format" });
    return;
  }
  const task = createTask({
    title,
    detail: typeof detail === "string" ? detail : "",
    category: typeof category === "string" && category.trim() ? category : "general",
    priority: priority === "low" || priority === "high" ? priority : "normal",
    assignee: typeof assignee === "string" && assignee ? assignee : null,
    createdBy: "jerry",
    dueDate: typeof dueDate === "string" ? dueDate : undefined,
  });
  res.status(201).json(task);
});

app.post("/api/tasks/:id/status", (req: Request, res: Response) => {
  const { status, note, expectedStatus } = req.body ?? {};
  if (status !== "backlog" && status !== "in-progress" && status !== "done") {
    res.status(400).json({ error: "status must be backlog, in-progress, or done" });
    return;
  }
  if (expectedStatus !== "backlog" && expectedStatus !== "in-progress" && expectedStatus !== "done") {
    res.status(400).json({ error: "expectedStatus is required and must be backlog, in-progress, or done" });
    return;
  }
  let task;
  try {
    task = updateTaskStatus(
      String(req.params.id),
      status,
      "jerry",
      typeof note === "string" ? note : undefined,
      expectedStatus,
    );
  } catch (error) {
    if (error instanceof TaskStatusConflictError) {
      res.status(409).json({ error: error.message, currentStatus: error.currentStatus });
      return;
    }
    throw error;
  }
  if (!task) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(task);
});

app.post("/api/tasks/:id/assign", (req: Request, res: Response) => {
  if (!req.body || typeof req.body !== "object" || !("assignee" in req.body)) {
    res.status(400).json({ error: "assignee is required; use null to unassign" });
    return;
  }
  const { assignee } = req.body ?? {};
  if (assignee != null && (typeof assignee !== "string" || !getPersona(assignee))) {
    res.status(400).json({ error: "assignee must be a current persona id or null" });
    return;
  }
  const task = assignTask(String(req.params.id), assignee ?? null, "jerry");
  if (!task) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(task);
});

app.post("/api/tasks/:id/due-date", (req: Request, res: Response) => {
  if (!req.body || typeof req.body !== "object" || !("dueDate" in req.body)) {
    res.status(400).json({ error: "dueDate is required; use null to clear it" });
    return;
  }
  const { dueDate } = req.body;
  if (dueDate != null && (typeof dueDate !== "string" || !isTaskDueDate(dueDate))) {
    res.status(400).json({ error: "dueDate must be a real date in YYYY-MM-DD format, or null" });
    return;
  }
  const task = setTaskDueDate(String(req.params.id), dueDate ?? null, "jerry");
  if (!task) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(task);
});

app.post("/api/tasks/:id/note", (req: Request, res: Response) => {
  const { note } = req.body ?? {};
  if (typeof note !== "string" || !note.trim()) {
    res.status(400).json({ error: "note required" });
    return;
  }
  const task = addTaskNote(String(req.params.id), "jerry", note);
  if (!task) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(task);
});

app.get("/api/task-categories", (_req: Request, res: Response) => {
  res.json(listTaskCategories());
});

app.post("/api/task-categories", (req: Request, res: Response) => {
  const { category } = req.body ?? {};
  if (typeof category !== "string" || !category.trim()) {
    res.status(400).json({ error: "category required" });
    return;
  }
  const categories = proposeTaskCategory(category);
  res.json({ categories });
});

// ---------- work log ----------
// A shared, sign-off-able, cross-linkable record of what got done/decided/planned and why —
// distinct from post_team_update (the quick live "FYI" also surfaced in the calendar feed).

const WORKLOG_KINDS = ["update", "add-on", "decision", "plan", "brainstorm"] as const;
type WorkLogKindParam = WorkLogEntry["kind"];

function isWorkLogKind(value: unknown): value is WorkLogKindParam {
  return typeof value === "string" && (WORKLOG_KINDS as readonly string[]).includes(value);
}

app.get("/api/worklog", (req: Request, res: Response) => {
  const taskId = typeof req.query.taskId === "string" ? req.query.taskId : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  const kind = typeof req.query.kind === "string" && isWorkLogKind(req.query.kind) ? req.query.kind : undefined;
  const personaId = typeof req.query.personaId === "string" ? req.query.personaId : undefined;
  const limit = typeof req.query.limit === "string" && Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : undefined;
  res.json(listWorkLog({ taskId, tag, kind, personaId, limit }));
});

app.get("/api/worklog/tags", (_req: Request, res: Response) => {
  res.json(listWorkLogTags());
});

app.get("/api/worklog/:id", (req: Request, res: Response) => {
  const entry = getWorkLogEntry(String(req.params.id));
  if (!entry) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(entry);
});

app.post("/api/worklog", (req: Request, res: Response) => {
  const { kind, summary, rationale, taskId, tag, relatedIds } = req.body ?? {};
  if (typeof summary !== "string" || !summary.trim()) {
    res.status(400).json({ error: "summary required" });
    return;
  }
  if (!isWorkLogKind(kind)) {
    res.status(400).json({ error: `kind must be one of ${WORKLOG_KINDS.join(", ")}` });
    return;
  }
  let entry;
  try {
    entry = createWorkLogEntry({
      by: "jerry",
      kind,
      summary,
      rationale: typeof rationale === "string" ? rationale : undefined,
      taskId: typeof taskId === "string" ? taskId : undefined,
      tag: typeof tag === "string" ? tag : undefined,
      relatedIds: Array.isArray(relatedIds) ? relatedIds.filter((id): id is string => typeof id === "string") : undefined,
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    return;
  }
  res.status(201).json(entry);
});

app.post("/api/worklog/:id/signoff", (req: Request, res: Response) => {
  const { note } = req.body ?? {};
  const entry = signOffWorkLogEntry(String(req.params.id), "jerry", typeof note === "string" ? note : undefined);
  if (!entry) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(entry);
});

// ---------- schedules ----------
// Real, cron-style unattended persona runs — see mcp/AGENTS.md's "Operational" section for the
// rules a scheduled run has to follow (same step cap, same risk checks, same approval gate as
// any other turn; a global pause and per-schedule pause/delete are always available).

app.get("/api/schedules", (_req: Request, res: Response) => {
  const now = new Date();
  const schedules = listSchedules().map((schedule) => ({
    ...schedule,
    nextRunAt: computeNextRunAt(schedule, now)?.toISOString() ?? null,
    inFlight: isScheduleInFlight(schedule.id),
  }));
  res.json({ paused: isAutomationPaused(), schedules });
});

app.post("/api/schedules", (req: Request, res: Response) => {
  const { name, personaId, prompt, cadence, cooldownMinutes, maxRunsPerDay, readOnly } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name required" });
    return;
  }
  if (typeof personaId !== "string" || !getPersona(personaId)) {
    res.status(400).json({ error: "personaId must be a current persona id" });
    return;
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "prompt required" });
    return;
  }
  let schedule;
  try {
    schedule = createSchedule({
      name,
      personaId,
      prompt,
      cadence,
      cooldownMinutes: typeof cooldownMinutes === "number" ? cooldownMinutes : undefined,
      maxRunsPerDay: typeof maxRunsPerDay === "number" ? maxRunsPerDay : undefined,
      readOnly: Boolean(readOnly),
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    return;
  }
  broadcast({ type: "schedule_updated" });
  res.status(201).json(schedule);
});

app.patch("/api/schedules/:id", (req: Request, res: Response) => {
  let schedule;
  try {
    schedule = updateSchedule(String(req.params.id), req.body ?? {});
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    return;
  }
  if (!schedule) {
    res.status(404).json({ error: "not found" });
    return;
  }
  broadcast({ type: "schedule_updated" });
  res.json(schedule);
});

app.delete("/api/schedules/:id", (req: Request, res: Response) => {
  const ok = deleteSchedule(String(req.params.id));
  if (!ok) {
    res.status(404).json({ error: "not found" });
    return;
  }
  broadcast({ type: "schedule_updated" });
  res.json({ ok: true });
});

app.post("/api/schedules/:id/run-now", (req: Request, res: Response) => {
  const schedule = getSchedule(String(req.params.id));
  if (!schedule) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (isAutomationPaused()) {
    res.status(409).json({ error: "Automation is paused." });
    return;
  }
  if (isScheduleInFlight(schedule.id)) {
    res.status(409).json({ error: "This schedule is already running." });
    return;
  }
  if (isPersonaBusy(schedule.personaId)) {
    res.status(409).json({ error: `${schedule.personaId} is already mid-turn.` });
    return;
  }
  res.status(202).json({ ok: true });
  void runScheduleNow(schedule, broadcast);
});

app.post("/api/schedules/pause", (req: Request, res: Response) => {
  const paused = Boolean(req.body?.paused);
  setAutomationPaused(paused);
  broadcast({ type: "schedule_paused", paused });
  res.json({ ok: true, paused });
});

// ---------- task templates + sample data ----------
// Pre-made task starters, and a way to fill or reset the local stores so the Dashboard has
// something to show. Both are local-development conveniences, not part of the agent runtime.

app.get("/api/task-templates", (_req: Request, res: Response) => {
  res.json(TASK_TEMPLATES);
});

app.post("/api/sample-data", (_req: Request, res: Response) => {
  const result = loadSampleData();
  broadcast({ type: "board_updated", reason: "sync" });
  broadcast({ type: "calendar_updated" });
  broadcast({ type: "worklog_updated" });
  res.json({ ok: true, ...result });
});

app.delete("/api/sample-data", (_req: Request, res: Response) => {
  clearSampleData();
  broadcast({ type: "board_updated", reason: "sync" });
  broadcast({ type: "calendar_updated" });
  broadcast({ type: "worklog_updated" });
  res.json({ ok: true });
});

// ---------- roster + calendar ----------
// Derived views over the same task store — no separate state, just different slices for the
// dashboard's Team tab (who's doing what right now) and Calendar tab (what shipped, what's next).

app.get("/api/roster", (_req: Request, res: Response) => {
  const byAssignee = tasksByAssignee();
  const roster = PERSONAS.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    department: p.department,
    color: p.color,
    tagline: p.tagline,
    activeTasks: byAssignee[p.id] ?? [],
  }));
  res.json(roster);
});

app.get("/api/calendar", (req: Request, res: Response) => {
  const requestedDays = typeof req.query.days === "string" ? Number(req.query.days) : 30;
  if (!Number.isFinite(requestedDays) || requestedDays < 1 || requestedDays > 365) {
    res.status(400).json({ error: "days must be a number between 1 and 365" });
    return;
  }

  const days = Math.floor(requestedDays);
  const completed = recentlyCompleted(days);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const teamUpdates = readTeamUpdates(Number.MAX_SAFE_INTEGER)
    .filter((update) => new Date(update.timestamp).getTime() >= cutoff)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const worklogEntries = listWorkLog().filter((entry) => new Date(entry.at).getTime() >= cutoff);
  const activity = [
    ...completed.map((task) => ({
      id: `task:${task.id}`,
      type: "completed" as const,
      timestamp: task.completedAt ?? task.updatedAt,
      task,
    })),
    ...teamUpdates.map((update, index) => ({
      id: `update:${update.timestamp}:${index}`,
      type: "team-update" as const,
      timestamp: update.timestamp,
      update,
    })),
    ...worklogEntries.map((entry) => ({
      id: `worklog:${entry.id}`,
      type: "worklog" as const,
      timestamp: entry.at,
      entry,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  res.json({
    activity,
    completed,
    upcoming: upcomingWork(),
    teamUpdates,
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("mcp-gui request failed:", error instanceof Error ? error.message : "unknown error");
  const status = typeof error === "object" && error !== null && "status" in error && Number(error.status) === 400 ? 400 : 500;
  res.status(status).json({ error: status === 400 ? "Request body must be valid JSON." : "The request could not be completed safely." });
});

startScheduler(broadcast);

const PORT = Number(process.env.PORT ?? 4405);
const HOST = process.env.HOST || "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`mcp-gui listening on http://${HOST}:${PORT}`);
});
