import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { PERSONAS } from "../../agents/src/personas.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const DEFAULT_CHAIN = ["shepard"];

/**
 * Decides who should answer a Team message Jerry sent without @tagging
 * anyone — a quick, tool-less classification pass over the roster, not a
 * full persona turn (no MCP server, no file access, no memory writes).
 * Falls back to Shepard, the team's catch-all lead, on anything ambiguous,
 * malformed, or if the call itself fails.
 */
export async function routeMessage(message: string): Promise<string[]> {
  const roster = PERSONAS.map((p) => `${p.id}: ${p.role} — ${p.tagline}`).join("\n");
  const prompt = `Jerry posted this in the team's shared channel without addressing anyone specific:\n"${message}"\n\nTeam roster:\n${roster}\n\nWhich agent(s) should answer? Reply with ONLY their id(s), comma-separated, in the order they should respond (usually just one — only list more than one if the message genuinely spans multiple lanes). If it's genuinely unclear or general, reply "shepard".`;

  try {
    const q = query({
      prompt,
      options: {
        cwd: repoRoot,
        systemPrompt: "You are a routing classifier for a small team. Output only agent ids, comma-separated — no explanation, no other text.",
        allowedTools: [],
        permissionMode: "default",
      } as Parameters<typeof query>[0]["options"],
    });

    let result = "";
    for await (const msg of q as AsyncIterable<any>) {
      if (msg.type === "result" && msg.subtype === "success") result = msg.result ?? "";
    }

    const ids = [...new Set(result.toLowerCase().split(/[,\s]+/).map((s) => s.trim()))].filter((id) =>
      PERSONAS.some((p) => p.id === id),
    );

    return ids.length ? ids : DEFAULT_CHAIN;
  } catch {
    return DEFAULT_CHAIN;
  }
}
