import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(dataDir, file), "utf-8")) as T;
}

export interface Identity {
  name: string;
  location: string;
  coordinates: string;
  contactEmail: string | null;
  contactEmailNote: string;
  links: Record<string, string>;
  linksNote: string;
}

export interface Education {
  degree: string;
  institution: string;
  yearAwarded: number;
  honors: string[];
  relevantCourseworkOnSite: string[];
  additionalCourseworkAvailable: string[];
  note: string;
}

export interface WorkItem {
  title: string;
  org?: string;
  detail: string;
  extraDetailAvailable?: string;
}

export interface WorkGroup {
  group: string;
  items: WorkItem[];
}

export interface Todo {
  id: string;
  text: string;
  status: "open" | "done";
  note?: string;
}

export interface Guardrails {
  excludedTopics: string[];
  supersededFacts: string[];
}

export type DesignTokens = Record<string, unknown>;

export const identity = loadJson<Identity>("identity.json");
export const education = loadJson<Education>("education.json");
export const work = loadJson<WorkGroup[]>("work.json");
export const todos = loadJson<Todo[]>("todos.json");
export const guardrails = loadJson<Guardrails>("guardrails.json");
export const designTokens = loadJson<DesignTokens>("design-tokens.json");
