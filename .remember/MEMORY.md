# Memory System — Architecture

This is what "memory" actually is in this project: five distinct, purpose-built layers, all
file-backed under `.remember/` (gitignored, local-only, never shipped to the public site).
Nothing here is a vector store or embedding search — it's plain files, read/appended by the MCP
tools in `TOOLS.md`. This doc is what to rebuild; the canonical/non-canonical split at the
bottom is about what to leave behind from the old repo's `.remember/`.

---

## The five layers

### 1. Session continuity — `now.md`, `recent.md`, `core-memories.md`

- **Read by:** `get_memory_context` → `{ now, recent, core }` (raw text, `""` if a file is missing)
- **Written by:** `append_memory_note(agentName, summary)` → appends a timestamped
  `## [ISO date] <agent> session` block to `now.md` only
- **Purpose:** what just happened, across agents and sessions. Every persona calls this at the
  start of a job so a fresh session picks up where the last one left off.
- **Open question carried from the old repo:** there's no tool that rotates `now.md` into
  `recent.md`, or `recent.md` into `core-memories.md` — and `core-memories.md` never actually
  existed in the old `.remember/` (only `now.md` and `recent.md` did; `core-memories.md` reads
  as empty via the missing-file fallback). Decide whether that rotation is a periodic manual
  step, a scheduled job, or a tool to build — right now it's an implied-but-unbuilt piece.

### 2. Cross-agent status — `team.jsonl`

- **Read by:** `get_team_updates()` → last 50 lines, parsed
- **Written by:** `post_team_update(agent, message, affects?)` → one JSON line per call:
  `{ agent, message, affects?, timestamp }`
- **Purpose:** signal, not noise — "I changed something you'll build on" or "I'm blocked on
  something you own." Informational only; posting an update never triggers another agent's
  session. Jerry decides when the next agent runs.

### 3. Behavioral profile — `profile.json`

- **Read by:** `get_profile()` → all observations, sorted by `timesConfirmed` desc then
  `lastConfirmed` desc (best-established patterns surface first)
- **Written by:** `note_about_jerry(agent, id, text, category, evidence?)` — **upsert by `id`**,
  not append. A repeat observation with the same stable kebab-case id updates the existing row
  (`text`, `category`, `evidence`, `lastConfirmed`, `timesConfirmed += 1`, `notedBy` gets the
  agent added if new) instead of creating a duplicate.
- **Shape:**
  ```ts
  interface ProfileObservation {
    id: string; text: string;
    category: "communication-style" | "decision-patterns" | "priorities"
            | "technical-preferences" | "working-style";
    evidence?: string;
    firstNoted: string; lastConfirmed: string; timesConfirmed: number;
    notedBy: string[];
  }
  ```
