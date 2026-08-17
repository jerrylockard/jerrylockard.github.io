import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const sessionsPath = join(rememberDir, "sessions.json");

function readAll(): Record<string, string> {
  if (!existsSync(sessionsPath)) return {};
  try {
    return JSON.parse(readFileSync(sessionsPath, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Session IDs are file-backed (not in-memory) so any process — the GUI, a CLI
 * invocation from this tool or another AI tool — resumes the same persona
 * conversation instead of starting fresh each time.
 */
export function getSessionId(personaId: string): string | undefined {
  return readAll()[personaId];
}

export function setSessionId(personaId: string, sessionId: string): void {
  const all = readAll();
  all[personaId] = sessionId;
  mkdirSync(rememberDir, { recursive: true });
  writeFileSync(sessionsPath, JSON.stringify(all, null, 2), "utf-8");
}
