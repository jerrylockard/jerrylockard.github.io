# Rules for agents working on this site

This file is the single source of truth for how Truss, Folio, and Plumb
(and any agent added later) are allowed to operate on this repo. The MCP
server exposes it via the `get_rules` tool so every agent session reads
the live version — don't duplicate this text into a system prompt, link
to it.

## Roster

| Agent | Job | Signs as |
| --- | --- | --- |
| Truss | Design/Frontend — turns the mockup's CSS/layout into real Astro components, owns visual consistency | `truss@lockard.tech` |
| Folio | Content/Copy — bio, work, and writing copy; enforces the exclusion list; resolves content TODOs | `folio@lockard.tech` |
| Plumb | QA/Accessibility — checks reduced-motion, contrast, semantic HTML, responsive behavior against the mockup | `plumb@lockard.tech` |

## Naming

- Short names, minimal underscores. Prefer no hyphen; one hyphen max when a name needs it.
- Files: lowercase (`truss.ts`, `content.json`), no underscores.
- Applies to everything under `mcp/` and anything an agent creates in `src/`.

## Git workflow

- **Work stays on the repo's current branch** (currently `master` — Jerry's global
  convention calls the target branch `main`; this repo hasn't been renamed to match
  yet, that's Jerry's call, not an agent's). No feature branches, no auto-created
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
— Folio, Content/Copy
Co-Authored-By: Folio <folio@lockard.tech>
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
  individual course grades or withdrawals, student ID, SSN or any portion of it,
  home address, legal middle name, stated ambition to run for public office.
- No fabricated placeholder content passed off as real — a photo, résumé, or contact
  detail either comes from Jerry or stays a visible, honest placeholder.

## Scope boundaries

- Truss: components, styles, layout. Not copy.
- Folio: content, copy, structured facts. Not layout or component code.
- Plumb: reads broadly, writes narrowly — flags issues and proposes fixes for
  Truss/Folio to apply rather than unilaterally rewriting copy or redesigning layout.
- None of the three modify their own agent definition or another agent's definition
  under `mcp/agents/` as a side effect of a normal job. Changing an agent's own
  config is its own explicitly-approved category of work.

## Change safety

- `astro build` (or `astro check` for a quick pass) must pass before proposing a
  commit. There's no PR gate on a main-only workflow, so a broken commit can go
  live on the next deploy.
- No new dependencies (`pnpm add` anything) without Jerry approving it first.
- Any file deletion, or any change to `astro.config.mjs`, `package.json`, or other
  CI/build-relevant files, gets flagged for explicit review even under full write
  access — blast radius is higher than a routine component or content edit.

## Operational

- `.env` and any secrets/tokens are never read, logged, or shown in the GUI chat,
  let alone committed.
- Every job leaves an audit trail (files touched, commands run) visible in the GUI
  and folded into `.remember/` via `append_memory_note`.
- No scheduled or unattended jobs that write or push without Jerry actively driving
  the session that started them.

## Memory

- At the start of a job, call `get_memory_context` to read `.remember/now.md`,
  `recent.md`, and `core-memories.md` for continuity.
- At the end of a job, call `append_memory_note` with a short summary of what
  happened — this is how the next session (any agent, or Jerry in plain Claude
  Code) picks up context.
