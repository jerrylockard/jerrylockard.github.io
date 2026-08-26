# MCP Server Tools — Full Reference

**Source of truth (live code, this repo):** `mcp/server/src/index.ts`, backed by `data.ts`,
`guardrails.ts`, `memory.ts`, `profile.ts`, `journal.ts`, `tasks.ts` in the same package. This is
real, running code, not a spec to build from — if this doc and the actual file ever disagree, the
code wins and this doc needs fixing.

This is the complete tool list with real input schemas and descriptions — `CONFIG.md` has just
the flat name list. Example agent names below use the current 8-agent roster (Shepard, Desiree,
Devon, Paige, Casey, Archie, Ryder, Scout).

Every tool returns `{ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }` (a
`json()` helper) except three that return the raw text of a file/string directly: `get_rules`,
`get_civic_voice_guide`, `get_journal_context`.

---

## Identity & content facts (read-only, backed by JSON/MD files)

| Tool | Reads | Notes |
|---|---|---|
| `get_identity` | `data/identity.json` | Name, location, coordinates, contact email (+ note on why), social links (+ note), both domains (+ notes on each). The "note" fields are the important part — they carry *why* a fact is what it is, not just the value. |
| `get_education` | `data/education.json` | Degree, institution, year, honors, on-site coursework list, a separate "available but not yet published" coursework list, and a note that grades/GPA are intentionally excluded. |
| `get_work` | `data/work.json` | Array of `{ group, items: [{ title, org?, detail, extraDetailAvailable? }] }`. Grouped work/volunteer/service history. |
| `get_design_tokens` | `data/design-tokens.json` | Palette, type, layout tokens, component patterns, and the *reasoning* behind them. Empty/provisional until the new visual direction is settled — see `PERSONAS.md`'s note under Desiree. |
| `get_civic_voice_guide` | `data/civic-voice-guide.md` | Full editorial rulebook for the civic-notes series (voice, 9-section structure, fact/attribution/opinion table, hard rules). Returned as raw text, not JSON. |
| `list_todos` | `data/todos.json` | `{ id, text, status: "open"|"done", note? }[]`. Distinct from the shared task board (`tasks.json`) — this is a smaller, older TODO list carried from the original site's mockup. |

## Guardrails & content safety

| Tool | Signature | Notes |
|---|---|---|
| `get_guardrails` | none | Returns `{ excludedTopics: string[], supersededFacts: string[] }` from `data/guardrails.json`. |
| `check_content_safety` | `{ text: string }` | Runs a fixed regex checklist (see below) against `text`, returns `{ safe: boolean, violations: { label, match }[] }`. Not a semantic check — pattern match only. |

**The actual regex checks** (from `guardrails.ts` — useful if you're reimplementing this, not
just documenting it):

```ts
{ label: "SSN-shaped number", pattern: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/ }
{ label: "Social Security reference", pattern: /\bsocial\s+security\b/i }
{ label: "GPA / grade point average", pattern: /\bgpa\b|\bgrade\s+point\s+average\b/i }
{ label: "Student ID reference", pattern: /\bstudent\s*id\b/i }
{ label: "Street-address shape", pattern: /\b\d{1,5}\s+[A-Za-z0-9.'\s]{2,30}\b(rd|road|st|street|ave|avenue|apt|dr|drive|ln|lane|blvd|way|ct|court)\b\.?/i }
{ label: "Inserted middle name (Jerry ___ Lockard)", pattern: /\bJerry\s+\S+\s+Lockard\b/ }
{ label: "Marriage, divorce, or ex-husband reference", pattern: /\bex-?husband\b|\bdivorce[ds]?\b|\b(my|his)\s+(former\s+)?marriage\b|\bmarried\b/i }
```

Deliberately structural/keyword-only — the source comment is explicit that Jerry's actual SSN,
student ID, address, or middle name must never be embedded in the checker itself, since that
would defeat the point (a leaked checker source would leak the real values).

## Rules & memory

