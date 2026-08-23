import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import type { ToolSet } from "ai";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const serverEntryPath = join(repoRoot, "mcp", "server", "src", "index.ts");

const MCP_PREFIX = "mcp__site__";

let clientPromise: Promise<{ client: MCPClient; tools: ToolSet }> | null = null;

/**
 * One shared connection to the site's own MCP server (mcp/server), reused
 * across every persona turn in this process rather than re-spawned per
 * message. Tool keys are prefixed mcp__site__<name> to match the naming the
 * dashboard's frontend already expects (toolLabel() strips that prefix).
 */
export function getSiteTools(): Promise<ToolSet> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = await createMCPClient({
        transport: new StdioMCPTransport({
          command: process.execPath,
          args: ["--import", "tsx", serverEntryPath],
        }),
      });
      const raw = await client.tools();
      const prefixed: ToolSet = {};
      for (const [name, def] of Object.entries(raw)) {
        prefixed[`${MCP_PREFIX}${name}`] = def;
      }
      return { client, tools: prefixed };
    })();
  }
  return clientPromise.then(({ tools }) => tools);
}

export async function closeSiteTools(): Promise<void> {
  if (!clientPromise) return;
  const { client } = await clientPromise;
  await client.close();
  clientPromise = null;
}
