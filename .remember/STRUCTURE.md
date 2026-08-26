# Site Structure — Content Model Only

**Trimmed 2026-08-23; premise corrected 2026-08-23 content-accuracy pass.** This doc originally
dropped the component map/file tree/design-system notes because "Jerry hasn't decided the new
visual direction yet" — that's no longer true. The visual direction was decided and the real site
is built and live: `src/pages/index.astro` composes Nav, Hero, Catenary, Strands, Work, About,
Platform, Writing, and Footer components (see `src/components/`) inside `src/layouts/layout.astro`,
matching the palette/type system/catenary-divider motif from `mockup.html`. Documenting that
component map/file tree in this kit is a real follow-up task, just not done in this pass (a
content-accuracy fix, not a full rewrite). What's below — the content-collection shape — was
already accurate independent of the visual design and still is. The pnpm workspace/package layout
lives in `CONFIG.md` (not repeated here); the MCP data shape lives in `TOOLS.md`.

---

## Content Collections

The old site had two Astro content collections. Worth carrying the *shape and behavior*
forward even if the pages that render them look completely different:

### Writing (`src/content/writing/`)
- Schema: `title`, `date`, `description?`, `draft?`
- **Behavior rule, not just schema:** zero posts = the section doesn't render at all, anywhere
  (index page, homepage teaser, nav link) — not a "coming soon" placeholder. This was a
  deliberate Jerry call, matching the broader "real data over placeholders" pattern in
  `PROFILE.md`. Carry the rule forward, not just the field list.

### Civic Notes (`src/content/civic-notes/`)
- Schema: `title`, `date`, `meeting`, `description?`, `draft?`
- Editorial rules are owned by Ryder and live in the `get_civic_voice_guide` MCP tool — full
  content of that guide (9-section structure, fact/attribution/opinion table, hard rules like
  never rounding "advanced from caucus" up to "approved") should be ported into
  `mcp/server/data/civic-voice-guide.md` verbatim when the server is rebuilt; it's editorial
  policy, not implementation, so it doesn't depend on the new design either.
- One real post exists in the old repo as a working example:
  `2026-08-18-board-of-commissioners-caucus.md` — worth reading before writing the new voice
  guide's example section, if one gets added.

---

## The Mayor's Academy / Civic Notes pipeline (raw notes → memory → eventual post)

Jerry's pattern, confirmed 2026-08-23: after each Mayor's Academy session and each Board of
Commissioners meeting, he wants a blog/journal post — what happened, what he learned, what stuck
with him. He gives the raw material (notes, sometimes dictated/imperfectly spelled); he does not
want to draft the post himself (see `PROFILE.md`). The pipeline:

1. **Raw capture** — Jerry's notes go into a memory file as-is-organized
   (`.remember/academy-material/ACADEMY_SESSION_<N>_NOTES.md` for the Academy; the existing Civic
   Notes pattern — see the real example below — for commissioners meetings). This is reference
   material, not the post.
2. **Drafting** — a later step turns the raw notes into an actual post in Jerry's
   voice/perspective. Not done automatically as part of capture; a deliberate step once there's
   enough material and a place to publish it.
3. **Publish** — lands in whichever content collection applies. Board of Commissioners meetings
   have a settled home already (`Civic Notes`, below). **Open question, not yet decided:** does a
   Mayor's Academy post belong in `Writing`, get its own new collection, or fold into `Civic
   Notes`? Don't invent a collection to answer this — flag it for Jerry when publishing is
   actually about to happen.

## What's not documented in this file (real, but lives elsewhere now)

Component inventory, the homepage composition order, the design-token palette/type/spacing
system, the layout's theme-toggle/nav-spy implementation details, and the deploy pipeline are all
real and live now (see the corrected note at the top) — they're just not duplicated into this
file. `src/components/` and `src/layouts/layout.astro` are the actual source of truth for the
component map; `get_design_tokens` (MCP tool) is the source of truth for the design-token system.
Adding a proper written component-map doc here is a real follow-up, not done in this pass.
