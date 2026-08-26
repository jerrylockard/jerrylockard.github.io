import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ModelMessage } from "ai";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const sessionsPath = join(rememberDir, "sessions.json");

/** Keep conversations bounded — the model still sees plenty of context without growing forever. */
const MAX_HISTORY_MESSAGES = 60;

type SessionStore = Record<string, unknown>;

function isModelMessage(value: unknown): value is ModelMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as { role?: unknown; content?: unknown };
  return (
    ["system", "user", "assistant", "tool"].includes(String(message.role)) &&
    Object.prototype.hasOwnProperty.call(message, "content")
  );
}

function readAll(): SessionStore {
  if (!existsSync(sessionsPath)) return {};
  try {
    return JSON.parse(readFileSync(sessionsPath, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Conversation history is file-backed (not in-memory) so any process — the
 * GUI, a CLI invocation from this tool or another AI tool — resumes the same
 * persona conversation instead of starting fresh each time.
 */
export function getHistory(personaId: string): ModelMessage[] {
  const history = readAll()[personaId];
  if (!Array.isArray(history)) return [];
  return history.filter(isModelMessage);
}

export function setHistory(personaId: string, history: ModelMessage[]): void {
  const all = readAll();
  all[personaId] = history.slice(-MAX_HISTORY_MESSAGES);
  mkdirSync(rememberDir, { recursive: true });
  writeFileSync(sessionsPath, JSON.stringify(all, null, 2), "utf-8");
}
