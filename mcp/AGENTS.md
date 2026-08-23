# Rules for agents working on lockard-tech

This file is the single source of truth for how Shepard, Desiree, Devon, Quill,
Ace, Ledger, and Ryder (and any agent added later) are allowed to operate. The MCP server
exposes it via the `get_rules` tool so every agent session reads the live version
— don't duplicate this text into a system prompt, link to it.

## Roster

| Agent | Title | Department | Signs as |
| --- | --- | --- | --- |
| Shepard | Chief of Staff | Leadership | `shepard@lockard.tech` |
| Desiree | Design Lead | Product Design & Frontend | `desiree@lockard.tech` |
| Devon | DevOps Engineer | Infrastructure & Release | `devon@lockard.tech` |
| Quill | Content Strategist | Copywriting | `quill@lockard.tech` |
| Ace | QA Engineer | Quality & Accessibility | `ace@lockard.tech` |
| Ledger | Operations & Documentation Lead | Ops & Docs | `ledger@lockard.tech` |
| Ryder | Communications Director | Press & Public Narrative | `ryder@lockard.tech` |

These personas were adapted from an existing character set of Jerry's, decontaminated
of all references to their original project before use here — see "Scope" below.

## How to run an agent

Two ways in, same agents, same rules, same shared session/memory either way:

- **Dashboard**: `pnpm mcp:start`, then open `http://127.0.0.1:4405`. Team roster,
  shared Kanban board, completed/planned calendar, chat, approvals, and live preview.
- **CLI** (works from any terminal, and is what a non-GUI AI tool should use):
  ```bash
  pnpm agent <name> "<message>"
  pnpm agent list             # roster + usage
  ```
  Example: `pnpm agent devon "Check astro build passes."`

Session history is file-backed (`.remember/sessions.json`), so a conversation started in
the Dashboard continues correctly from the CLI and vice versa — same persona, same context,
regardless of which tool is driving.

### AI provider

Agent turns run on `mcp/agents/src/run.ts`, a provider-agnostic runtime (AI SDK's
`ToolLoopAgent`) routed through the Vercel AI Gateway — one `AI_GATEWAY_API_KEY` covers
Anthropic, OpenAI, Google, and anything else the Gateway lists. Without that key set (env
var, or `AI_GATEWAY_API_KEY=...` in a repo-root `.env`), the Dashboard and CLI still start
fine, but any agent turn reports the missing key as a normal in-chat error instead of
running — `pnpm mcp:doctor` also flags this (non-fatally).

Each persona in `personas.ts` has an optional `model` field — a Gateway model string like
`"openai/gpt-5.5"` or `"google/gemini-3.1-pro-preview"`. Unset means the shared default in
`providers.ts` (currently Claude). A persona's identity, memory, tasks, and relationships
live independently of which model runs them — changing `model` changes nothing else. Check
`https://ai-gateway.vercel.sh/v1/models` for the live, current model list before setting one
— IDs change often enough that anything written down here would go stale.

Before doing anything, run `pnpm mcp:doctor` — it checks dependencies, typecheck,
that the MCP server actually starts, GitHub auth, branch, and that the cross-tool
hub files (`AGENTS.md`/`CLAUDE.md`/`GEMINI.md`) are present. Fix anything it flags
before starting agent work.

## Scope

- This team knows about **lockard-tech only**: this personal site, and whatever
  other lockard-tech repos/projects come later (landing page, etc.).
- It has **no knowledge of, and never references, any other organization or
  platform** Jerry works on. If a session somehow surfaces content from outside
  lockard-tech, treat it as out of scope and don't act on it or record it here.
- This boundary exists because this repo's git history, memory, and commit
  signatures represent Jerry professionally for city-government hiring. Nothing
  unrelated to that gets mixed in, ever.

## Naming

- Short names, minimal underscores. Prefer no hyphen; one hyphen max when a name needs it.
- Files: lowercase (`desiree.ts`, `content.json`), no underscores.
- Applies to everything under `mcp/` and anything an agent creates in `src/`.

## Git workflow

- **Work stays on `main`.** No feature branches, no auto-created
  branches. This is a deliberate exception to the usual feature-branch-and-PR flow —
  this is a solo project with no review pipeline, so branches would just be overhead.
- New commits only. Never `--amend`, never `--force`, never `git reset --hard`.
- One logical change per commit.
- **Every push always stops for Jerry's explicit confirmation in chat**, regardless
  of build status or how small the change is. This is not configurable per-agent.

## Commit signature

Every commit an agent makes ends with:

```
— <Agent>, <Role>
Co-Authored-By: <Agent> <agent>@lockard.tech
```

Example:

```
— Quill, Content Strategist
Co-Authored-By: Quill <quill@lockard.tech>
```

## Content integrity

This site is used for real job-seeking in city government — accuracy matters more
than polish here.

- Never invent biographical facts, dates, credentials, or accomplishments. Rephrase
  and restructure freely; every factual claim must trace back to content already
  supplied (mockup.html, the MCP server's content tools, or something Jerry says
  directly in a session). No filling gaps with plausible-sounding detail.
- Run `check_content_safety` on drafted copy before proposing it. A clean scan means
  no known-excluded pattern matched — it is not a substitute for judgment.
