#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { identity, education, work, todos, guardrails, designTokens } from "./data.js";
import { checkContentSafety } from "./guardrails.js";
import { readMemoryContext, appendMemoryNote, postTeamUpdate, readTeamUpdates } from "./memory.js";

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
      agentName: z.string().describe("Which agent is writing this note (e.g. Andrew, Desiree, Devon, Penelope, Ethan)"),
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
      agent: z.string().describe("Your name (e.g. Andrew, Desiree, Devon, Penelope, Ethan)"),
      message: z.string().describe("What happened, in a sentence or two"),
      affects: z.array(z.string()).optional().describe("Names of teammates this is especially relevant to, if any"),
    },
  },
  async ({ agent, message, affects }) => json(postTeamUpdate(agent, message, affects))
);

const transport = new StdioServerTransport();
await server.connect(transport);
