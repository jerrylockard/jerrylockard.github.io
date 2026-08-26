import type { TaskPriority, TaskStatus } from "../../server/src/tasks.js";
import type { WorkLogKind } from "../../server/src/worklog.js";

// Local-development content only: one-click task starters, plus a couple of weeks of plausible
// sample work so every Dashboard page has something to render. Nothing here is published to the
// public site, and nothing here asserts a biographical fact about Jerry — the tasks and log
// entries describe work on the site, not claims about him.

export interface TaskTemplate {
  /** Short button label. */
  label: string;
  title: string;
  detail: string;
  category: string;
  assignee: string;
  priority: TaskPriority;
}

export interface SampleTask {
  title: string;
  detail: string;
  category: string;
  /** Persona id, or "" to leave unassigned. */
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  note?: string;
}

export interface SampleWorkLogEntry {
  by: string;
  kind: WorkLogKind;
  summary: string;
  rationale: string;
  tag: string;
  /** Matched against SAMPLE_TASKS[].title at seed time to cross-link the entry to its task. */
  taskTitle?: string;
  signedOffBy?: string;
}

export interface SampleTeamUpdate {
  /** Persona display name, matching postTeamUpdate's existing convention. */
  agent: string;
  message: string;
  affects?: string[];
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    label: "Draft first Writing post",
    title: "Draft the first post for src/content/writing/",
    detail: "The writing pipeline is built but the collection is empty, so /writing renders \"Nothing published yet\" and the homepage teaser never appears. Pitch two or three angles from the journal and recent team updates, then draft one post against the collection schema (title, date, tag, description, draft) and run check_content_safety before proposing it.",
    category: "content",
    assignee: "ryder",
    priority: "high",
  },
  {
    label: "Update a civic note",
    title: "Close out the August 18 caucus note",
    detail: "src/content/civic-notes/2026-08-18-board-of-commissioners-caucus.md is still status advanced-from-caucus with nextActionDate 2026-08-25, and recordingCoverage says the official video hasn't been published yet. Check get_civic_voice_guide first, then update status, updatedDate, and the recording section from what actually happened — never round \"advanced from caucus\" up to \"approved.\"",
    category: "press",
    assignee: "ryder",
    priority: "high",
  },
  {
    label: "Check this week's agenda",
    title: "Pull the next Board of Commissioners agenda",
    detail: "The Board meets Tuesdays at 6:00 PM at City Hall, alternating caucus and legislative. Pull the published agenda and say plainly whether the August 18 items (the Axon package, the vehicle purchases) are on it, then post_team_update so Ryder and Shepard see it without asking. A quiet week is fine to report as quiet.",
    category: "press",
    assignee: "scout",
    priority: "high",
  },
  {
    label: "QA the Notes hub",
    title: "Run a QA and accessibility pass on /notes and /academy-notes",
    detail: "The Notes hub, the academy-notes index, and the academy-notes slug page shipped in the most recent commit and haven't been through a pass yet. Check heading order, keyboard focus on the section links, contrast on .eyebrow and .empty-note, the image/caption/alt pairing, and the 620/860/900px breakpoints against get_design_tokens. Bring the fix with the finding.",
    category: "qa",
    assignee: "casey",
    priority: "high",
  },
  {
    label: "Sweep the open TODOs",
    title: "Reconcile list_todos against the task board",
    detail: "todos.json still lists the empty writing collection and the CDN fonts as open while the shared board has nothing on it, so none of the real open work is actually tracked anywhere. Walk the list, create tasks for what's still live, and close out anything marked open that has already shipped.",
    category: "general",
    assignee: "shepard",
    priority: "high",
  },
  {
    label: "Self-host the fonts",
    title: "Self-host Newsreader, Public Sans, and IBM Plex Mono",
    detail: "layout.astro still pulls all three families from the Google Fonts CDN behind two preconnects and a render-blocking stylesheet. Vendor the WOFF2 files into public/fonts, confirm astro build passes and nothing shifts on first paint, and hand the @font-face swap in global.css to Desiree.",
    category: "infra",
    assignee: "devon",
    priority: "normal",
  },
  {
    label: "Add social preview tags",
    title: "Add canonical, Open Graph, and Twitter tags to layout.astro",
    detail: "The head has a title, a description, and favicons and nothing else, so a link to the site shared on LinkedIn or pasted to a hiring manager renders bare. Drive the tags off the existing Layout props, add a canonical URL from the configured site, and get the shared description string and the image choice from Paige rather than writing copy yourself.",
    category: "design",
    assignee: "desiree",
    priority: "normal",
  },
  {
    label: "Add a 404 page",
    title: "Add a site 404 page",
    detail: "src/pages has no 404.astro, so a mistyped URL or an old slug lands on the host's default page with no nav, no footer, and no way back into the site. Build one on Layout with Nav and Footer and routes back to the homepage and /notes, and flag the body line for Paige instead of writing it.",
    category: "design",
    assignee: "desiree",
    priority: "normal",
  },
  {
    label: "Confirm Academy session 2",
    title: "Confirm logistics for Mayor's Academy session 2",
    detail: "Session 2 is September 14 at 6:00 PM with Commissioner Timothy Downing and Neighborhood Services Director Brandon Holmes, and the paperwork lists two locations — Sparkhaus at 727 Madison Ave. and Pleasant Street Development. Confirm where it starts and whether it moves, check it against Jerry's calendar, and flag anything uncertain as uncertain rather than guessing.",
    category: "general",
    assignee: "scout",
    priority: "normal",
  },
  {
    label: "Refresh the README map",
    title: "Bring README's project structure back to current",
    detail: "The tree in README.md lists only the /writing and /civic-notes routes and the writing + civic-notes collections. It's missing the /notes hub, /academy-notes, the academyNotes collection, and the academy-note-card and journal-entry-card components. Update it so a cold read matches the repo.",
    category: "docs",
    assignee: "archie",
    priority: "normal",
  },
  {
    label: "Fix the roster drift",
    title: "Reconcile CHEATSHEET.md against personas.ts",
    detail: "CHEATSHEET calls Ryder's department \"Public Narrative & Civic Media\" while personas.ts and mcp/AGENTS.md both say \"Press & Public Narrative\" — one fact, two values. Its Dashboard section list also omits Schedules and the work log. Fix it to one source of truth and note where that source is.",
    category: "docs",
    assignee: "archie",
    priority: "normal",
  },
  {
    label: "Sharpen search copy",
    title: "Write the homepage and shared social description",
    detail: "The homepage falls back to layout.astro's default title and description, and /writing's meta description repeats its on-page lede word for word. Write distinct strings for both, plus the one shared description the social tags will use, then hand them to Desiree to wire in.",
    category: "content",
    assignee: "paige",
    priority: "normal",
  },
  {
    label: "Propose a sitemap",
    title: "Propose sitemap and robots.txt coverage",
    detail: "astro.config.mjs sets site to https://jerrylockard.me, but nothing emits a sitemap and public/ has no robots.txt — which matters for a site meant to be found. @astrojs/sitemap needs Jerry's approval before install, so bring the recommendation and the hand-rolled alternative instead of adding the dependency first.",
    category: "infra",
    assignee: "devon",
    priority: "low",
  },
  {
    label: "Clear Pages leftovers",
    title: "Retire the leftover GitHub Pages CNAME",
    detail: "Deploys moved to Vercel on 2026-08-23 and the workflow is already retired, but the root CNAME file still carries jerrylockard.me — inert for Vercel and a second place the domain is written down. Confirm the domain in the Vercel project's settings, then flag the deletion for Jerry's review instead of removing it quietly.",
    category: "infra",
    assignee: "devon",
    priority: "low",
  },
];

