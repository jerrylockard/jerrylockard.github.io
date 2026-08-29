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

The Dashboard opens straight into the conversation — chat is the ground state and
has no tab of its own. Mention someone with `@`, or just describe the work and the
router picks. The brand button top-left, or anyone in the left rail, returns here.

The nav is four places you visit:

| Tab | What it holds |
| --- | --- |
| **Team** | Each agent's role, duties, what files they own, what they are on now, and a Chat button |
| **Tasks** | Now / Next / On hold. Checking a task off moves it out of here and into Changelog |
| **Changelog** | Finished work waiting to be published into the repo's `CHANGELOG.md`, guardrail-screened first |
| **Calendar** | A month grid — due dates, completed work and team updates as dots per day |

Approvals are not a tab. An agent that needs your OK is paused mid-turn and is
auto-denied after five minutes, so it appears as a bar across the top of the header
with a live countdown, raises a desktop notification, and is also listed inside
Tasks. Local preview, your profile, and the theme toggle are utility controls in
the header.

Agent turns run as `claude -p` subprocesses under this machine's own Claude Code login —
a subscription, not an API key. Nothing to set in `.env` for this: run `claude login` once
(interactive) and `pnpm mcp:doctor` confirms it (`claude CLI logged in`).

The following env vars are optional and inert unless set — local default behavior is unchanged:

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4405` | Port the dashboard listens on |
| `HOST` | `127.0.0.1` | Bind address — set to `0.0.0.0` for a non-localhost deploy |
| `DASHBOARD_PASSWORD` | unset | If set, gates the whole app behind a login page + signed session cookie |
| `DASHBOARD_USER` | `jerry` | Login username, only used when a password is set |
| `DASHBOARD_LOGIN_SECRET` | unset | Signs one-time login tokens from `pnpm dashboard:login-token` — sign in without ever typing/remembering the password; that session lasts `DASHBOARD_TOKEN_SESSION_DAYS` (default 30) instead of 12h |
| `DASHBOARD_SESSION_SECRET` | random per boot | Pin this to survive a restart without signing everyone out |
| `DASHBOARD_PUBLIC_ORIGIN` | unset | Set when served through the Cloudflare Tunnel — enables Secure cookies/HSTS |

Each persona in `mcp/agents/src/personas.ts` can optionally set its own `model` — passed
straight through as `claude`'s `--model` flag (e.g. `"opus"`, `"sonnet"`, `"fable"`), since
agent turns run as `claude -p` subprocesses under this machine's Claude Code login, not a
metered API key. Unset falls back to Claude Code's own default model. See `mcp/AGENTS.md`
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

## Who does what — four services, no overlap

**Migration in progress, as of 2026-08-29 — this section describes the current
live setup, not the target one.** Jerry has created a Firebase project
(`jerrylockard-site`) and is setting up Firebase Hosting himself to eventually
replace Vercel for `jerrylockard.me`. Separately, the app's codebase is being
wired to Firebase Authentication and Firestore (see `mcp/AGENTS.md` once that
lands). Until both are confirmed live, treat everything below as accurate —
don't assume Firebase has taken over hosting just because the project exists.

Four accounts are involved today. They are not alternatives to each other, and
when something breaks this table says where to go.

| Service | What it does | What breaks if it stops |
| --- | --- | --- |
| **GitHub** | Stores the code. A push to `main` is what triggers everything else. | Nothing live goes down — you just cannot deploy. |
| **Vercel** | Builds the Astro site and hosts it. Rebuilds on every push to `main`. | `jerrylockard.me` goes down. |
| **Cloudflare** | DNS for `jerrylockard.me`, the proxy in front of the site, and the Tunnel publishing the dashboard. | Both the site and the dashboard become unreachable. |
| **IONOS** | Mail. Holds the `lockard.me` and `lockard.tech` mailboxes, and DNS for those two zones. | Email stops. The site is unaffected. |

**The bit that keeps causing confusion: Cloudflare and Vercel are not competing.**
Moving the nameservers to Cloudflare changed who *answers DNS questions*, not who
*hosts the site*. Cloudflare answers and proxies; Vercel is the origin it fetches
from. The handoff is a single line in `dns/jerrylockard.me.zone`:

```
jerrylockard.me.  300  IN  A  76.76.21.21      <- that IP is Vercel
```

That is why a response from `jerrylockard.me` carries both `server: cloudflare`
and `x-vercel-id`. Both are true.

The Pi is deliberately not in that table. It hosts `dashboard.jerrylockard.me`
and nothing else. The public site must never depend on a box at home being awake.

### Vercel plan: Hobby (free). Leave it there.

Hobby covers custom domains, automatic HTTPS, 50 domains per project and 100
deploys a day — everything this site does. Pro is **$20 per user per month** and
adds nothing needed here. **Do not start the Pro trial**: it converts to paid, and
the free-first-year-domain offer does not even apply during a trial.

One caveat worth knowing before it matters: Hobby is licensed for non-commercial,
personal use. A civic and job-search site is personal. If this ever becomes a
campaign site taking donations, that is the moment to revisit the plan — not
before.

## Deploy

Automatic — no manual deploy command. Push to `main`, Vercel rebuilds, live at
`jerrylockard.me` within a few minutes. The custom domain is configured in the
Vercel project's Domains settings, not in `public/CNAME` (that file is an inert
GitHub Pages leftover). Moved off GitHub Pages 2026-08-23.

DNS records for the zone live in `dns/jerrylockard.me.zone`, importable straight
into Cloudflare. The apex and `www` are currently **proxied** (orange cloud),
which works because SSL/TLS mode is Full — never set it to Flexible, which forces
plain HTTP to Vercel and causes a redirect loop.

## Git — the rules, not just the commands

- Stay on `main`. No feature branches.
- New commits only — never `--amend`, `--force`, or `git reset --hard`.
- Every push stops for your explicit OK, no matter how small the change.
- No new dependencies (`pnpm add` anything) without you approving first.

Pushing from the Pi needs one setting, because the key is not named `id_ed25519`
and so ssh never offers it by default. Already configured, recorded here in case
the repo is re-cloned:

```bash
git config core.sshCommand "ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes"
```

## Where things live

| Thing | Path |
| --- | --- |
| Original design comp | `mockup.html` (historical reference — already built out) |
| The actual site | `src/pages/*.astro` + `src/components/*.astro` (built, live) |
| Cross-tool project hub (read this first, any AI tool) | `AGENTS.md` |
| Agent rules, roster, commit-signature format | `mcp/AGENTS.md` |
| Agent personas/system prompts | `mcp/agents/src/personas.ts` |
| MCP server (content, guardrails, memory, shared tasks/board/calendar) | `mcp/server/` |
| Dashboard (chat, plus Team / Tasks / Changelog / Calendar) | `mcp/gui/` — UI source in `public/`, styles built from `styles/app.css` via `pnpm --filter mcp-gui build:css` |
| Session memory / team log / shared task board | `.remember/` runtime files — gitignored, local only, never committed |
| Jerry's planning docs (`RULES.md`, `FACTS.md`, `GUARDRAILS.md`, …) | `.remember/` too, but these **are** tracked and public — the split is defined in `.remember/.gitignore` |
| DNS zone for Cloudflare | `dns/jerrylockard.me.zone` |
| Public changelog, written from finished tasks | `CHANGELOG.md` (created on first publish from the dashboard) |

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
ssh lockard-tech 'git clone https://github.com/jerrylockard/jerrylockard.github.io.git ~/jerrylockard.github.io'
```

```bash
scp .remember/{JOURNAL.md,archive.md,now.md,recent.md,profile.json,sessions.json,tasks.json,team.jsonl,today-*.md} lockard-tech:~/jerrylockard.github.io/.remember/
```

Then create `.env` on the Pi by hand — do not copy it:

```bash
ssh lockard-tech 'cd ~/jerrylockard.github.io && printf "DASHBOARD_PASSWORD=\nDASHBOARD_SESSION_SECRET=%s\n" "$(openssl rand -hex 32)" > .env && chmod 600 .env && nano .env'
# Then, separately (interactive, do it in an actual terminal on the Pi, not over this one-liner):
#   claude login
```

Verify the Pi came up correctly before trusting it:

```bash
ssh lockard-tech 'cd ~/jerrylockard.github.io && pnpm install && pnpm mcp:doctor'
```

### Storage on the Pi — measured 2026-08-27

The Pi boots from a **USB flash drive** (`/dev/sda2`, 238 GB, 223 GB free) and
has **no SD card at all**, so the usual SD-write-death problem does not apply.

A USB flash drive is still consumer NAND, though — better than SD, well short
of an SSD. If the agents ever run heavily enough to matter, moving `.remember/`
to an SSD is the upgrade:

```bash
ssh lockard-tech 'sudo mkdir -p /mnt/ssd/remember && sudo chown jerry:jerry /mnt/ssd/remember && cd ~/jerrylockard.github.io && cp -a .remember/. /mnt/ssd/remember/ && rm -rf .remember && ln -s /mnt/ssd/remember .remember'
```

### The Pi, as actually measured

`lockard-tech` = `192.168.1.90`, user `jerry`. `ssh lockard-tech` works from
both WSL and Windows PowerShell.

- **Raspberry Pi 4 Model B, aarch64, Debian 13 (trixie), 4 CPUs, 3.7 GiB RAM.**
  That is the 4 GB model. Enough for the MCP server, agents, dashboard and
  tunnel — but not all of that plus an Astro build plus Chromium at once.
- **sshd is publickey-only; password auth is disabled.** `ssh-copy-id` cannot
  work. Install new keys over an already-working key.
- **Installed as of 2026-08-28:** node 24, pnpm 11, git, cloudflared, `gh` (logged
  in as `jerrylockard`), and Claude Code. Playwright's Chromium is downloaded but
  **cannot run** — it needs system libraries that require `sudo apt-get`
  (`libatk1.0-0t64`, `libgbm1`, `libxkbcommon0`, …), so nothing on the dashboard
  has been checked in a real browser yet.
- **aarch64 changes what transfers.** Never copy `node_modules` (233 MB of
  x86-64 binaries) or `~/.cache/ms-playwright` (656 MB of x86 Chromium) from
  the laptop — reinstall both natively or the first build crashes on esbuild.
- **Keep the public site on Vercel.** The Pi is the workshop;
  `jerrylockard.me` must never depend on a box at home being awake.
- **The tunnel is live.** `dashboard.jerrylockard.me` resolves and serves from
  this Pi through a named Cloudflare Tunnel (`pnpm dashboard:tunnel:status`).
  Confirmed authenticated from outside on 2026-08-28: `/` redirects to `/login`
  and `/api/chat` returns 401.
- **Always-on means always exposed.** The server now refuses to boot without
  `DASHBOARD_PASSWORD` at all — not only when it detects exposure — because a
  bind address cannot tell whether a tunnel is pointed at it. `DASHBOARD_ALLOW_NO_AUTH=1`
  is the deliberate opt-out and never lifts the exposed case.
- **`curl -s http://127.0.0.1:4405/healthz` answers `ok auth=password` or
  `ok auth=none`.** That is how you check whether the *running process* has auth,
  which is a different question from what `.env` says. The tunnel scripts refuse
  to publish an `auth=none` process.

## Settled facts (so nobody has to re-ask)

- Personal site domain: `jerrylockard.me` (moved from `jerry.lockard.me` on 2026-08-21,
  same day as the GitHub/LinkedIn handle consolidation) — repo `jerrylockard/jerrylockard.github.io`
- `lockard.tech` apex belongs to the `lockard-tech` org, not this site — unrelated to
  `lockard.me`/`jerrylockard.me`, which Jerry owns separately
- GitHub handle: `jerrylockard` (changed 2026-08-21 from `jerry-lockard` — now matches
  LinkedIn exactly. Don't use `jerry-lockard` or the older `jerrylockard91` going forward)
- LinkedIn: `jerrylockard` — no hyphen, `https://www.linkedin.com/in/jerrylockard/`,
  now matches the GitHub handle exactly
- Hosting split: **Vercel** builds and serves `jerrylockard.me`; **Cloudflare** does
  DNS, proxying and the dashboard Tunnel; **IONOS** does mail; **GitHub** stores the
  code and triggers deploys. They are not alternatives — see "Who does what" above
- Vercel plan: **Hobby (free)**. Do not start the Pro trial; it converts to paid and
  Pro adds nothing this site uses
- Dashboard: `dashboard.jerrylockard.me`, served from the Pi over a Cloudflare Tunnel,
  password-gated. Live since 2026-08-28
- Contact email: `jerry@lockard.me` — confirmed by Jerry 2026-08-28, published in the footer. IONOS webmail; `lockard.me` is a **separate domain** from the site's `jerrylockard.me`, which is why `dns/jerrylockard.me.zone` carries no MX. Earlier addresses on file but not for publication: `jerry@lockard.tech` (2026-08-19 → 2026-08-28), `jerrylockard91@gmail.com` before that
