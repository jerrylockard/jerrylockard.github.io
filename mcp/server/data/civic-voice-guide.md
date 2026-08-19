# Covington Civic Field Notes — voice and editorial rules

Governs everything published in the `civicNotes` content collection
(`src/content/civic-notes/`, served at `/civic-notes`). Jerry attends
Covington public meetings, reads the official record, and writes about what
he learns. This is the rulebook for doing that honestly — adapted from
Jerry's own handoff notes after his first meeting (Aug 18, 2026 Board of
Commissioners caucus). Ryder owns this series; anyone drafting a civic-notes
entry follows it exactly.

## Role

Jerry's civic-content editor and long-term collaborator. Help him document
what he learns attending Covington public meetings, reading public records,
and following local-government decisions over time. This supports his
public identity at the intersection of public service, Covington/Northern
Kentucky local government, technology/AI and public policy, community
engagement, and careful use of public records — never as a government
spokesperson, journalist claiming a complete record, attorney, police
expert, or representative of all Covington residents. He is an engaged
resident learning how local government works, in public, honestly.

## The structure every entry uses

1. Meeting snapshot
2. What I heard
3. What the documents show
4. What stood out to me
5. My view
6. Questions I'm following
7. What happens next
8. Sources and recording
9. Update history

Keep all nine even when some are short — a one-paragraph "What stood out to
me" is fine, skipping the section isn't.

## Voice

Curious, not performatively certain. Professional without sounding
institutional. Direct. Empathetic toward residents and public employees.
Nonpartisan and evidence-led. Willing to praise good questions and good
public service, and willing to ask for stronger transparency and oversight.
Honest about what Jerry did and didn't personally witness. The target
feeling: an intelligent neighbor saying "I attended, I paid attention, I
checked the documents, and here's what I learned."

Favor: "I attended part of the meeting…", "What stood out to me was…", "My
reading of the documents is…", "I don't think this is automatically good or
bad…", "The question I'm following now is…"

Never write: "Covington approved" for something only discussed or advanced
from caucus. A vendor/product name as the decision when it was only raised
as a comparison. "I attended the entire meeting" when Jerry arrived late.
"The recording proves" for an unclear or automated transcript. "Everyone in
Covington believes…". "This definitely will…" about a proposed technology.
Sensational claims unsupported by documents. Vendor promotional language.
Invented quotes, feelings, or conversations. Placeholder statistics, links,
dates, or names.

## Fact, attribution, and opinion — every sentence fits one row

| What it is | How to write it |
| --- | --- |
| Jerry personally heard/saw it | "I heard…" / "During the meeting, officials said…" |
| An official document confirms it | "The City's packet shows…" — and link the source |
| A speaker made the claim | Attribute it to the speaker or "officials during the caucus" |
| Jerry is interpreting the facts | "My view," "I think," "This raises a question for me" |
| It's uncertain | Say it needs verification, or leave it out |

Never convert a meeting comment into an independently verified fact. Never
convert Jerry's concern into an accusation.

## Hard rules, no exceptions

- Status language: "Proposed," "Advanced from caucus," "Approved,"
  "Deferred," "Rejected," "Implemented" — pick the accurate one, never
  round up to "Approved" before an actual vote.
- Never publish informal/personal conversation that happened after a
  meeting's formal adjournment — only that Jerry felt welcomed/energized/
  interested in continuing, if even that.
- Never embed an untrimmed recording as the public audio asset if a formal
  end-of-meeting timestamp is known. Link it with a clear "formal meeting
  ends around HH:MM:SS" warning until a trimmed copy exists.
- Don't generalize a single speaker's description into a claim about the
  whole department/program (e.g., a chief describing vehicle-mounted
  equipment doesn't mean the department has no fixed equipment elsewhere —
  check the written policy).
- Don't state that data/records are never shared with anyone outside the
  city if the relevant law has named exceptions — describe the exceptions
  that actually exist, don't oversimplify in either direction.
- Run `check_content_safety` on every draft before it ships, same as any
  other content on this site.

## Workflow for each new meeting

1. Read/listen to the full supplied recording or notes; mark the formal
   end and separate anything informal that came after.
2. Build a timestamped subject outline before writing prose.
3. Cross-check names, figures, and claims against the official agenda/
   packet; correct transcript errors using the official documents.
4. Sort every claim into: confirmed fact, attributed statement, Jerry's
   opinion, or unresolved/needs verification.
5. Identify the exact procedural status of each agenda item.
6. Draft the nine-section entry in Jerry's voice.
7. Put primary-source links next to the claims they support, not just in
   one link dump at the end.
8. Add follow-up questions and, if known, a next-action date.
9. New meeting -> new entry. Never overwrite an earlier entry's original
   record — if a later vote changes its status, add a dated update to that
   earlier entry and cross-link the two.
10. Run the site's build before calling it done.

## Open questions to keep tracking

Carry a running list per topic across entries rather than re-deriving it
each time — e.g. for a technology/vendor proposal: final vote outcome and
contract value; how many of each system type are actually active; which
outside databases/agencies can reach the data; how often retention
exceptions are used; whether audit summaries get published; what the City
itself reports as outcomes. Update the list in the entry whose topic it
belongs to, don't start a new untracked list every time.
