# jerrylockard.me

Jerry Lockard's personal site — civic-first, built for real job-seeking in
Covington, Kentucky city/public-sector work via the Mayor's Academy. Community,
government, and public service lead; the technical work stays in the background.

Live at [jerrylockard.me](https://jerrylockard.me). Read **`AGENTS.md`** first
for the full picture (also symlinked as `CLAUDE.md`, imported by `GEMINI.md`) — this
file is just the quick-start.

## Project structure

```text
/
├── public/                # static assets — favicon, portrait photo, resume
├── src/
│   ├── pages/              # routes: index, /writing, /writing/[slug],
│   │                       #         /civic-notes, /civic-notes/[slug],
│   │                       #         /academy-notes, /academy-notes/[slug]
│   ├── components/         # nav, hero, catenary, work, about, platform,
│   │                       # writing, civic-note-card, academy-note-card, footer
│   ├── content/             # writing, civic-notes, academy-notes markdown collections
│   └── layouts/             # layout.astro
├── docs/                   # facts, content guardrails, command cheatsheet, research material,
│   │                       # mockup.html (design comp), dns/ (zone reference)
├── scripts/                # automation (nightly-digest.mjs)
├── firebase.json / .firebaserc   # Firebase Hosting config
└── package.json
```

Astro looks for `.astro` files in `src/pages/` and exposes each as a route based on
its file name (or folder, for dynamic `[slug]` routes).

## Commands

All commands run from the repo root:

| Command | Action |
| :--- | :--- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Astro dev server at `localhost:4321` |
| `pnpm build` | Production build to `./dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm astro ...` | Run Astro CLI commands (`astro add`, `astro check`, etc.) |

See **`docs/CHEATSHEET.md`** for the full runnable-command reference (build, deploy,
git, DNS) and **`docs/FACTS.md`** for settled facts (domain, GitHub handle, contact
email).

## Deploy

Automatic — no manual deploy step. A push to `main` builds and deploys to **Firebase
Hosting** (project `jerrylockard-site`) via `.github/workflows/firebase-hosting-merge.yml`,
live at `jerrylockard.me` (custom domain configured in the Firebase console). Moved off
Vercel 2026-08-29, off GitHub Pages 2026-08-23.

## Docs and content guardrails

`docs/` holds settled facts (`FACTS.md`), content rules for anything published about
Jerry (`GUARDRAILS.md`), the command cheatsheet (`CHEATSHEET.md`), and reference
material used when drafting posts (`research/` — Mayor's Academy session notes,
civic-notes research; see `docs/research/README.md`).

## Learn more

Full Astro documentation: https://docs.astro.build
