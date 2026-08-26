# Changelog — This Kit's Own History

Not the site's changelog, not the old repo's — this tracks **this planning kit** (`.remember/`
itself) as it grows. Different purpose from `git log`: git shows *what changed in a file*, this
shows *what changed about the plan and why*, in plain language, in one place.

**Convention:** newest entry on top. One entry per session/sitting that changes something
structural (new file, renamed file, new section, a fact corrected). Date + what + why in one or
two lines — this is a log, not a report; save the detail for the file that actually changed.

**On "auto-updating":** the MCP server exists now (`mcp/server/src/index.ts`, real and running —
see `FACTS.md`'s corrected Current Scope section), but nothing wires `append_memory_note` (or an
equivalent) into this specific file yet — that's a real, small follow-up, not done as part of this
pass. Until it is, this stays manual discipline: whoever (human or agent) makes a structural
change adds the entry.

---

## 2026-08-23 — Content-accuracy pass: 7→8 agents, GitHub Pages→Vercel, and drafted-but-unshipped persona changes corrected

Follow-up to the reorg below, at Jerry's request ("do one more content-accuracy scan"). Found and
fixed several current-state claims that had gone stale, distinct from the historical entries in
this file (which stay as-written — they're accurate for when they were written):

- **Agent count.** `CONFIG.md` still said "7 agent personas" in two places — corrected to 8
  (Scout was added 2026-08-23 but these two lines were missed at the time).
- **Deploy platform.** `FACTS.md`'s Domain & Deployment table, `CONFIG.md` (workspace table +
  Hosting section), and `PERSONAS.md`'s Devon block all still described GitHub Pages as the live
  deploy target — stale since the real repo moved to Vercel this same day (see the root repo's own
  `AGENTS.md`/`CHEATSHEET.md`). Corrected all four; left `archive.md`/`JOURNAL.md`'s GitHub Pages
  mentions alone since those are historical logs describing what was true when written.