- **Purpose:** *how* Jerry works — communication style, decision patterns, priorities, technical
  preferences, working style. Explicitly **not** biographical/personal content (that's layer 5)
  and explicitly **not** project/session continuity (that's layer 1). Shared across every agent.
- **What actually exists right now:** one entry, `prefers-real-data-over-placeholders`
  (category: `priorities`, noted by Desiree, confirmed once 2026-08-20) — "Jerry consistently
  wants features built against real, sourced data rather than mocked or placeholder content, and
  would rather delay a feature than ship a fake version of it." That's the entire canonical
  behavioral-pattern store as of the last snapshot. Everything else describing "how Jerry works"
  in the old repo lives in the *non-canonical* Gordon files below, not in this system.

### 4. Ryder's private journal — `journal.md`

- **Read by:** `get_journal_context()` → raw text, or `"(no entries yet)"`
- **Written by:** `append_journal_entry(summary, contentIdeas?)` → timestamped block, content
  ideas listed separately from the summary
- **Purpose:** daily check-ins, Ryder-only by convention (not code-enforced — nothing stops
  another persona from calling these tools, the boundary is a prompt-level instruction). Never
  auto-becomes site content; `contentIdeas` is a proposal list for Jerry to review, not a queue
  that gets drafted automatically.
- **Trigger discipline:** only on Jerry's explicit "check-in" / "daily check-in" / "let's check
  in" — not forced onto an ordinary conversation.
- **Concrete example in this kit:** `JOURNAL.md` is what this layer actually holds — sensitive
  biographical content (health, relationships, identity) gathered before the live journal.md
  exists. Same access rule applies now as will apply then: Ryder-only, never general onboarding.

### 5. Shared task board — `tasks.json` (+ `tasks.lock`)

- Full tool list and shape are in `TOOLS.md` — it's memory in the sense that it's
  file-backed, cross-session, cross-agent state, but it's structured work-tracking rather than
  narrative memory. Same file whether driven from the Dashboard or a CLI agent turn.
- File-locked (250ms timeout) since Dashboard and CLI can write concurrently.
- `assignee`/`createdBy` are validated against the *live* persona roster — renaming an agent's
  internal `id` (not just display name) without a migration step orphans old tasks. Relevant now
  since Paige/Casey/Archie are renames of Quill/Ace/Ledger — if the `id` strings change too
  (`quill` → `paige`, etc.), any old task data referencing the old ids needs a migration pass,
  not a silent drop.
- **This already happened once, concretely:** the old repo's `sessions.json` (backing the
  Dashboard/CLI session-continuity feature — see layer 1's sibling concept, but for chat
  sessions rather than the shared memory buffer) is a flat map of old persona ids (`quill`,
  `ace`, `ledger`, plus `shepard`/`desiree`/`devon`/`ryder`) to session UUIDs. Every one of those
  four old-id entries is now orphaned by this kit's rename to Paige/Casey/Archie — proof this
  isn't a hypothetical risk, it already happened in the source material this kit was built from.

### 6. Scout's dedup memory — Mem0 (external, not `.remember/`)

Scout (`AGENTS.md`/`PERSONAS.md`) doesn't use any of the five layers above — it uses **Mem0**, an
external memory MCP service, via `search_memories`/`add_memory`, scoped by `agent_id:
"covington-monitor"`. This is a real architectural departure worth being explicit about:

- Not file-backed under this kit's `.remember/` at all — it lives in Mem0's own store, outside
  this repo entirely.
- Purpose-built for exactly one thing: has this specific civic event already been reported, so it
  never gets surfaced to Jerry twice. Not a general-purpose memory layer like 1–4 above.
- Confirmed working in Scout's first real run (2026-08-23) — `search_memories` returned empty
  (correctly, first run), `add_memory` with `infer=false` stored four items in the exact
  `"Covington monitor reported: <title> — <YYYY-MM-DD>"` format Scout's prompt specifies.
- **If Scout is ever rebuilt as a real `mcp/agents` persona** (not just a scheduled prompt run),
  decide deliberately whether its Mem0 dependency stays external or gets folded into the site's
  own MCP server's memory tools — right now it's genuinely a different system, not an oversight.

---

## Canonical vs. one-off files

The old repo's `.remember/` accumulated files beyond the five system layers above — from a
single one-off audit session by an assistant called "Gordon" (commit signature
`gordon@docker.com`, which doesn't match the `@lockard.tech` pattern any of the personas
use — Gordon is not, and was never, one of the agents).

| File | What it is | Rebuild it? |
|---|---|---|
| `now.md`, `recent.md`, `team.jsonl`, `profile.json`, `journal.md`, `tasks.json`, `tasks.lock` | The five canonical layers above | **Yes** — this is the actual system |
| `sessions.json` | File-backed session continuity so a Dashboard conversation resumes correctly from the CLI and vice versa | **Yes** — referenced by `AGENTS.md`'s "Session Continuity" section, backs cross-surface persona conversations |
| `archive.md` | A hand-maintained weekly changelog | **Maybe** — useful as a human-readable project changelog, but it's not read by any tool either; decide if it's worth keeping as a manual log or dropping in favor of git history |
| `gui-transcript.jsonl`, `logs/`, `tmp/` | Dashboard runtime artifacts | **No** — regenerate at runtime, don't seed them |
| `today-*.md` | Daily scratch notes | **No** — ephemeral, not part of the system's read path |
| `.gitignore` (inside `.remember/`) | Controls which hand-authored docs are tracked vs. which runtime/scratch content stays local-only | **Yes** — the memory system's runtime layers are explicitly local-only; the planning docs are meant to be tracked |

**Gordon's one-off audit files are gone, not just flagged.** `HANDOFF.md`, `COMPREHENSIVE_HANDOFF.md`,
`QUICK_REFERENCE.md`, `BUG_REPORT_2026-08-22.md`, `gordon-context.md`, and `gordon-profile.json`
(a single one-off audit session by an assistant called "Gordon" — commit signature
`gordon@docker.com`, never one of the actual personas) were deleted 2026-08-23 — see
`CHANGELOG.md`. Every durable fact inside them was already duplicated in `FACTS.md`/`PROFILE.md`/
`AGENTS.md`/`GUARDRAILS.md` by the time they were removed; nothing genuinely new was lost. Don't
treat them as a spec if they ever resurface in git history — they were a historical snapshot from
one audit session, not part of the architecture.

**The practical implication:** when you rebuild the MCP server, implement `memory.ts`,
`profile.ts`, `journal.ts`, `tasks.ts` against the five canonical files only.
