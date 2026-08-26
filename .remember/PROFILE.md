# Jerry Profile — How He Works, What He Expects

This is the "know him well enough to not re-ask" doc. It's the seed for what `get_profile`
should return once the MCP server exists (see `MEMORY.md`'s layer 3 — the live version
of this is a growing `profile.json`, not a static file; update this doc's canonical-entries
table whenever `note_about_jerry` gets called for real). Pulled forward from `HANDOFF.md` before
that file was retired as duplicate narrative — this is the version that stays.

Distinct from `FACTS.md` (published, factual, biographical) and `GUARDRAILS.md`
(what never gets published) — this is behavioral: how Jerry decides, communicates, and works,
so an agent doesn't ask him things the team should already know.

Also distinct from `JOURNAL.md` (Ryder-only, sensitive/biographical — health, relationships,
identity history). This file stays team-shared and behavioral on purpose; if you're tempted to
add something personal here, it probably belongs in `JOURNAL.md` instead.

---

## Decision-making style

- **Real data over placeholders, every time.** He'd rather delay a feature than ship a fake
  version of it. The writing-samples section stayed hidden rather than launch with lorem ipsum;
  the resume link only renders once a real, safety-checked PDF exists. This is the one pattern
  that's actually been logged in the live `profile.json` (`prefers-real-data-over-placeholders`,
  confirmed once by Desiree, 2026-08-20) — treat it as the most load-bearing entry in this file.
- **Confirms every push explicitly, no matter how small.** Not a formality — a real gate. Don't
  treat "the build passed" as equivalent to "Jerry said go."
- **Thinks in systems, not scattered tasks.** Connect the dots when proposing a fix — show how
  it affects the whole picture, not just the one file touched.
- **Iterates on identity relentlessly before shipping public-facing work.** Domain went
  `jerry.lockard.tech` → `jerry.lockard.me` → apex `jerrylockard.me`; GitHub handle went
  `jerry-lockard` → `jerrylockard`, deliberately timed to match LinkedIn the same day. This
  wasn't indecision — it was consolidating toward one consistent identity before it went out to
  hiring committees. Expect this instinct to resurface any time identity/branding comes up again.
- **Wants specifics named, not softened into a vague category.** When he confirmed the political
  ambition should be stated at all, he didn't stop at "interested in public service" — he wanted
  the actual target on the page (U.S. House, working toward Speaker). Don't round a specific fact
  down to a safer-sounding generality without asking first; he's shown he'd rather state the real
  thing plainly. (This doesn't override the sitting-official carve-out in `GUARDRAILS.md` — see
  there before turning any specific target into copy that names a person.)

## How he gives material, and why agents write, not him

Jerry is dyslexic and finds spelling/writing genuinely difficult, but enjoys coding and structure
— that's part of why this whole project works for him. Practical implications:

- **He hands over raw material — notes, PDFs, things he read aloud — and expects the agent to
  organize/write it, not the reverse.** Don't ask him to draft or clean up text himself; that's
  the agent's job. See `RULES.md`'s Content Intake Protocol.
- **He wants the eventual blog/journal posts (Mayor's Academy sessions, Civic Notes for
  Board of Commissioners meetings) drafted by an agent from his raw notes/thoughts** — what he
  learned, admired, what stuck with him — not written by him from scratch.
- **Give him scannable structure over long prose** — tables, bold key facts, short sections. He's
  explicit that his memory isn't the best either, so a file he can scan in under a minute beats
  one he has to read closely to extract the one fact he needed.
- **He worries about ending up with duplicate/conflicting versions of the same thing** (env vars,
  docs, dev steps) — when updating a fact that already lives somewhere, update it there and
  cross-link, don't create a second copy that can drift out of sync.

## Communication & work style

- **Direct and terse.** No wind-ups, no unnecessary preamble — jump to the point or the
  recommendation.
- **Cares about accuracy over polish.** This is real job-seeking material for city-government
  work. A typo matters less than a made-up fact — a fabricated detail is a disqualification,
  not a style note.
- **Owns his choices; doesn't need decisions re-litigated.** Once something's settled, treat it
  as settled — see `FACTS.md`. Respects domain expertise without wanting to
  micromanage it.
- **Corrects scope creep directly and expects it to stick the first time** — e.g. the explicit
  instruction that this team's own cross-references never extend beyond lockard-tech, including
  in an assistant's own commentary about the project, not just in what gets published.

## Technical preferences

- **pnpm workspace**, not npm/yarn — established, don't relitigate.
- **Self-hosted where possible.** Runs his own infrastructure; prefers not to depend on
  third-party CDNs for critical assets (e.g., fonts should eventually be self-hosted, not
  loaded from Google Fonts).
- **Astro + TypeScript** for the public site — clean, type-safe, component-based. (Note: this
  was the old repo's stack choice — confirm it's still the target before assuming it carries
  into the rebuild untouched.)

## The career-framing pivot (why "civic-first" is load-bearing, not a style choice)

Two facts from the old repo's `guardrails.json` "superseded facts" list are worth carrying
forward as context, not just history:

- An older version of his materials framed him as **"aspiring to join Meta or Twitter"** —
  dropped entirely because it conflicts with the civic-first direction. Not softened, removed.
- An older version listed **detailed programming stack specifics** (Flutter, Firebase,
  LangChain, OAuth apps, etc.) — collapsed down to a brief "self-hosted infrastructure" framing.
  The technical work is real, but it's deliberately kept in the background, not the headline.

**The implication for any agent touching content:** when in doubt about how much technical
detail to surface, err toward less. The site's entire positioning is city/public-sector
job-seeking through the Covington Mayor's Academy — not a developer portfolio — and Jerry has
already actively pulled a more tech-forward framing back once. Don't reintroduce it by degrees.

## Content non-negotiables (see `GUARDRAILS.md` for the full, canonical list)

The short version, because it's worth having in the same place as the "why": never invent a
biographical fact, always run `check_content_safety` before proposing public copy, and never
publish a photo/résumé/contact detail that isn't real. Jerry would rather have an honest gap
than a filled-in guess.

## Canonical behavioral-pattern log

This table is the human-readable mirror of `profile.json`. When an agent calls `note_about_jerry`
for real, add or update a row here too (or better — once the MCP server exists, generate this
table from `profile.json` instead of hand-maintaining it).

| id | category | text | first noted | confirmed × |
|---|---|---|---|---|
| `prefers-real-data-over-placeholders` | priorities | Jerry consistently wants features built against real, sourced data rather than mocked or placeholder content, and would rather delay a feature than ship a fake version of it. | 2026-08-20 | 1 |

---

## Where this doc's content came from

Extracted from the old repo's `.remember/HANDOFF.md` (a one-off audit narrative, not a canonical
agent artifact — see `MEMORY.md`) plus `mcp/server/data/guardrails.json`'s
`supersededFacts`. `HANDOFF.md` itself was retired once its durable content landed here — the
rest of it was narrative retelling of facts that already live in `FACTS.md` and
`AGENTS.md`.
