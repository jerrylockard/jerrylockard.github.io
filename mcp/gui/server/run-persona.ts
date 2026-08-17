import { runPersonaTurn as runShared, type PersonaEvent } from "../../agents/src/run.js";
import { requestApproval } from "./approvals.js";

export type { PersonaEvent };

export async function runPersonaTurn(personaId: string, message: string, emit: (event: PersonaEvent) => void): Promise<void> {
  await runShared({ personaId, message, onEvent: emit, requestApproval });
}
