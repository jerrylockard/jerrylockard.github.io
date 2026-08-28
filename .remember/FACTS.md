# Settled Facts — Never Re-Ask These

These are confirmed, locked-in facts. Do not ask Jerry to confirm them again.

---

## Domain & Deployment

| Fact | Value | Confirmed |
|------|-------|-----------|
| **Live site domain** | `jerrylockard.me` | 2026-08-21 |
| **Previous domain** | `jerry.lockard.me` (2026-08-20 → 2026-08-21) | Historical |
| **Original domain** | `jerry.lockard.tech` (2026-08-16 → 2026-08-20) | Historical |
| **Repository** | `jerrylockard/jerrylockard.github.io` | 2026-08-17 |
| **Deploy trigger** | Push to `main` → **Vercel** (connected to the GitHub repo, framework auto-detected as Astro) → `jerrylockard.me` | Automatic |
| **Custom domain HTTPS** | Managed by Vercel via the project's Domains settings, not GitHub | Current |
| **Moved off GitHub Pages** | 2026-08-23 — `.github/workflows/deploy.yml` and `public/CNAME` both removed | Historical |

---

## Identity Handles (Unified 2026-08-21)

| Platform | Handle | URL |
|----------|--------|-----|
| **GitHub** | `jerrylockard` (no hyphen) | `https://github.com/jerrylockard` |
| **LinkedIn** | `jerrylockard` (matches GitHub exactly) | `https://www.linkedin.com/in/jerrylockard/` |
| **Email (published)** | `jerry@lockard.me` | Confirmed 2026-08-28 — IONOS webmail, separate domain from `jerrylockard.me` |
| **Old email (do not publish)** | `jerrylockard91@gmail.com` | Superseded |

> **Note:** `lockard.tech` apex domain belongs to the separate `lockard-tech` GitHub org — unrelated to this site, then and now.

> **Old hyphenated form:** if `jerry-lockard.github.io` (with a hyphen) turns up anywhere — an
> old doc, a stale link, a search result — it predates the 2026-08-21 GitHub username change to
> `jerrylockard` (no hyphen). Not a typo, just an older identity; don't "fix" a file by
> reintroducing it, and don't publish it anywhere going forward.

---

## Provenance — How This Kit Came to Exist

Local directory history, so nobody re-derives or misremembers it later:

1. Before it was ever `jerry-lockard.github.io` or `jerrylockard.github.io`, the local folder
   was named plain `personal-site` (`/c/personal-site` — visible as stray tool-permission entries
   from that era). Renamed at some point to match the GitHub repo name of the time.
