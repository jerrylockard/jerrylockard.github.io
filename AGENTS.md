# jerrylockard.github.io

Jerry Lockard's personal site. Read this file first, no matter which AI tool you are —
`CLAUDE.md` in this same directory is a real symlink to this file, `GEMINI.md` points
here via Gemini CLI's `@./AGENTS.md` import syntax, and Codex CLI / opencode read
`AGENTS.md` natively — so this is the one place every tool actually lands.

## What this is

A civic-first personal site for Covington, Kentucky — Jerry is using it for real
job-seeking in city/public-sector work via the Mayor's Academy, not as a developer
portfolio. Community, government, and public service lead; technical work stays in
the background. Repo lives at `github.com/jerrylockard/jerrylockard.github.io`
(personal account, not the `lockard-tech` org) and is served live at
`jerrylockard.me`. Jerry bought that domain himself; the site moved from
`jerry.lockard.tech` to `jerry.lockard.me` on 2026-08-20, then to the apex
`jerrylockard.me` on 2026-08-21, the same day his GitHub and LinkedIn handles both
became `jerrylockard`. `lockard.tech` remains the bare apex domain belonging to the
separate `lockard-tech` GitHub org — unrelated to this site, then and now.

## Current state — read before assuming anything is built

- **The real site is built and live.** `src/pages/index.astro` composes the actual page
  from `src/components/` (Nav, Hero, Catenary, Strands, Work, About, Platform, Writing,
  Footer) inside `src/layouts/layout.astro` — this is no longer the starter scaffold.
- `mockup.html` at the repo root is the **original design comp** Desiree built the real
  components from — palette, type system, component patterns, the catenary-divider
  signature motif. Keep it as historical reference; the live source of truth for what's
  actually on the site is `src/components/`, not the mockup.
- Deploys automatically via **Vercel** (connected to this GitHub repo, framework
  auto-detected as Astro) — a push to `main` deploys, live at `jerrylockard.me` (custom
  domain configured in the Vercel project's Domains settings, not `public/CNAME` — that
  file is a GitHub Pages leftover, harmless but inert now). Moved off GitHub Pages
  2026-08-23. No manual deploy step.
- The writing feature (`src/content/writing/`, `/writing` index, `/writing/[slug]`,
  homepage teaser, nav link) is fully wired but has **zero posts** — nothing renders
  until a `.md` file lands in `src/content/writing/`.
- A few open items live in the MCP `list_todos` tool (portrait photo still a placeholder,
  fonts still loading from Google's CDN instead of self-hosted) — check there for the
  current list rather than trusting a copy in this file.
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
GitHub handle, contact email) — go there first if you just need a quick answer. Jerry
also keeps deeper project facts, rules, guardrails, and Mayor's Academy material in a
`.remember/` directory. Its hand-authored docs (`RULES.md`, `GUARDRAILS.md`, `FACTS.md`,
etc. — see `.remember/README.md` for the full list) are tracked in git and public in
this repo, same as any other file here; only the MCP server's session/runtime state
under `.remember/` is gitignored and local-only.

## The agent team

Eight agents live under `mcp/` — Shepard (Chief of Staff), Desiree (Design Lead —
design/frontend), Devon (DevOps Engineer — devops/deploy), Paige (Content Editor —
copy/editing), Casey (QA & Accessibility Lead), Archie (Documentation & Knowledge Lead —
keeps this file, `mcp/AGENTS.md`, and `.remember/` accurate as things change), Ryder
(Communications Director — interviews Jerry directly, watches the whole team, shapes the
public story toward an eventual campaign announcement), and Scout (Civic Events &
Schedule Monitor — watches Covington's civic sources and Jerry's calendar directly, not
repo files). Full rules, roster detail, and the team-communication protocol are in
**`mcp/AGENTS.md`** — read before doing agent-related work, it's the live source of
truth and this section is just a summary.

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
- **Content integrity.** Never invent biographical facts. Hard-excluded topics (see
  `get_guardrails` for the live list): GPA, individual grades/withdrawals, student ID,
  SSN, home address, legal middle name, Jerry's ex-husband/the marriage/the divorce in
  any form. Note: "ambition to run for public office" was excluded here until
  2026-08-18 — Jerry confirmed it's the actual point of the site, so it's now stated
  explicitly (U.S. House, working toward Speaker) in `about.astro`/`platform.astro`;
  see `get_guardrails`'s superseded-facts for the full reasoning and the one carve-out
  (don't name a specific sitting official without asking).
- **Git: stay on `main`.** No feature branches. New commits only — never `--amend`,
  `--force`, or `git reset --hard`.
- **Every push stops for Jerry's explicit confirmation**, regardless of how small.
- **No new dependencies** without Jerry approving first.
- `.env` and secrets are never read, logged, or committed.

## Documentation

Full Astro documentation: https://docs.astro.build

Astro dev server background-mode commands (built into this project's Astro setup):
`astro dev --background`, `astro dev stop`, `astro dev status`, `astro dev logs`.
