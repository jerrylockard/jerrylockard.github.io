import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// Load repo-root .env once, if present. Never throws when the file is
// missing — Jerry may set these via his shell profile instead.
try {
  process.loadEnvFile(join(repoRoot, ".env"));
} catch {
  // no .env file — that's fine, env vars may already be set another way
}

/**
 * Every persona resolves to a Vercel AI Gateway model string
 * ("anthropic/claude-sonnet-5", "openai/gpt-5.5", "google/gemini-3.1-pro-preview",
 * etc.) so one AI_GATEWAY_API_KEY covers every provider. See
 * https://ai-gateway.vercel.sh/v1/models for the live, current list — model
 * IDs change often enough that hardcoding more than a safe default here
 * would go stale.
 */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

export function resolveModel(persona: { model?: string }): string {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not set. Get one from vercel.com (AI Gateway → API Keys) and " +
        "add it to a .env file at the repo root, e.g. AI_GATEWAY_API_KEY=your_key_here.",
    );
  }
  return persona.model || DEFAULT_MODEL;
}
