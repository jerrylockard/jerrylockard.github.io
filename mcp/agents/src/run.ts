import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { getPersona } from "./personas.js";
import { appendMemoryNote } from "../../server/src/memory.js";
import { checkBashRisk, checkFilePathRisk } from "./risk.js";
import { getSessionId, setSessionId } from "./sessions.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const serverEntryPath = join(repoRoot, "mcp", "server", "src", "index.ts");

const siteServerConfig = {
  command: process.execPath,
  args: ["--import", "tsx", serverEntryPath],
};

export type PersonaEvent =
  | { type: "text"; personaId: string; text: string }
  | { type: "tool_use"; personaId: string; id: string; tool: string; input: unknown; reasoning?: string }
  | { type: "tool_result"; personaId: string; id: string; result: string }
  | { type: "team_update"; personaId: string; agent: string; message: string; affects?: string[] }
  | { type: "done"; personaId: string; subtype: string; result?: string; reasoning?: string }
  | { type: "error"; personaId: string; message: string };

/** Returns true to allow the tool call, false to deny it. */
export type ApprovalRequester = (personaId: string, toolName: string, reason: string, detail: string) => Promise<boolean>;

async function canUseTool(personaId: string, toolName: string, input: Record<string, unknown>, requestApproval: ApprovalRequester) {
  const filePath = typeof input.file_path === "string" ? input.file_path : "";

  if (toolName === "Read" && /\.env(\..*)?$/i.test(filePath)) {
    return { behavior: "deny" as const, message: "Reading .env files is never allowed for agents." };
  }

  if (toolName === "Bash") {
    const command = typeof input.command === "string" ? input.command : "";
    const risk = checkBashRisk(command);
    if (risk.needsConfirmation) {
      const approved = await requestApproval(personaId, toolName, risk.reason ?? "risky command", command);
      return approved
        ? { behavior: "allow" as const, updatedInput: input }
        : { behavior: "deny" as const, message: `Jerry did not approve this command (${risk.reason}).` };
    }
    return { behavior: "allow" as const, updatedInput: input };
  }

  if (toolName === "Write" || toolName === "Edit" || toolName === "NotebookEdit") {
    const risk = checkFilePathRisk(filePath);
    if (risk.needsConfirmation) {
      const approved = await requestApproval(personaId, toolName, risk.reason ?? "protected file", filePath);
      return approved
        ? { behavior: "allow" as const, updatedInput: input }
        : { behavior: "deny" as const, message: `Jerry did not approve this change (${risk.reason}).` };
    }
    return { behavior: "allow" as const, updatedInput: input };
  }

  return { behavior: "allow" as const, updatedInput: input };
}

export interface RunPersonaTurnOptions {
  personaId: string;
  message: string;
  onEvent: (event: PersonaEvent) => void;
  requestApproval: ApprovalRequester;
}

/**
 * Runs one turn of a persona conversation against the Claude Agent SDK. Shared
 * by the GUI (mcp/gui/server/run-persona.ts, GUI-queue approvals + SSE events)
 * and the CLI (mcp/agents/src/cli.ts, terminal-prompt approvals + console
 * output) so both drive the exact same agent behavior and safety rules.
 */
export async function runPersonaTurn({ personaId, message, onEvent, requestApproval }: RunPersonaTurnOptions): Promise<void> {
  const persona = getPersona(personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const resume = getSessionId(personaId);

  const q = query({
    prompt: message,
    options: {
      cwd: repoRoot,
      systemPrompt: persona.systemPrompt,
      mcpServers: { site: siteServerConfig },
      allowedTools: ["mcp__site__*", "Read", "Glob", "Grep"],
      permissionMode: "default",
      thinking: { type: "adaptive", display: "summarized" },
      ...(resume ? { resume } : {}),
      canUseTool: (toolName: string, input: Record<string, unknown>) => canUseTool(personaId, toolName, input, requestApproval),
    } as Parameters<typeof query>[0]["options"],
  });

  let finalResult: string | undefined;
  let finalSubtype = "success";
  let reasoning = "";

  for await (const msg of q as AsyncIterable<any>) {
    if (msg.type === "assistant" && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === "text" && block.text) {
          onEvent({ type: "text", personaId, text: block.text });
        } else if (block.type === "thinking" && block.thinking) {
          reasoning += block.thinking;
        } else if (block.type === "tool_use") {
          onEvent({ type: "tool_use", personaId, id: block.id, tool: block.name, input: block.input, reasoning: reasoning || undefined });
          reasoning = "";
          if (block.name === "mcp__site__post_team_update" && block.input?.agent && block.input?.message) {
            onEvent({ type: "team_update", personaId, agent: block.input.agent, message: block.input.message, affects: block.input.affects });
          }
        }
      }
    }

    if (msg.type === "user" && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === "tool_result") {
          const content = block.content;
          const text = Array.isArray(content)
            ? content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
            : typeof content === "string"
              ? content
              : JSON.stringify(content);
          onEvent({ type: "tool_result", personaId, id: block.tool_use_id, result: text });
        }
      }
    }

    if (msg.type === "result") {
      if (msg.session_id) setSessionId(personaId, msg.session_id);
      finalSubtype = msg.subtype;
      if (msg.subtype === "success") finalResult = msg.result;
    }
  }

  onEvent({ type: "done", personaId, subtype: finalSubtype, result: finalResult, reasoning: reasoning || undefined });

  const summary = finalResult ? finalResult.slice(0, 500) : `Session ended: ${finalSubtype}`;
  appendMemoryNote(persona.name, summary);
}
