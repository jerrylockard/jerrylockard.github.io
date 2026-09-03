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

Automatic on push to `main` via `.github/workflows/firebase-hosting-merge.yml`. To
deploy manually instead:

```bash
pnpm build
firebase deploy --only hosting
```

```bash
firebase login                       # first-time auth (opens a browser)
firebase login --no-localhost        # headless variant — for SSH sessions
firebase projects:list                # confirm project access
firebase deploy --only hosting --json # deploy with machine-readable output
```

Project is `jerrylockard-website`, on the Firebase Spark (free) plan — classic Hosting,
not App Hosting (App Hosting forces a paid Blaze plan; this site is a static build and
doesn't need it).

## GitHub Actions (CI deploy)

```bash
gh run list --workflow=firebase-hosting-merge.yml --limit 5   # recent runs
gh run watch <run-id> --exit-status                            # watch one live
gh run view <run-id> --log                                      # full log of a run
gh secret list                                                   # confirm FIREBASE_SERVICE_ACCOUNT_* is set
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

## DNS (Cloudflare)

`docs/dns/jerrylockard.me.zone` is the importable reference copy of the zone — Cloudflare
dashboard → jerrylockard.me → DNS → Records → Import and Export → Import.

```bash
dig +short A jerrylockard.me           # what the apex currently resolves to
dig +short TXT jerrylockard.me         # verification records (Firebase's hosting-site=...)
curl -sI https://jerrylockard.me       # confirm HTTPS/headers on the live site
```

If Firebase's custom-domain setup ever asks for different records than what's in the
zone file, the Firebase console wins — update the zone file to match, not the reverse.
Keep the apex **DNS only (grey cloud)** in Cloudflare, not proxied — Firebase issues and
validates its own certificate, and Cloudflare's proxy breaks that.

## Firebase CLI housekeeping

```bash
firebase --version
firebase use                          # show/set the active project for this directory
firebase hosting:sites:list           # list Hosting sites on this project
```
