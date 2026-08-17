import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");

function safeRead(file: string): string {
  const path = join(rememberDir, file);
  return existsSync(path) ? readFileSync(path, "utf-8") : "";
}

export interface MemoryContext {
  now: string;
  recent: string;
  core: string;
}

export function readMemoryContext(): MemoryContext {
  return {
    now: safeRead("now.md"),
    recent: safeRead("recent.md"),
    core: safeRead("core-memories.md"),
  };
}

export function appendMemoryNote(agentName: string, summary: string): void {
  const stamp = new Date().toISOString();
  const block = `\n## [${stamp}] ${agentName} session\n${summary.trim()}\n`;
  appendFileSync(join(rememberDir, "now.md"), block, "utf-8");
}

export interface TeamUpdate {
  agent: string;
  message: string;
  affects?: string[];
  timestamp: string;
}

const teamLogPath = join(rememberDir, "team.jsonl");

export function postTeamUpdate(agent: string, message: string, affects?: string[]): TeamUpdate {
  const update: TeamUpdate = { agent, message: message.trim(), affects, timestamp: new Date().toISOString() };
  appendFileSync(teamLogPath, JSON.stringify(update) + "\n", "utf-8");
  return update;
}

export function readTeamUpdates(limit = 50): TeamUpdate[] {
  if (!existsSync(teamLogPath)) return [];
  const lines = readFileSync(teamLogPath, "utf-8").trim().split("\n").filter(Boolean);
  return lines.slice(-limit).map((line) => JSON.parse(line) as TeamUpdate);
}
