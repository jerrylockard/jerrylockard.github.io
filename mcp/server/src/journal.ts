import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const journalPath = join(repoRoot, ".remember", "journal.md");

/**
 * Ryder's daily check-in journal — kept separate from now.md/recent.md/
 * team.jsonl on purpose. Those are shared context every persona reads at
 * the start of a session; this is Jerry's personal reflection, and nothing
 * here should leak into Desiree's or Devon's context just because they
 * called get_memory_context. Only Ryder reads or writes this file. Still
 * gitignored like the rest of .remember/ — never becomes site content on
 * its own, no matter what's in it.
 */
export function appendJournalEntry(summary: string, contentIdeas?: string[]): void {
  const stamp = new Date().toISOString();
  const ideas = contentIdeas?.length ? `\n\nContent ideas surfaced:\n${contentIdeas.map((i) => `- ${i}`).join("\n")}` : "";
  const block = `\n## [${stamp}]\n${summary.trim()}${ideas}\n`;
  appendFileSync(journalPath, block, "utf-8");
}

export function readRecentJournal(): string {
  return existsSync(journalPath) ? readFileSync(journalPath, "utf-8") : "";
}
