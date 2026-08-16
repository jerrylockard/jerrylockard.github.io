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
