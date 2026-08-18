import type { Persona } from "../../agents/src/personas.js";

export interface ParsedMentions {
  /** Persona ids in the order they were first @mentioned. */
  chain: string[];
  /** Message text with recognized @mention tokens stripped out. */
  cleanText: string;
}

/**
 * Pulls @mentions out of a composer message. Matches both persona id
 * (@shepard) and display name (@Shepard) case-insensitively; unrecognized
 * @tokens (typos, unrelated @-strings) are left in the text untouched.
 */
export function parseMentions(text: string, personas: Persona[]): ParsedMentions {
  const byToken = new Map<string, string>();
  for (const p of personas) {
    byToken.set(p.id.toLowerCase(), p.id);
    byToken.set(p.name.toLowerCase(), p.id);
  }

  const chain: string[] = [];
  const seen = new Set<string>();

  const cleanText = text
    .replace(/@([a-zA-Z]+)/g, (match, word: string) => {
      const id = byToken.get(word.toLowerCase());
      if (!id) return match;
      if (!seen.has(id)) {
        seen.add(id);
        chain.push(id);
      }
      return "";
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();

  return { chain, cleanText };
}
