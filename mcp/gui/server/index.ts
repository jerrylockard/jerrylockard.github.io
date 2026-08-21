import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express, { type Request, type Response } from "express";
import { PERSONAS, getPersona } from "../../agents/src/personas.js";
import { runMentionChain, runPersonaTurn, type ChainEvent } from "./run-persona.js";
import { parseMentions } from "./mentions.js";
import { onApprovalRequested, onApprovalResolved, resolveApproval, listPendingApprovals, type PendingApproval } from "./approvals.js";
import { checkPreviewStatus, startPreviewServer, PREVIEW_URL } from "./preview.js";
import { appendTranscriptEvent, clearTranscript, readTranscript } from "./transcript.js";
import { routeMessage } from "./router.js";
import { readProfile } from "../../server/src/profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const app = express();
app.use(express.json());
app.use(express.static(publicDir));

type StreamEvent =
  | (ChainEvent & { channel?: string })
  | { type: "approval_requested"; approval: PendingApproval }
  | { type: "approval_resolved"; id: string; approved: boolean; timedOut: boolean };

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

onApprovalRequested((approval) => {
  for (const job of reconcileJobs.values()) {
    if (job.state === "working" && approval.personaId === "ledger") {
      job.state = "waiting";
      job.message = "Ledger is waiting for your approval.";
    }
  }
  broadcast({ type: "approval_requested", approval });
});
onApprovalResolved((id, approved, timedOut) => {
  for (const job of reconcileJobs.values()) {
    if (job.state === "waiting") {
      job.state = "working";
      job.message = approved ? "Approval received. Ledger is continuing." : "Approval denied. Ledger is wrapping up.";
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
  req.on("close", () => clients.delete(res));
});

app.get("/api/personas", (_req: Request, res: Response) => {
  res.json(PERSONAS.map(({ id, name, role, tagline, color }) => ({ id, name, role, tagline, color })));
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
  const prompt = `Reconcile this old GUI chat history for the lockard-tech website. Treat the current repository, live rules, current MCP data, and current source files as authoritative over anything stale in the transcript. Inspect the relevant code and documentation. Correct stale names (including any old Lexi references when the current agent is Ledger), update the appropriate project documentation and shared agent memory with only verified current information, and do not commit or push. Do not invent facts. When finished, report exactly what you corrected and where.\n\nChannel: ${channel}\nTranscript:\n${transcript}`;

  const job: ReconcileJob = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel,
    state: "queued",
    startedAt: new Date().toISOString(),
    message: "Queued for Ledger.",
  };
  reconcileJobs.set(job.id, job);
  res.status(202).json({ ok: true, job });

  void (async () => {
    job.state = "working";
    job.message = "Ledger is checking the current repository and shared context.";
    try {
      await runPersonaTurn("ledger", prompt, () => undefined);
      clearTranscript(channel);
      job.state = "complete";
      job.message = "Ledger reconciled the history and it was cleared.";
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

  // Persisted for transcript replay only — never broadcast, since the sender's
  // own tab already renders their message optimistically on submit.
  const recordUserMessage = (text: string) => appendTranscriptEvent(channel, { type: "user_message", text });

  const emit = (event: ChainEvent) => {
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
    runPersonaTurn(channel, message, emit).catch((err: unknown) => {
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

app.get("/api/preview/status", async (_req: Request, res: Response) => {
  const running = await checkPreviewStatus();
  res.json({ running, url: PREVIEW_URL });
});

app.post("/api/preview/start", async (_req: Request, res: Response) => {
  const result = await startPreviewServer();
  res.json(result);
});

const PORT = Number(process.env.PORT ?? 4405);
app.listen(PORT, "127.0.0.1", () => {
  console.log(`mcp-gui listening on http://127.0.0.1:${PORT}`);
});
