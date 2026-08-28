# jerrylockard.github.io

Jerry Lockard's personal site — civic-first, built for real job-seeking in
Covington, Kentucky city/public-sector work via the Mayor's Academy. Community,
government, and public service lead; the technical work stays in the background.

Live at [jerrylockard.me](https://jerrylockard.me). Read **`AGENTS.md`** first
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
├── mcp/                    # agent team — MCP server, agent runtime, Dashboard
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
| `pnpm mcp:start` / `mcp:stop` / `mcp:status` / `mcp:logs` | Dashboard at `http://127.0.0.1:4405` |
| `pnpm agent <name> "<message>"` | Drive one agent turn from any terminal, no Dashboard needed |
| `pnpm agent list` | See the agent roster |

See **`CHEATSHEET.md`** for the full command reference and the settled facts (domain,
GitHub handle, contact email).

## Dashboard

The local Dashboard has four tabs: **Team** for the roster and current assignments,
**Board** for shared Backlog/In progress/Done tasks, **Calendar** for completed work,
planned work, and team updates, and **Chat** for direct agent conversations. The
Dashboard and MCP tools read and write the same local task store in
`.remember/tasks.json`.

## Deploy

Automatic — no manual deploy step. A push to `main` deploys via **Vercel** (connected
to this GitHub repo), live at `jerrylockard.me` (custom domain, configured in the
Vercel project's Domains settings). Framework auto-detected as Astro. Moved off
GitHub Pages 2026-08-23.

## The agent team

Eight agents work this repo: Shepard (Chief of Staff — Leadership), Desiree (Design
Lead — Product Design & Frontend), Devon (DevOps Engineer — Infrastructure & Release),
Paige (Content Editor — Content & Editorial), Casey (QA & Accessibility Lead — Quality
& Accessibility), Archie (Documentation & Knowledge Lead — Documentation & Continuity),
Ryder (Communications Director — Public Narrative & Civic Media), and Scout (Civic
Events & Schedule Monitor — Community Monitoring & Scheduling). Full rules, roster
detail, and the team-communication protocol live in **`mcp/AGENTS.md`** and
**`.remember/AGENTS.md`**.

## Project memory & planning docs

`.remember/` holds Jerry's planning docs and the runtime memory the MCP server writes
as agents work (session state, task board, team log). The hand-authored planning docs
(`RULES.md`, `GUARDRAILS.md`, `FACTS.md`, etc. — see `.remember/README.md` for the full
list) are tracked in git and public in this repo. Only the MCP server's session/runtime
state is gitignored and local-only — don't rely on that part existing in a fresh clone.

The site's MCP server includes identity, education, work, design-token, civic-voice,
rules, todo, content-safety, guardrail, memory, team, profile, and journal tools, plus
the shared task workflow:

- Task lifecycle: `create_task`, `list_tasks`, `get_task`, `get_board`,
  `update_task_status`, `assign_task`, and `add_task_note`
- Categories and derived views: `list_task_categories`, `propose_task_category`,
  `get_my_work`, `get_recent_activity`, and `get_upcoming_work`

If your tool does not support MCP directly, `pnpm agent <name> "<message>"` reaches
the same agents from a plain terminal.

## Learn more

Full Astro documentation: https://docs.astro.build
