#!/usr/bin/env node
/**
 * Nightly email update, ~6:30pm ET daily (see the cron entry that runs this).
 * Reads the last 24h of git activity, has Claude draft a short update in the
 * docs/CHARACTER.json persona's voice, and emails it. No dashboard, no task
 * board, no always-on server — just a script a cron job runs once a day.
 *
 * Never reads raw .env content itself for logging/display — process.loadEnvFile
 * hands values straight to process.env, and only pass/fail ever gets printed.
 */
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLAUDE_BIN = "/home/jerry/.local/bin/claude";

try {
  process.loadEnvFile(join(repoRoot, ".env"));
} catch {
  // No .env — the missing-vars check below reports this clearly.
}

const REQUIRED_ENV = ["SMTP_CLAUDE_EMAIL", "SMTP_CLAUDE_PASSWORD", "SMTP_HOST", "SMTP_PORT", "DIGEST_TO"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars, not sending: ${missing.join(", ")}`);
  process.exit(1);
}

const character = JSON.parse(readFileSync(join(repoRoot, "docs", "CHARACTER.json"), "utf-8"));

function execFilePromise(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function recentActivity() {
  try {
    const stdout = await execFilePromise(
      "git",
      ["log", "--since=24 hours ago", "--pretty=format:%ad %s", "--date=short"],
      { cwd: repoRoot },
    );
    return stdout.trim() || "No commits in the last 24 hours.";
  } catch (err) {
    return `Could not read git log: ${err.message}`;
  }
}

async function draftUpdate(activity) {
  const traits = Object.values(character.persona.blendedFrom).join(" ");
  const systemPrompt = `You are ${character.persona.workingName}, working with Jerry on jerrylockard.github.io. ${traits} Voice: ${character.persona.voice}`;
  const prompt = [
    "Write Jerry a short nightly email update (4-8 sentences, plain text, no markdown headers).",
    "Here's what happened in the repo in the last 24 hours (may say nothing happened):",
    "",
    activity,
    "",
    "Cover: what got done (if anything, be specific — no vague summaries), what we're",
    "working toward next, and end with genuine, specific encouragement — not generic",
    "cheerleading. If nothing happened today, say so honestly and still be encouraging",
    "about tomorrow. Never invent progress that isn't in the activity above.",
  ].join("\n");

  const stdout = await execFilePromise(
    CLAUDE_BIN,
    [
      "--print",
      prompt,
      "--output-format",
      "json",
      "--system-prompt",
      systemPrompt,
      "--strict-mcp-config",
      "--setting-sources",
      "project",
      "--permission-mode",
      "bypassPermissions",
      "--no-session-persistence",
    ],
    { cwd: repoRoot, maxBuffer: 1024 * 1024 },
  );
  return JSON.parse(stdout).result;
}

async function sendMail(body) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_CLAUDE_EMAIL, pass: process.env.SMTP_CLAUDE_PASSWORD },
  });
  const dateLabel = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" });
  await transporter.sendMail({
    from: `"${character.persona.workingName}" <${process.env.SMTP_CLAUDE_EMAIL}>`,
    to: process.env.DIGEST_TO,
    subject: `jerrylockard.github.io — ${dateLabel}`,
    text: body,
  });
}

const activity = await recentActivity();
const body = await draftUpdate(activity);
await sendMail(body);
console.log("Digest sent.");
