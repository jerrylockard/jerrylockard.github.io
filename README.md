# jerry-lockard.github.io

Jerry Lockard's personal site — civic-first, built for real job-seeking in
Covington, Kentucky city/public-sector work via the Mayor's Academy. Community,
government, and public service lead; the technical work stays in the background.

Live at [jerry.lockard.me](https://jerry.lockard.me). Read **`AGENTS.md`** first
for the full picture (also symlinked as `CLAUDE.md`, imported by `GEMINI.md`) — this
file is just the quick-start.

## Project structure

```text
/
├── public/                # static assets — CNAME, favicon, portrait photos
├── src/
│   ├── pages/              # routes: index, /writing, /writing/[slug],
│   │                       #         /civic-notes, /civic-notes/[slug]
│   ├── components/         # nav, hero, catenary, work, about, platform,
│   │                       # writing, civic-note-card, footer
│   ├── content/             # writing + civic-notes markdown collections
│   └── layouts/             # layout.astro
├── mockup.html             # original design comp (historical reference)
├── mcp/                    # agent team — server, agents, gui (see below)
└── package.json
```

Astro looks for `.astro` files in `src/pages/` and exposes each as a route based on
its file name (or folder, for dynamic `[slug]` routes).

## Commands

All commands run from the repo root:

| Command | Action |
| :--- | :--- |
| `pnpm install` | Install dependencies — this is a pnpm workspace, installs all 4 packages |
| `pnpm dev` | Astro dev server at `localhost:4321` |
| `pnpm build` | Production build to `./dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm astro ...` | Run Astro CLI commands (`astro add`, `astro check`, etc.) |
| `pnpm mcp:doctor` | Verify the whole system — deps, typecheck, MCP server, GitHub auth — is ready |
| `pnpm mcp:start` / `mcp:stop` / `mcp:status` / `mcp:logs` | Agent dashboard GUI at `http://127.0.0.1:4405` |
| `pnpm agent <name> "<message>"` | Drive one agent turn from any terminal, no GUI needed |
| `pnpm agent list` | See the agent roster |

See **`CHEATSHEET.md`** for the full command reference and the settled facts (domain,
GitHub handle, contact email).

## Deploy

Automatic — no manual deploy step. A push to `main` triggers
`.github/workflows/deploy.yml`, which builds with `pnpm build` and publishes to
GitHub Pages at `jerry.lockard.me` (custom domain via `public/CNAME`).

## The agent team

Seven agents work this repo: Shepard (lead), Desiree (design/frontend), Devon
(devops/deploy), Quill (content/copy), Ace (QA/accessibility), Ledger
(docs/handoff), and Ryder (narrative/press). Full rules, roster detail, and the
team-communication protocol live in **`mcp/AGENTS.md`**. If your tool supports MCP
directly, the site's server (`mcp/server/`) exposes identity/education/work/
design-token/guardrail/memory/team tools; otherwise `pnpm agent <name> "<message>"`
reaches the same agents from a plain terminal.

## Learn more

Full Astro documentation: https://docs.astro.build
