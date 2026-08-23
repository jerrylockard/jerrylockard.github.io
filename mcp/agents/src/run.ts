import { ToolLoopAgent, isStepCount, type ModelMessage } from "ai";
import { getPersona } from "./personas.js";
import { appendMemoryNote } from "../../server/src/memory.js";
import { resolveModel } from "./providers.js";
import { buildHostTools, type ApprovalRequester } from "./tools.js";
import { getSiteTools } from "./mcp-client.js";
import { getHistory, setHistory } from "./sessions.js";

export type { ApprovalRequester };

export type PersonaEvent =
  | { type: "text"; personaId: string; text: string }
  | { type: "tool_use"; personaId: string; id: string; tool: string; input: unknown; reasoning?: string }
  | { type: "tool_result"; personaId: string; id: string; result: string }
  | { type: "team_update"; personaId: string; agent: string; message: string; affects?: string[] }
  | { type: "done"; personaId: string; subtype: string; result?: string; reasoning?: string }
  | { type: "error"; personaId: string; message: string };

export interface RunPersonaTurnOptions {
  personaId: string;
  message: string;
  onEvent: (event: PersonaEvent) => void;
  requestApproval: ApprovalRequester;
}

/**
 * Runs one turn of a persona conversation. Provider-agnostic — the persona's
 * `model` field (default: Claude, via providers.ts) picks the actual model,
 * routed through the Vercel AI Gateway so one AI_GATEWAY_API_KEY covers
 * Anthropic/OpenAI/Google/etc. Shared by the GUI (mcp/gui/server/run-persona.ts,
 * GUI-queue approvals + SSE events) and the CLI (mcp/agents/src/cli.ts,
 * terminal-prompt approvals + console output) so both drive the exact same
 * agent behavior and safety rules.
 */
export async function runPersonaTurn({ personaId, message, onEvent, requestApproval }: RunPersonaTurnOptions): Promise<void> {
  const persona = getPersona(personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  let reasoning = "";
  let assistantText = "";
  let finalSubtype = "success";

  try {
    const model = resolveModel(persona);
    const hostTools = buildHostTools({ personaId, requestApproval });
    const siteTools = await getSiteTools();

    const agent = new ToolLoopAgent({
      model,
      instructions: persona.systemPrompt,
      tools: { ...hostTools, ...siteTools },
      stopWhen: isStepCount(40),
    });

    const history = getHistory(personaId);
    const messages: ModelMessage[] = [...history, { role: "user", content: message }];

    const result = await agent.stream({ messages });

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        assistantText += part.text;
        onEvent({ type: "text", personaId, text: part.text });
      } else if (part.type === "reasoning-delta") {
        reasoning += part.text;
      } else if (part.type === "tool-call") {
        onEvent({ type: "tool_use", personaId, id: part.toolCallId, tool: part.toolName, input: part.input, reasoning: reasoning || undefined });
        reasoning = "";
        if (part.toolName === "mcp__site__post_team_update") {
          const input = part.input as { agent?: string; message?: string; affects?: string[] };
          if (input?.agent && input?.message) {
            onEvent({ type: "team_update", personaId, agent: input.agent, message: input.message, affects: input.affects });
          }
        }
      } else if (part.type === "tool-result") {
        const text = typeof part.output === "string" ? part.output : JSON.stringify(part.output);
        onEvent({ type: "tool_result", personaId, id: part.toolCallId, result: text });
      } else if (part.type === "tool-error") {
        const text = part.error instanceof Error ? part.error.message : String(part.error);
        onEvent({ type: "tool_result", personaId, id: part.toolCallId, result: `Error: ${text}` });
      } else if (part.type === "error") {
        const text = part.error instanceof Error ? part.error.message : String(part.error);
        onEvent({ type: "error", personaId, message: text });
        finalSubtype = "error";
      }
    }

    const responseMessages = await result.responseMessages;
    setHistory(personaId, [...messages, ...responseMessages]);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    onEvent({ type: "error", personaId, message: messageText });
    finalSubtype = "error";
  }

  onEvent({ type: "done", personaId, subtype: finalSubtype, result: assistantText || undefined, reasoning: reasoning || undefined });

  const summary = assistantText ? assistantText.slice(0, 500) : `Session ended: ${finalSubtype}`;
  appendMemoryNote(persona.name, summary);
}
