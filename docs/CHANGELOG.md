# Project changelog

Real history, dated, newest first. Not derived from `git log` — a curated record of
decisions and why, for context git commit messages don't carry. Check this for project
history instead of re-asking Jerry to re-explain something already settled here.

## 2026-08-31 — Firebase project switched jerrylockard-site → jerrylockard-website

Hosting project switched from `jerrylockard-site` to `jerrylockard-website` at Jerry's
request, adding Firebase Analytics to the client SDK config (`src/lib/firebase-app.ts`)
at the same time. Updated: `.firebaserc`, `firebase.json` (`hosting.site`), both
`.github/workflows/firebase-hosting-*.yml` (`projectId` and the service-account secret
name, now `FIREBASE_SERVICE_ACCOUNT_JERRYLOCKARD_WEBSITE`), and prose references in
`README.md`, `AGENTS.md`, `docs/CHEATSHEET.md`, `docs/FACTS.md`, and
`docs/dns/jerrylockard.me.zone`.

**Not done as part of this change, and required before the next merge deploys
cleanly:** the custom domain (`jerrylockard.me` + `www`) needs to be re-added under
`jerrylockard-website` in the Firebase console, the DNS TXT verification value
confirmed against whatever that console issues (the zone file's value is carried over
from the old project and unverified), and a new
`FIREBASE_SERVICE_ACCOUNT_JERRYLOCKARD_WEBSITE` secret added in the GitHub repo
settings — the old service-account secret has no access to the new project.

## 2026-08-31 — GitHub repo renamed jerrylockard.github.io → jerrylockard.me

The GitHub repo itself (not just the site domain) was renamed from
`jerrylockard/jerrylockard.github.io` to `jerrylockard/jerrylockard.me`, matching the
live domain. GitHub redirects the old name automatically, but `origin`'s remote URL,
`package.json`'s `name`, and prose references across `README.md`, `AGENTS.md`,
`docs/FACTS.md`, the `run-jerrylockard-github-io` skill (renamed
`run-jerrylockard-me`), and `scripts/nightly-digest.mjs` were updated to match.
Entries below predating this keep the old name — that's what was true then.

## 2026-08-29 — mcp/\* agent-dashboard system retired; hosting migrated to Firebase

The custom multi-agent dashboard system (`mcp/server`, `mcp/agents`, `mcp/gui` — eight
named personas, a chat UI, JWT login tokens, a Claude Code CLI backend migration off an
earlier Vercel AI Gateway setup) was retired — it was consuming time out of proportion
to what it delivered. The site itself (`src/`) was never dependent on it and is
unaffected. Durable facts/guardrails/workflow notes were preserved to `docs/FACTS.md`,
`docs/GUARDRAILS.md`, and `docs/research/` before deletion.

Site hosting moved from Vercel to Firebase Hosting (project `jerrylockard-site`, Spark
free plan) the same day, with `.github/workflows/firebase-hosting-merge.yml` deploying
on push to `main`. The DNS cutover to Firebase's custom-domain records was not
completed as part of this — `jerrylockard.me` was still on Cloudflare's proxied A
record as of this writing.

Project reference docs (facts, guardrails, command cheatsheet, research material)
reorganized into `docs/`, out of the repo root.

## 2026-08-23 — Content-accuracy pass; GitHub Pages → Vercel

Corrected several docs that had drifted from what was actually built (7→8 agents,
persona roster changes that had shipped but weren't reflected in docs). Site moved off
GitHub Pages to Vercel the same day — a root `CNAME` file and a GitHub Pages workflow
were retired from that move (the `CNAME` file itself lingered, inert, until the
2026-08-29 entry above).

## 2026-08-17 through 2026-08-21 — Repo history and identity consolidation

- Before this repo existed under its current name, the local working directory went
  through several names/locations: a plain `personal-site` folder, then matching
  whatever the GitHub repo was called at the time, living on Windows
  (`C:\jerrylockard.github.io`), then moved to native WSL2 (`/home/jerry/...`) for
  build performance.
- An AI coding session (OpenCode) went through the then-current repo's memory
  directory and extracted the durable, correct information about Jerry into a fresh
  sibling directory, to rebuild cleanly rather than keep patching the old one. That
  rebuild directory was later renamed into place as the canonical
  `jerrylockard.github.io` (2026-08-23) — there's no separate "original" repo to check
  against anymore.
- Domain moved `jerry.lockard.tech` → `jerry.lockard.me` (2026-08-20) → apex
  `jerrylockard.me` (2026-08-21), the same day the GitHub handle changed from
  `jerry-lockard` to `jerrylockard` and LinkedIn was updated to match exactly.

### Known drift, old repo (historical, worth knowing the shape of)

The old repo's data layer had a real MCP-server-mirrors-into-site-data pattern, and it
silently drifted at least once: a work-history item existed in the MCP server's data
but was never actually rendered by the site's own copy of that data, and conversely the
site's copy had an education entry the MCP data didn't carry at all — each side was
missing something the other had, undetected until specifically audited. That whole
pattern (a second copy of data that can silently diverge from the source) no longer
exists in this repo as of the 2026-08-29 retirement above, but the failure mode is worth
remembering if a similar "mirror the data in two places" pattern ever gets proposed
again: it needs an explicit check, not just hoping both copies stay in sync.