export const SAMPLE_TASKS: SampleTask[] = [
  {
    title: "Update the August 18 civic note after the Board acts",
    detail: "The Aug 18 caucus entry is published at status \"advanced from caucus\" with nextActionDate 2026-08-25. Once the legislative meeting produces a recorded action, update the status field, clear or move nextActionDate, and add a dated line to the Update history section. Blocked until the Board actually votes — no pre-writing the outcome.",
    category: "press",
    assignee: "ryder",
    priority: "high",
    status: "backlog",
    dueDate: "2026-08-27",
    note: "Waiting on the meeting. Scout has the date confirmed; I'm not drafting the update ahead of the vote.",
  },
  {
    title: "Front-matter and tag conventions for Writing entries",
    detail: "The writing collection schema takes `tag` as a free string. Before there is more than one post, settle a short closed list of tags and a house pattern for `description` (one sentence, scannable, no repeat of the title). Write it down where a drafter will actually see it.",
    category: "content",
    assignee: "paige",
    priority: "normal",
    status: "backlog",
    dueDate: "2026-08-31",
    note: "Proposing five tags. Need to know what the launch post uses so the list is built around it, not retrofitted.",
  },
  {
    title: "Packet tables need a real mobile treatment",
    detail: "The Aug 18 civic note carries three data tables straight out of the City's packet (vehicle purchases, recording timestamps, payment schedule). They overflow the measure at the 620px breakpoint. Needs a scroll container or a stacked treatment that keeps the numbers intact — the figures are the point of the entry.",
    category: "design",
    assignee: "desiree",
    priority: "normal",
    status: "backlog",
    dueDate: "2026-09-02",
  },
  {
    title: "Confirm the remaining Mayor's Academy session dates",
    detail: "Session 1 was 2026-08-10 and the program runs eight sessions. Get the published dates for sessions 2 through 8 from the City rather than inferring a cadence, and put the confirmed ones on the board so the write-up slots exist before each session, not after.",
    category: "general",
    assignee: "scout",
    priority: "normal",
    status: "backlog",
    dueDate: "2026-08-29",
    note: "Session 2 date is not published anywhere I can verify yet. Reporting that as unknown rather than guessing a monthly cadence.",
  },
  {
    title: "Rollback note for the font swap",
    detail: "Write the revert down before the font change ships: which commit restores the Google Fonts link, what a good render looks like after the revert, and how to tell the difference between a font failure and a cache. Work stays on main with no PR gate, so a bad font commit is live on the next deploy.",
    category: "infra",
    assignee: "devon",
    priority: "normal",
    status: "backlog",
    dueDate: "2026-09-03",
  },
  {
    title: "Decide whether /writing collapses into /notes",
    detail: "There are now three collection indexes (/writing, /academy-notes, /civic-notes) plus the /notes hub that lists all three. That may be one navigation layer more than a small site needs — or the separate indexes may be exactly right once each has real volume. Genuinely undecided; nobody owns it yet and it should not be settled by whoever touches the nav next.",
    category: "general",
    assignee: "",
    priority: "low",
    status: "backlog",
  },
  {
    title: "First Writing post",
    detail: "The writing pipeline has been finished for a while — collection, /writing index, /writing/[slug], homepage teaser and nav link all wired to appear once a post exists. Nothing renders because there is no post. This closes the content gap, not a code gap. Drafted in Jerry's voice from a check-in, and it does not enter the repo until he has read it line by line.",
    category: "press",
    assignee: "ryder",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-08-28",
    note: "Draft is with Jerry as a file, not a commit. Nothing personal in it ships without his explicit yes.",
  },
  {
    title: "Contrast and focus-visible fixes from Casey's audit",
    detail: "Two findings from the Notes hub pass: the card metadata line (--ink-faint on --limestone) measures just under 4.5:1 in dark mode at its actual size, and the section links on /notes take focus without showing a ring. Fixing the dark-mode token rather than the type size, so the correction lands everywhere the token is used.",
    category: "design",
    assignee: "desiree",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-08-27",
    note: "Token change first, then re-check every surface that uses --ink-faint — entry rows and work item meta both do.",
  },
  {
    title: "Self-host the three webfonts",
    detail: "Public Sans, Newsreader and IBM Plex Mono currently load from the Google Fonts CDN. Subset and self-host the WOFF2 files, declare @font-face in global.css, and drop the CDN link — removes a third-party dependency and a render-blocking request. Adds files to public/ and edits global.css, so it stops for Jerry's confirmation before it goes out.",
    category: "infra",
    assignee: "devon",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-09-02",
    note: "Subsets built and rendering correctly in local preview. Holding the swap until the rollback note exists and Jerry confirms the deploy.",
  },
  {
    title: "Keyboard and screen-reader pass on the Notes hub",
    detail: "Walk /notes and both detail templates (civic-notes/[slug], academy-notes/[slug]) by keyboard only and with a screen reader: heading order, skip link, focus visibility, whether the three section headings actually announce as sections, and whether the status label on a civic card reads as anything meaningful out of context.",
    category: "qa",
    assignee: "casey",
    priority: "normal",
    status: "in-progress",
    dueDate: "2026-08-29",
    note: "Hub itself is close. Detail templates are where the heading order goes sideways — the tables interrupt it.",
  },
  {
    title: "One deploy target, written down once",
    detail: "README.md, CHEATSHEET.md, AGENTS.md and astro.config.mjs all say the site deploys via Vercel to jerrylockard.me. todos.json justifies self-hosting the fonts with \"for the Pi deploy.\" Same fact, two values, and both are being read as current. Confirm which is real, correct the wrong one, and note where the answer lives so it does not drift again.",
    category: "docs",
    assignee: "archie",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-08-27",
    note: "Flagged to Devon and Jerry. I am not picking a winner — I record the answer, I do not invent it.",
  },
  {
    title: "Notes hub at /notes",
    detail: "One page collecting the three threads — Mayor's Academy sessions, Covington Civic Field Notes, and personal writing — each as its own section with its own card treatment and a link to the full index. Includes an honest empty state for each section and for the page as a whole.",
    category: "design",
    assignee: "desiree",
    priority: "high",
    status: "done",
    dueDate: "2026-08-22",
    note: "Shipped. Three sections, not one merged feed — the collections are structured differently on purpose.",
  },
  {
    title: "August 18 caucus Civic Field Note",
    detail: "Full entry on the Aug 18 Board of Commissioners caucus: vehicle purchases, the Southbank Partners contribution, the proposed 10-year Axon package, and storm response. Cross-checked against the City's official agenda, the AIRs and backup packet, and the Police Department's written ALPR policy, with meeting statements attributed as statements rather than restated as fact.",
    category: "press",
    assignee: "ryder",
    priority: "high",
    status: "done",
    dueDate: "2026-08-18",
    note: "Partial attendance disclosed in the entry. Official video still not posted, so the Sources section says so plainly instead of linking a placeholder.",
  },
  {
    title: "August 25 legislative meeting flagged onto the board",
    detail: "The Aug 18 packet points the Axon item to a legislative meeting on 2026-08-25. Confirmed the date against the City's event listing and put it in front of Ryder and Shepard with enough lead time to plan attendance, rather than the day of.",
    category: "general",
    assignee: "scout",
    priority: "high",
    status: "done",
    dueDate: "2026-08-19",
    note: "Date confirmed from the City calendar, not inferred from the packet alone.",
  },
  {
    title: "Reduced-motion audit",
    detail: "Checked every animated surface against the motion rules in the design spec: the catenary divider draw, the .observe scroll reveals, nav transitions, and the theme toggle. All of them honor prefers-reduced-motion, and nothing depends on motion to convey state.",
    category: "qa",
    assignee: "casey",
    priority: "normal",
    status: "done",
    dueDate: "2026-08-21",
    note: "Clean. Contrast and focus visibility are a separate finding — those did not pass, and I raised them on their own.",
  },
  {
    title: "Résumé content-safety round",
    detail: "Two passes over the résumé before it went live at public/resume.pdf and into the footer. GPA, individual course grades, and the legal middle name in the header all had to come out. check_content_safety came back clean on the final version.",
    category: "content",
    assignee: "paige",
    priority: "high",
    status: "done",
    dueDate: "2026-08-15",
    note: "The header line was the easy miss — worth checking document metadata too, not just visible text.",
  },
  {
    title: "Shared board and work log stood up",
    detail: "The board and work log are now the shared source of project state, file-backed so a session started in the dashboard and one started from the CLI see the same thing. Reconciled todos.json against it: the two genuinely open items (first Writing post, self-hosted fonts) are real tasks with owners now, and the rest were already done.",
    category: "general",
    assignee: "shepard",
    priority: "normal",
    status: "done",
    dueDate: "2026-08-14",
    note: "Stop deriving \"what's left\" from the todo file — it lags the board by days.",
  },
];

