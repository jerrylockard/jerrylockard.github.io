/**
 * Prevents the same persona from running two turns at once — a schedule firing while Jerry
 * happens to be chatting with that same persona. In-memory only: this only ever needs to
 * coordinate within one process (the persistent mcp-gui server, where both chat and scheduled
 * turns run); a separate CLI invocation is a one-shot process with nothing to race against.
 */
const busy = new Set<string>();

export function isPersonaBusy(personaId: string): boolean {
  return busy.has(personaId);
}

export async function withPersonaLock<T>(personaId: string, fn: () => Promise<T>): Promise<T> {
  busy.add(personaId);
  try {
    return await fn();
  } finally {
    busy.delete(personaId);
  }
}
