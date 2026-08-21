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

Roster: `shepard` (lead), `desiree` (design/frontend), `devon` (devops/deploy),
`quill` (content/copy), `ace` (QA/accessibility), `ledger` (docs/handoff),
`ryder` (narrative/press).

Example:
```bash
pnpm agent shepard "what's still open on the site?"
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

## Deploy

Automatic — no manual deploy command. A push to `main` triggers
`.github/workflows/deploy.yml` (`pnpm build` → GitHub Pages) and it's live at
`jerry.lockard.tech` within a few minutes. Custom-domain HTTPS is auto-issued by
GitHub and can lag behind a DNS/CNAME change — that's normal, not a bug.

## Git — the rules, not just the commands

- Stay on `main`. No feature branches.
- New commits only — never `--amend`, `--force`, or `git reset --hard`.
- Every push stops for your explicit OK, no matter how small the change.
- No new dependencies (`pnpm add` anything) without you approving first.

## Where things live

| Thing | Path |
| --- | --- |
| Original design comp | `mockup.html` (historical reference — already built out) |
| The actual site | `src/pages/*.astro` + `src/components/*.astro` (built, live) |
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
- LinkedIn: `jerrylockard` — no hyphen, `https://www.linkedin.com/in/jerrylockard/` (differs from the GitHub handle's hyphenation; don't copy one to the other)
- Contact email: `jerry@lockard.tech` — confirmed live by Jerry 2026-08-19, published in the footer. `jerrylockard91@gmail.com` was the address before the switch; keep it on file but don't publish it unless Jerry says otherwise
