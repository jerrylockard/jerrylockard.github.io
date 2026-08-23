#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { identity, education, work, todos, guardrails, designTokens, civicVoiceGuide } from "./data.js";
import { checkContentSafety } from "./guardrails.js";
import { readMemoryContext, appendMemoryNote, postTeamUpdate, readTeamUpdates } from "./memory.js";
import { appendJournalEntry, readRecentJournal } from "./journal.js";
import { readProfile, noteObservation } from "./profile.js";
import { getPersona } from "../../agents/src/personas.js";
import {
  createTask,
  listTasks,
  getTask,
  getBoard,
  updateTaskStatus,
  assignTask,
  addTaskNote,
  listTaskCategories,
  proposeTaskCategory,
  tasksByAssignee,
  recentlyCompleted,
  upcomingWork,
  isTaskDueDate,
} from "./tasks.js";

const rulesPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "AGENTS.md");

const server = new McpServer({ name: "jerrylockard.github.io", version: "0.1.0" });

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const taskAssigneeSchema = z.string().refine((id) => Boolean(getPersona(id)), "Must be a current persona id");
const taskActorSchema = z.string().trim().refine((id) => id === "jerry" || Boolean(getPersona(id)), "Must be 'jerry' or a current persona id");
const taskDueDateSchema = z.string().refine(isTaskDueDate, "Must be a real date in YYYY-MM-DD format");

server.registerTool(
  "get_identity",
  {
    title: "Get identity",
    description: "Name, location, and contact/social links for the site owner. Links are unconfirmed placeholders until noted otherwise.",
  },
  async () => json(identity)
);

server.registerTool(
  "get_education",
  {
    title: "Get education",
    description: "Degree, honors, and site-approved coursework. Never includes grades or GPA — see get_guardrails.",
  },
  async () => json(education)
);

server.registerTool(
  "get_work",
  {
    title: "Get work history",
    description: "Grouped work, volunteer, and service history for the site.",
  },
  async () => json(work)
);

server.registerTool(
  "get_design_tokens",
  {
    title: "Get design tokens",
    description: "Palette, type, layout tokens, component patterns, and the design rationale extracted from the approved mockup.",
  },
  async () => json(designTokens)
);

server.registerTool(
  "get_civic_voice_guide",
  {
    title: "Get civic voice guide",
    description:
      "Editorial rules for the Covington Civic Field Notes series (/civic-notes) — voice, the required article structure, the fact/attribution/opinion table, and hard rules (status language, no informal-conversation publishing, no untrimmed recordings). Call this before drafting or editing any civic-notes entry.",
  },
  async () => ({ content: [{ type: "text" as const, text: civicVoiceGuide }] })
);

server.registerTool(
  "list_todos",
  {
    title: "List open TODOs",
    description: "Open items carried over from the mockup's own TODO list (portrait, writing samples, contact email, GitHub handle, font hosting, theme persistence).",
  },
  async () => json(todos)
);

server.registerTool(
  "get_guardrails",
  {
    title: "Get content guardrails",
    description: "Topics that must never appear on the public site, plus facts from older drafts that have been explicitly superseded.",
  },
  async () => json(guardrails)
);

server.registerTool(
  "check_content_safety",
  {
    title: "Check content safety",
    description:
      "Scan drafted copy for excluded-topic patterns (SSN shape, GPA, student ID, street-address shape, an inserted middle name, run-for-office language) before proposing it for the site. Not a substitute for judgment — a clean scan doesn't guarantee the content is appropriate, only that it doesn't match a known-excluded pattern.",
    inputSchema: {
      text: z.string().describe("The drafted copy to check"),
    },
  },
  async ({ text }) => json(checkContentSafety(text))
);

server.registerTool(
  "get_rules",
  {
    title: "Get agent rules",
    description: "The full, current rules doc (mcp/AGENTS.md) — naming, git workflow, commit signature format, content integrity, scope boundaries, and operational rules. Read this at the start of a session.",
  },
  async () => ({ content: [{ type: "text" as const, text: readFileSync(rulesPath, "utf-8") }] })
);

server.registerTool(
  "get_memory_context",
  {
    title: "Get memory context",
    description: "Read the current session buffer, recent history, and core memories from .remember/, for continuity across sessions and agents.",
  },
  async () => json(readMemoryContext())
);

server.registerTool(
  "append_memory_note",
  {
    title: "Append memory note",
    description: "Append a short session summary to the .remember/ buffer so future sessions and other agents have continuity. Call this at the end of a job.",
    inputSchema: {
      agentName: z.string().describe("Which agent is writing this note (e.g. Shepard, Desiree, Devon, Quill, Ace)"),
      summary: z.string().describe("What happened and what changed this session, in a few sentences"),
    },
  },
  async ({ agentName, summary }) => {
    appendMemoryNote(agentName, summary);
    return json({ ok: true });
  }
);

