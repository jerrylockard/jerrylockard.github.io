# Schedule — Structure for Event & Calendar Tracking

No MCP server exists yet to actually track dates programmatically, and the Mayor's Academy
material (`academy-material/`) hasn't been processed yet as of this writing — but as of
2026-08-23, this is no longer an empty scaffold. **Scout** (`AGENTS.md`) now runs a real, live
weekly check against Covington's actual civic sources and populates the standing facts below.

---

## Standing recurring civic events (confirmed 2026-08-23, via Scout's first run)

| Event | Cadence | Time | Location | Notes |
|---|---|---|---|---|
| **Board of Commissioners** | Weekly, Tuesdays | 6:00 PM ET / 5:00 PM CT | City Hall, 20 W. Pike St, Covington, KY 41011 | Alternates caucus and legislative meetings. Routine — Scout only flags a specific week if the agenda has a notable public-input item (rezoning, budget, hearing) or a cancellation/change. |
| **Kenton County Planning Commission** | Monthly, first Thursday | 6:15 PM ET / 5:15 PM CT | Kenton County Government Center, 1840 Simon Kenton Way, Kenton Chambers (2nd Floor) | Found via Scout's first run — wasn't previously captured anywhere in this kit. |
| **Covington Farmers Market** | Weekly, Saturdays | 9:00 AM – 1:00 PM | Washington St, between W. 6th St & W. Pike St | **Seasonal: May 2 – Oct 31 only.** In season as of this writing. |

## Board & commission vacancies (snapshot, 2026-08-23 — see `AGENTS.md`/Scout for how this stays current)

Covington had 11 boards with open seats as of Scout's first run. Full source:
[onboard.covingtonky.gov](https://onboard.covingtonky.gov). The ones best matching Jerry's
civic-participation interest (poli-sci background, civil liberties coursework — see `JOURNAL.md`):

| Board | Seats open | Meets |
|---|---|---|
| Human Rights Commission | 1 | 5:30 PM, first Thursday monthly |
| Neighborhood Investment Partners | 2 | City Hall, Duveneck Conference Room |
| Board of Architectural Review and Development (B.O.A.R.D.) | 1 (opening soon) | Applications due 30 days before the associated meeting |

Full list also included: Audit Committee, Board of Examiners for Police and Firefighters, City
Employees Retirement Fund, Devou Park Advisory Committee, Occupational License Board of Appeals,
Police and Fire Pension Board, Rental License Appeals Board, The Fund for Covington Inc., Urban
Forestry Board, Code Enforcement Hearing Board.

## Event categories

| Category | Examples | Source of truth |
|---|---|---|
| **Civic — recurring public meetings** | Board of Commissioners, Kenton County Planning Commission, Farmers Market | Scout's weekly run — see standing table above |
| **Mayor's Academy** | Cohort sessions, assignments, site visits | `academy-material/ACADEMY_SCHEDULE.md` — all 8 dates, from Jerry's own paperwork (not the PDF) |
| **Personal — recurring** | Anything on a fixed cadence in Jerry's own life | Not yet captured |
| **Personal — one-off / follow-ups** | E.g. the Mayor Washington shadow-day ask (`JOURNAL.md`) | Tracked as a task (`TOOLS.md`'s shared board) until it has an actual date, then promoted here |
| **Content deadlines** | A civic-notes entry due after a meeting, before the next one | Derived from the civic meeting calendar, not independent |

## Why this belongs here and not just in the task board

The shared task board (`TOOLS.md`) is good for discrete work items with a status
(backlog/in-progress/on-hold/done). A recurring civic meeting isn't "done" after one occurrence —
it's a standing commitment that generates new tasks each cycle (attend, write up, follow up on
open questions). This file is meant to hold the *pattern*; the task board holds the *instances*
it generates. The MCP server exists now, so this is `get_upcoming_work`'s calendar-adjacent
sibling, not a replacement for it.

## Open questions — updated 2026-08-23

- ~~What's the actual Board of Commissioners meeting cadence?~~ **Resolved** — see the standing
  table above.
- ~~Does the Mayor's Academy have a fixed session calendar, or is it more ad hoc?~~ **Resolved,
  2026-08-23** — yes, fixed: 8 sessions, Aug 2026-Apr 2027, monthly-ish, all 6pm. Not in the PDF
  (that turned out to be briefing material, not a syllabus) — Jerry supplied it directly from his
  own program paperwork. Full table: `academy-material/ACADEMY_SCHEDULE.md`.
- Any recurring deadlines (assignments, check-ins) the Academy itself imposes beyond attending each
  session. Still open — nothing on this in the schedule paperwork or Session 1.
- Scout's Aug 25 Board of Commissioners check couldn't confirm whether that specific agenda has a
  notable public-input item (rezoning/budget/hearing) — the news post didn't expose line items to
  a fetch. Worth checking manually if a future run hits the same wall repeatedly; may need a
  different source (the actual agenda PDF link, not just the news listing).

## Convention once this starts filling in

- One entry per recurring pattern, not per occurrence — "Board of Commissioners meets every
  [cadence]" as one row, not a growing list of individual meeting dates.
- One-off dated commitments (like the Mayor shadow-day ask) stay on the task board until they
  have a confirmed date, then move here.
- Cross-link to `JOURNAL.md`/`ROLES.md` where a scheduled thing ties back to an open idea or
  relationship thread, rather than duplicating context.