export const SAMPLE_WORKLOG: SampleWorkLogEntry[] = [
  {
    by: "desiree",
    kind: "decision",
    summary: "The Notes hub lists three threads as three sections instead of merging them into one date-sorted feed.",
    rationale: "The collections are structured differently on purpose — civic notes track a decision status, academy notes track session N of 8, writing is free-form. One merged feed would flatten exactly the distinction a reader needs to know what they are looking at.",
    tag: "notes-hub",
    taskTitle: "Notes hub at /notes",
    signedOffBy: "shepard",
  },
  {
    by: "shepard",
    kind: "brainstorm",
    summary: "Kicked around whether /writing, /academy-notes and /civic-notes should redirect into /notes now that the hub exists.",
    rationale: "Three indexes plus a hub is arguably one navigation layer too many for a site this size, but published entries already link to the individual indexes and breaking those to tidy the nav costs more than it saves. Leaving it open until the first Writing post shows how people actually arrive.",
    tag: "notes-hub",
    taskTitle: "Decide whether /writing collapses into /notes",
  },
  {
    by: "ryder",
    kind: "plan",
    summary: "First Writing post is drafted and goes to Jerry as a file, not a commit.",
    rationale: "A personal post is his voice and his name. The guardrails say anything about his personal life gets confirmed with him directly first, and an empty /writing page is not a reason to loosen that.",
    tag: "writing-launch",
    taskTitle: "First Writing post",
    signedOffBy: "jerry",
  },
  {
    by: "paige",
    kind: "decision",
    summary: "Writing tags become a closed list of five rather than free text.",
    rationale: "The schema accepts any string for `tag`, so without a convention we end up with \"Covington\", \"covington\" and \"city government\" all meaning the same thing by the fourth post — and tag pages that split an already-small archive.",
    tag: "writing-launch",
    taskTitle: "Front-matter and tag conventions for Writing entries",
    signedOffBy: "shepard",
  },
  {
    by: "jerry",
    kind: "decision",
    summary: "I read the first Writing post line by line before it goes anywhere near the repo.",
    rationale: "It is my voice on a site people are going to read as me. I would rather be slow on the first one than correct a personal post in public.",
    tag: "writing-launch",
    taskTitle: "First Writing post",
  },
  {
    by: "scout",
    kind: "update",
    summary: "Confirmed the Axon item moves to a legislative meeting on August 25; the official caucus video still has not posted.",
    rationale: "The published entry carries nextActionDate 2026-08-25, so the moment the Board acts the live status goes stale. Ryder needs the lead time, and the \"video not yet published\" line in the Sources section is still accurate as of this morning.",
    tag: "civic-notes",
    taskTitle: "August 25 legislative meeting flagged onto the board",
    signedOffBy: "shepard",
  },
  {
    by: "ryder",
    kind: "decision",
    summary: "Status stays \"advanced from caucus\" until there is a recorded action, even though the item is widely expected to pass.",
    rationale: "The voice guide's hard line is never rounding \"advanced from caucus\" up to \"approved.\" An expectation is not a vote, and the series is about a real government body making real decisions.",
    tag: "civic-notes",
    taskTitle: "August 18 caucus Civic Field Note",
    signedOffBy: "jerry",
  },
  {
    by: "ryder",
    kind: "plan",
    summary: "The post-vote correction lands in the entry's Update history section with its own date, not as a silent edit.",
    rationale: "Correcting in the open is the credibility model for the whole series. An entry that shows its own corrections is worth more than one that was quietly rewritten to look right.",
    tag: "civic-notes",
    taskTitle: "Update the August 18 civic note after the Board acts",
  },
  {
    by: "devon",
    kind: "decision",
    summary: "Self-host subset WOFF2 for all three faces rather than keeping the Google Fonts CDN link.",
    rationale: "It takes a third-party request off the critical render path and a third party out of the privacy story of a site aimed at city-government readers. Subsetting keeps the added weight smaller than the request it replaces.",
    tag: "self-host-fonts",
    taskTitle: "Self-host the three webfonts",
    signedOffBy: "jerry",
  },
  {
    by: "devon",
    kind: "plan",
    summary: "Rollback is a one-line revert to the CDN link, tested before the swap ships.",
    rationale: "Work stays on main with no PR gate, so a bad font commit is live on the very next deploy. The rollback has to exist and be verified before the change does, not after something looks wrong in production.",
    tag: "self-host-fonts",
    taskTitle: "Rollback note for the font swap",
  },
  {
    by: "casey",
    kind: "update",
    summary: "Reduced-motion audit came back clean; contrast and focus visibility did not.",
    rationale: "The catenary reveal and the scroll reveals already honor prefers-reduced-motion. But --ink-faint on --limestone in dark mode measures just under 4.5:1 at the size the card metadata actually renders, and the section links on /notes take focus without showing it. Raising those separately so they do not get folded into a \"mostly fine\" summary.",
    tag: "a11y-pass",
    taskTitle: "Reduced-motion audit",
    signedOffBy: "shepard",
  },
  {
    by: "desiree",
    kind: "decision",
    summary: "Fixing the contrast finding at the token level in dark mode rather than enlarging the metadata type.",
    rationale: "The metadata line is mono at small size by design; growing it to pass contrast would break the type hierarchy the entry rows and work items both depend on. Darkening one token fixes it everywhere the token is used, which is more places than Casey tested.",
    tag: "a11y-pass",
    taskTitle: "Contrast and focus-visible fixes from Casey's audit",
    signedOffBy: "casey",
  },
  {
    by: "archie",
    kind: "update",
    summary: "Flagged one fact carrying two values: README, CHEATSHEET, AGENTS.md and astro.config.mjs say Vercel; todos.json says \"for the Pi deploy.\"",
    rationale: "This is the exact failure mode we keep hitting — the same fact defined in more than one place with different values, and both being read as current. I am not picking the winner, because I record what the team settles rather than deciding it. But one of them is wrong and somebody is going to act on it.",
    tag: "docs-truth",
    taskTitle: "One deploy target, written down once",
  },
  {
    by: "archie",
    kind: "add-on",
    summary: "Once the deploy target is settled, CHEATSHEET.md gets the same pass — it predates the Notes hub, the work log and schedules.",
    rationale: "A doc that is wrong is worse than no doc, because people act on it. A cheat sheet missing half the commands is a smaller problem than one listing commands that no longer do what it says.",
    tag: "docs-truth",
    taskTitle: "One deploy target, written down once",
    signedOffBy: "shepard",
  },
];

