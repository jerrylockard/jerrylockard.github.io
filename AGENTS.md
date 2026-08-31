# jerrylockard.me

Jerry Lockard's personal site. Read this file first, no matter which AI tool you are —
`CLAUDE.md` in this same directory is a real symlink to this file, `GEMINI.md` points
here via Gemini CLI's `@./AGENTS.md` import syntax, and Codex CLI / opencode read
`AGENTS.md` natively — so this is the one place every tool actually lands.

**Before doing substantive work, read `docs/CHARACTER.json`.** It defines the working
persona and, more importantly, an ordered checklist of what to read/verify before
acting — built after a session that repeatedly acted on stale doc content and had to be
corrected for the same things more than once. Follow its `bootSequence` in order.

## What this is

A civic-first personal site for Covington, Kentucky — Jerry is using it for real
job-seeking in city/public-sector work via the Mayor's Academy, not as a developer
portfolio. Community, government, and public service lead; technical work stays in
the background. Repo lives at `github.com/jerrylockard/jerrylockard.me`
(personal account, not the `lockard-tech` org) and is served live at
`jerrylockard.me`. Jerry bought that domain himself; the site moved from
`jerry.lockard.tech` to `jerry.lockard.me` on 2026-08-20, then to the apex
`jerrylockard.me` on 2026-08-21, the same day his GitHub and LinkedIn handles both
became `jerrylockard`. `lockard.tech` remains the bare apex domain belonging to the
separate `lockard-tech` GitHub org — unrelated to this site, then and now.

The actual point of the site (confirmed directly by Jerry, 2026-08-18): working toward
running for public office — U.S. House of Representatives, eventually the Speaker's
chair. The site and the Mayor's Academy are the on-ramp, not the destination. See
`docs/GUARDRAILS.md` before writing anything that touches this or any other
biographical claim.

## Current state — read before assuming anything is built

- **The real site is built and live.** `src/pages/index.astro` composes the actual page
  from `src/components/` (Nav, Hero, Catenary, Work, About, Platform, Writing, Footer)
  inside `src/layouts/layout.astro` — this is no longer the starter scaffold.
- `docs/mockup.html` at the repo root is the **original design comp** the real components
  were built from — palette, type system, component patterns, the catenary-divider
  signature motif. Keep it as historical reference; the live source of truth for what's
  actually on the site is `src/components/`, not the mockup.
- Deploys via **Firebase Hosting** (project `jerrylockard-site`) — a push to `main`
  triggers `.github/workflows/firebase-hosting-merge.yml`, which builds and deploys.
  Custom domain configured in the Firebase console, not a repo file — the old GitHub
  Pages `CNAME` file was retired 2026-08-29. Moved off Vercel 2026-08-29 (Vercel before
  that, GitHub Pages before that — see `docs/FACTS.md` for the full hosting history).
- The writing feature (`src/content/writing/`, `/writing` index, `/writing/[slug]`,
  homepage teaser, nav link) is fully wired but has **zero posts** — nothing renders
  until a `.md` file lands in `src/content/writing/`.
- **A custom multi-agent dashboard system that used to live under `mcp/` was retired
  2026-08-29** — it was consuming time out of proportion to what it delivered. If you
  see a reference to `mcp/`, `.remember/`, agent personas, or a `dashboard.jerrylockard.me`
  anywhere (an old commit, a stale doc, external notes), it's historical — none of it
  exists in this repo anymore. Don't propose rebuilding it; ask Jerry what he actually
  wants first if the topic comes up.

## Stack

- **Package manager: pnpm.**
- **Site framework: Astro**, built with `astro build`, output is a plain static `dist/`
  (no server, no adapter).
- **Hosting: Firebase Hosting**, classic static hosting on the free Spark plan — see
  `docs/CHEATSHEET.md` for why App Hosting (the other Firebase hosting product) is the
  wrong one and would force a paid plan.

## Getting started

```bash
pnpm install    # installs dependencies
pnpm dev        # Astro dev server, http://localhost:4321
pnpm build      # production build → dist/
```

See **`docs/CHEATSHEET.md`** for the full runnable-command reference (build, deploy,
git, DNS checks). **`docs/FACTS.md`** has settled facts (domain history, handles,
contact email) and **`docs/GUARDRAILS.md`** has the content rules for anything
published about Jerry — both go there first, don't re-ask or re-derive them.
**`docs/research/`** has the Mayor's Academy session material and civic-notes research
notes used when drafting `src/content/academy-notes/` or `src/content/civic-notes/`
entries — see `docs/research/README.md`.

## Hard rules — apply regardless of which tool you are

- **Scope: lockard-tech only.** No knowledge of, or reference to, any other
  organization or platform Jerry works on. This repo's history represents him
  professionally for city-government hiring — nothing unrelated gets mixed in, ever.
- **Content integrity.** Never invent a biographical fact — every claim traces to
  something already published on the site, `docs/mockup.html`, or something Jerry says
  directly. See `docs/GUARDRAILS.md` for the hard-excluded topics (GPA, grades, student
  ID, SSN, home address, legal middle name, ex-husband/marriage/divorce in any form),
  the discretionary-care topics, and the placeholder policy (never pass off fake
  content as real).
- **Git workflow:**
  - Stay on `main`. No agent/tool-initiated feature branches — externally-created
    branches (Dependabot, a GitHub App) or Jerry's own short-lived branches can exist
    and get merged, but only with his explicit OK.
  - New commits only — never `--amend`, `--force`, or `git reset --hard`.
  - One logical change per commit.
  - **Every push stops for Jerry's explicit confirmation**, regardless of how small or
    whether the build passed.
  - Commit signature — end every commit with:
    ```
    — Claude, AI Assistant
    Co-Authored-By: Claude <claude@lockard.tech>
    ```
- **Change safety:** `astro build` (or `astro check`) must pass before proposing a
  commit. No new dependencies (`pnpm add` anything) without Jerry approving first. Any
  file deletion, or a change to `astro.config.mjs`/`package.json`/CI files, gets
  flagged for explicit review even with full write access.
- **Naming:** short names, minimal underscores, prefer no hyphen (one hyphen max when
  needed). Files: lowercase, no underscores.
- `.env` and secrets are never read, logged, shown in chat, or committed. (There's
  currently no `.env` in this repo at all — nothing here needs one.)
- **Ship, don't simulate.** A turn doesn't count as progress unless something actually
  changed on disk/in git/in production. Describing what *would* happen is planning, not
  work — don't report it back as if it shipped. Prefer a small real thing over a large
  described one. "It's set up" is a claim to verify (build it, run it, screenshot it),
  not report.

## Documentation

Full Astro documentation: https://docs.astro.build

Astro dev server background-mode commands (built into this project's Astro setup):
`astro dev --background`, `astro dev stop`, `astro dev status`, `astro dev logs`.
