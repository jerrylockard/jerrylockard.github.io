# Command cheat sheet

Actual runnable commands for this repo. For explanation/context, see `AGENTS.md`
(root); for facts, `FACTS.md`; for content rules, `GUARDRAILS.md`. This file is
commands only — if you're adding something here that isn't a command someone can copy
and run, it probably belongs in one of those instead.

## Setup

```bash
pnpm install                # install dependencies
```

## Develop

```bash
pnpm dev                    # Astro dev server → http://localhost:4321
astro dev --background      # same, but backgrounded
astro dev stop               # stop the backgrounded dev server
astro dev status             # is it running?
astro dev logs               # tail its log
```

## Build

```bash
pnpm build                  # production build → dist/
pnpm preview                 # preview the production build locally
astro check                  # type-check the site without a full build
```

## Deploy (Firebase Hosting)

Automatic on push to `main` via `.github/workflows/firebase-hosting-merge.yml`
(deploys with the `FIREBASE_TOKEN` secret, not a service-account key — see
`docs/CHANGELOG.md`'s 2026-09-05 entry for why). To deploy manually instead:

```bash
pnpm build
npx firebase-tools@latest deploy --only hosting --project jerrylockard-website
```

`firebase-tools` isn't installed globally on this host — `npx firebase-tools@latest`
resolves it from cache without needing a global install or sudo.

```bash
npx firebase-tools@latest login                       # first-time auth (opens a browser)
npx firebase-tools@latest login --no-localhost        # headless variant — for SSH sessions
npx firebase-tools@latest projects:list                # confirm project access
npx firebase-tools@latest deploy --only hosting --project jerrylockard-website --json # machine-readable output
```

Project is `jerrylockard-website`, on the Firebase Spark (free) plan — classic Hosting,
not App Hosting (App Hosting forces a paid Blaze plan; this site is a static build and
doesn't need it). This project lives under the `lockard.me` Google Workspace account,
which enforces `iam.disableServiceAccountKeyCreation` — no service-account JSON key
can be minted for it, which is why CI uses `FIREBASE_TOKEN` instead.

## GitHub Actions (CI deploy)

```bash
gh run list --workflow=firebase-hosting-merge.yml --limit 5   # recent runs
gh run watch <run-id> --exit-status                            # watch one live
gh run view <run-id> --log                                      # full log of a run
gh secret list                                                   # confirm FIREBASE_TOKEN is set
```

## Git

```bash
git status --short
git add <files>              # stage specific files, not -A/.
git commit -m "..."          # see AGENTS.md for the required commit signature
git push origin main
```

Rules (full detail in `AGENTS.md`): stay on `main`, no feature branches, new commits
only (never `--amend`/`--force`/`reset --hard`), every push needs Jerry's explicit OK.

## DNS (IONOS)

`docs/dns/jerrylockard.me.zone` is the reference copy of the records — manage them
directly in the IONOS control panel, not via an import tool (that was a
Cloudflare-specific feature, and DNS moved off Cloudflare to IONOS 2026-08-30; see
`docs/FACTS.md`).

```bash
dig +short A jerrylockard.me           # what the apex currently resolves to
dig +short TXT jerrylockard.me         # verification records (Firebase's hosting-site=...)
curl -sI https://jerrylockard.me       # confirm HTTPS/headers on the live site
```

If Firebase's custom-domain setup ever asks for different records than what's in the
zone file, the Firebase console wins — update the zone file to match, not the reverse.

## Firebase CLI housekeeping

```bash
firebase --version
firebase use                          # show/set the active project for this directory
firebase hosting:sites:list           # list Hosting sites on this project
```
