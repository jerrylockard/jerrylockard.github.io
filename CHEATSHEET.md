# Command cheat sheet

Quick reference — see `AGENTS.md` for the full picture, `mcp/AGENTS.md` for agent rules.

## First thing, every time you come back

```bash
pnpm install       # only needed if you moved/renamed the folder, or it's been a while
pnpm mcp:doctor     # confirms everything's actually ready — run this if anything feels off
```

## Working with the Dashboard and agents

```bash
pnpm mcp:start              # start the Dashboard → http://127.0.0.1:4405
pnpm mcp:stop                # stop it
pnpm mcp:status              # is it running?
pnpm mcp:logs                # tail its log

pnpm agent list              # see the roster
pnpm agent <name> "<msg>"    # talk to one agent from any terminal, no Dashboard needed
```

The Dashboard opens in the **Workroom**, where Team can route a request automatically or
you can choose a specialist. The top navigation keeps the workflow to **Workroom**,
**Work** (Tasks + Activity), and **Team**; requests that require your approval appear as
**Decisions**. Local preview, Jerry's working profile, and theme are utility controls.

Agent turns need one env var to actually run (Dashboard and CLI both start fine without
it — a turn just reports this clearly instead of running, and `pnpm mcp:doctor` flags it
non-fatally). Put it in a repo-root `.env` file (gitignored) or your shell profile:

| Var | Purpose |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Required for any agent to respond. One key covers every provider (Anthropic, OpenAI, Google, …) via the Vercel AI Gateway — get one at vercel.com (AI Gateway → API Keys). |