| Tool | Signature | Notes |
|---|---|---|
| `get_rules` | none | Returns the live `mcp/AGENTS.md` file, raw text. This is the actual mechanism that keeps every agent session current — no rule text is duplicated into `personas.ts`; every persona's prompt just says "call `get_rules` and follow it." |
| `get_memory_context` | none | Returns `{ now, recent, core }` — the raw text of `.remember/now.md`, `recent.md`, `core-memories.md` (missing files read as `""`). |
| `append_memory_note` | `{ agentName: string, summary: string }` | Appends a timestamped `## [ISO date] <agent> session` block to `now.md`. This is the *only* writer for that file — there's no separate "clear/rotate now.md into recent.md" tool; that's presumably a manual/periodic step. |
| `get_team_updates` | none | Returns the last 50 entries of `.remember/team.jsonl`. |
| `post_team_update` | `{ agent: string, message: string, affects?: string[] }` | Appends one JSON line to `team.jsonl`: `{ agent, message, affects, timestamp }`. |
| `get_profile` | none | Returns all `ProfileObservation` entries from `.remember/profile.json`, sorted by `timesConfirmed` desc, then `lastConfirmed` desc — best-established patterns first. |
| `note_about_jerry` | `{ agent, id, text, category, evidence? }` — `category` is an enum: `communication-style \| decision-patterns \| priorities \| technical-preferences \| working-style` | **Upsert by `id`.** A repeat observation with the same `id` updates `text`/`category`/`evidence`, bumps `lastConfirmed`, increments `timesConfirmed`, and appends the calling agent to `notedBy` if not already present — it does not create a duplicate row. This is the whole mechanism behind "reuse a stable kebab-case id so repeated observations reinforce the same entry." |
| `get_journal_context` | none | **Ryder-only** by convention (not code-enforced). Returns raw text of `.remember/journal.md`, or `"(no entries yet)"`. |
| `append_journal_entry` | `{ summary: string, contentIdeas?: string[] }` | **Ryder-only** by convention. Appends a timestamped block to `journal.md`, with content ideas listed separately. Nothing here becomes site content automatically. |

## Shared task board

Backs the dashboard's Kanban/roster/calendar views — same file (`.remember/tasks.json`) whether
you're going through the Dashboard or an agent's CLI turn.

| Tool | Signature | Notes |
|---|---|---|
| `create_task` | `{ title, detail, category, priority?: "low"\|"normal"\|"high", assignee?: personaId, createdBy: personaId\|"jerry", dueDate?: "YYYY-MM-DD" }` | Starts in `backlog`. `assignee`/`createdBy` are validated against the *current* persona roster (`getPersona(id)`) — renaming an agent's `id` without a migration step would make old tasks reference a persona id that no longer resolves. |
| `list_tasks` | `{ status?, assignee?, category? }` (all optional filters) | |
| `get_board` | none | Full board: backlog/in-progress/done columns + current category list — this is what the Dashboard's Kanban view renders directly. |
| `get_task` | `{ id }` | Single task including its full activity log. |
| `update_task_status` | `{ id, status, expectedStatus, by: personaId\|"jerry", note? }` | `expectedStatus` is an optimistic-concurrency check — pass the status you last observed. Moving to `done` is what drives the calendar's "recently completed" view, so a stale status here makes Jerry's activity view wrong. |
| `assign_task` | `{ id, assignee?: personaId, by }` | Omit `assignee` to unassign. |
| `add_task_note` | `{ id, by, note }` | Appends to the activity log without changing status/assignee — for "still in progress, here's an update." |
| `list_task_categories` | none | Check before `create_task` so categories don't fragment. As of the old repo's last snapshot: `design`, `content`, `infra`, `qa`, `docs`, `press`, `general`, `dashboard` — a reasonable starting set to seed the rebuild with, though this list is meant to keep growing. |
| `propose_task_category` | `{ category }` | Adds a new category — the board is meant to grow categories over time without a schema change. |
| `get_my_work` | none | Rollup of what's currently assigned per persona (excludes done). Powers "what is Desiree working on" roster cards. |
| `get_recent_activity` | `{ days?: number, 1–365, default 30 }` | Tasks completed in the window, newest first. |
| `get_upcoming_work` | none | In-progress work, then backlog, ordered by due date/priority. |

**Task shape** (`tasks.ts`):
```ts
interface Task {
  id: string; title: string; detail: string;
  status: "backlog" | "in-progress" | "done";
  priority: "low" | "normal" | "high";
  category: string;                 // open string, not a fixed enum — grows over time
  assignee: string | null;          // persona id, or null
  createdBy: string;                // persona id, or "jerry"
  createdAt: string; updatedAt: string;
  dueDate?: string; completedAt?: string;
  activity: TaskActivityEntry[];
}
```
File-locked (`tasks.lock`, 250ms timeout) since both the Dashboard and CLI agent turns can write
concurrently.

---

## Architecture note (already implemented this way)

`get_rules` reads `mcp/AGENTS.md` live rather than duplicating rule text into `personas.ts` —
that's the mechanism that keeps every agent session current without a redeploy. Same principle
for `get_identity`/`get_work`/etc.: source data lives in versioned JSON/MD files under
`mcp/server/data/`, not hardcoded into the tool functions. Keep this pattern if either file is
ever restructured — it's a real design constraint, not just a suggestion for a future build.
