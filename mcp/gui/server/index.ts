import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express, { type Request, type Response } from "express";
import { PERSONAS } from "../../agents/src/personas.js";
import { runMentionChain, type ChainEvent } from "./run-persona.js";
import { parseMentions } from "./mentions.js";
import { onApprovalRequested, onApprovalResolved, resolveApproval, listPendingApprovals, type PendingApproval } from "./approvals.js";
import { checkPreviewStatus, startPreviewServer, PREVIEW_URL } from "./preview.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const app = express();
app.use(express.json());
app.use(express.static(publicDir));

type StreamEvent =
  | ChainEvent
  | { type: "approval_requested"; approval: PendingApproval }
  | { type: "approval_resolved"; id: string; approved: boolean; timedOut: boolean };

const clients = new Set<Response>();

function broadcast(event: StreamEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) res.write(payload);
}

onApprovalRequested((approval) => broadcast({ type: "approval_requested", approval }));
onApprovalResolved((id, approved, timedOut) => broadcast({ type: "approval_resolved", id, approved, timedOut }));

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

app.post("/api/chat", (req: Request, res: Response) => {
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  if (!message.trim()) {
    res.status(400).json({ error: "message required" });
    return;
  }

  const { chain, cleanText } = parseMentions(message, PERSONAS);
  if (chain.length === 0) {
    res.status(400).json({ error: "Tag at least one agent with @name to send this." });
    return;
  }
  if (!cleanText) {
    res.status(400).json({ error: "Add some text along with the @mention." });
    return;
  }

  res.json({ ok: true, chain });

  runMentionChain(chain, cleanText, (event) => broadcast(event)).catch((err: unknown) => {
    broadcast({ type: "error", personaId: chain[0], message: err instanceof Error ? err.message : String(err) });
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
