import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkContentSafety } from "./guardrails.js";
import { recentlyCompleted, type Task } from "./tasks.js";
import { readTeamUpdates, type TeamUpdate } from "./memory.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const statePath = join(rememberDir, "changelog-state.json");
const changelogPath = join(repoRoot, "CHANGELOG.md");

/**
 * Turns finished work into a published CHANGELOG.md.
 *
 * The flow Jerry described: a task gets checked off, it leaves the Tasks view,
 * it shows up here as a candidate, and once he approves it, it lands in the
 * repo's CHANGELOG.md.
 *
 * Two things make that more than string concatenation.
 *
 * First, CHANGELOG.md is TRACKED and this repo is PUBLIC, while the task board
 * and team log live in gitignored .remember/. So this function is the exact
 * private-to-public boundary the dashboard is supposed to have, and every line
 * crossing it is screened against the guardrails. A task titled after a doctor's
 * appointment must not become a permanent public git entry.
 *
 * Second, publishing has to be idempotent. Without a record of what has already
 * been published, every publish would re-append the same finished work — so ids
 * and update stamps are remembered here rather than inferred from the file.
 */

interface ChangelogState {
  publishedTaskIds: string[];
  publishedUpdateKeys: string[];
}

export type ChangelogSourceKind = "task" | "update";

export interface ChangelogCandidate {
  /** Stable key: `task:<id>` or `update:<iso>:<agent>`. */
  key: string;
  kind: ChangelogSourceKind;
  /** The line as it would appear in CHANGELOG.md, without the bullet. */
  text: string;
  /** YYYY-MM-DD the work landed. */
  date: string;
  category?: string;
  agent?: string;
  /** Set when this line trips a guardrail; it cannot be published as-is. */
  blocked?: { label: string; match: string }[];
}

function readState(): ChangelogState {
  if (!existsSync(statePath)) return { publishedTaskIds: [], publishedUpdateKeys: [] };
  try {
    const parsed = JSON.parse(readFileSync(statePath, "utf-8"));
    return {
      publishedTaskIds: Array.isArray(parsed?.publishedTaskIds) ? parsed.publishedTaskIds : [],
      publishedUpdateKeys: Array.isArray(parsed?.publishedUpdateKeys) ? parsed.publishedUpdateKeys : [],
    };
  } catch {
    return { publishedTaskIds: [], publishedUpdateKeys: [] };
  }
}

function writeState(state: ChangelogState): void {
  mkdirSync(rememberDir, { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
}

function dayOf(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function updateKey(update: TeamUpdate): string {
  return `update:${update.timestamp}:${update.agent}`;
}

function screen(text: string): { label: string; match: string }[] | undefined {
  const result = checkContentSafety(text);
  return result.safe ? undefined : result.violations;
}

function taskCandidate(task: Task): ChangelogCandidate {
  const text = task.title.trim().replace(/\s+/g, " ");
  return {
    key: `task:${task.id}`,
    kind: "task",
    text,
    date: dayOf(task.completedAt ?? task.updatedAt),
    category: task.category,
    agent: task.assignee ?? undefined,
    blocked: screen(`${text} ${task.detail ?? ""}`),
  };
}

function updateCandidate(update: TeamUpdate): ChangelogCandidate {
  const text = update.message.trim().replace(/\s+/g, " ");
  return {
    key: updateKey(update),
    kind: "update",
    text,
    date: dayOf(update.timestamp),
    agent: update.agent,
    blocked: screen(text),
  };
}

/** Finished work not yet in CHANGELOG.md, newest first. */
export function listChangelogCandidates(days = 90): ChangelogCandidate[] {
  const state = readState();
  const publishedTasks = new Set(state.publishedTaskIds);
  const publishedUpdates = new Set(state.publishedUpdateKeys);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const tasks = recentlyCompleted(days)
    .filter((t) => !publishedTasks.has(t.id))
    .map(taskCandidate);

  const updates = readTeamUpdates(Number.MAX_SAFE_INTEGER)
    .filter((u) => new Date(u.timestamp).getTime() >= cutoff && !publishedUpdates.has(updateKey(u)))
    .map(updateCandidate);

  return [...tasks, ...updates].sort((a, b) => b.date.localeCompare(a.date) || a.text.localeCompare(b.text));
}

export function readChangelog(): string {
  return existsSync(changelogPath) ? readFileSync(changelogPath, "utf-8") : "";
}

const HEADER = `# Changelog

What has actually changed on jerrylockard.me and in the work behind it. Newest
first. Written from finished work on the dashboard's task board, reviewed by
Jerry before anything lands here.
`;

export interface PublishResult {
  written: string;
  path: string;
  count: number;
  skipped: { key: string; reason: string }[];
}

/**
 * Appends the selected candidates to CHANGELOG.md as one dated section.
 *
 * Re-screens at publish time rather than trusting the flag from
 * listChangelogCandidates: the candidate list may have been fetched minutes ago,
 * and this is the write that makes something permanent and public. A blocked line
 * is skipped and reported, never silently dropped.
 */
export function publishToChangelog(keys: string[], heading?: string): PublishResult {
  const wanted = new Set(keys);
  const candidates = listChangelogCandidates(3650).filter((c) => wanted.has(c.key));

  const skipped: { key: string; reason: string }[] = [];
  const publishable: ChangelogCandidate[] = [];
  for (const candidate of candidates) {
    const violations = screen(candidate.text);
    if (violations) {
      skipped.push({
        key: candidate.key,
        reason: `Held back — reads as ${violations.map((v) => v.label).join(" and ")}, which is on the excluded list and this file is public.`,
      });
      continue;
    }
    publishable.push(candidate);
  }

  for (const key of keys) {
    if (!candidates.some((c) => c.key === key)) {
      skipped.push({ key, reason: "No longer a candidate — already published, or the task was reopened." });
    }
  }

  if (!publishable.length) {
    return { written: "", path: changelogPath, count: 0, skipped };
  }

  const date = heading?.trim() || new Date().toISOString().slice(0, 10);
  const lines = publishable.map((c) => {
    const tail = c.category && c.kind === "task" ? ` _(${c.category})_` : "";
    return `- ${c.text}${tail}`;
  });
  const section = `\n## ${date}\n\n${lines.join("\n")}\n`;

  const existing = readChangelog();
  if (!existing.trim()) {
    writeFileSync(changelogPath, `${HEADER}${section}`, "utf-8");
  } else {
    // Newest section directly under the header, matching the convention
    // .remember/CHANGELOG.md already uses.
    const marker = existing.indexOf("\n## ");
    const next = marker === -1
      ? `${existing.replace(/\s*$/, "\n")}${section}`
      : `${existing.slice(0, marker)}${section}${existing.slice(marker)}`;
    writeFileSync(changelogPath, next, "utf-8");
  }

  const state = readState();
  for (const candidate of publishable) {
    if (candidate.kind === "task") state.publishedTaskIds.push(candidate.key.slice("task:".length));
    else state.publishedUpdateKeys.push(candidate.key);
  }
  writeState(state);

  return { written: section.trim(), path: changelogPath, count: publishable.length, skipped };
}
