import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkContentSafety } from "./guardrails.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");
const profilePath = join(rememberDir, "profile.json");

export type ProfileCategory =
  | "communication-style"
  | "decision-patterns"
  | "priorities"
  | "technical-preferences"
  | "working-style";

/**
 * Curated facts Jerry keeps about himself so they can be reused instead of
 * re-asked — the shareable version of a bio, contact details he is happy to
 * give out, standing positions, scheduling constraints.
 *
 * Separate from ProfileObservation on purpose. An observation is the team's read
 * on how he works and is earned by repetition; a field is a stated fact with one
 * correct value that he owns. Conflating them would mean an agent could quietly
 * "reinforce" a fact, and a fact has no confidence to accumulate.
 */
export type ProfileFieldCategory =
  | "identity"
  | "contact"
  | "civic"
  | "background"
  | "positions"
  | "logistics"
  | "assets";

export interface ProfileField {
  key: string;
  label: string;
  value: string;
  category: ProfileFieldCategory;
  /** "jerry", or the agent name that filled it in. */
  source: string;
  updatedAt: string;
}

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

export interface ProfileDoc {
  fields: ProfileField[];
  observations: ProfileObservation[];
}

/**
 * Reads the store, tolerating the original on-disk shape.
 *
 * profile.json used to be a bare array of observations. Existing installs still
 * have that file, so an array is read as { fields: [], observations: array }
 * rather than thrown away — losing what the team had already learned would be a
 * silent, unrecoverable regression on a store that is deliberately not in git.
 */
function readDoc(): ProfileDoc {
  if (!existsSync(profilePath)) return { fields: [], observations: [] };
  try {
    const parsed = JSON.parse(readFileSync(profilePath, "utf-8"));
    if (Array.isArray(parsed)) return { fields: [], observations: parsed };
    return {
      fields: Array.isArray(parsed?.fields) ? parsed.fields : [],
      observations: Array.isArray(parsed?.observations) ? parsed.observations : [],
    };
  } catch {
    return { fields: [], observations: [] };
  }
}

function writeDoc(doc: ProfileDoc): void {
  mkdirSync(rememberDir, { recursive: true });
  writeFileSync(profilePath, JSON.stringify(doc, null, 2), "utf-8");
}

function readAll(): ProfileObservation[] {
  return readDoc().observations;
}

function writeAll(observations: ProfileObservation[]): void {
  writeDoc({ ...readDoc(), observations });
}

/**
 * Nothing enters this store without passing the guardrail check.
 *
 * This file is gitignored, which makes it feel safe to write anything into — and
 * that is exactly the risk. The hard-excluded list (get_guardrails) is excluded
 * because Jerry does not want it recorded anywhere, not merely because it must
 * not be published: the profile is read back by every agent and quoted into
 * drafts, so a home address written here reaches public copy eventually. Failing
 * the write is the only version of this that holds.
 */
export class ProfileSafetyError extends Error {
  constructor(readonly violations: { label: string; match: string }[]) {
    super(`Refused: this looks like hard-excluded material (${violations.map((v) => v.label).join(", ")}). See get_guardrails.`);
    this.name = "ProfileSafetyError";
  }
}

function screen(...texts: string[]): void {
  const result = checkContentSafety(texts.filter(Boolean).join("\n"));
  if (!result.safe) throw new ProfileSafetyError(result.violations);
}

const FIELD_CATEGORIES: ProfileFieldCategory[] = [
  "identity", "contact", "civic", "background", "positions", "logistics", "assets",
];

export function isProfileFieldCategory(value: string): value is ProfileFieldCategory {
  return (FIELD_CATEGORIES as string[]).includes(value);
}

export function listProfileFieldCategories(): ProfileFieldCategory[] {
  return [...FIELD_CATEGORIES];
}

/** Full store: curated fields plus learned observations, each already sorted. */
export function readProfileDoc(): ProfileDoc {
  const doc = readDoc();
  return {
    fields: doc.fields.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label)),
    observations: doc.observations.sort(
      (a, b) => b.timesConfirmed - a.timesConfirmed || b.lastConfirmed.localeCompare(a.lastConfirmed),
    ),
  };
}

/** Upsert one curated fact. Last write wins — a fact has one correct value. */
export function setProfileField(
  source: string,
  key: string,
  label: string,
  value: string,
  category: ProfileFieldCategory,
): ProfileField {
  screen(label, value);
  const slug = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("key must contain at least one letter or number");
  const doc = readDoc();
  const field: ProfileField = {
    key: slug,
    label: label.trim(),
    value: value.trim(),
    category,
    source,
    updatedAt: new Date().toISOString(),
  };
  const index = doc.fields.findIndex((f) => f.key === slug);
  if (index === -1) doc.fields.push(field);
  else doc.fields[index] = field;
  writeDoc(doc);
  return field;
}

export function removeProfileField(key: string): boolean {
  const doc = readDoc();
  const next = doc.fields.filter((f) => f.key !== key);
  if (next.length === doc.fields.length) return false;
  writeDoc({ ...doc, fields: next });
  return true;
}

/** Jerry correcting the record. An observation he rejects should not come back. */
export function forgetObservation(id: string): boolean {
  const doc = readDoc();
  const next = doc.observations.filter((o) => o.id !== id);
  if (next.length === doc.observations.length) return false;
  writeDoc({ ...doc, observations: next });
  return true;
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
  screen(text, evidence ?? "");
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
