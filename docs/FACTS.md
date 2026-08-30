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

Three services only, confirmed 2026-08-30 — **no Cloudflare, no Vercel**:

| Service | What it does | What breaks if it stops |
| --- | --- | --- |
| **GitHub** | Stores the code. A push to `main` triggers the deploy. | Nothing live goes down — you just can't deploy. |
| **Firebase** | Hosts the built Astro site and serves `jerrylockard.me`. | `jerrylockard.me` goes down. |
| **IONOS** | Registrar and DNS for `jerrylockard.me` (moved off Cloudflare 2026-08-30, confirmed at the registry level via RDAP, not just a DNS lookup — those can lag hours on caching). Also mail: holds the `lockard.me` and `lockard.tech` mailboxes. | DNS/email stop. The already-built site keeps serving from Firebase until a change is needed. |

`docs/dns/jerrylockard.me.zone` is the reference copy of the records — manage them directly
in the IONOS control panel, not via an import tool (that was a Cloudflare-specific
feature). `jerrylockard.me` sends and receives no mail on purpose — see that file's
mail-block records (SPF/DKIM/DMARC all set to reject) and remove IONOS's own
auto-provisioned mail records, which do the opposite by default.

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

Repo/directory history (renames, moving off Windows/WSL2, the OpenCode rebuild, the
mcp/* retirement) lives in `docs/CHANGELOG.md`, not here — that's the right home for
narrative history. This file is current facts only.

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

Full command reference lives in `docs/CHEATSHEET.md` — not duplicated here. The short version:
pnpm, Astro 7.x + TypeScript for the site, Firebase Hosting for deployment.

---

## File Locations (Where Things Live)

| Thing | Path |
|-------|------|
| Original design comp | `docs/mockup.html` (historical — already built out) |
| Actual site pages | `src/pages/*.astro` |
| Site components | `src/components/*.astro` (Nav, Hero, Catenary, Work, About, Platform, Writing, Footer, CivicNoteCard) |
| Global layout | `src/layouts/layout.astro` |
| Styles | `src/styles/global.css` |
| Identity/Work/Education data | `src/data/site.ts` |
| Writing content | `src/content/writing/` (zero posts — pipeline ready) |
| Civic Notes content | `src/content/civic-notes/` (one post published) |
| Academy Notes content | `src/content/academy-notes/` (Session 1 published) |
| Content config | `src/content.config.ts` |
| CI/CD | `.github/workflows/firebase-hosting-merge.yml` — builds and deploys to Firebase Hosting on push to `main` |
| Custom domain | Configured in the Firebase console (Hosting → custom domains). GitHub Pages and its `CNAME` file were retired 2026-08-29 — see `docs/CHANGELOG.md` |
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
- **Self-hosted fonts** — still loading from Google Fonts CDN, not yet self-hosted
- **OG/canonical meta tags** — missing from `layout.astro` `<head>`

---

## Open Items Carried From the Old Repo

1. ~~Verify "Board of Commissioners" terminology~~ — **Fixed 2026-08-23**, before the final rename:
   `about.astro`'s caption changed from "city council" to "Board of Commissioners," verified
   against civic-notes. Same day Jerry emailed Mayor Washington — worth carrying the correct
   terminology forward rather than re-introducing the old wrong term.
2. **Add OG/canonical meta tags** — never added; still worth doing
3. **Self-host fonts** — still loading from Google Fonts CDN; low priority