- **A bigger stale premise, not just a word swap:** `FACTS.md`'s old "Current Scope of This Kit"
  section flatly stated "No agents, no MCP server, no site code" — false. The rebuild this kit was
  planning already happened: this directory is the live, canonical `jerrylockard.github.io`, with
  real running code at `mcp/server/src/index.ts` and `mcp/agents/src/personas.ts`. Rewrote that
  section and the Provenance step above it (which still said the kit's rename was "still pending")
  to reflect that both are done. Same fix applied to `STRUCTURE.md` (dropped its "Jerry hasn't
  decided the new visual direction yet" premise — the site's real components are built and live)
  and `TOOLS.md`/`PERSONAS.md` (dropped "if you're rebuilding"/"Draft for the rebuild" framing —
  these tools and personas are live code, docs should track them, not describe a future build).
- **Drafted-but-never-shipped persona changes, caught by diffing docs against the actual
  `personas.ts`:** this kit's docs (`AGENTS.md`, `PERSONAS.md`) claimed Desiree's title became
  "Design Director" and Ryder's department became "Public Narrative & Civic Media" as part of the
  Quill/Ace/Ledger→Paige/Casey/Archie rename — neither actually landed in the code (Desiree is
  still "Design Lead," Ryder is still "Press & Public Narrative"). Also found Devon's documented
  scope included `mcp/gui/**`, which isn't in the real `scope` array either. Corrected all three in
  the docs to match the live code rather than the unshipped draft, and flagged each explicitly (in
  `AGENTS.md`'s Roster History and `PERSONAS.md`) as real, low-risk changes to make in `personas.ts`
  itself if they're still wanted — not silently applied here, since renaming/reconfiguring an
  agent's own definition is its own explicitly-approved category of work, not a side effect of a
  docs pass.

---

## 2026-08-23 — Directory reorg: Gordon's one-off files deleted, Academy docs grouped, README rebuilt as an index

Jerry asked for `.remember/` to actually be organized, not just planned to be — several of the
consolidation decisions below were already recommended by this kit's own docs (`MEMORY.md`'s
canonical-vs-one-off table, an earlier changelog entry claiming `HANDOFF.md`/`BUG_REPORT` were
"deleted") but had never actually been executed; the files were still sitting on disk. This pass
closes that gap:

- **Deleted** `HANDOFF.md`, `COMPREHENSIVE_HANDOFF.md`, `QUICK_REFERENCE.md`,
  `BUG_REPORT_2026-08-22.md`, `gordon-context.md`, `gordon-profile.json` — Gordon's one-off audit
  package. Checked every entry in `gordon-profile.json`'s 8 patterns against `PROFILE.md` first;
  nothing was missing, all 8 were already covered there. Same check for `HANDOFF.md`/
  `BUG_REPORT`'s facts against `FACTS.md`'s "Open Items Carried From the Old Repo" section —
  nothing lost.
- **Moved** all 12 `ACADEMY_*.md` files into `academy-material/`, alongside the two source PDFs
  they were already extracted from — one folder per source instead of scattered at the top level.
  `ACADEMY_INDEX.md`'s internal links needed no changes (same-directory relative links); updated
  the handful of cross-references elsewhere (`RULES.md`, `STRUCTURE.md`, `SCHEDULE.md`) to the new
  path. Updated `.gitignore` accordingly — un-ignoring `academy-material/` itself, then
  re-excluding just the two `*.pdf` files, since git won't apply `!` negation to files inside a
  directory that's still excluded at the directory level.
- **Rewrote `README.md`** from a duplicate Gordon-package summary into an actual index of this
  directory — the "root README.md table" `RULES.md`'s Content Intake Protocol already referred to,
  which didn't really exist as a table until now.
- **Trimmed** `FACTS.md`'s "Tech Stack" table (fully duplicated `CONFIG.md`) down to a pointer.
- Deliberately left `RULES.md`/`GUARDRAILS.md` and `FACTS.md`/`MEMORY.md` as separate files —
  they read as similar-sounding names but cover different concerns (operating rules vs. the
  content-safety spec; settled facts vs. how the memory system itself is built), and `RULES.md`
  already explicitly delegates content-guardrail detail to `GUARDRAILS.md` rather than duplicating
  it. `profile.json`/`PROFILE.md` also stay separate on purpose — one's the tool-written data file
  `get_profile` actually reads, the other's its human-readable mirror; merging them would break
  the JSON.
- **Not fixed, flagged instead:** several files here (`CONFIG.md`'s "7 agent personas",
  GitHub-Pages-era deploy language) still describe an older snapshot pulled from the original
  repo and haven't caught up to the 8-agent Paige/Casey/Archie/Scout roster or the Vercel move —
  real staleness, but a content-accuracy pass, not a reorg. Left alone rather than half-fixing it
  file by file.

---

## 2026-08-23 — lockard-tech clarified as Jerry's own company; site's 3 purposes confirmed

Jerry clarified, while asking for Claude Desktop project-setup text: `lockard-tech` is his own
tech company, founded after his May 2025 EKU graduation — not an unrelated org, despite
`RULES.md`'s scope note reading that way out of context (that note is about GitHub-org
separation, not ownership). Added to `FACTS.md`. Also confirmed the site has three concrete
purposes — networking/introductions, announcing his run for public office, and
building/representing lockard-tech — captured in `FACTS.md` for anyone drafting site copy or
project descriptions going forward.

---

## 2026-08-23 — Real Academy schedule + Session 1 notes; 2025 econ magazine; two new standing rules

Jerry gave the actual Mayor's Academy schedule (8 sessions, Aug 2026-Apr 2027) and his live
notes from Session 1 directly in chat — captured as `ACADEMY_SCHEDULE.md` and
`ACADEMY_SESSION_1_NOTES.md`, which finally resolves what `SCHEDULE.md` had flagged as unknown
(the PDF itself never had a calendar; Jerry's own paperwork did). Also read a second, shorter PDF
(`covington-economic-magazine.pdf`, 24pp, the city's 2025 Economic Development Impact Report) and
split it into `ACADEMY_ECON_IMPACT_2025.md` (city-wide 2025 numbers, company wins, People/Place
highlights) plus a "2025 update" section folded into the existing `ACADEMY_RIVERFRONT_CCR.md`
(the Silverman CCR deal grew from $67.2M to $83M — a real change, not just a rounding fix).

Jerry also asked for two standing behaviors, now codified: any material he hands over always
becomes a memory file (`RULES.md` §10, Content Intake Protocol — the pattern above is now the
worked example to follow), and agents should treat "documented" and "shipped" as different things,
biasing toward real, verifiable production changes over descriptions of planned ones (`RULES.md`
§11, Ship Don't Simulate). Added a `PROFILE.md` note on why agents draft everything from his raw
notes rather than him writing prose (dyslexia, memory), and a `STRUCTURE.md` section describing
the raw-notes → drafted-post → published pipeline for Academy sessions and Civic Notes, without
deciding the still-open question of where an Academy post would actually publish.

---

## 2026-08-23 — Mayor's Academy PDF (157pp) processed into 8 ACADEMY_*.md memory files

Read the entire `academy-material/Mayor's Academy Materials.pdf` (confirmed 157 pages via the Read
tool, matching the earlier heuristic) and turned it into organized, scannable reference docs:
`ACADEMY_INDEX.md` (entry point), `ACADEMY_MAYOR_WASHINGTON.md`, `ACADEMY_GOVERNMENT_TRANSITION.md`,
`ACADEMY_ECONOMIC_DEVELOPMENT.md`, `ACADEMY_RIVERFRONT_CCR.md`, `ACADEMY_INFRASTRUCTURE_PROJECTS.md`,
`ACADEMY_BUDGET_FEDERAL_IMPACT.md`, `ACADEMY_HOUSING_NKY_OVERVIEW.md`,
`ACADEMY_HOUSING_TOOLS_CASE_STUDIES.md`. Turns out the PDF is Covington/NKY civic and
economic-development briefing material (press releases, a regional housing report, one government
order, the city's 2024 impact report) — not a session-by-session Academy syllabus with dates, so
`SCHEDULE.md`'s open question about a fixed Academy calendar is now answered "no fixed calendar in
this material" rather than left open. Nothing in the PDF touched `GUARDRAILS.md`'s excluded
topics — it's all public city/regional government content, no biographical material about Jerry.

## 2026-08-23 — Root docs corrected to describe this kit, not the real repo; git/gitignore set up

Root `AGENTS.md`/`CLAUDE.md` had been a stale copy of the *real* repo's docs — claiming the site
was built and live in this directory (7-agent roster, `src/components/`, `mcp/`, auto-deploy),
none of which exists here. Rewrote root `AGENTS.md` to accurately describe this directory as a
planning kit in its "writing directions and instructions, no code yet" phase, pointed it at
`.remember/` files instead of restating facts that go stale (the 7-agent vs. this kit's current
8-agent roster was exactly that kind of drift), and remade `CLAUDE.md` as a real symlink to it
(previously two separate files with duplicated content). Added a phase-accurate preamble to
`CHEATSHEET.md` (its commands are a target-state spec — no `mcp/` workspace or `pnpm` on `PATH`
here yet). Added a top-level `.gitignore` (node_modules/dist/.astro/.env/logs/OS cruft — deliberately
*not* `.remember/`, which is this kit's actual tracked content, unlike the real repo's gitignored
runtime `.remember/`) and removed stray Windows artifacts (`debug.log`, a `Zone.Identifier` file)
that had ended up in this directory.

Also discovered mid-session: a fresh, disconnected git repo (branch `master`, zero commits) had
appeared in this directory, separate from the real repo's actual history at
`/home/jerry/jerrylockard` (branch `main`, 15+ commits, connected to
`github.com/jerrylockard/jerrylockard.github.io`, with its own not-yet-pushed local changes).
Jerry's call: this directory should become the new canonical copy eventually, after those
not-yet-pushed changes are carried over first — but that's a git/repo-integration step, held for
when the phase moves past "writing instructions" into actual code work. Not done yet.

## 2026-08-23 — Added `.claude/skills/run-jerrylockard-github-io/`, a driver-based run skill

Built and verified (not just documented) a way for a future agent to launch and drive this site:
`astro dev` + a Playwright-based `driver.mjs` that navigates headless Chromium, screenshots, and
reports console errors. Real screenshot taken and inspected, not just claimed. Needed Jerry's
sign-off first, since it meant a new devDependency (Playwright) — approved for this narrow,
agent-tooling purpose only, not shipped as part of the site itself.

Hit and solved two environment problems worth remembering beyond the skill file itself: plain
`npm install` crashes outright on this repo's pnpm-built `node_modules` (had to `npm install -g
pnpm` instead, since `pnpm`/`corepack` aren't preinstalled), and Playwright's Chromium can't launch
because required system libs are missing with no working path to `sudo apt-get install` them —
`sudo` fails ("a terminal is required to authenticate") even when Jerry runs it himself via the `!`
prefix, seemingly for any command in this environment. Worked around it without root: `apt-get
download <pkg>` (no sudo needed) + `dpkg-deb -x` to extract locally + `LD_LIBRARY_PATH`. `driver.mjs`
does this automatically on first use, no manual step. Full detail in the skill's own Gotchas
section — this entry is the pointer, not the duplicate.

---

## 2026-08-23 — Scout (8th agent) created, run for real, and made recurring

Jerry asked for an agent to build his real weekly schedule and gave a complete, ready-to-run
monitoring spec himself (Covington sources, Mem0 dedup logic, exact output format). Documented
Scout as the roster's 8th member across `AGENTS.md`/`PERSONAS.md` — architecturally distinct from
the other seven (doesn't touch the repo, doesn't inherit `SHARED_PREAMBLE`, its prompt is kept
verbatim). Ran it for real: Mem0 (`search_memories`/`add_memory`) and WebFetch/WebSearch against
Covington's actual civic sources both worked live. First run found 4 reportable items (logged to
Mem0), confirmed two standing recurring facts not previously in this kit (Kenton County Planning
Commission cadence, Farmers Market season/hours), and surfaced that the Aug 25 Board of
Commissioners agenda's public-input content couldn't be confirmed via fetch — all folded into
`SCHEDULE.md`. Then made it actually recurring: a live Claude Code routine
(`trig_01B7nga1TJicJrKrvoqmMGSd`), weekly Sunday 6 PM ET, emailing the digest via Gmail MCP,
Mem0-connected for dedup. `ROLES.md`'s HR-scheduling gap is now half-closed — see there for what's
still open.

## 2026-08-23 — Deep review pass against the renamed original repo

Reviewed everything unread in `/home/jerry/jerrylockard/.claude` and `.remember/` (the original
repo, since renamed off `jerrylockard.github.io`) against this kit's content. Found and fixed:
the "Board of Commissioners" item was actually already resolved (was still marked open here);
`doctor.mjs` gained a 20th check (`AI_GATEWAY_API_KEY`) that this kit still said was 19; an
earlier local-directory name (`personal-site`) missing from `FACTS.md`'s provenance history; a
real precedent for the "never amend" rule (a caught-before-push wrong-signature commit) missing
from `RULES.md`; a concrete example of the agent-rename-orphans-sessions risk sitting unnoticed
in the old repo's own `sessions.json`; an unimplemented feature pitch ("The Notebook," Ryder)
that existed only in a team-update log, at risk of being lost. Added `CHANGELOG.md` (this file),
`ROLES.md`, and `SCHEDULE.md` in response to a broader ask: this kit isn't just for the personal
site anymore — it's meant to organize Jerry's life going forward, with agents eventually acting
as far more than a web dev team (HR, PR, therapist-adjacent support, journalist/storyteller,
designer, influencer). See `ROLES.md` for the actual mapping and the gaps that surfaced.

## 2026-08-23 — Full EKU transcript added; discretionary guardrails tier established

Jerry supplied his complete official transcript. Added the full term-by-term grade/GPA record to
`JOURNAL.md` (Ryder-only — never publishable, matches the existing hard exclusion, but useful
internally). Confirmed legal middle name (Allen). Deliberately did **not** record SSN, student ID
number, or home address from the same document — real PII risk with no benefit to keeping it in
a plaintext file, distinct from GPA/grades which are "don't publish" rather than "don't store."
Also established a new **discretionary topics** tier in `GUARDRAILS.md` (sexual orientation, HIV
status) — distinct from the hard-excluded list: acknowledged if asked, never proactively led
with. Neither existed in the guardrails doc before this.

## 2026-08-23 — Provenance and current-scope sections added to `FACTS.md`

Jerry described the full directory migration history in chat (Windows → WSL2 rsync → OpenCode
pull into this kit → pending double-rename) and asked for it written up clearly. Added as a
dedicated `## Provenance` section, plus a `## Current Scope of This Kit` section stating
explicitly: no CNAME/deploy config yet, no agents/MCP server/site code yet — this kit is the
data-and-instructions layer only, with a self-expanding, ever-growing-memory design goal.

## 2026-08-23 — Consolidated 5 directories into one flat `.remember/`

`project-rules/`, `project-memory/`, `project-config/`, `agent-system/`, `site-structure/` (most
holding only 1–3 files) collapsed into a single `.remember/` directory, matching this project's
own convention for local, agent-facing memory. Files renamed to drop underscores and shorten
(`HARD_RULES.md`→`RULES.md`, `SETTLED_FACTS.md`→`FACTS.md`, `JERRY_PROFILE.md`→`PROFILE.md`,
`AGENT_ROSTER.md`→`AGENTS.md`, `MCP_TOOLS.md`→`TOOLS.md`, `SITE_STRUCTURE.md`→`STRUCTURE.md`,
`MEMORY_SYSTEM.md`→`MEMORY.md`), all cross-references fixed.

## 2026-08-23 — Agent roster renamed; three new reference docs added; consolidation pass

Jerry renamed three agents (Quill→Paige, Ace→Casey, Ledger→Archie) and retitled two roles
(Desiree→Design Director, Ryder's department broadened) directly in `AGENT_ROSTER.md`. Reviewed
that edit for gaps (Devon's scope table missing `mcp/gui/**` despite prose ownership — fixed),
then closed several file-by-file consolidation decisions: deleted `BUG_REPORT_2026-08-22.md`
(superseded) and `HANDOFF.md` (narrative retired after extracting its durable content into a new
`JERRY_PROFILE.md`); made `GUARDRAILS.md` the single canonical source instead of duplicating the
excluded-topics list in `HARD_RULES.md`; archived `DESIGN_TOKENS.md` and trimmed
`SITE_STRUCTURE.md` to content-model-only, since visual design isn't decided yet. Added
`PERSONAS.md` (full system prompts, adapted to the new names) and `MCP_TOOLS.md` (full tool
reference with real schemas and the actual content-safety regex patterns).

## Earlier (before this kit had a changelog)

The kit's original five-directory structure (`project-rules/`, `project-memory/`,
`project-config/`, `agent-system/`, `site-structure/`) was built by pulling facts from the old
`jerrylockard.github.io` repo's `.remember/` directory via OpenCode — see `FACTS.md`'s
Provenance section for the full directory-migration story. No changelog existed yet at that
point; this file starts tracking from the session above.
