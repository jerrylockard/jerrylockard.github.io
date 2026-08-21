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

const rulesPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "AGENTS.md");

const server = new McpServer({ name: "jerry-lockard.github.io", version: "0.1.0" });

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

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

const transport = new StdioServerTransport();
await server.connect(transport);