2. The `jerrylockard.github.io` repo (by then already through at least one repo-name rename of
   its own — see the hyphenated-form note above) lived on Windows at `C:\jerrylockard.github.io`
   (`/mnt/c/jerrylockard.github.io` from WSL2's side).
3. Moved onto the native WSL2 filesystem for performance, via:
   ```bash
   rsync -a --info=progress2 \
     /mnt/c/jerrylockard.github.io/ \
     /home/jerry/jerrylockard.github.io/
   ```
4. From there, OpenCode was used to go through that repo's `.remember/` directory and pull the
   important, correct information about Jerry into a new sibling directory —
   `jerrylockard-github-io-rebuild` — so the project could be rebuilt from scratch instead of
   patched further. This kit is that directory. Everything in it since has been refined
   iteratively (naming, consolidation, content) rather than done once and left alone.
5. **Done as of 2026-08-23:** the *original* repo at `/home/jerry/jerrylockard.github.io` was
   renamed to `/home/jerry/jerrylockard`, freeing the `jerrylockard.github.io` name, and
   `jerrylockard-github-io-rebuild` was renamed into it — this directory *is* that renamed
   rebuild kit, and it's the live, canonical repo now. Both halves of the pending rename are
   complete; there's no separate "original" repo anymore to check against.

---

## Current Scope (Corrected — This Is a Live, Working Repo)

An earlier version of this section described this directory as a not-yet-built planning kit
("no agents, no MCP server, no site code") — that was accurate for a while, but is stale now and
was corrected during the 2026-08-23 content-accuracy pass (see `CHANGELOG.md`). The rebuild
finished and this kit *is* the real, live `jerrylockard.github.io`:

- **The site is built and live**, deployed via Vercel to `jerrylockard.me` — see the Domain &
  Deployment table above. There is no `public/CNAME` anymore (removed 2026-08-23 along with the
  GitHub Pages workflow); the custom domain is configured in Vercel's project settings instead.
- **The MCP server, agents, and site code are all real, running code** — `mcp/server/src/index.ts`,
  `mcp/agents/src/personas.ts` (8 personas: Shepard, Desiree, Devon, Paige, Casey, Archie, Ryder,
  Scout), and the actual Astro site under `src/`. `AGENTS.md`/`PERSONAS.md`/`TOOLS.md` in this
  directory are meant to track that real implementation, not describe a future build — if either
  ever drifts from what `mcp/agents/src/personas.ts` or `mcp/server/src/index.ts` actually
  contains, the code wins and these docs need fixing, same source-of-truth rule as everywhere
  else in this kit.
- **What this kit still adds beyond the code:** the planning/reference layer — facts about Jerry,
  the Mayor's Academy material, rules, guardrails, and the design for a memory system meant to
  keep growing as agents interact with each other and with Jerry to add work, create tasks, and
  track calendar events, continuously learning his habits and schedule rather than working from
  a fixed snapshot.

## Personal / Biographical (Published on Site)

| Fact | Value |
|------|-------|
| **Full name** | Jerry Lockard |
| **Location** | Covington, Kentucky |
| **Coordinates** | 39.0837° N, 84.5086° W |
| **Education** | B.A. Political Science, Eastern Kentucky University, 2025 (Dean's List, Spring 2025) |
| **Current civic role** | Covington Mayor's Academy (current cohort) |
| **Work history** | Substitute teacher (Fayette County Schools, KY certified); Volunteer, Hope Center (Lexington, KY — meals & resident support); Self-hosted infrastructure (sole operator, Linux/networking/databases/runbooks) |
| **Ambition (LIVE on site)** | U.S. House of Representatives, working toward Speaker — confirmed by Jerry 2026-08-18 as the actual point of the site |
| **lockard-tech** | Jerry's own tech company, founded after his May 2025 EKU graduation. This is the same `lockard-tech` named in `RULES.md`'s scope boundary (in-scope, his own — not "unrelated," that note is specifically about the GitHub *org*/`lockard.tech` apex domain being organizationally separate from the `jerrylockard.github.io`/`jerrylockard.me` site repo, not about who owns it) |
| **Site's 3 stated purposes (confirmed 2026-08-23)** | (1) networking / introducing himself, (2) announcing his run for public office, (3) building/representing lockard-tech |

> **Known drift (old repo):** the MCP server's `work.json` has the Hope Center item above, but
> the old site's `src/data/site.ts` never actually rendered it — and conversely `site.ts` has a
> third "Study" work group (the B.A. Political Science entry) that isn't in `work.json`'s work
> groups at all (education lives separately in `get_education` there). If the rebuild keeps a
> similar MCP-mirrors-into-site-data pattern, make sure whatever generates the public page reads
> from the MCP data directly, or has a check that catches this kind of silent drift — it went
> unnoticed in the old repo.

---

## Project Purpose

- **Primary:** Real job-seeking in city/public-sector work via Covington Mayor's Academy
- **Secondary:** Demonstrate technical credibility (self-hosted infrastructure) — real but background
- **NOT:** A developer portfolio — community, government, public service lead

---

## Tech Stack (Locked In)

Full detail (package.json contents, env vars, dev environments) lives in `CONFIG.md` — not
duplicated here. The short version: pnpm workspace (4 packages), Astro 7.x + TypeScript for the
site, `mcp/server`/`mcp/agents`/`mcp/gui` for the agent system, `.remember/` for session memory.

---

## Commands

Full command reference lives in `CONFIG.md` — not duplicated here. The two you'll
actually run first: `pnpm install` then `pnpm mcp:doctor`.

---

## File Locations (Where Things Live)

| Thing | Path |
|-------|------|
| Original design comp | `mockup.html` (historical — already built out) |
| Actual site pages | `src/pages/*.astro` |
| Site components | `src/components/*.astro` (Nav, Hero, Catenary, Work, About, Platform, Writing, Footer, CivicNoteCard) |
| Global layout | `src/layouts/layout.astro` |
| Styles | `src/styles/global.css` |
| Identity/Work/Education data | `src/data/site.ts` (mirrors MCP) |
| Writing content | `src/content/writing/` (zero posts — pipeline ready) |
| Civic Notes content | `src/content/civic-notes/` (one post published) |
| Academy Notes content | `src/content/academy-notes/` (Session 1 published) |
| Content config | `src/content.config.ts` |
| CI/CD | None — Vercel builds directly from the GitHub repo, no `.github/workflows/` |
| Custom domain | Configured in Vercel project Domains settings, not a `CNAME` file. A root `CNAME` file (not `public/CNAME`) still exists — GitHub Pages leftover, harmless but inert |
| Cross-tool hub (read first) | `AGENTS.md` (root) — symlinked as `CLAUDE.md`, imported by `GEMINI.md` |
| Agent rules | `mcp/AGENTS.md` |
| Agent personas | `mcp/agents/src/personas.ts` |
| MCP server tools | `mcp/server/src/index.ts` |
| Dashboard | `mcp/gui/` |
| Session memory (runtime state) | `.remember/` — gitignored, except the hand-authored planning docs (`RULES.md`, `GUARDRAILS.md`, `FACTS.md`, etc.), which are tracked in git and public |
| Portrait photo | `public/PORTRAIT.jpg` |
| Resume | `public/resume.pdf` (self-hosted, safety-checked) |

---

## What's LIVE vs. OPEN

### ✅ Shipped & Live
- Design system & all components built
- Portrait photo deployed
- Resume deployed (self-hosted, passed content-safety)
- Social links & contact email wired in footer
- Theme toggle with localStorage persistence
- All responsive breakpoints working
- Semantic HTML + keyboard navigation

### 🟡 Not Live Yet (Pipeline Ready)
- **Writing posts** — zero articles in `src/content/writing/`; `/writing` index and homepage teaser don't render until real post exists
- **Self-hosted fonts** — still loading from Google Fonts CDN (blocking on Pi deployment)
- **OG/canonical meta tags** — missing from `layout.astro` `<head>`

---

## Open Items Carried From the Old Repo

1. ~~Verify "Board of Commissioners" terminology~~ — **Fixed 2026-08-23**, before the final rename:
   `about.astro`'s caption changed from "city council" to "Board of Commissioners," verified
   against civic-notes. Same day Jerry emailed Mayor Washington (see `JOURNAL.md`) — worth
   carrying the correct terminology into the rebuild from the start rather than re-introducing
   the old wrong term.
2. **Add OG/canonical meta tags** — never added in the old repo; still worth doing
3. **Self-host fonts** — was still loading from Google Fonts CDN; low priority
4. **Dashboard UX redundancy** — noted 2026-08-23 (nav + cards duplication in the Command Center
   redesign), analysis done, refactor not started
5. **`dashboard.jerrylockard.me`** — planned subdomain for the agent dashboard once hosting is
   decided (see `CONFIG.md`'s Hosting section)