import { tool } from "ai";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve as resolvePath, sep } from "node:path";
import { promises as fs } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { checkBashRisk, checkFilePathRisk } from "./risk.js";

const execAsync = promisify(exec);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Returns true to allow the tool call, false to deny it. */
export type ApprovalRequester = (personaId: string, toolName: string, reason: string, detail: string) => Promise<boolean>;

export interface ToolContext {
  personaId: string;
  requestApproval: ApprovalRequester;
}

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".astro", ".remember", "coverage", ".pnpm-store"]);
const MAX_OUTPUT_CHARS = 30_000;
const MAX_READ_BYTES = 250_000;

function truncate(text: string, max = MAX_OUTPUT_CHARS): string {
  return text.length > max ? `${text.slice(0, max)}\n… (truncated, ${text.length - max} more characters)` : text;
}

/** Resolves a possibly-relative path against the repo root, refusing to escape it. */
function resolveInRepo(inputPath: string): string {
  const absolute = resolvePath(repoRoot, inputPath);
  if (absolute !== repoRoot && !absolute.startsWith(repoRoot + sep)) {
    throw new Error(`Path escapes the repository: ${inputPath}`);
  }
  return absolute;
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

export function buildHostTools({ personaId, requestApproval }: ToolContext) {
  const bash = tool({
    description: "Run a shell command in the repository root and return its stdout/stderr.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to run"),
      description: z.string().optional().describe("Short description of what this command does"),
    }),
    execute: async ({ command }) => {
      const risk = checkBashRisk(command);
      if (risk.needsConfirmation) {
        const approved = await requestApproval(personaId, "Bash", risk.reason ?? "risky command", command);
        if (!approved) return `Jerry did not approve this command (${risk.reason}).`;
      }
      try {
        const { stdout, stderr } = await execAsync(command, { cwd: repoRoot, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 });
        const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
        return truncate(combined || "(command produced no output)");
      } catch (error) {
        const err = error as { stdout?: string; stderr?: string; message?: string };
        const combined = [err.stdout, err.stderr, err.message].filter(Boolean).join("\n").trim();
        return truncate(`Command failed: ${combined}`);
      }
    },
  });

  const read = tool({
    description: "Read a text file's contents, with line numbers.",
    inputSchema: z.object({
      file_path: z.string().describe("Path to the file, relative to the repo root or absolute"),
    }),
    execute: async ({ file_path }) => {
      if (/\.env(\..*)?$/i.test(file_path)) return "Reading .env files is never allowed for agents.";
      const absolute = resolveInRepo(file_path);
      const stat = await fs.stat(absolute).catch(() => null);
      if (!stat) return `File not found: ${file_path}`;
      if (stat.size > MAX_READ_BYTES) return `File is too large to read directly (${stat.size} bytes): ${file_path}`;
      const content = await fs.readFile(absolute, "utf-8");
      const numbered = content.split("\n").map((line, i) => `${String(i + 1).padStart(5)}\t${line}`).join("\n");
      return truncate(numbered);
    },
  });

  const write = tool({
    description: "Write full content to a file, creating it (and parent directories) if needed.",
    inputSchema: z.object({
      file_path: z.string().describe("Path to the file, relative to the repo root or absolute"),
      content: z.string().describe("The full content to write"),
    }),
    execute: async ({ file_path, content }) => {
      const risk = checkFilePathRisk(file_path);
      if (risk.needsConfirmation) {
        const approved = await requestApproval(personaId, "Write", risk.reason ?? "protected file", file_path);
        if (!approved) return `Jerry did not approve this change (${risk.reason}).`;
      }
      const absolute = resolveInRepo(file_path);
      await fs.mkdir(dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, content, "utf-8");
      return `Wrote ${content.length} characters to ${file_path}`;
    },
  });

  const edit = tool({
    description: "Replace an exact string in a file with another string.",
    inputSchema: z.object({
      file_path: z.string().describe("Path to the file, relative to the repo root or absolute"),
      old_string: z.string().describe("The exact text to replace"),
      new_string: z.string().describe("The text to replace it with"),
      replace_all: z.boolean().optional().describe("Replace every occurrence instead of requiring exactly one"),
    }),
    execute: async ({ file_path, old_string, new_string, replace_all }) => {
      const risk = checkFilePathRisk(file_path);
      if (risk.needsConfirmation) {
        const approved = await requestApproval(personaId, "Edit", risk.reason ?? "protected file", file_path);
        if (!approved) return `Jerry did not approve this change (${risk.reason}).`;
      }
      const absolute = resolveInRepo(file_path);
      const content = await fs.readFile(absolute, "utf-8").catch(() => null);
      if (content === null) return `File not found: ${file_path}`;
      const occurrences = content.split(old_string).length - 1;
      if (occurrences === 0) return `old_string was not found in ${file_path}`;
      if (occurrences > 1 && !replace_all) return `old_string appears ${occurrences} times in ${file_path} — add more context or pass replace_all`;
      const next = replace_all ? content.split(old_string).join(new_string) : content.replace(old_string, new_string);
      await fs.writeFile(absolute, next, "utf-8");
      return `Replaced ${replace_all ? occurrences : 1} occurrence(s) in ${file_path}`;
    },
  });

  const glob = tool({
    description: "Find files matching a glob pattern (e.g. 'src/**/*.astro').",
    inputSchema: z.object({
      pattern: z.string().describe("Glob pattern, relative to the search root"),
      path: z.string().optional().describe("Directory to search from, relative to the repo root (default: repo root)"),
    }),
    execute: async ({ pattern, path }) => {
      const cwd = path ? resolveInRepo(path) : repoRoot;
      const matches: string[] = [];
      const fsAny = fs as unknown as { glob: (pattern: string, opts: { cwd: string }) => AsyncIterable<string> };
      for await (const entry of fsAny.glob(pattern, { cwd })) {
        matches.push(relative(repoRoot, join(cwd, entry)).split(sep).join("/"));
        if (matches.length >= 200) break;
      }
      return matches.length ? matches.join("\n") : "No files matched.";
    },
  });

  const grep = tool({
    description: "Search file contents for a regular expression across the repository.",
    inputSchema: z.object({
      pattern: z.string().describe("Regular expression to search for"),
      path: z.string().optional().describe("Directory to search from, relative to the repo root (default: repo root)"),
      caseInsensitive: z.boolean().optional(),
    }),
    execute: async ({ pattern, path, caseInsensitive }) => {
      const root = path ? resolveInRepo(path) : repoRoot;
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, caseInsensitive ? "i" : undefined);
      } catch (error) {
        return `Invalid regular expression: ${error instanceof Error ? error.message : String(error)}`;
      }
      const matches: string[] = [];
      for await (const file of walk(root)) {
        if (matches.length >= 200) break;
        const stat = await fs.stat(file).catch(() => null);
        if (!stat || stat.size > MAX_READ_BYTES) continue;
        const content = await fs.readFile(file, "utf-8").catch(() => null);
        if (content === null) continue;
        const relPath = relative(repoRoot, file).split(sep).join("/");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length && matches.length < 200; i++) {
          if (regex.test(lines[i])) matches.push(`${relPath}:${i + 1}:${lines[i].trim().slice(0, 300)}`);
        }
      }
      return matches.length ? matches.join("\n") : "No matches found.";
    },
  });

  return { Bash: bash, Read: read, Write: write, Edit: edit, Glob: glob, Grep: grep };
}
