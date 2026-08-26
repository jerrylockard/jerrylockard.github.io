import { runPersonaTurn, type PersonaEvent, type HandoffRequest, type ApprovalRequester } from "./run.js";
import { getPersona } from "./personas.js";
import { appendMemoryNote } from "../../server/src/memory.js";
import { withPersonaLock } from "./turn-lock.js";

export type HandoffChainEvent =
  | { type: "handoff_start"; fromPersonaId: string; toPersonaId: string; hop: number }
  | { type: "handoff_limit_reached"; chain: string[]; blockedPersonaId: string };

export interface RunPersonaChainOptions {
  personaId: string;
  message: string;
  onEvent: (event: PersonaEvent | HandoffChainEvent) => void;
  requestApproval: ApprovalRequester;
  /** Hard cap on automatic delegate_to hand-offs for this chain. Past this, the chain just stops — logged, not an error — and the task sits assigned/waiting like an ordinary assign_task call. */
  maxHops?: number;
  /** Threaded to every hop, including delegated ones — an idle/brainstorm chain stays read-only end to end. */
  readOnly?: boolean;
  /** Threaded to every hop, including delegated ones — a private chat stays isolated end to end, even if it hands off. */
  incognito?: boolean;
}

function buildDelegationPrompt(fromPersonaId: string, request: HandoffRequest, fromFinalReply: string): string {
  const fromName = getPersona(fromPersonaId)?.name ?? fromPersonaId;
  const taskLine = request.taskId ? `Task ${request.taskId} is now assigned to you.` : "";
  return [
    `${fromName} is handing this off to you, in the same session, to pick up right now.`,
    taskLine,
    `${fromName}'s instructions: "${request.instructions}"`,
    "",
    `${fromName}'s last message before handing off: "${fromFinalReply.slice(0, 1000)}"`,
    "",
    "Pick this up now, in your own lane, following the team's rules — or say why you can't.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Runs one persona's turn, and — if it calls `delegate_to` — automatically continues into the
 * named persona's turn next, in the same session, and so on. Each hop is its own full
 * runPersonaTurn call: its own step budget, its own approval gate, nothing new needed there.
 * Hitting maxHops degrades gracefully rather than failing — the underlying task assignment from
 * delegate_to always succeeds; only the decision to also spawn a live turn for it is capped.
 */
export async function runPersonaChain({
  personaId,
  message,
  onEvent,
  requestApproval,
  maxHops = 6,
  readOnly,
  incognito,
}: RunPersonaChainOptions): Promise<void> {
  type Job = { personaId: string; message: string; fromPersonaId?: string };
  const queue: Job[] = [{ personaId, message }];
  const chain: string[] = [];
  let hop = 0;

  while (queue.length) {
    const job = queue.shift()!;
    chain.push(job.personaId);
    if (job.fromPersonaId) {
      onEvent({ type: "handoff_start", fromPersonaId: job.fromPersonaId, toPersonaId: job.personaId, hop });
    }

    let finalReply = "";
    let handoffs: HandoffRequest[] | undefined;
    await withPersonaLock(job.personaId, () =>
      runPersonaTurn({
        personaId: job.personaId,
        message: job.message,
        requestApproval,
        readOnly,
        incognito,
        onEvent: (event) => {
          onEvent(event);
          if (event.type === "done") {
            finalReply = event.result ?? "";
            handoffs = event.handoffs;
          }
        },
      }),
    );

    for (const request of handoffs ?? []) {
      if (hop >= maxHops) {
        onEvent({ type: "handoff_limit_reached", chain: [...chain], blockedPersonaId: request.targetPersonaId });
        appendMemoryNote(
          "System",
          `Hand-off chain stopped at the ${maxHops}-hop limit before reaching ${request.targetPersonaId}. Chain so far: ${chain.join(" → ")}.`,
        );
        queue.length = 0;
        break;
      }
      hop += 1;
      queue.push({
        personaId: request.targetPersonaId,
        fromPersonaId: job.personaId,
        message: buildDelegationPrompt(job.personaId, request, finalReply),
      });
    }
  }
}
