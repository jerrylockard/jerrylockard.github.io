import { spawn, spawnSync } from "node:child_process";
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

const PORT = Number(process.env.PORT ?? 4405);

/** Block the current thread briefly. Node permits Atomics.wait on the main thread. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Is anything answering on the port, regardless of who started it? */
function portInUse() {
  return spawnSync("curl", ["-sS", "-o", "/dev/null", "-m", "3", `http://127.0.0.1:${PORT}/healthz`], { stdio: "pipe" }).status === 0;
}

function start() {
  mkdirSync(dataDir, { recursive: true });
  const existing = readPid();
  if (existing && isAlive(existing)) {
    console.log(`mcp-gui already running (pid ${existing}). See: pnpm mcp:status / pnpm mcp:logs`);
    return;
  }

  // The pidfile alone is not enough. A different checkout (or a crash that took the
  // pidfile with it) can leave the port held by a process this one knows nothing
  // about — the old code would spawn a duplicate that died on EADDRINUSE, write its
  // pid anyway, and leave `stop`/`status` reporting on a process that never served
  // anything.
  if (portInUse()) {
    console.error(
      `Port ${PORT} is already serving a dashboard, started outside this checkout.\n` +
        `  Stop that one first, or start this one elsewhere:  PORT=4406 pnpm mcp:start`,
    );
    process.exitCode = 1;
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

  // Confirm it actually came up before claiming success and recording the pid.
  // security.ts refuses to boot when misconfigured for exposure, and that failure
  // should surface here rather than as a silent no-op.
  const deadline = Date.now() + 8000;
  let up = false;
  while (Date.now() < deadline) {
    if (portInUse()) { up = true; break; }
    if (!isAlive(child.pid)) break; // died on startup — stop waiting, show the log
    sleepSync(300);
  }

  if (!up) {
    console.error(`mcp-gui failed to start. Last lines of mcp/gui/.data/gui.log:\n`);
    try {
      console.error(readFileSync(logFile, "utf-8").split("\n").slice(-15).join("\n"));
    } catch {
      console.error("(no log output)");
    }
    if (existsSync(pidFile)) rmSync(pidFile);
    process.exitCode = 1;
    return;
  }

  writeFileSync(pidFile, String(child.pid), "utf-8");
  console.log(`mcp-gui started (pid ${child.pid}) on http://127.0.0.1:${PORT}. Logs: mcp/gui/.data/gui.log`);
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