Everything else is optional and inert unless set — local default behavior is unchanged:

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4405` | Port the dashboard listens on |
| `HOST` | `127.0.0.1` | Bind address — set to `0.0.0.0` for a non-localhost deploy |
| `DASHBOARD_PASSWORD` | unset | If set, gates the whole app behind HTTP Basic Auth |
| `DASHBOARD_USER` | `jerry` | Basic Auth username, only used when a password is set |

Each persona in `mcp/agents/src/personas.ts` can optionally set its own `model` (a Gateway
model string, e.g. `"openai/gpt-5.5"`) — unset falls back to Claude. See `mcp/AGENTS.md`
for details.

Roster: `shepard` (Chief of Staff — Leadership), `desiree` (Design Lead — Product
Design & Frontend), `devon` (DevOps Engineer — Infrastructure & Release), `paige`
(Content Editor — Content & Editorial), `casey` (QA & Accessibility Lead — Quality &
Accessibility), `archie` (Documentation & Knowledge Lead — Documentation & Continuity),
`ryder` (Communications Director — Public Narrative & Civic Media), and `scout` (Civic
Events & Schedule Monitor — watches Covington's civic sources + Jerry's calendar
directly, not repo files).

Example:
```bash
pnpm agent shepard "what's still open on the site?"
```

## Shared task board and calendar

The Dashboard and agents share `.remember/tasks.json`; edits made through either surface
show up in the same Backlog, In Progress, and Done columns.

- Task lifecycle: `create_task`, `list_tasks`, `get_task`, `get_board`,
  `update_task_status`, `assign_task`, `add_task_note`
- Categories and derived views: `list_task_categories`, `propose_task_category`,
  `get_my_work`, `get_recent_activity`, `get_upcoming_work`

## Building the site itself

```bash
pnpm dev             # Astro dev server → http://localhost:4321
astro dev --background   # same, but backgrounded (also: astro dev stop/status/logs)
pnpm build            # production build → dist/
pnpm preview           # preview the production build
```

`pnpm dev` on its own does **not** involve the agents — it just serves whatever the
site currently is. Run it alongside the Dashboard to watch the live-preview panel update as
an agent works.

## Typechecking the MCP workspace

```bash
pnpm --filter mcp-server check
pnpm --filter mcp-agents check
pnpm --filter mcp-gui check
```

`pnpm mcp:doctor` runs all three checks as part of its full readiness scan.

## Deploy

Automatic — no manual deploy command. A push to `main` deploys via **Vercel**
(connected to this GitHub repo, framework auto-detected as Astro) and it's live at
`jerrylockard.me` within a few minutes. Custom domain configured in the Vercel
project's Domains settings. Moved off GitHub Pages 2026-08-23.

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
| MCP server (content, guardrails, memory, shared tasks/board/calendar) | `mcp/server/` |
| Dashboard (Team, Board, Calendar, Chat) | `mcp/gui/` |
| Session memory / team log / shared task board / Jerry's planning docs | `.remember/` (entirely local and gitignored — nothing under it is tracked in this repo) |

## Moving memory between machines

**This repository is public.** Runtime memory in `.remember/` is gitignored on
purpose and moves by `scp`, never by git. A scan against `get_guardrails` on
2026-08-26 found `JOURNAL.md` matching every hard-excluded category (GPA,
student ID, SSN, home address, middle name, the marriage); `recent.md` and
`team.jsonl` are flagged too. Committing them would publish that permanently —
git history keeps it after a delete.

What travels, and how:

| What | How | Why |
| --- | --- | --- |
| Everything in `src/`, `mcp/`, the docs | `git clone` | Public code, already tracked |
| `.remember/*.md`, `*.json`, `*.jsonl` | `scp` | Private memory — never commit |
| `.env` | retype by hand | Never leaves a machine in a file transfer |

Clone the code, then bring the memory across:

```bash
ssh pi@<host> 'git clone https://github.com/jerrylockard/jerrylockard.github.io.git ~/jerrylockard.github.io'
```

```bash
scp .remember/{JOURNAL.md,archive.md,now.md,recent.md,profile.json,sessions.json,tasks.json,team.jsonl,today-*.md} pi@<host>:~/jerrylockard.github.io/.remember/
```

Then create `.env` on the Pi by hand — do not copy it:

```bash
ssh pi@<host> 'cd ~/jerrylockard.github.io && printf "AI_GATEWAY_API_KEY=\nDASHBOARD_PASSWORD=\nDASHBOARD_SESSION_SECRET=%s\n" "$(openssl rand -hex 32)" > .env && chmod 600 .env && nano .env'
```

Verify the Pi came up correctly before trusting it:

```bash
ssh pi@<host> 'cd ~/jerrylockard.github.io && pnpm install && pnpm mcp:doctor'
```

### If the Pi boots from a microSD card

The agents write constantly — transcripts, sessions, memory notes, the task
board, the access log. Sustained small writes are what kills SD cards, usually
in months. Move the write-heavy directory to attached storage and symlink it:

```bash
ssh pi@<host> 'sudo mkdir -p /mnt/ssd/remember && sudo chown pi:pi /mnt/ssd/remember && cd ~/jerrylockard.github.io && cp -a .remember/. /mnt/ssd/remember/ && rm -rf .remember && ln -s /mnt/ssd/remember .remember'
```

Booting the whole Pi from a USB SSD is the better fix if you have the option.

### Also worth knowing on a Pi

- **Keep the public site on Vercel.** The Pi is the workshop; `jerrylockard.me`
  should never depend on a box at home being awake, on the home IP, or on the
  ISP's view of hosting.
- **ARM64 Chromium.** The screenshot tooling in
  `.claude/skills/run-jerrylockard-github-io/` drives headless Chromium, and
  Playwright's ARM support needs its own setup — it will not just work.
- **cloudflared has ARM64 builds**, so the tunnel runs on the Pi rather than a
  laptop. That is the whole point: always-on means the dashboard is actually
  reachable.
- **Always-on means always exposed.** A sleeping laptop was accidental
  security. Set `DASHBOARD_PASSWORD` before the tunnel ever starts — the server
  refuses to boot exposed without it, and `pnpm dashboard:tunnel:doctor` will
  tell you what is still missing.

## Settled facts (so nobody has to re-ask)

- Personal site domain: `jerrylockard.me` (moved from `jerry.lockard.me` on 2026-08-21,
  same day as the GitHub/LinkedIn handle consolidation) — repo `jerrylockard/jerrylockard.github.io`
- `lockard.tech` apex belongs to the `lockard-tech` org, not this site — unrelated to
  `lockard.me`/`jerrylockard.me`, which Jerry owns separately
- GitHub handle: `jerrylockard` (changed 2026-08-21 from `jerry-lockard` — now matches
  LinkedIn exactly. Don't use `jerry-lockard` or the older `jerrylockard91` going forward)
- LinkedIn: `jerrylockard` — no hyphen, `https://www.linkedin.com/in/jerrylockard/`,
  now matches the GitHub handle exactly
- Contact email: `jerry@lockard.tech` — confirmed live by Jerry 2026-08-19, published in the footer. `jerrylockard91@gmail.com` was the address before the switch; keep it on file but don't publish it unless Jerry says otherwise
