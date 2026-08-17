# Command cheat sheet

Quick reference — see `AGENTS.md` for the full picture, `mcp/AGENTS.md` for agent rules.

## First thing, every time you come back

```bash
pnpm install       # only needed if you moved/renamed the folder, or it's been a while
pnpm mcp:doctor     # confirms everything's actually ready — run this if anything feels off
```

## Working with the agents

```bash
pnpm mcp:start              # start the GUI → http://127.0.0.1:4405
pnpm mcp:stop                # stop it
pnpm mcp:status              # is it running?
pnpm mcp:logs                # tail its log

pnpm agent list              # see the roster
pnpm agent <name> "<msg>"    # talk to one agent from any terminal, no GUI needed
```

Roster: `andrew` (lead), `desiree` (design/frontend), `devon` (devops/deploy),
`penelope` (content/copy), `ethan` (QA/accessibility), `lexi` (docs/handoff).

Example:
```bash
pnpm agent andrew "let's build the real site from the mockup"
```

## Building the site itself

```bash
pnpm dev             # Astro dev server → http://localhost:4321
astro dev --background   # same, but backgrounded (also: astro dev stop/status/logs)
pnpm build            # production build → dist/
pnpm preview           # preview the production build
```

`pnpm dev` on its own does **not** involve the agents — it just serves whatever the
site currently is. Run it alongside the GUI to watch the live-preview panel update as
an agent works.

## Git — the rules, not just the commands

- Stay on `main`. No feature branches.
- New commits only — never `--amend`, `--force`, or `git reset --hard`.
- Every push stops for your explicit OK, no matter how small the change.
- No new dependencies (`pnpm add` anything) without you approving first.

## Where things live

| Thing | Path |
| --- | --- |
| Approved design comp | `mockup.html` |
| The actual site | `src/pages/*.astro` (still the starter scaffold) |
| Cross-tool project hub (read this first, any AI tool) | `AGENTS.md` |
| Agent rules, roster, commit-signature format | `mcp/AGENTS.md` |
| Agent personas/system prompts | `mcp/agents/src/personas.ts` |
| MCP server (identity, design tokens, guardrails, memory) | `mcp/server/` |
| Dashboard GUI | `mcp/gui/` |
| Session memory / team log | `.remember/` (gitignored, local only) |

## Settled facts (so nobody has to re-ask)

- Personal site domain: `jerry.lockard.tech` — repo `jerry-lockard/jerry-lockard.github.io`
- `lockard.tech` apex belongs to the `lockard-tech` org, not this site
- GitHub handle: `jerry-lockard` (final — `jerrylockard91` is an old unused account, never use it)
- Contact email: `jerrylockard91@gmail.com` for now, moving to `jerry@lockard.tech` later