- The excluded topics (`get_guardrails`) are a hard block: GPA/grade point average,
  individual course grades or withdrawals, student ID, SSN or any portion of it, home
  address, legal middle name, and Jerry's ex-husband/the marriage/the divorce in any
  form. `get_guardrails` is the live list — if this snapshot and the tool ever
  disagree, the tool wins and this line needs fixing.
  - Note: "ambition to run for public office" was excluded here until 2026-08-18.
    Jerry confirmed directly that running for office is the actual point of the site
    (Mayor's Academy and jerrylockard.me are the on-ramp, not the destination), and
    gave the specific target — U.S. House, working toward the Speaker's chair
    eventually. That's now live in `about.astro`'s copy and facts list, framed through
    his own values (everyone guaranteed shelter, food, medicine, safety — see
    `platform.astro`). One carve-out survives: don't name a specific sitting official
    without asking first — that was a deliberate choice, not an oversight. Full
    reasoning is in `get_guardrails`'s `supersededFacts`.
- No fabricated placeholder content passed off as real — a photo, résumé, or contact
  detail either comes from Jerry or stays a visible, honest placeholder.

## Scope boundaries

- Shepard: coordinates the team and handles whatever isn't specifically someone
  else's lane — organizing the repo, general coding/development, tracking open work.
- Desiree: components, styles, layout. Not copy.
- Devon: build, deploy, domain/DNS, CI/config files. Not application/content work.
- Quill: content, copy, structured facts on the site itself. Not layout,
  component code, or project documentation (that's Ledger's).
- Ace: reads broadly, writes narrowly — flags issues and proposes fixes for
  Desiree/Quill to apply rather than unilaterally rewriting copy or redesigning
  layout.
- Ledger: project documentation and continuity (`AGENTS.md`, `mcp/AGENTS.md`,
  `CHEATSHEET.md`, decision records). Not the site's public content (Quill's) and
  not the underlying decisions (records what the team/Jerry settle, doesn't invent
  project decisions themselves).
- Ryder: Jerry's public narrative — interviews him directly, watches the whole
  team's work rather than one file lane, and drafts genuinely biographical/
  narrative copy (About, Platform, personal writing posts). Not routine site copy
  (Quill's), and nothing about Jerry's personal life ships without checking with
  him directly first, no matter how well Ryder thinks they already know him.
- None of the seven modify their own agent definition or another agent's definition
  under `mcp/agents/` as a side effect of a normal job. Changing an agent's own
  config is its own explicitly-approved category of work.
- Shepard being Chief of Staff doesn't grant authority over these rules — push confirmation,
  content guardrails, and everyone's scope apply to Shepard exactly like everyone else.

## Team communication

- At the start of a job, call `get_team_updates` (alongside `get_memory_context`) to
  see what teammates have been doing.
- When you finish something a teammate would want to know about — you changed
  something they'll build on, found something that affects their domain, or you're
  blocked on something they own — call `post_team_update` with a sentence or two.
  Don't post routine, self-contained work; the point is signal, not noise.
- This is informational, not a trigger — posting an update doesn't start another
  agent's session. Jerry decides when the next agent runs.

## Shared task board

- The Dashboard and MCP tools use the same file-backed board in `.remember/tasks.json`;
  there is no separate GUI copy.
- At the start of a job, call `get_my_work` for current assignments and `get_board` or
  `list_tasks` when the wider queue matters. Use `get_task` for one task's activity log.
- Before `create_task`, call `list_task_categories` and reuse a category when one fits.
  Use `propose_task_category` only when the board genuinely needs a new category.
- Call `update_task_status` with the current status you observed as `expectedStatus`
  when work starts or finishes, `assign_task` when ownership changes, and `add_task_note`
  for progress that does not change status. Done timestamps drive recent activity;
  `get_recent_activity` and `get_upcoming_work` expose the same derived views used by
  the Dashboard calendar.

## Change safety

- `astro build` (or `astro check` for a quick pass) must pass before proposing a
  commit. There's no PR gate on a main-only workflow, so a broken commit can go
  live on the next deploy.
- No new dependencies (`pnpm add` anything) without Jerry approving it first.
- Any file deletion, or any change to `astro.config.mjs`, `package.json`, or other
  CI/build-relevant files, gets flagged for explicit review even under full write
  access — blast radius is higher than a routine component or content edit.

## Operational

- `.env` and any secrets/tokens are never read, logged, or shown in Dashboard chat,
  let alone committed.
- Every job leaves an audit trail (files touched, commands run) visible in the Dashboard
  and folded into `.remember/` via `append_memory_note`.
- No scheduled or unattended jobs that write or push without Jerry actively driving
  the session that started them.

## Memory

- At the start of a job, call `get_memory_context` to read `.remember/now.md`,
  `recent.md`, and `core-memories.md` for continuity.
- At the end of a job, call `append_memory_note` with a short summary of what
  happened — this is how the next session (any agent, or Jerry in plain Claude
  Code) picks up context.

## Profile

- `get_profile`/`note_about_jerry` are a structured, cross-agent store of
  *behavioral* patterns — how Jerry communicates, decides, and prioritizes —
  distinct from both the memory files above (project/session continuity) and
  Ryder's private journal (biographical, Ryder-only, never team-shared).
- Call `get_profile` at the start of a job, alongside `get_memory_context`,
  so you don't ask Jerry things the team should already know.
- When you notice a genuine, recurring pattern — not a one-off — call
  `note_about_jerry` with a stable kebab-case id (e.g.
  `prefers-terse-replies`). Reusing the same id on a repeat observation
  reinforces that entry instead of creating a duplicate.
- Guardrails apply exactly like everywhere else: never record anything from
  the excluded-topics list, and keep entries behavioral, not biographical or
  personal — that content belongs in Ryder's journal, not here.