server.registerTool(
  "get_team_updates",
  {
    title: "Get team updates",
    description: "Read recent cross-agent status updates — what teammates have been doing and what might affect your work. Check this at the start of a session, alongside get_memory_context.",
  },
  async () => json(readTeamUpdates())
);

server.registerTool(
  "post_team_update",
  {
    title: "Post team update",
    description: "Let the team know what you did or found, when it might matter to someone else's work — not every routine action. Keep it to a sentence or two.",
    inputSchema: {
      agent: z.string().describe("Your name (e.g. Shepard, Desiree, Devon, Quill, Ace)"),
      message: z.string().describe("What happened, in a sentence or two"),
      affects: z.array(z.string()).optional().describe("Names of teammates this is especially relevant to, if any"),
    },
  },
  async ({ agent, message, affects }) => json(postTeamUpdate(agent, message, affects))
);

server.registerTool(
  "get_profile",
  {
    title: "Get Jerry's learned profile",
    description:
      "Behavioral patterns the team has learned about how Jerry works — communication style, decision patterns, priorities, technical preferences, working style — sorted by how well-established each one is. Read this alongside get_memory_context at the start of a session so you don't ask him things the team should already know. This is NOT biographical/personal content (that's Ryder's private journal, get_journal_context) — it's how he works, not who he is.",
  },
  async () => json(readProfile())
);

server.registerTool(
  "note_about_jerry",
  {
    title: "Note a learned pattern about Jerry",
    description:
      'Record — or reinforce, if it already exists — a genuine, recurring pattern in how Jerry communicates, decides, or prioritizes. Not a one-off. Use a stable, short kebab-case id so repeated observations strengthen the same entry instead of duplicating it (e.g. "prefers-terse-replies", reused every time you notice it again — not a fresh id per observation). Never record anything from the excluded-topics list (get_guardrails) or anything biographical/personal — this is a behavioral-pattern store the whole team reads, not a private journal.',
    inputSchema: {
      agent: z.string().describe("Your name (e.g. Shepard, Desiree, Devon, Quill, Ace, Ledger, Ryder)"),
      id: z.string().describe('Stable kebab-case slug identifying this observation, e.g. "prefers-terse-replies"'),
      text: z.string().describe("The observation itself, one clear sentence"),
      category: z
        .enum(["communication-style", "decision-patterns", "priorities", "technical-preferences", "working-style"])
        .describe("Which kind of pattern this is"),
      evidence: z.string().optional().describe("Optional short quote or context supporting this observation"),
    },
  },
  async ({ agent, id, text, category, evidence }) => json(noteObservation(agent, id, text, category, evidence))
);

server.registerTool(
  "get_journal_context",
  {
    title: "Get journal context",
    description:
      "Ryder-only. Read past daily check-in journal entries with Jerry, for continuity between sessions (following up on something from yesterday, noticing a pattern). No other persona should call this — it's Jerry's personal reflection, not team-shared context.",
  },
  async () => ({ content: [{ type: "text" as const, text: readRecentJournal() || "(no entries yet)" }] })
);

server.registerTool(
  "append_journal_entry",
  {
    title: "Append journal entry",
    description:
      "Ryder-only. Save a daily check-in with Jerry — what was discussed, how he's doing, anything worth following up on. This is private and never becomes site content on its own; content ideas surfaced during the conversation go in a separate list for Jerry to review and approve later, not auto-published.",
    inputSchema: {
      summary: z.string().describe("What was actually discussed — Jerry's day, his own words where it matters, not a generic recap"),
      contentIdeas: z.array(z.string()).optional().describe("Specific ideas that could become site content, for Jerry to review — not pre-approved for publishing"),
    },
  },
  async ({ summary, contentIdeas }) => {
    appendJournalEntry(summary, contentIdeas);
    return json({ ok: true });
  }
);

// ---------- task board ----------
// Backs the dashboard's Kanban/roster/calendar views. Every agent and Jerry share the same
// board — there's no per-persona task store, so "what is Desiree doing" is just a filter over
// the same data "what's in progress" reads from.

server.registerTool(
  "create_task",
  {
    title: "Create a task",
    description:
      "Add a task to the shared board (starts in Backlog). Use this for real, concrete work — not a vague aspiration. Pick an existing category from list_task_categories when one fits; call propose_task_category first if you genuinely need a new one.",
    inputSchema: {
      title: z.string().trim().min(1).describe("Short task title, e.g. 'Self-host WOFF2 fonts'"),
      detail: z.string().describe("What actually needs to happen, in a sentence or two"),
      category: z.string().trim().min(1).describe("Category id — see list_task_categories for what already exists"),
      priority: z.enum(["low", "normal", "high"]).optional().describe("Defaults to normal"),
      assignee: taskAssigneeSchema.optional().describe("Persona id to assign to now, or omit to leave unassigned"),
      createdBy: taskActorSchema.describe("Your persona id, or 'jerry' if you're relaying a request from him"),
      dueDate: taskDueDateSchema.optional().describe("YYYY-MM-DD date, if there's a real deadline"),
    },
  },
  async ({ title, detail, category, priority, assignee, createdBy, dueDate }) =>
    json(createTask({ title, detail, category, priority, assignee: assignee ?? null, createdBy, dueDate }))
);

