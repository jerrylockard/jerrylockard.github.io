import { streamText } from "ai";
import { DEFAULT_MODEL } from "./providers.js";

if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error("AI_GATEWAY_API_KEY is not set. Add it to a .env file at the repo root — see mcp/AGENTS.md.");
}

const model = process.argv[2] || DEFAULT_MODEL;
const prompt = process.argv.slice(3).join(" ") || "Why is the sky blue?";

async function main() {
  const result = streamText({ model, prompt });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log();
  console.log(`[model: ${model}]`);
  console.log("Token usage:", await result.usage);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
