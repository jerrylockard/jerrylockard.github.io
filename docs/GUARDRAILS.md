# Content Guardrails Reference

**This is the single canonical guardrails doc** for anything published about Jerry on
this site. If you're updating an excluded topic or a superseded fact, this is the only
place it should live — don't fork a copy elsewhere.

(This file used to be mirrored by a `get_guardrails` tool in a custom agent system
that was retired 2026-08-29 — this plain file is the only copy now.)

---

## Hard Excluded Topics (Never Publish)

These are absolute blocks. No exceptions. No "just this once."

| Category | Specific Items |
|----------|----------------|
| **Academic Records** | GPA / grade point average, individual course grades, withdrawals |
| **Government IDs** | Student ID, SSN (any portion), home address |
| **Legal Name** | Legal middle name |
| **Personal Relationships** | Ex-husband, the marriage, the divorce — **in any form** |
| **Sitting Officials** | Names of specific sitting officials **without asking Jerry first** (deliberate choice, not oversight) |

**Why the ex-husband/marriage/divorce line is absolute, not a discretion call:** Jerry's own
reasoning (2026-08-18, re-affirmed 2026-08-20) is that his ex might see it published and dispute
it publicly. That's a concrete reputational/legal risk, not squeamishness — treat it with the
same weight as an SSN or a home address, not as a soft "he'd probably rather not."

---

## Discretionary Topics (Not Excluded — Handle With Care)

Distinct from the hard blocks above: these can be discussed if the context genuinely calls for
it, but never proactively featured or led with.

| Topic | Rule |
|---|---|
| **Sexual orientation** (Jerry is gay) | Not denied if asked directly. Not proactively announced or led with in copy. Not "the number one thing people know about me," in his words. |
| **HIV status** | Same tier as above — acknowledged if asked, never proactively announced, never the focal point. |

**The distinction that matters:** the hard-excluded list is a "never, full stop" rule — easy
to check by pattern-matching. This discretionary tier is a *framing* judgment call for
whoever drafts the copy, not something a pattern match can catch — there's no regex for
"led with" vs. "mentioned when relevant."

---

## Superseded Facts (Previously Excluded, Now LIVE)

### Ambition to Run for Public Office
- **Status:** WAS excluded → NOW LIVE (as of 2026-08-18)
- **Reasoning:** Jerry confirmed directly that running for office is the **actual point** of the site. Mayor's Academy and `jerrylockard.me` are the on-ramp, not the destination.
- **Specific Target:** U.S. House of Representatives, working toward the Speaker's chair eventually.
- **Current Framing:** Live in `about.astro` and `platform.astro`, framed through his own values: "everyone guaranteed shelter, food, medicine, safety."
- **Surviving Carve-out:** Don't name a specific sitting official without asking first.
- **Concrete example of the carve-out in practice:** Jerry has said, in his own words, "I want
  Mike Johnson's job" — that's real context for *why* he picked Speaker specifically (direct
  influence over the language of bills and laws), not pre-approval to publish that phrasing.
  "State the target specifically" (U.S. House, eventually Speaker) and "name the sitting official
  holding that seat" are two different asks — he's only clearly given the first one. Don't
  collapse them into copy without asking separately.

### Career Framing (Dropped, Not Just Softened)

Two more superseded facts, kept here because they explain the site's current positioning rather
than just documenting a change:

- An older version framed Jerry as **"aspiring to join Meta or Twitter"** — dropped outright,
  conflicts with the civic-first direction.
- An older version listed **detailed programming stack specifics** (Flutter, Firebase,
  LangChain, OAuth apps, etc.) — collapsed to the brief "self-hosted infrastructure" framing.
  The technical work stays real but backgrounded, not the headline: the site's entire
  positioning is city/public-sector job-seeking through the Mayor's Academy, not a developer
  portfolio, and Jerry has already pulled back a more tech-forward framing once. Don't
  reintroduce it by degrees.

---

## Before Proposing Any Public Copy

Reread the excluded-topics list above and check the draft against it by hand — there's
no automated scanner for this anymore. A clean read isn't a substitute for judgment; it's
a check that nothing on the hard-excluded list slipped in, including partial mentions
(e.g. "GPA" in any context, not just a specific number).

---

## Biographical Fact Sourcing

### Never Invent Facts
Every factual claim must trace to ONE of:
1. **`mockup.html`** — original design comp (historical reference)
2. **Content already published on the site** (`src/content/`, `src/data/site.ts`)
3. **Jerry directly in session** — something he says explicitly

### No Plausible Gap-Filling
- If a date is missing, don't guess — ask or leave it out
- If a detail isn't in the sources, it doesn't exist for publishing purposes
- "Plausible-sounding" is not a standard — **traceable** is

---

## Placeholder Policy

### Never Pass Off Fake as Real
| Asset | Rule |
|-------|------|
| **Photo** | Either from Jerry or stays a visible, honest placeholder |
| **Résumé** | Either from Jerry (safety-checked) or no link rendered |
| **Contact Detail** | Either confirmed by Jerry or not published |
| **Writing Post** | Zero posts = section hidden (intentional: "empty writing section worse than none") |

### Current Placeholders (Honest)
- Writing section: Hidden entirely until `src/content/writing/*.md` has real posts
- Civic Notes: Framework ready, renders when real notes exist

---

## Civic Notes Extra Guardrails

**Applies harder here, not softer** — real people, real government body. See
`docs/research/civic-notes/CIVIC-NOTE-TEMPLATE.md` for the full structure/voice guide this
content collection follows.

### Required Structure
- Fact / Attribution / Opinion clearly separated
- Meeting name, date, official body (Board of Commissioners, etc.)

### Hard Lines
- Never round "advanced from caucus" up to "approved"
- Never publish informal post-meeting conversation
- Never embed untrimmed recording as the public asset
- Recheck against the excluded-topics list above before proposing anything

---

## Updating Guardrails

This is a plain hand-maintained file now — edit it directly when a topic gets excluded,
included, or superseded, the same way any other project doc changes. If Jerry confirms a
superseded fact (like the office ambition), update the relevant section above.