server.registerTool(
  "list_tasks",
  {
    title: "List tasks",
    description: "List tasks on the shared board, optionally filtered by status, assignee, or category.",
    inputSchema: {
      status: z.enum(["backlog", "in-progress", "done"]).optional(),
      assignee: z.string().optional().describe("Persona id"),
      category: z.string().optional(),
    },
  },
  async ({ status, assignee, category }) => json(listTasks({ status, assignee, category }))
);

server.registerTool(
  "get_board",
  {
    title: "Get the full task board",
    description: "Read the whole board — backlog, in-progress, and done columns, plus the current category list. This is what the dashboard's Kanban view renders directly.",
  },
  async () => json(getBoard())
);

server.registerTool(
  "get_task",
  {
    title: "Get one task",
    description: "Read a single task by id, including its full activity log.",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    const task = getTask(id);
    if (!task) return json({ error: "not found" });
    return json(task);
  }
);

server.registerTool(
  "update_task_status",
  {
    title: "Move a task",
    description: "Move a task between Backlog, In Progress, and Done. Call this whenever you actually start or finish something on the board — the dashboard's calendar view is built from Done timestamps, so stale statuses make Jerry's activity view wrong.",
    inputSchema: {
      id: z.string(),
      status: z.enum(["backlog", "in-progress", "done"]),
      expectedStatus: z.enum(["backlog", "in-progress", "done"]).describe("The status you observed before this move"),
      by: taskActorSchema.describe("Your persona id"),
      note: z.string().optional().describe("Optional short note on why/what changed"),
    },
  },
  async ({ id, status, expectedStatus, by, note }) => {
    const task = updateTaskStatus(id, status, by, note, expectedStatus);
    if (!task) return json({ error: "not found" });
    return json(task);
  }
);

server.registerTool(
  "assign_task",
  {
    title: "Assign or reassign a task",
    description: "Assign a task to a persona, reassign it to someone else, or clear the assignee entirely (pass no assignee to unassign).",
    inputSchema: {
      id: z.string(),
      assignee: taskAssigneeSchema.optional().describe("Persona id to assign to; omit to unassign"),
      by: taskActorSchema.describe("Your persona id, or 'jerry'"),
    },
  },
  async ({ id, assignee, by }) => {
    const task = assignTask(id, assignee ?? null, by);
    if (!task) return json({ error: "not found" });
    return json(task);
  }
);

server.registerTool(
  "add_task_note",
  {
    title: "Add a note to a task",
    description: "Append a progress note to a task's activity log without changing its status or assignee — use this for a status update on something still in progress.",
    inputSchema: {
      id: z.string(),
      by: taskActorSchema.describe("Your persona id"),
      note: z.string().trim().min(1),
    },
  },
  async ({ id, by, note }) => {
    const task = addTaskNote(id, by, note);
    if (!task) return json({ error: "not found" });
    return json(task);
  }
);

server.registerTool(
  "list_task_categories",
  {
    title: "List task categories",
    description: "The current set of task categories on the board — check this before creating a task so you reuse an existing category instead of fragmenting the board.",
  },
  async () => json(listTaskCategories())
);

server.registerTool(
  "propose_task_category",
  {
    title: "Propose a new task category",
    description:
      "Add a new category to the board (e.g. a new site section or project area). This is how the board grows over time without a schema change — use it when an existing category genuinely doesn't fit, not as a default.",
    inputSchema: { category: z.string().trim().min(1) },
  },
  async ({ category }) => json({ categories: proposeTaskCategory(category) })
);

server.registerTool(
  "get_my_work",
  {
    title: "Get current work by assignee",
    description: "Rollup of what's currently assigned to each persona (excludes done). Powers the dashboard roster view's 'what is each person working on' cards. Call with no arguments for everyone, or check your own queue at the start of a session.",
  },
  async () => json(tasksByAssignee())
);

server.registerTool(
  "get_recent_activity",
  {
    title: "Get recently completed work",
    description: "Tasks completed within the given window (default 30 days), newest first — the 'what's been accomplished' side of the dashboard's calendar view.",
    inputSchema: {
      days: z.number().int().min(1).max(365).optional().describe("Lookback window in days, defaults to 30"),
    },
  },
  async ({ days }) => json(recentlyCompleted(days))
);

server.registerTool(
  "get_upcoming_work",
  {
    title: "Get planned and in-progress work",
    description: "In-progress work followed by Backlog, ordered by due date and priority — the 'what's planned next' side of the dashboard's calendar view.",
  },
  async () => json(upcomingWork())
);

const transport = new StdioServerTransport();
await server.connect(transport);
