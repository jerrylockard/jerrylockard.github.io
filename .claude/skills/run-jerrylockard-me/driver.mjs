#!/usr/bin/env node
// Drives the Astro dev server with headless Chromium: navigate, screenshot, report console errors.
// Usage: node driver.mjs [path] [screenshot-out]
//   path           default "/"
//   screenshot-out default /tmp/jerrylockard-me-screenshot.png
//
// Assumes the dev server is already running (see SKILL.md "Run (agent path)").
// Self-heals the missing-shared-library problem (libnspr4/libnss3/libasound2)
// that blocks Playwright's bundled Chromium on this host, since apt-get can't
// install system-wide here without an interactive sudo password (see SKILL.md
// Gotchas). Downloads + extracts the needed .deb files into /tmp/pw-libs on
// first run; reuses them on later runs.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const LIB_DIR = '/tmp/pw-libs';
const LIB_PATH = `${LIB_DIR}/usr/lib/x86_64-linux-gnu`;
const DEB_PKGS = ['libnspr4', 'libnss3', 'libasound2t64', 'libasound2-data'];

function ensureLibs() {
	if (existsSync(`${LIB_PATH}/libnspr4.so`)) return;
	console.error('[driver] missing-lib workaround: downloading + extracting', DEB_PKGS.join(', '));
	const debDir = '/tmp/pw-deps';
	mkdirSync(debDir, { recursive: true });
	mkdirSync(LIB_DIR, { recursive: true });
	execSync(`apt-get download ${DEB_PKGS.join(' ')}`, { cwd: debDir, stdio: 'inherit' });
	execSync(`for f in *.deb; do dpkg-deb -x "$f" ${LIB_DIR}; done`, { cwd: debDir, shell: '/bin/bash', stdio: 'inherit' });
}

ensureLibs();
process.env.LD_LIBRARY_PATH = `${LIB_PATH}:${process.env.LD_LIBRARY_PATH ?? ''}`;

const path = process.argv[2] ?? '/';
const outPath = process.argv[3] ?? '/tmp/jerrylockard-me-screenshot.png';
const base = process.env.DEV_SERVER_URL ?? 'http://localhost:4321';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
// The site reveals below-the-fold sections via IntersectionObserver (opacity:0
// until scrolled into view) — a full-page screenshot has no real scrolling to
// trigger that, so content below the first viewport would be caught
// mid-transition. The site's own CSS already has a prefers-reduced-motion
// branch that shows everything immediately; emulate that instead of trying to
// out-wait/out-scroll the animation.
const page = await browser.newPage({ reducedMotion: 'reduce' });
const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(String(err)));

await page.goto(base + path, { waitUntil: 'networkidle' });
await page.screenshot({ path: outPath, fullPage: true });

console.log('TITLE:', await page.title());
console.log('SCREENSHOT:', outPath);
console.log('CONSOLE_ERRORS:', consoleErrors.length ? consoleErrors.join(' | ') : 'none');

await browser.close();
process.exit(consoleErrors.length ? 1 : 0);
