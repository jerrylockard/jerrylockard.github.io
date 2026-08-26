# Hard Rules — Non-Negotiable Boundaries

These rules apply to every agent, every tool, every session. They are load-bearing.

---

## 1. Scope Boundary: lockard-tech Only

- This team knows about **lockard-tech only**: this personal site and future lockard-tech repos.
- **Zero knowledge of, and never references, any other organization or platform** Jerry works on.
- This boundary exists because the repo's git history, memory, and commit signatures represent Jerry professionally for city-government hiring. Nothing unrelated gets mixed in, ever.

---

## 2. Git Workflow

- **Stay on `main`** — no feature branches, no auto-created branches.
- **New commits only** — never `--amend`, never `--force`, never `git reset --hard`.
- **One logical change per commit**.
- **Every push stops for Jerry's explicit confirmation** — regardless of build status or change size. This is not configurable per-agent.

**A real precedent, not a hypothetical:** in the old repo, an unpushed local commit was once
found carrying an incorrect, out-of-scope signature — the wrong agent name/role/email entirely,
not just a typo. It was caught before it reached `origin` by a later agent doing a routine
reconciliation pass. Because "never `--amend`" is absolute, the agent who found it could not fix
it themselves — rewriting someone else's commit is a call for Jerry or the lead agent to make,
not something any single agent decides unilaterally, even to fix an obvious mistake. If you ever
find a bad commit before it's pushed: flag it clearly, don't touch it, and wait for that decision.

---

## 3. Commit Signature Format

Every commit an agent makes ends with:

```
— <Agent>, <Role>
Co-Authored-By: <Agent> <agent>@lockard.tech
```

Example:
```
— Paige, Content Editor
Co-Authored-By: Paige <paige@lockard.tech>
```

---

## 4. Content Integrity (Hard Blocks)

**Full detail — excluded topics, superseded facts, the content-safety check protocol, and the
placeholder policy — lives in `GUARDRAILS.md`, the single canonical doc for this. Don't
duplicate that list here; if the two ever disagree, `GUARDRAILS.md` (and behind it,
`get_guardrails`) wins.**

The short version, so this file still stands alone as a rules summary:

- Never invent a biographical fact — every claim traces back to an MCP data tool or something
  Jerry says directly. No filling gaps with plausible-sounding detail.
- Run `check_content_safety` before proposing public copy; treat any hit as a hard stop.
- Never pass off a fabricated placeholder (photo, résumé, contact detail) as real.

---

## 5. Change Safety

- `astro build` (or `astro check` for quick pass) **must pass** before proposing a commit.
- **No new dependencies** (`pnpm add` anything) without Jerry approving first.
- Any file deletion, or change to `astro.config.mjs`, `package.json`, CI/build-relevant files = flagged for explicit review.

---

## 6. Operational

- `.env` and secrets/tokens are **never** read, logged, shown in chat, or committed.
- Every job leaves an audit trail (files touched, commands run) visible in Dashboard and folded into `.remember/` via `append_memory_note`.
- No scheduled/unattended jobs that write or push without Jerry actively driving the session.

---

## 7. Naming Conventions

- Short names, minimal underscores. Prefer no hyphen; one hyphen max when needed.
- Files: lowercase (`desiree.ts`, `content.json`), no underscores.
- Applies to everything under `mcp/` and anything an agent creates in `src/`.

---

## 8. Memory Protocol

- **Start of job:** Call `get_memory_context` (reads `.remember/now.md`, `recent.md`, `core-memories.md`)
- **Start of job:** Call `get_team_updates` (what teammates did)
- **Start of job:** Call `get_profile` (learned patterns about how Jerry works)
- **End of job:** Call `append_memory_note` with short summary of what happened
- **When affecting teammate:** Call `post_team_update` with 1-2 sentences (signal, not noise)

---

## 9. Profile Learning (`note_about_jerry`)

- For **behavioral patterns only** — how Jerry communicates, decides, prioritizes.
- Use stable kebab-case IDs (e.g., `prefers-terse-replies`) so repeat observations reinforce the same entry.
- **Never record** excluded-topics content. Keep entries behavioral, not biographical/personal.
- Biographical/personal content belongs in Ryder's private journal, not shared profile.

---

## 10. Content Intake Protocol

Whenever Jerry gives an agent source material — a PDF, pasted text, a photo, notes read aloud,
anything — that material gets turned into a durable memory file before the session ends. This
isn't optional and isn't something to ask permission for each time; it's standing policy.

- **Identify the topic(s)** and the natural file boundary — one file per topic that would get
  looked up independently, matching the granularity already used across `.remember/` (e.g. the
  `academy-material/ACADEMY_*.md` files: one per subject, not one giant file per source document).
- **Extract real content**, not a summary-of-a-summary — names, dates, numbers, direct quotes
  where they matter. A future session reading the memory file should never need to go back to
  the original source.
- **Cross-link** new files to related existing ones (`[[wiki-links]]` or plain markdown links) so
  the material is discoverable from more than one entry point.
- **Update the index** — whichever file plays "entry point" for that topic area (e.g.
  `academy-material/ACADEMY_INDEX.md`) and this directory's own `README.md` table — so nothing new
  is orphaned/undiscoverable.
- **Log it in `CHANGELOG.md`** — one entry, what was added and why, per this file's own convention.
- If the material contains anything that reads as sensitive/personal rather than public
  reference material, don't write it into a broadly-readable file — flag it back to Jerry instead
  (see `GUARDRAILS.md`, `JOURNAL.md`).

This is exactly the pattern already used for the Mayor's Academy PDFs and Jerry's own session
notes/schedule — treat that as the reference example, not a one-off.

## 11. Ship, Don't Simulate

An agent's turn does not count as progress unless something changed that Jerry can actually see —
a file written, a commit made, a page rendering, a real screenshot taken. Describing what *would*
happen, or what a future session *should* do, is planning — useful, but not itself the work, and
it should never be reported back as if it were.

- If a turn ends without an artifact changing on disk (or in git, or in production), say so
  plainly instead of writing a summary that reads like something shipped.
- Prefer a small real thing over a large described thing. A single committed file beats a
  five-file plan for five files that don't exist yet.
- "It's set up" or "it should work" are claims to verify, not report — run it, check it, screenshot
  it, read the actual response. (See `.claude/skills/run-jerrylockard-github-io/` for the pattern:
  built AND actually launched/screenshotted, not just documented.)
- This kit's whole purpose is to stop being *just* memory/instructions at some point and start
  turning into the actual site, actual posts, actual production behavior. Treat every session as
  a chance to move something from "documented" to "shipped," not just add more documentation
  about what's planned.

## 12. Source of Truth Hierarchy

1. **MCP server tools** (`get_rules`, `get_identity`, `get_guardrails`, `get_design_tokens`, etc.) — live, authoritative
2. **`mcp/AGENTS.md`** — agent rules, roster, commit signatures
3. **`AGENTS.md` (root)** — cross-tool project hub, settled facts
4. **`CHEATSHEET.md`** — command reference, quick facts
5. **`src/data/site.ts`** — site's local copy of identity/work/education (mirrors MCP)
6. **Component/source code** — implementation truth for what's actually rendered

**If tools and docs disagree, the MCP tool wins and the doc needs fixing.**