import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { getPersona } from "../../agents/src/personas.js";
import { appendMemoryNote } from "../../server/src/memory.js";
import { checkBashRisk, checkFilePathRisk } from "./risk.js";
import { requestApproval } from "./approvals.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const serverEntryPath = join(repoRoot, "mcp", "server", "src", "index.ts");

const siteServerConfig = {
  command: process.execPath,
  args: ["--import", "tsx", serverEntryPath],
};

const sessionIds = new Map<string, string>();

export type PersonaEvent =
  | { type: "text"; personaId: string; text: string }
  | { type: "tool_use"; personaId: string; tool: string }
  | { type: "done"; personaId: string; subtype: string; result?: string }
  | { type: "error"; personaId: string; message: string };

async function canUseTool(personaId: string, toolName: string, input: Record<string, unknown>) {
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

export async function runPersonaTurn(personaId: string, message: string, emit: (event: PersonaEvent) => void): Promise<void> {
  const persona = getPersona(personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const resume = sessionIds.get(personaId);

  const q = query({
    prompt: message,
    options: {
      cwd: repoRoot,
      systemPrompt: persona.systemPrompt,
      mcpServers: { site: siteServerConfig },
      allowedTools: ["mcp__site__*", "Read", "Glob", "Grep"],
      permissionMode: "default",
      ...(resume ? { resume } : {}),
      canUseTool: (toolName: string, input: Record<string, unknown>) => canUseTool(personaId, toolName, input),
    } as Parameters<typeof query>[0]["options"],
  });

  let finalResult: string | undefined;
  let finalSubtype = "success";

  for await (const msg of q as AsyncIterable<any>) {
    if (msg.type === "assistant" && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === "text" && block.text) {
          emit({ type: "text", personaId, text: block.text });
        } else if (block.type === "tool_use") {
          emit({ type: "tool_use", personaId, tool: block.name });
        }
      }
    }

    if (msg.type === "result") {
      if (msg.session_id) sessionIds.set(personaId, msg.session_id);
      finalSubtype = msg.subtype;
      if (msg.subtype === "success") finalResult = msg.result;
    }
  }

  emit({ type: "done", personaId, subtype: finalSubtype, result: finalResult });

  const summary = finalResult ? finalResult.slice(0, 500) : `Session ended: ${finalSubtype}`;
  appendMemoryNote(persona.name, summary);
}
