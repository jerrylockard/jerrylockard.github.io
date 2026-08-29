# Civic Note template

Copy this skeleton to `src/content/civic-notes/YYYY-MM-DD-<slug>.md` for every new meeting
entry, so the theme stays consistent without re-explaining it each time. This file itself is
**not** part of the `civicNotes` collection (it lives outside `src/content/civic-notes/`, so
Astro's content loader never touches it) — it's just the fill-in-the-blank source of truth.

Frontmatter fields come straight from the schema in `src/content.config.ts`. Section structure,
voice, and hard rules come from `CIVIC-VOICE-GUIDE.md` (same directory) — read that before
drafting if it's been a while; this template only encodes its shape, not its full rulebook.
Modeled directly on `src/content/civic-notes/2026-08-18-board-of-commissioners-caucus.md`, the
first published entry.

---

```markdown
---
title: "What I heard at Covington's <MONTH DAY> <meeting type>"
meetingDate: YYYY-MM-DD
publishedDate: YYYY-MM-DD
updatedDate: YYYY-MM-DD
meetingType: "<e.g. Board of Commissioners Caucus | Board of Commissioners Legislative Meeting>"
location: "Covington City Hall, 20 W. Pike St., Covington, Kentucky"
attendance: "full" # or "partial"
recordingCoverage: "<Full, or explain the gap — e.g. 'Partial — I arrived after the meeting began.'>"
status: "proposed" # one of: proposed | advanced-from-caucus | approved | deferred | rejected | implemented
nextActionDate: YYYY-MM-DD # omit entirely if nothing is pending
topics: ["<topic-one>", "<topic-two>"]
summary: "<One or two sentences: what was decided or discussed, plain language.>"
officialAgendaUrl: "<https://www.covingtonky.gov/... link to the official agenda PDF>"
officialPacketUrl: "<https://www.covingtonky.gov/... link to AIRs & backup packet, if separate>"
# recordingUrl: "<add once the official/self-recorded video is up>"
---

## What I heard

Narrate what you personally attended/heard, in first person, honest about attendance gaps.
Include a timestamped subject-outline table if there's a recording:

| Approximate time | Subject |
| --- | --- |
| 00:00–00:00 | <subject> |

Follow with a paragraph or two on what stood out in the moment — reactions, not analysis yet.

## What the documents show

Cross-check every claim against the official agenda/packet. Use tables for line-item data
(purchases, contract figures, payment schedules). Attribute meeting statements explicitly
("Staff said...", "A commissioner asked...") rather than stating them as independently verified
fact. Name the exact procedural status of each item — never round up to "approved" before an
actual vote.

## What stood out to me

One or two paragraphs. Fine if short — don't skip it.

## My view

Jerry's own opinion, clearly marked as such ("My view is...", "I'm not treating this as
automatically good or harmful..."). Nonpartisan, evidence-led.

## Questions I'm following

Grouped by topic, carried forward across future entries on the same subject rather than
re-derived each time (see CIVIC-VOICE-GUIDE.md's "Open questions to keep tracking").

**<Topic>** — <question>? <question>?

## What happens next

State the current status plainly and name the next known action/date if any. Note that this
entry will be updated (not overwritten) when that happens.

## Sources and recording

- **Official video** — <link once available, or note it's not yet published and where it'll
  eventually appear (TBNK / Covington's YouTube channel)>.
- [City event page](<link>)
- [Official agenda](<link>)
- [Official agenda-item requests and backup packet](<link>)
- <any other primary sources cited above — department pages, statutes, ordinances>

## Update history

- **<Month Day, Year>** — Initial entry published, based on <attendance basis>, cross-checked
  against <sources>.
```

---

## Checklist before publishing

- [ ] Read/listened to the full recording or notes; marked the formal adjournment
- [ ] Cross-checked names, figures, and claims against the official agenda/packet
- [ ] Every sentence sorted into: confirmed fact / attributed statement / Jerry's opinion /
      needs verification
- [ ] `status` reflects the exact procedural stage — not rounded up
- [ ] Primary-source links sit next to the claims they support, not just dumped at the end
- [ ] Rechecked the draft against `docs/GUARDRAILS.md`
- [ ] New meeting → new entry; if this updates an earlier entry's status instead, add a dated
      note to *that* entry and cross-link rather than overwriting its original record
- [ ] Ran the site build before calling it done
