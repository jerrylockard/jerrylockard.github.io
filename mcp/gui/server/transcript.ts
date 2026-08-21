import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ChainEvent } from "./run-persona.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const transcriptPath = join(rememberDir, "gui-transcript.jsonl");

/** A user-sent message, recorded for replay only — never broadcast live (the sender's own tab renders it optimistically on submit). */
export type UserMessageEvent = { type: "user_message"; text: string };

export type TranscriptEvent = ChainEvent | UserMessageEvent;

export interface TranscriptLine {
  channel: string;
  ts: string;
  event: TranscriptEvent;
}

/**
 * Per-channel chat history for the GUI. The live log is otherwise pure SSE —
 * nothing persists across a reload — so this is what lets a persona channel
 * show past messages when Jerry switches to it or reopens the tab. `channel`
 * is whichever channel was active when the event was produced ("team" or a
 * persona id); readTranscript's "team" case returns everything, since Team
 * is the union view.
 */
export function appendTranscriptEvent(channel: string, event: TranscriptEvent): void {
  mkdirSync(rememberDir, { recursive: true });
  const line: TranscriptLine = { channel, ts: new Date().toISOString(), event };
  appendFileSync(transcriptPath, JSON.stringify(line) + "\n", "utf-8");
}

export function readTranscript(channel: string, limit = 200): TranscriptLine[] {
  if (!existsSync(transcriptPath)) return [];
  const lines = readFileSync(transcriptPath, "utf-8").trim().split("\n").filter(Boolean);
  const parsed = lines.map((line) => JSON.parse(line) as TranscriptLine);
  const filtered = channel === "team" ? parsed : parsed.filter((l) => l.channel === channel);
  return filtered.slice(-limit);
}

export function clearTranscript(channel: string): void {
  if (!existsSync(transcriptPath)) return;
  const lines = readFileSync(transcriptPath, "utf-8").trim().split("\n").filter(Boolean);
  const retained = channel === "team" ? [] : lines.filter((line) => {
    const parsed = JSON.parse(line) as TranscriptLine;
    return parsed.channel !== channel;
  });
  writeFileSync(transcriptPath, retained.length ? `${retained.join("\n")}\n` : "", "utf-8");
}
