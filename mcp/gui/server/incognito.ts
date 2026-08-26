import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { TranscriptEvent } from "./transcript.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const incognitoDir = join(repoRoot, ".remember", "incognito");

/**
 * Which persona channels are currently in an incognito conversation. In-memory only, same
 * reasoning as turn-lock.ts's `busy` set — one process, nothing else to coordinate with.
 */
const active = new Set<string>();

export function isIncognito(personaId: string): boolean {
  return active.has(personaId);
}

export interface IncognitoLine {
  ts: string;
  event: TranscriptEvent | { type: "incognito_start" } | { type: "incognito_end" };
}

function filePath(personaId: string): string {
  return join(incognitoDir, `${personaId}.jsonl`);
}

function appendLine(personaId: string, line: IncognitoLine): void {
  mkdirSync(incognitoDir, { recursive: true });
  appendFileSync(filePath(personaId), JSON.stringify(line) + "\n", "utf-8");
}

/** Starts a private conversation with this persona — nothing recorded from here goes to the shared transcript or the persona's normal working memory. */
export function startIncognito(personaId: string): void {
  active.add(personaId);
  appendLine(personaId, { ts: new Date().toISOString(), event: { type: "incognito_start" } });
}

/** Ends the private conversation. The transcript stays on disk as Ryder's private notes (see readLatestSession) — this only flips the live routing back to normal. */
export function endIncognito(personaId: string): void {
  active.delete(personaId);
  appendLine(personaId, { ts: new Date().toISOString(), event: { type: "incognito_end" } });
}

export function appendIncognitoEvent(personaId: string, event: TranscriptEvent): void {
  appendLine(personaId, { ts: new Date().toISOString(), event });
}

/**
 * Everything from the most recent incognito_start to its matching incognito_end (or to the
 * end of the file, if the session that just ended is the one being asked for). This is what
 * gets handed to a persona for review — never anything from an earlier, already-reviewed
 * session, so a re-review doesn't dredge up old private notes unprompted.
 */
function latestSessionLines(personaId: string): IncognitoLine[] {
  const path = filePath(personaId);
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as IncognitoLine);

  let startIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].event.type === "incognito_start") {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) return [];

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].event.type === "incognito_end") {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex);
}

/** For the review prompt — just the events, in order, from the session that just ended. */
export function readLatestSession(personaId: string): TranscriptEvent[] {
  return latestSessionLines(personaId)
    .map((l) => l.event)
    .filter((e): e is TranscriptEvent => e.type !== "incognito_start" && e.type !== "incognito_end");
}

/** For the GUI reloading mid-conversation — same events, with timestamps, shaped like a normal transcript line so the frontend's existing replay code (applyHistoryEvent) needs no incognito-specific branch. */
export function readLatestSessionLines(personaId: string): { channel: string; ts: string; event: TranscriptEvent }[] {
  return latestSessionLines(personaId)
    .filter((l): l is IncognitoLine & { event: TranscriptEvent } => l.event.type !== "incognito_start" && l.event.type !== "incognito_end")
    .map((l) => ({ channel: personaId, ts: l.ts, event: l.event }));
}

/** Reduces raw streamed events into a plain back-and-forth transcript, ignoring tool chatter and other bookkeeping event types. */
export function formatSessionTranscript(personaName: string, events: TranscriptEvent[]): string {
  const lines: string[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer.trim()) lines.push(`${personaName}: ${buffer.trim()}`);
    buffer = "";
  };
  for (const event of events) {
    if (event.type === "user_message") {
      flush();
      lines.push(`Jerry: ${event.text}`);
    } else if (event.type === "text") {
      buffer += event.text;
    } else if (event.type === "done") {
      flush();
    }
  }
  flush();
  return lines.join("\n\n");
}

export function buildReviewPrompt(personaName: string, transcriptText: string): string {
  if (!transcriptText.trim()) {
    return "Jerry just ended a private conversation with you, but nothing was actually said. Nothing to review.";
  }
  return [
    `Jerry just ended a private, incognito conversation with you. Nothing said in it was shown to the rest of the team, and none of it is in your regular working memory — this is the only place you'll see it. Here it is:`,
    "",
    "---",
    transcriptText,
    "---",
    "",
    `Decide what, if anything, could become public content — a journal entry, an op-ed angle, Civic Field Notes material, About/Platform copy. Some of it may be nothing more than an ordinary conversation with nothing to say publicly, and that's a fine answer too.`,
    `Do NOT quote or restate personal or sensitive specifics in your answer — describe possible angles or themes only, in general terms. This response is going back to Jerry in your regular channel, not staying private, so nothing here should re-expose what he just told you in confidence.`,
    `If something would need Jerry's own explicit read before you'd treat it as content, say so plainly instead of guessing — per your standing rule, anything personal goes back to him directly first, every time, no exceptions.`,
    `Run check_content_safety on any concrete copy before proposing it, same as always.`,
  ].join("\n");
}
