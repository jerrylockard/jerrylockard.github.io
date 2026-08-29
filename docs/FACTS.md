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
| **Deploy trigger** | Push to `main` → GitHub Actions builds and deploys to **Firebase Hosting** (project `jerrylockard-site`) → `jerrylockard.me` | Automatic |
| **Custom domain HTTPS** | Managed by Firebase via Hosting → custom domains, not GitHub | Current |
| **Hosting history** | GitHub Pages until 2026-08-23, then Vercel, then Firebase Hosting as of 2026-08-29 | Historical |

---

## Who does what — no overlap

| Service | What it does | What breaks if it stops |
| --- | --- | --- |
| **GitHub** | Stores the code. A push to `main` triggers the deploy. | Nothing live goes down — you just can't deploy. |
| **Firebase** | Hosts the built Astro site and serves `jerrylockard.me`. | `jerrylockard.me` goes down. |
| **Cloudflare** | DNS for `jerrylockard.me`. | The site becomes unreachable. |
| **IONOS** | Mail. Holds the `lockard.me` and `lockard.tech` mailboxes, and DNS for those two zones. | Email stops. The site is unaffected. |

Cloudflare and Firebase are not competing — moving the nameservers to Cloudflare
changed who *answers* DNS questions, not who *hosts* the site. Cloudflare answers;
Firebase is the origin those answers point at (the apex A record in
`dns/jerrylockard.me.zone`). Keep the apex **DNS only (grey cloud)**, not proxied —
Firebase issues and validates its own certificate, and Cloudflare's proxy breaks that.

Cloudflare's remaining role here is DNS only as of 2026-08-29 — the Cloudflare Tunnel
it used to also provide (publishing the now-retired dashboard) is gone. Whether to move
DNS off Cloudflare entirely is an open, deliberate decision Jerry may still want to make
— not done as a side effect of anything above.

### Firebase plan: Spark (free) — and the App Hosting trap

Firebase has **two different hosting products**, and picking the wrong one is what
triggers the "upgrade the project's pricing plan" wall:

| Product | Plan needed | Use it for |
| --- | --- | --- |
| **Firebase Hosting** (classic, static files) | **Spark — free** | A static build. This is what this site needs. |
| **Firebase App Hosting** (newer, SSR frameworks) | **Blaze — paid**, card on file | Server-rendered apps only. |

This site builds to a static `dist/`, so classic Hosting on Spark covers it completely
— custom domain and automatic SSL included. **Do not enable App Hosting** unless the
site genuinely gains server-side rendering, and understand that doing so means
attaching billing to the project. Spark's limits are 10 GB stored and 360 MB/day
transfer — nowhere near what a personal site needs.

One caveat worth knowing before it matters: if this ever becomes a campaign site taking
donations, revisit the plan and the terms then — not before.

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

- **The site is built and live**, deployed via Firebase Hosting to `jerrylockard.me` — see the
  Domain & Deployment table above. There is no `public/CNAME` anymore (removed 2026-08-23 along
  with the GitHub Pages workflow); the custom domain is configured in the Firebase console
  instead.
- **On 2026-08-29, the custom `mcp/*` agent-dashboard system (MCP server, personas, dashboard)
  was retired** — Jerry decided it was consuming time out of proportion to what it delivered.
  This file, `docs/GUARDRAILS.md`, and the Mayor's Academy material under `docs/research/` are what
  survived that removal; everything else that used to be described here as "real, running
  agent-system code" no longer exists. The site itself (`src/`) was unaffected.

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
| **lockard-tech** | Jerry's own tech company, founded after his May 2025 EKU graduation. Not to be confused with the separate, unrelated `lockard-tech` GitHub org / `lockard.tech` apex domain — same name, different owner, organizationally unconnected to this site repo |
| **Site's stated purposes (updated 2026-08-29 — see Project Purpose below)** | Networking/introducing himself, Mayor's Academy and civic engagement, blogging/opinion pieces on meetings and Covington events, eventually announcing his run for public office, and genuinely highlighting the developer/builder side of him alongside all of that — not one thing wearing a civic disguise |

> **Known drift (old repo):** the MCP server's `work.json` has the Hope Center item above, but
> the old site's `src/data/site.ts` never actually rendered it — and conversely `site.ts` has a
> third "Study" work group (the B.A. Political Science entry) that isn't in `work.json`'s work
> groups at all (education lives separately in `get_education` there). If the rebuild keeps a
> similar MCP-mirrors-into-site-data pattern, make sure whatever generates the public page reads
> from the MCP data directly, or has a check that catches this kind of silent drift — it went
> unnoticed in the old repo.

---

## Project Purpose

This is deliberately a mix, not a single-purpose site (clarified by Jerry 2026-08-29 —
corrects the older "civic-first, technical work stays in the background" framing
elsewhere in this repo, which undersold this): networking and introducing himself to
people, the Mayor's Academy, blogging/opinion pieces on meetings and Covington events he
attends, and — eventually — announcing a run for public office. Technology and building
things (apps, websites, self-hosted infrastructure) isn't hidden background color here;
it's a real part of who he is, presented alongside the civic/political side rather than
subordinated to it. In his own words: he loves technology and coding, and he loves
politics — this site is where mixing the two together does some good.

Practical implication: don't treat a technical detail as something to minimize or cut for
being "too developer-portfolio." The line to hold is still real (see `docs/GUARDRAILS.md`
on career framing) — this isn't a swing back to a resume-site — but "civic-first" no
longer means "hide the builder." If this reads as in tension with wording elsewhere in
this repo (`AGENTS.md`, `docs/GUARDRAILS.md`), that's real drift from this update, not a
misread — flag it rather than picking one side to trust silently.

---

## Tech Stack (Locked In)

Full command reference lives in `CHEATSHEET.md` — not duplicated here. The short version:
pnpm, Astro 7.x + TypeScript for the site, Firebase Hosting for deployment.

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
| CI/CD | `.github/workflows/firebase-hosting-merge.yml` — builds and deploys to Firebase Hosting on push to `main` |
| Custom domain | Configured in the Firebase console (Hosting → custom domains), not a `CNAME` file. A root `CNAME` file (not `public/CNAME`) still exists — GitHub Pages leftover, harmless but inert |
| Cross-tool hub (read first) | `AGENTS.md` (root) — symlinked as `CLAUDE.md`, imported by `GEMINI.md` |
| Content-safety guardrails | `docs/GUARDRAILS.md` |
| Mayor's Academy / civic-notes research material | `docs/research/` |
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
   against civic-notes. Same day Jerry emailed Mayor Washington — worth carrying the correct
   terminology forward rather than re-introducing the old wrong term.
2. **Add OG/canonical meta tags** — never added; still worth doing
3. **Self-host fonts** — still loading from Google Fonts CDN; low priority