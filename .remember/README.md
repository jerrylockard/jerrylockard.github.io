# .remember/ — Index

This directory is Jerry's local, gitignored-by-default planning kit and the site's session
memory. Two different kinds of content live here side by side — see `.gitignore` for exactly
which files are tracked vs. local-only, and `MEMORY.md` for why the split is drawn where it is.

## Hand-authored planning docs (tracked)

One topic per file, cross-linked rather than duplicated. Start here if you're new to this
directory — read `RULES.md` and `FACTS.md` first, they're the ones everything else assumes.

| File | What's in it |
|---|---|
| [RULES.md](RULES.md) | Hard, non-negotiable rules — scope, git workflow, commit format, change safety, memory/profile protocol, content-intake protocol |
| [GUARDRAILS.md](GUARDRAILS.md) | The single canonical content-safety doc — excluded topics, discretionary topics, superseded facts, the content-safety check protocol |
| [FACTS.md](FACTS.md) | Settled facts — domain/identity handles, biographical facts published on the site, tech stack, file locations, this kit's own provenance |
| [PROFILE.md](PROFILE.md) | How Jerry works — decision style, communication style, technical preferences; the human-readable mirror of `profile.json` |
| [MEMORY.md](MEMORY.md) | The memory system's architecture — the five file-backed layers, what's canonical vs. one-off, Scout's separate Mem0 layer |
| [AGENTS.md](AGENTS.md) | Agent roster, scope boundaries, shared rules, condensed system prompts — summary form (`PERSONAS.md` has the full text) |
| [PERSONAS.md](PERSONAS.md) | Full persona system prompts, verbatim — what should actually land in `personas.ts` |
| [TOOLS.md](TOOLS.md) | Full MCP server tool reference — real input schemas, the content-safety regex patterns, task-board shape |
| [CONFIG.md](CONFIG.md) | Tech stack, workspace/package layout, `package.json`/config file contents, env vars, dev environments |
| [STRUCTURE.md](STRUCTURE.md) | Content model only (writing + civic-notes collections) — visual/component design is deliberately not here yet |
| [ROLES.md](ROLES.md) | Maps Jerry's fuller "organize my whole life" vision against the current roster — what's covered, what's a gap |
| [SCHEDULE.md](SCHEDULE.md) | Standing recurring civic events, board vacancies, how this differs from the task board |
| [CHANGELOG.md](CHANGELOG.md) | This kit's own history — what changed about the plan and why, newest first |

## Mayor's Academy material (markdown tracked, source PDFs local-only)

See [academy-material/ACADEMY_INDEX.md](academy-material/ACADEMY_INDEX.md) for the full topic
list. The two source PDFs live alongside the notes in `academy-material/` but stay untracked
(large, scanned/image-heavy).

## Session memory & runtime state (local-only, not tracked)

Written and read by the MCP server as agents work — not hand-authored, don't edit by hand unless
you're deliberately seeding state:

| File/dir | Purpose |
|---|---|
| `now.md`, `recent.md` | Session continuity — what just happened |
| `team.jsonl` | Cross-agent status updates |
| `profile.json` | Behavioral-pattern store (`PROFILE.md` is its human-readable mirror) |
| `tasks.json` (+`tasks.lock`) | Shared task board, backing the Dashboard's Kanban/calendar views |
| `sessions.json` | Session continuity between Dashboard and CLI |
| `archive.md`, `today-*.md` | Hand-maintained weekly log / daily scratch notes |
| `gui-transcript.jsonl`, `logs/`, `tmp/` | Dashboard runtime artifacts — regenerate at runtime |

## Restricted (Ryder-only)

`JOURNAL.md` — Ryder's private daily check-in journal. Sensitive/biographical content (health,
relationships, identity history). Never general team memory, never a source for other personas
or docs — see `GUARDRAILS.md` and `MEMORY.md` layer 4 before touching this file at all.
