# jerry-lockard.github.io

Jerry Lockard's personal site. Read this file first, no matter which AI tool you are —
`CLAUDE.md` and `GEMINI.md` in this same directory are symlinks to this file, and Codex
CLI / opencode read `AGENTS.md` natively, so this is the one place every tool lands.

## What this is

A civic-first personal site for Covington, Kentucky — Jerry is using it for real
job-seeking in city/public-sector work via the Mayor's Academy, not as a developer
portfolio. Community, government, and public service lead; technical work stays in
the background. Repo lives at `github.com/jerry-lockard/jerry-lockard.github.io`
(personal account, not the `lockard-tech` org) and will be served at
`jerry.lockard.tech`. `lockard.tech` is the bare apex domain and belongs to the
`lockard-tech` GitHub org — a different, separate thing from this site.

## Current state — read before assuming anything is built

- `src/pages/index.astro` is still the **unmodified Astro starter scaffold**. The real
  site has not been built yet.
- `mockup.html` at the repo root is the **approved design comp** — palette, type system,
  component patterns, the catenary-divider signature motif. It's a static reference, not
  wired into Astro. Building the real site from it is the next phase of work, not done.
- A full agent system already exists under `mcp/` (see below) and is ready to use.

## Stack — this trips people up, so it's explicit

- **Package manager: pnpm.** This is a pnpm workspace (`pnpm-workspace.yaml`) with 4
  packages: the root Astro site, `mcp/server`, `mcp/agents`, `mcp/gui`.
- **Site framework: Astro.** The public site is `.astro` files, built with `astro build`.
- The `mcp/gui` dashboard (an internal control panel for chatting with the agents) has
  its own plain `index.html`/`style.css`/`app.js` frontend — that is a separate local
  tool for *working on* the site, served by a small Express server, not part of the
  Astro site itself and not what ships publicly. Don't confuse the two.

## Getting started

```bash
pnpm install          # installs all 4 workspace packages
pnpm mcp:doctor       # verifies the whole system is actually ready (see mcp/gui/scripts/doctor.mjs)
pnpm dev              # Astro dev server, http://localhost:4321
pnpm mcp:start        # agent dashboard GUI, http://127.0.0.1:4405 (stop/status/logs variants exist)
pnpm agent <name> "<message>"   # drive one agent turn from any terminal, no GUI needed
```

See **`CHEATSHEET.md`** for the full command reference and the settled facts (domain,
GitHub handle, contact email) — go there first if you just need a quick answer.

## The agent team

Six agents live under `mcp/` — Andrew (lead), Desiree (design/frontend), Devon
(devops/deploy), Penelope (content/copy), Ethan (QA/accessibility), Lexi (docs/handoff —
keeps this file and `mcp/AGENTS.md` accurate as things change). Full rules, roster
detail, and the team-communication protocol are in **`mcp/AGENTS.md`** — read it before
doing agent-related work, it is the live source of truth and this section is just a
summary.

If your tool supports MCP directly (Claude Code does), the site's MCP server is at
`mcp/server/src/index.ts` (run via `node --import tsx mcp/server/src/index.ts`) and
exposes identity/education/work/design-token/guardrail/memory/team tools. If your tool
doesn't support MCP, use `pnpm agent <name> "<message>"` instead — same agents, same
rules, plain CLI.

## Hard rules — apply regardless of which tool or agent you are

These are load-bearing; `mcp/AGENTS.md` has the full detail, but the short version:

- **Scope: lockard-tech only.** No knowledge of, or reference to, any other
  organization or platform Jerry works on. This repo's history represents him
  professionally for city-government hiring — nothing unrelated gets mixed in.
- **Content integrity.** Never invent biographical facts. Hard-excluded topics: GPA,
  individual grades/withdrawals, student ID, SSN, home address, legal middle name,
  stated ambition to run for public office.
- **Git: stay on `main`.** No feature branches. New commits only — never `--amend`,
  `--force`, or `git reset --hard`.
- **Every push stops for Jerry's explicit confirmation**, regardless of how small.
- **No new dependencies** without Jerry approving first.
- `.env` and secrets are never read, logged, or committed.

## Documentation

Full Astro documentation: https://docs.astro.build

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

Astro dev server background-mode commands (built into this project's Astro setup):
`astro dev --background`, `astro dev stop`, `astro dev status`, `astro dev logs`.