export const SAMPLE_TEAM_UPDATES: SampleTeamUpdate[] = [
  {
    agent: "Scout",
    message: "The Axon item from the Aug 18 caucus goes to a legislative meeting today, August 25, in Commission Chambers — confirmed against the City's event listing, not just the packet. The official caucus video still has not posted to TBNK or the City's YouTube channel, so the \"not yet published\" line in the entry's Sources section is still accurate.",
    affects: ["Ryder", "Shepard"],
  },
  {
    agent: "Ryder",
    message: "The Aug 18 entry stays at \"advanced from caucus\" until there is a recorded vote, and when the update lands it goes into the Update history section with its own date rather than as a silent edit. Separately, the first Writing post is drafted and sitting with Jerry — /writing stays empty until he clears it.",
    affects: ["Scout", "Paige", "Shepard"],
  },
  {
    agent: "Casey",
    message: "Two findings from the Notes hub pass, both in Desiree's lane so I wrote them up instead of touching the components: --ink-faint on --limestone measures just under 4.5:1 in dark mode at the size the card metadata actually renders, and the section links on /notes take focus without showing a ring. Reduced motion came back clean.",
    affects: ["Desiree", "Shepard"],
  },
  {
    agent: "Desiree",
    message: "Taking the contrast fix at the token level in dark mode rather than resizing the metadata, so it lands everywhere --ink-faint is used and not just on the cards Casey tested. Also flagging that the packet tables in the Aug 18 civic note overflow at 620px — that is a layout fix, so nobody needs to shorten column headers or trim the figures.",
    affects: ["Casey", "Paige", "Ryder"],
  },
  {
    agent: "Devon",
    message: "Font self-hosting is ready to test: subset WOFF2 for Public Sans, Newsreader and IBM Plex Mono, @font-face in global.css, CDN link removed. It adds files to public/ and edits global.css, so it waits for Jerry's confirmation — and I want the CDN revert written down and tested before the swap goes out, not after something renders wrong in production.",
    affects: ["Shepard", "Desiree", "Archie"],
  },
  {
    agent: "Archie",
    message: "We have one fact with two values: README, CHEATSHEET, AGENTS.md and astro.config.mjs all say the site deploys via Vercel to jerrylockard.me, while todos.json justifies self-hosting the fonts with \"the Pi deploy.\" Devon, which one is current? I will write down whichever answer is real and delete the other — I am not picking it myself.",
    affects: ["Devon", "Shepard"],
  },
  {
    agent: "Paige",
    message: "Writing front matter takes a free-text `tag`, so I am proposing a closed list of five before there is more than one post to reconcile. Ryder — send me the tag the launch post uses and I will build the list around it rather than renaming your post later.",
    affects: ["Ryder", "Archie", "Shepard"],
  },
  {
    agent: "Shepard",
    message: "The board and work log are the shared source of project state now, and todos.json has been reconciled against them. The two genuinely open items — the first Writing post and the self-hosted fonts — are real tasks with owners; everything else in that file was already done. Stop deriving \"what's left\" from the todo file, it lags by days.",
    affects: ["Devon", "Ryder", "Casey", "Archie"],
  },
];
