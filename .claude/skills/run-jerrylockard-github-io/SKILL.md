---
name: run-jerrylockard-github-io
description: Build, run, and drive the jerrylockard.github.io Astro site — start the dev server, screenshot pages with headless Chromium, check console errors. Use when asked to run, start, build, or screenshot this site, or verify a change renders.
---

This is an Astro static site. "Running" it means starting the dev server, then
driving a headless Chromium against it via `.claude/skills/run-jerrylockard-github-io/driver.mjs`
(Playwright) — there's no `chromium-cli` on this host, so the driver is a small
custom script instead of the usual heredoc.

All paths below are relative to the repo root (`/home/jerry/jerrylockard.github.io/`).

**Current state (corrected 2026-08-24):** the note above describing this as an
empty placeholder repo was stale — this is the real, live `jerrylockard.github.io`,
with a fully built Astro site (`src/pages/index.astro` composes Nav, Hero,
Catenary, Work, About, Platform, a recent-writing teaser, and Footer from
`src/components/`, plus a `/notes` hub with dedicated `/academy-notes`,
`/civic-notes`, and `/writing` sections) deployed via Vercel to `jerrylockard.me`. Expect real, populated screenshots,
not a blank page — if one comes back blank-ish, that's a real bug to
investigate, not the expected state.

## Prerequisites

`pnpm` is this project's declared package manager but isn't preinstalled here,
and plain `npm install` **crashes** on this repo's existing pnpm-managed
`node_modules` (arborist chokes on pnpm's `.pnpm` symlink layout). Get `pnpm`
via npm first, then use it for everything:

```bash
npm install -g pnpm
pnpm install
```

Playwright (added as a devDependency solely for this driver — Jerry approved
this explicitly, since the project's own rule is no new deps without asking)
needs its browser binary:

```bash
npx playwright install chromium
```

`--with-deps` (the normal way to also get Chromium's system libraries) **does
not work here** — it shells out to `sudo apt-get`, and `sudo` in this
environment always fails with "a terminal is required to authenticate," even
when a human runs it interactively via the `!` prefix. Skip `--with-deps`; see
Gotchas for the workaround. No manual step is actually required to *run* the
driver — `driver.mjs` performs the workaround itself on first use.

## Build

```bash
./node_modules/.bin/astro build   # → dist/. pnpm isn't on PATH — call the binary directly, or use pnpm once installed above.
```

## Run (agent path)

Start the dev server in the background, wait for it to actually serve, then
drive it:

```bash
(nohup ./node_modules/.bin/astro dev --port 4321 > /tmp/astro-dev.log 2>&1 &)
timeout 30 bash -c 'until curl -sf http://localhost:4321 >/dev/null; do sleep 1; done'

node .claude/skills/run-jerrylockard-github-io/driver.mjs / /tmp/screenshot.png
```

Stop the server by killing whatever's listening on the port (`astro dev`
doesn't respond cleanly to a plain SIGTERM on its wrapper):

```bash
lsof -ti:4321 -sTCP:LISTEN | xargs -r kill
```

`driver.mjs <path> <screenshot-out>` navigates to `http://localhost:4321<path>`,
waits for network-idle, screenshots (full page), and prints:

```
TITLE: <page title>
SCREENSHOT: <path written>
CONSOLE_ERRORS: none | <joined error messages>
```

Exit code is `1` if any console/page error fired — check it, not just the
screenshot. Both args are optional (`path` defaults to `/`, output defaults to
`/tmp/jerrylockard-github-io-screenshot.png`). Override the base URL with
`DEV_SERVER_URL` if you started the server on a different port.

## Run (human path)

```bash
./node_modules/.bin/astro dev   # → http://localhost:4321, foreground. Ctrl-C to stop.
```

Useless headless — this is for a human with an actual browser.

## Test

No test suite exists in this repo yet.

---

## Gotchas

- **`npm install` crashes with `Cannot read properties of null (reading 'matches')`.**
  This repo's `node_modules` was built by `pnpm` (content-addressed `.pnpm/`
  layout); npm's arborist can't reconcile it and throws. Don't use `npm
  install` here at all — `npm install -g pnpm` (global, doesn't touch this
  `node_modules`) then `pnpm install`/`pnpm add`.
- **`pnpm add <pkg>` fails with `ERR_PNPM_ADDING_TO_ROOT`.** This is a pnpm
  workspace (`pnpm-workspace.yaml`: `.` + `mcp/*`). Adding to the root package
  needs an explicit `-w`: `pnpm add -D <pkg> -w`.
- **Chromium fails to launch:
  `error while loading shared libraries: libnspr4.so: cannot open shared object file`.**
  Playwright's Chromium needs system libs (`libnspr4`, `libnss3`,
  `libasound2t64`, `libasound2-data`, plus X/font libs `install-deps` would
  normally pull in) that aren't on this host, and there's no way to `sudo
  apt-get install` them — `sudo` fails with "a terminal is required to
  authenticate" both from a background shell *and* from an interactive `!`
  command a human runs themselves. Workaround (no root needed):
  `apt-get download <pkg>` fetches a `.deb` as the current user;
  `dpkg-deb -x pkg.deb <dir>` extracts it without installing.
  `driver.mjs` does exactly this into `/tmp/pw-libs` and sets
  `LD_LIBRARY_PATH` before launching — automatic, no manual step. If you hit a
  *different* missing `.so` (from a fuller Chrome build, not
  chrome-headless-shell), extend `DEB_PKGS` in `driver.mjs` the same way.
- **`sudo` never works in this environment**, not even when a human types the
  command themselves via the `!` prefix — there's no TTY for password entry
  either way. Don't route around missing system packages by asking for sudo;
  use the `apt-get download` + `dpkg-deb -x` + `LD_LIBRARY_PATH` pattern
  instead, same as the Chromium libs above.
- **`pnpm`/`corepack` aren't preinstalled**, only `node`/`npm`/`npx`
  (`corepack: command not found`). `npm install -g pnpm` is the fix, not
  `corepack enable`.
