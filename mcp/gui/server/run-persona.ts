import { runPersonaTurn as runShared, type PersonaEvent } from "../../agents/src/run.js";
import { getPersona } from "../../agents/src/personas.js";
import { requestApproval } from "./approvals.js";

export type { PersonaEvent };

export type ChainEvent =
  | PersonaEvent
  | { type: "mention_chain"; chain: string[]; message: string; routed?: boolean }
  | { type: "hop_start"; personaId: string; index: number; total: number };

export async function runPersonaTurn(personaId: string, message: string, emit: (event: PersonaEvent) => void): Promise<void> {
  await runShared({ personaId, message, onEvent: emit, requestApproval });
}

function buildHandoffPrompt(originalMessage: string, fromPersonaId: string, fromReply: string): string {
  const fromName = getPersona(fromPersonaId)?.name ?? fromPersonaId;
  return `Jerry looped you into a conversation with the team. His original message: "${originalMessage}"\n\n${fromName} replied: "${fromReply}"\n\nRespond to Jerry now, building on what ${fromName} said (agree, disagree, or add your own angle — don't just repeat it).`;
}

/**
 * Runs a sequence of persona turns for one @mention chain, in order. Each
 * agent after the first is handed the original message plus the previous
 * agent's reply, so they're not answering blind — but each still runs in
 * their own resumed SDK session, so this is a relay, not a shared thread.
 */
export async function runMentionChain(
  chain: string[],
  originalMessage: string,
  emit: (event: ChainEvent) => void,
  routed = false,
): Promise<void> {
  emit({ type: "mention_chain", chain, message: originalMessage, routed });

  let previous: { personaId: string; reply: string } | null = null;

  for (let i = 0; i < chain.length; i++) {
    const personaId = chain[i];
    emit({ type: "hop_start", personaId, index: i, total: chain.length });

    const prompt = previous ? buildHandoffPrompt(originalMessage, previous.personaId, previous.reply) : originalMessage;

    let reply = "";
    await runPersonaTurn(personaId, prompt, (event) => {
      if (event.type === "done" && event.result) reply = event.result;
      emit(event);
    });

    previous = { personaId, reply };
  }
}
