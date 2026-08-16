import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const guiDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(guiDir, ".data");
const pidFile = join(dataDir, "gui.pid");
const logFile = join(dataDir, "gui.log");

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid() {
  if (!existsSync(pidFile)) return null;
  const raw = readFileSync(pidFile, "utf-8").trim();
  const pid = Number(raw);
  return Number.isFinite(pid) ? pid : null;
}

function start() {
  mkdirSync(dataDir, { recursive: true });
  const existing = readPid();
  if (existing && isAlive(existing)) {
    console.log(`mcp-gui already running (pid ${existing}). See: pnpm status / pnpm logs`);
    return;
  }

  const out = openSync(logFile, "a");
  const err = openSync(logFile, "a");
  const child = spawn(process.execPath, ["--import", "tsx", join(guiDir, "server", "index.ts")], {
    cwd: guiDir,
    detached: true,
    stdio: ["ignore", out, err],
  });
  child.unref();
  writeFileSync(pidFile, String(child.pid), "utf-8");
  console.log(`mcp-gui started (pid ${child.pid}). Logs: mcp/gui/.data/gui.log`);
}

function stop() {
  const pid = readPid();
  if (!pid || !isAlive(pid)) {
    console.log("mcp-gui is not running.");
    if (existsSync(pidFile)) rmSync(pidFile);
    return;
  }
  process.kill(pid);
  rmSync(pidFile);
  console.log(`mcp-gui (pid ${pid}) stopped.`);
}

function status() {
  const pid = readPid();
  if (pid && isAlive(pid)) {
    console.log(`mcp-gui running (pid ${pid}).`);
  } else {
    console.log("mcp-gui is not running.");
  }
}

function logs() {
  if (!existsSync(logFile)) {
    console.log("No logs yet.");
    return;
  }
  const lines = readFileSync(logFile, "utf-8").split("\n");
  console.log(lines.slice(-100).join("\n"));
}

const cmd = process.argv[2];
const handlers = { start, stop, status, logs };
const handler = handlers[cmd];
if (!handler) {
  console.error("Usage: node scripts/ctl.mjs <start|stop|status|logs>");
  process.exit(1);
}
handler();
