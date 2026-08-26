# Project Configuration — Tech Stack & Workspace

---

## Package Manager

**pnpm** (workspace with 4 packages)

```bash
pnpm install              # Installs all 4 workspace packages
```

---

## Workspace Structure (`pnpm-workspace.yaml`)

```yaml
packages:
  - "."
  - "mcp/server"
  - "mcp/agents"
  - "mcp/gui"
```

### Package Breakdown

| Package | Location | Purpose |
|---------|----------|---------|
| **Root (Astro site)** | `.` | Public site — `astro build` → `dist/` → Vercel (moved off GitHub Pages 2026-08-23) |
| **MCP Server** | `mcp/server` | Identity, rules, memory, guardrails, team tools |
| **MCP Agents** | `mcp/agents` | 8 agent personas + runtime (`run.ts`) |
| **MCP GUI** | `mcp/gui` | Local control panel (Express + plain HTML/JS) |

---

## Root `package.json`

```json
{
  "name": "jerrylockard.github.io",
  "type": "module",
  "version": "0.0.1",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "mcp:start": "pnpm --filter mcp-gui start",
    "mcp:stop": "pnpm --filter mcp-gui stop",
    "mcp:status": "pnpm --filter mcp-gui status",
    "mcp:logs": "pnpm --filter mcp-gui logs",
    "agent": "pnpm --filter mcp-agents run agent",
    "mcp:doctor": "node mcp/gui/scripts/doctor.mjs"
  },
  "dependencies": {
    "astro": "^7.2.2"
  },
  "devDependencies": {
    "tsx": "^4.19.0"
  }
}
```

---

## Astro Config (`astro.config.mjs`)

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jerrylockard.me',
});
```

---

## Content Config (`src/content.config.ts`)

Three collections now (glob loader, not the old `type: "content"` shorthand) — full schemas in
`STRUCTURE.md`, not duplicated here:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const writing = defineCollection({ loader: glob({ pattern: "**/*.md", base: "./src/content/writing" }), schema: z.object({ /* title, date, tag, description, draft */ }) });
const civicNotes = defineCollection({ loader: glob({ pattern: "**/*.md", base: "./src/content/civic-notes" }), schema: z.object({ /* meeting metadata + status tracking — see STRUCTURE.md */ }) });
const academyNotes = defineCollection({ loader: glob({ pattern: "**/*.md", base: "./src/content/academy-notes" }), schema: z.object({ /* session metadata — see STRUCTURE.md */ }) });

export const collections = { writing, civicNotes, academyNotes };
```

---

## TypeScript Config (`tsconfig.json`)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```

---

## MCP Server Package (`mcp/server/package.json`)

Key details:
- Entry: `src/index.ts` (run via `node --import tsx mcp/server/src/index.ts`)
- Exposes 26 tools across identity/content facts, guardrails, rules/memory, and the shared task
  board — full reference with schemas and the actual content-safety regex patterns is in
  `TOOLS.md`, not duplicated here as a flat name list.

---

## MCP Agents Package (`mcp/agents/package.json`)

Key details:
- Entry: `src/run.ts` (provider-agnostic `ToolLoopAgent`, `fullStream` → `PersonaEvent` — frontend
  needed zero changes when this was rearchitected)
- Personas: `src/personas.ts` (8 agents; each optional `model` field, default = Claude)
- CLI: `pnpm agent <name> "<message>"` (via `src/cli.ts`)
- `src/providers.ts` — model resolution + env, Vercel AI Gateway routing
- `src/tools.ts` — Bash/Read/Write/Edit/Glob/Grep tool implementations, plus approval gating
  (`requestApproval`) — this is the mechanism behind "every push stops for Jerry's confirmation"
- `src/mcp-client.ts` — connects to the site's own MCP server over stdio; those tools surface to
  personas prefixed `mcp__site__*`
