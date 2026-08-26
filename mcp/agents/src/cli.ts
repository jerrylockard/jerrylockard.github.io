#!/usr/bin/env node
import * as readline from "node:readline/promises";
import { PERSONAS, getPersona } from "./personas.js";
import type { PersonaEvent } from "./run.js";
import { runPersonaChain as runPersonaTurn, type HandoffChainEvent } from "./handoff.js";

type CliEvent = PersonaEvent | HandoffChainEvent;

function printRoster(): void {
  console.log("Agents:\n");
  for (const p of PERSONAS) {
    console.log(`  ${p.id.padEnd(10)} ${p.name} — ${p.role}`);
    console.log(`  ${"".padEnd(10)} ${p.tagline}\n`);
  }
  console.log('Usage: pnpm agent <name> "<message>"');
  console.log('Example: pnpm agent desiree "Check the design tokens and summarize the palette."');
}

async function promptApproval(personaId: string, toolName: string, reason: string, detail: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\n⚠ ${personaId} wants to use ${toolName} (${reason}):`);
  console.log(`  ${detail}`);
  const answer = await rl.question("  Allow? (y/N): ");
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

function toolLabel(tool: string): string {
  if (tool.startsWith("mcp__site__")) return tool.slice("mcp__site__".length);
  return tool;
}

function handleEvent(event: CliEvent): void {
  if (event.type === "text") {
    process.stdout.write(event.text);
  } else if (event.type === "tool_use") {
    process.stdout.write(`\n  → ${toolLabel(event.tool)}\n`);
  } else if (event.type === "team_update") {
    const affects = event.affects?.length ? ` (→ ${event.affects.join(", ")})` : "";
    console.log(`\n  ◆ ${event.agent} to the team: ${event.message}${affects}`);
  } else if (event.type === "handoff_start") {
    console.log(`\n  ⇄ ${event.fromPersonaId} handed off to ${event.toPersonaId}`);
  } else if (event.type === "handoff_limit_reached") {
    console.log(`\n  ⚠ Hand-off chain stopped after ${event.chain.length} hop(s) before reaching ${event.blockedPersonaId} — task is assigned and waiting.`);
  } else if (event.type === "error") {
    console.error(`\nError: ${event.message}`);
  } else if (event.type === "done") {
    process.stdout.write("\n");
  }
}

async function main(): Promise<void> {
  const [personaId, ...rest] = process.argv.slice(2);
  const message = rest.join(" ");

  if (!personaId || personaId === "list" || personaId === "--help" || personaId === "-h") {
    printRoster();
    process.exit(0);
  }

  if (!getPersona(personaId)) {
    console.error(`Unknown agent: ${personaId}\n`);
    printRoster();
    process.exit(1);
  }

  if (!message.trim()) {
    console.error('A message is required: pnpm agent <name> "<message>"');
    process.exit(1);
  }

  console.log(`— ${getPersona(personaId)!.name} —\n`);

  try {
    await runPersonaTurn({ personaId, message, onEvent: handleEvent, requestApproval: promptApproval });
  } catch (err) {
    console.error(`\nSession failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
