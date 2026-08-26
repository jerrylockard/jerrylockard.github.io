# Content Guardrails Reference

**Live Source:** `get_guardrails` MCP tool (authoritative)  
**Snapshot Date:** 2026-08-22  
**Rule:** If this snapshot and the tool disagree, **the tool wins** and this doc needs fixing.

**This is the single canonical guardrails doc** — `RULES.md` §4 links here instead of
repeating the list. If you're updating an excluded topic or a superseded fact, this is the only
place it should live.

---

## Hard Excluded Topics (Never Publish)

These are absolute blocks. No exceptions. No "just this once."

| Category | Specific Items |
|----------|----------------|
| **Academic Records** | GPA / grade point average, individual course grades, withdrawals — full term-by-term record on file in `JOURNAL.md` (Ryder-only), never for publication |
| **Government IDs** | Student ID, SSN (any portion), home address |
| **Legal Name** | Legal middle name |
| **Personal Relationships** | Ex-husband, the marriage, the divorce — **in any form** |
| **Sitting Officials** | Names of specific sitting officials **without asking Jerry first** (deliberate choice, not oversight) |

**Why the ex-husband/marriage/divorce line is absolute, not a discretion call:** Jerry's own
reasoning (2026-08-18, re-affirmed 2026-08-20) is that his ex might see it published and dispute
it publicly. That's a concrete reputational/legal risk, not squeamishness — treat it with the
same weight as an SSN or a home address, not as a soft "he'd probably rather not." Full context
in `JOURNAL.md` (Ryder-only) if you need it; the rule itself applies to every agent regardless.

---

## Discretionary Topics (Not Excluded — Handle With Care)

Distinct from the hard blocks above: these can be discussed if the context genuinely calls for
it, but never proactively featured or led with.

| Topic | Rule |
|---|---|
| **Sexual orientation** (Jerry is gay) | Not denied if asked directly. Not proactively announced or led with in copy. Not "the number one thing people know about me," in his words. |
| **HIV status** | Same tier as above — acknowledged if asked, never proactively announced, never the focal point. |

**The distinction that matters:** the hard-excluded list is a "never, full stop" — a clean
`check_content_safety` scan blocks it outright. This discretionary tier is a *framing* rule, not
a pattern the checker can catch — there's no regex for "led with" vs. "mentioned when relevant."
Applying it correctly is an editorial judgment call for whoever drafts the copy (Paige for
routine copy, Ryder for narrative), not something a tool enforces for you.

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
  collapse them into copy without asking separately. Full context in `JOURNAL.md`.

### Career Framing (Dropped, Not Just Softened)

Two more superseded facts, kept here because they explain the site's current positioning rather
than just documenting a change:

- An older version framed Jerry as **"aspiring to join Meta or Twitter"** — dropped outright,
  conflicts with the civic-first direction.
- An older version listed **detailed programming stack specifics** (Flutter, Firebase,
  LangChain, OAuth apps, etc.) — collapsed to the brief "self-hosted infrastructure" framing.
  The technical work stays real but backgrounded, not the headline. See `PROFILE.md` for
  why this matters beyond just "these two facts changed."

---

## Content Safety Check Protocol

### Before ANY Public Copy
```bash
# Via MCP tool (required for Paige/Ryder, recommended for everyone)
check_content_safety "your drafted copy here"
```

The actual regex patterns behind this check are documented in `TOOLS.md` (not
duplicated here — same one-source-of-truth principle as the excluded-topics list itself).

### What a Clean Scan Means
- No known-excluded pattern matched
- **NOT a substitute for judgment** — it's a safety net, not a green light

### What Triggers a Hit
- Any regex match against the excluded-topics list above
- Partial matches (e.g., "GPA" in any context)
- Context doesn't matter — the pattern existing is the block

---

## Biographical Fact Sourcing

### Never Invent Facts
Every factual claim must trace to ONE of:
1. **`mockup.html`** — original design comp (historical reference)
2. **MCP server tools** — `get_identity`, `get_education`, `get_work`
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

**Applies harder here, not softer** — real people, real government body.

### Required Structure (from `get_civic_voice_guide`)
- Fact / Attribution / Opinion clearly separated
- Meeting name, date, official body (Board of Commissioners, etc.)

### Hard Lines
- Never round "advanced from caucus" up to "approved"
- Never publish informal post-meeting conversation
- Never embed untrimmed recording as the public asset
- Run `check_content_safety` on EVERYTHING before proposing

---

## Quick Decision Tree

```
Drafting copy?
    │
    ├─► Is it biographical? → Check get_identity / get_education / get_work
    │
    ├─► Does it mention excluded topic? → HARD STOP (don't publish)
    │
    ├─► Does it touch orientation/HIV status? → Discretionary tier — see above; don't lead with it
    │
    ├─► Is it Civic Notes? → Check get_civic_voice_guide + check_content_safety
    │
    ├─► Is it routine site copy? → Run check_content_safety
    │
    └─► Is it narrative/biographical (About, Platform)? → Ryder lane + check_content_safety
```

---

## Enforcement

- **Paige/Ryder rule:** `check_content_safety` is mandatory before proposing copy
- **Casey (QA) catches:** Flags any missed guardrail violations in review
- **Archie (Docs) catches:** Ensures guardrails documented in one place only
- **All agents:** Guardrails apply equally — including Shepard (Chief of Staff)
- **Ryder** holds the fuller private context behind these rules (`JOURNAL.md`, Ryder-only) — the
  rules themselves still bind everyone equally without needing that context

---

## Updating Guardrails

Only via `get_guardrails` tool (MCP server data). 
- If Jerry confirms a superseded fact (like the office ambition), the tool is updated
- This doc is a snapshot — **the tool is the live source of truth**
- Archie updates this doc when the tool changes