- `src/sessions.ts` — `ModelMessage[]` history, capped at 60 messages
- `src/router.ts` — `query()` → `generateText()`, the actual per-turn entry point
- **[2026-08-23] Rearchitected off `@anthropic-ai/claude-agent-sdk`** onto this Vercel-AI-SDK-based
  stack specifically so personas could run on Gemini/OpenAI/etc., not just Claude — added
  `ai`/`zod`/`@ai-sdk/mcp`, removed the Claude-specific SDK dependency entirely.

---

## MCP GUI Package (`mcp/gui/package.json`)

Key details:
- Express server + plain `index.html`/`style.css`/`app.js` frontend
- Dashboard at `http://127.0.0.1:4405`
- Controls: `pnpm mcp:start|stop|status|logs`
- Doctor script: `scripts/doctor.mjs` — **20 checks as of 2026-08-23** (check #20,
  `AI_GATEWAY_API_KEY` presence, was added the same day as the multi-provider agent
  rearchitecture below). Older references to "19 checks"/"19/19" elsewhere in this kit are
  accurate as of when they were written (2026-08-22 or earlier) — not a discrepancy, just older.

---

## Environment Variables

### Required for Agent Turns
```bash
AI_GATEWAY_API_KEY=...   # Vercel AI Gateway key (get at vercel.com → AI Gateway → API Keys)
```

### Optional (Dashboard)
| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `4405` | Dashboard listen port |
| `HOST` | `127.0.0.1` | Bind address (use `0.0.0.0` for non-localhost) |
| `DASHBOARD_PASSWORD` | unset | HTTP Basic Auth password (if set) |
| `DASHBOARD_USER` | `jerry` | Basic Auth username |

---

## Key Commands

```bash
# Setup & verification
pnpm install
pnpm mcp:doctor

# Site development
pnpm dev                 # http://localhost:4321
pnpm build               # Production build → dist/
pnpm preview             # Preview production build

# Astro background mode
astro dev --background
astro dev stop
astro dev status
astro dev logs

# Type checking (MCP workspace)
pnpm --filter mcp-server check
pnpm --filter mcp-agents check
pnpm --filter mcp-gui check

# Agents
pnpm mcp:start           # Dashboard GUI
pnpm agent list          # Roster
pnpm agent <name> "<msg>"  # CLI agent turn

# Deploy
# Automatic: push to main → Vercel (connected to the GitHub repo) → jerrylockard.me
```

---

## Development Environments

### Comet (Pixel phone dev VM)
Jerry is migrating primary development off his Windows desktop onto "Comet" — a Debian-on-AVF
Linux VM running on his Google Pixel phone, reached via ADB port-forward SSH + VS Code Remote-SSH.

- **Repo path is `~/workspace/jerrylockard.github.io`** (singular `workspace`) — an earlier
  assumption mirroring a flat Windows-style path was wrong and got reverted 2026-08-22. Don't
  re-assume a different path.
- As of 2026-08-22: repo cloned and building clean (`pnpm mcp:doctor` 19/19 on that host); Codex
  and Claude Code CLIs installed but not yet authenticated there.
- **Known limitation:** `nvm` doesn't work non-interactively over the ADB/SSH connection to
  Comet — affects any tooling that assumes an interactive shell for Node version switching.
  Worked around during setup, not fixed at the root; expect to hit this again if setup scripts
  ever get re-run there.
- The `.remember/` directory and native files were migrated to Comet over SSH as part of this
  transition, and the Windows-side clone was deleted once that was verified — Comet, not
  Windows, is the intended primary dev machine going forward.

### Hosting (open decision)
Beyond Vercel for the public site itself, the MCP server/dashboard/agent stack needs a real
host once it's more than a local dev tool. **Fly.io is the recommended option over Render**, as
of the last discussion — not yet decided, pending Jerry's own Fly.io account/billing setup. Don't
assume this is settled; confirm before building deploy tooling around either platform.
Target subdomain once hosted: **`dashboard.jerrylockard.me`** — `HOST`/auth env vars in
`mcp/gui` were already made configurable (2026-08-22/23) in prep for this, but the actual
deploy + auth-provider choice is still open.