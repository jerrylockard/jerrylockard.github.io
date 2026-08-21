import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const profilePath = join(rememberDir, "profile.json");

export type ProfileCategory =
  | "communication-style"
  | "decision-patterns"
  | "priorities"
  | "technical-preferences"
  | "working-style";

export interface ProfileObservation {
  id: string;
  text: string;
  category: ProfileCategory;
  evidence?: string;
  firstNoted: string;
  lastConfirmed: string;
  timesConfirmed: number;
  notedBy: string[];
}

function readAll(): ProfileObservation[] {
  if (!existsSync(profilePath)) return [];
  try {
    return JSON.parse(readFileSync(profilePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeAll(observations: ProfileObservation[]): void {
  mkdirSync(rememberDir, { recursive: true });
  writeFileSync(profilePath, JSON.stringify(observations, null, 2), "utf-8");
}

/**
 * Behavioral patterns the team has learned about how Jerry works — read by
 * every persona. Distinct from Ryder's private journal.ts (biographical,
 * Ryder-only) and memory.ts (session/project continuity, not about Jerry
 * himself). Sorted so the best-established patterns surface first.
 */
export function readProfile(): ProfileObservation[] {
  return readAll().sort((a, b) => b.timesConfirmed - a.timesConfirmed || b.lastConfirmed.localeCompare(a.lastConfirmed));
}

/** Upsert by id — a repeated observation reinforces its existing entry instead of duplicating it. */
export function noteObservation(
  agent: string,
  id: string,
  text: string,
  category: ProfileCategory,
  evidence?: string,
): ProfileObservation {
  const all = readAll();
  const now = new Date().toISOString();
  const existing = all.find((o) => o.id === id);

  if (existing) {
    existing.text = text;
    existing.category = category;
    if (evidence) existing.evidence = evidence;
    existing.lastConfirmed = now;
    existing.timesConfirmed += 1;
    if (!existing.notedBy.includes(agent)) existing.notedBy.push(agent);
    writeAll(all);
    return existing;
  }

  const created: ProfileObservation = {
    id,
    text,
    category,
    evidence,
    firstNoted: now,
    lastConfirmed: now,
    timesConfirmed: 1,
    notedBy: [agent],
  };
  all.push(created);
  writeAll(all);
  return created;
}
