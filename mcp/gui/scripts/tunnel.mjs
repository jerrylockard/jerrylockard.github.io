#!/usr/bin/env node
/**
 * Publishes the dashboard at dashboard.jerrylockard.me over a Cloudflare Tunnel.
 *
 * Why a tunnel and not a deploy: the dashboard drives agents that run shell
 * commands and edit files in this working tree. There is nothing to deploy —
 * the repo it operates on only exists on this machine. A tunnel gives the
 * public hostname an authenticated path back to the real control plane instead
 * of a copy of it that can't do anything.
 *
 * Two modes:
 *   quick   throwaway *.trycloudflare.com hostname. No account, no DNS change.
 *           Use it to prove the whole path works before touching real DNS.
 *   named   dashboard.jerrylockard.me, bound to a tunnel you own. Requires the
 *           jerrylockard.me zone to be on Cloudflare DNS (see `doctor`).
 *
 * Every path that exposes a port checks two separate things before it will run:
 * that DASHBOARD_PASSWORD is in .env (requirePassword), and that the process
 * actually listening on the port reports itself authenticated (requireServerAuth).
 * Those can disagree — .env gains a password while a long-running server keeps
 * serving without one — and only the second question is the one that matters.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, openSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const guiDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(guiDir, "..", "..");
const dataDir = join(guiDir, ".data");
const cfDir = join(dataDir, "cloudflared");
const configPath = join(cfDir, "config.yml");
const pidFile = join(dataDir, "tunnel.pid");
const logFile = join(dataDir, "tunnel.log");

const TUNNEL_NAME = process.env.TUNNEL_NAME || "jerrylockard-dashboard";
const HOSTNAME = process.env.DASHBOARD_HOSTNAME || "dashboard.jerrylockard.me";
const PORT = Number(process.env.PORT ?? 4405);
const SERVICE = `http://127.0.0.1:${PORT}`;

try {
  process.loadEnvFile(join(repoRoot, ".env"));
} catch {
  // optional
}

const bin = process.env.CLOUDFLARED_BIN || "cloudflared";

function have(cmd) {
  // Resolve against PATH directly. `sh -c "command -v ..."` would work too, but
  // passing args with shell:true concatenates rather than escapes them, which
  // Node now flags as a deprecated injection footgun (DEP0190).
  if (cmd.includes("/")) return existsSync(cmd);
  return (process.env.PATH ?? "")
    .split(":")
    .filter(Boolean)
    .some((dir) => existsSync(join(dir, cmd)));
}

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function requirePassword(what) {
  if (!process.env.DASHBOARD_PASSWORD) {
    die(
      `Refusing to ${what}: DASHBOARD_PASSWORD is not set.\n\n` +
        `  This dashboard runs shell commands in the repo. Exposing it without a\n` +
        `  password would put an unauthenticated shell on the internet.\n\n` +
        `  Add to ${join(repoRoot, ".env")}:\n` +
        `    DASHBOARD_PASSWORD=<a long random passphrase>\n` +
        `    DASHBOARD_SESSION_SECRET=${"<run: openssl rand -hex 32>"}\n`,
    );
  }
}

function requireCloudflared() {
  if (!have(bin)) {
    die(
      `cloudflared not found on PATH.\n\n` +
        `  Install (no sudo needed):\n` +
        `    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \\\n` +
        `      -o ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared\n`,
    );
  }
}

/**
 * What the RUNNING server says about itself: "password", "none", or null when
 * nothing answered.
 *
 * requirePassword() below reads .env — but .env is not what is serving traffic.
 * A dashboard started before the password was added is still running without
 * auth, and re-reading the file will never reveal that. This asks the process.
 */
function serverAuthMode() {
  const probe = spawnSync("curl", ["-sS", "-m", "4", `${SERVICE}/healthz`], { stdio: "pipe" });
  if (probe.status !== 0) return null;
  return probe.stdout.toString().includes("auth=none") ? "none" : "password";
}

/**
 * The check that closes the gap between "the config is right" and "the thing
 * listening on this port is safe to publish". Refuses either way it can fail:
 * nothing running, or something running without a password.
 */
function requireServerAuth(what) {
  const mode = serverAuthMode();
  if (mode === null) {
    die(`The dashboard isn't answering at ${SERVICE}. Start it first:\n\n    pnpm mcp:start\n`);
  }
  if (mode === "none") {
    die(
      `Refusing to ${what}: the dashboard answering on ${SERVICE} is running WITHOUT\n` +
        `  authentication, so publishing it would put an unauthenticated shell on the internet.\n\n` +
        `  DASHBOARD_PASSWORD is set in .env, but this process booted before that and has not\n` +
        `  re-read the file. Restart it so the password takes effect:\n\n` +
        `    pnpm mcp:stop && pnpm mcp:start\n\n` +
        `  Then confirm it took:\n\n` +
        `    curl -s ${SERVICE}/healthz     # should print: ok auth=password\n`,
    );
  }
}

function readPid() {
  if (!existsSync(pidFile)) return null;
  const pid = Number(readFileSync(pidFile, "utf-8").trim());
  return Number.isFinite(pid) ? pid : null;
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// ---------- commands ----------

function quick() {
  requireCloudflared();
  requirePassword("open a public tunnel");
  requireServerAuth("open a public tunnel");

  console.log(`\nOpening a throwaway tunnel to ${SERVICE} …`);
  console.log(`Nothing about your DNS changes. Ctrl-C to close it.\n`);
  const child = spawn(bin, ["tunnel", "--no-autoupdate", "--url", SERVICE], { stdio: ["ignore", "pipe", "pipe"] });
  const surface = (buf) => {
    const text = buf.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) console.log(`\n  ▸ ${match[0]}\n\n    Sign in as "${process.env.DASHBOARD_USER || "jerry"}" with DASHBOARD_PASSWORD.\n`);
  };
  child.stdout.on("data", surface);
  child.stderr.on("data", surface);
  process.on("SIGINT", () => child.kill("SIGINT"));
}

function login() {
  requireCloudflared();
  console.log(
    `\nThis opens a browser to authorize cloudflared against a Cloudflare zone.\n` +
      `If jerrylockard.me is not on Cloudflare DNS yet, this is where you'd add it —\n` +
      `run \`node mcp/gui/scripts/tunnel.mjs doctor\` first to see what that involves.\n`,
  );
  spawnSync(bin, ["tunnel", "login"], { stdio: "inherit" });
}

function create() {
  requireCloudflared();
  mkdirSync(cfDir, { recursive: true });

  const existing = spawnSync(bin, ["tunnel", "list", "--output", "json"], { stdio: "pipe" });
  let id = null;
  if (existing.status === 0) {
    try {
      const found = JSON.parse(existing.stdout.toString()).find((t) => t.name === TUNNEL_NAME);
      if (found) {
        id = found.id;
        console.log(`Tunnel "${TUNNEL_NAME}" already exists (${id}).`);
      }
    } catch {
      // fall through to create
    }
  }

  if (!id) {
    const made = spawnSync(bin, ["tunnel", "create", TUNNEL_NAME], { stdio: "inherit" });
    if (made.status !== 0) die(`Could not create the tunnel. Run \`${bin} tunnel login\` first.`);
    const relist = spawnSync(bin, ["tunnel", "list", "--output", "json"], { stdio: "pipe" });
    id = JSON.parse(relist.stdout.toString()).find((t) => t.name === TUNNEL_NAME)?.id;
    if (!id) die("Tunnel was created but could not be found in `tunnel list`.");
  }

  const credentials = join(homedir(), ".cloudflared", `${id}.json`);
  const config = `# Generated by mcp/gui/scripts/tunnel.mjs — safe to edit and re-run.
tunnel: ${id}
credentials-file: ${credentials}

ingress:
  # The dashboard. Everything reaching this hostname is still challenged for a
  # password by the app itself; the tunnel is transport, not authentication.
  - hostname: ${HOSTNAME}
    service: ${SERVICE}
    originRequest:
      # Agent turns are long. Don't cut a working session off mid-run.
      connectTimeout: 30s
      noTLSVerify: false
  # Anything else that somehow reaches this tunnel is refused outright.
  - service: http_status:404
`;
  writeFileSync(configPath, config, "utf-8");
  console.log(`\n✓ Tunnel id   ${id}`);
  console.log(`✓ Config      ${configPath}`);
  console.log(`✓ Credentials ${credentials}`);
  console.log(`\nNext:  node mcp/gui/scripts/tunnel.mjs route\n`);
}

function route() {
  requireCloudflared();
  if (!existsSync(configPath)) die(`No tunnel config yet. Run \`node mcp/gui/scripts/tunnel.mjs create\` first.`);
  console.log(`\nBinding ${HOSTNAME} → tunnel "${TUNNEL_NAME}" …`);
  console.log(`(This writes a CNAME in Cloudflare DNS. It only works if the zone is on Cloudflare.)\n`);
  const result = spawnSync(bin, ["tunnel", "route", "dns", TUNNEL_NAME, HOSTNAME], { stdio: "inherit" });
  if (result.status !== 0) {
    die(
      `Could not bind ${HOSTNAME}.\n\n` +
        `  The usual cause is that jerrylockard.me is still on Vercel DNS\n` +
        `  (ns1.vercel-dns.com / ns2.vercel-dns.com). Cloudflare can only write a\n` +
        `  DNS record for a zone it is authoritative for.\n\n` +
        `  Run \`node mcp/gui/scripts/tunnel.mjs doctor\` for the current state.\n`,
    );
  }
  console.log(`\n✓ ${HOSTNAME} now routes to this tunnel.\n`);
}

function start() {
  requireCloudflared();
  requirePassword("start the public tunnel");
  if (!existsSync(configPath)) die(`No tunnel config. Run \`create\` then \`route\` first.`);
  requireServerAuth("start the public tunnel");

  const existing = readPid();
  if (existing && isAlive(existing)) {
    console.log(`Tunnel already running (pid ${existing}).`);
    return;
  }

  mkdirSync(dataDir, { recursive: true });
  const out = openSync(logFile, "a");
  const child = spawn(bin, ["tunnel", "--no-autoupdate", "--config", configPath, "run", TUNNEL_NAME], {
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
  writeFileSync(pidFile, String(child.pid), "utf-8");
  console.log(`\n✓ Tunnel started (pid ${child.pid}) → https://${HOSTNAME}`);
  console.log(`  Logs: ${logFile}\n`);
}

function stop() {
  const pid = readPid();
  if (!pid || !isAlive(pid)) {
    console.log("Tunnel is not running.");
    if (existsSync(pidFile)) rmSync(pidFile);
    return;
  }
  process.kill(pid);
  rmSync(pidFile);
  console.log(`Tunnel (pid ${pid}) stopped. ${HOSTNAME} will stop resolving to this machine.`);
}

function status() {
  const pid = readPid();
  const running = pid && isAlive(pid);
  console.log(`\nTunnel   ${running ? `running (pid ${pid})` : "not running"}`);
  console.log(`Hostname ${HOSTNAME}`);
  const mode = serverAuthMode();
  const origin =
    mode === null
      ? "(dashboard DOWN)"
      : mode === "none"
        ? "(dashboard up, but UNAUTHENTICATED — will refuse to tunnel)"
        : "(dashboard up, authenticated)";
  console.log(`Origin   ${SERVICE}  ${origin}`);
  console.log(`Config   ${existsSync(configPath) ? configPath : "not created yet"}\n`);
}

function logs() {
  if (!existsSync(logFile)) {
    console.log("No tunnel logs yet.");
    return;
  }
  console.log(readFileSync(logFile, "utf-8").split("\n").slice(-80).join("\n"));
}

function doctor() {
  console.log("\nTunnel readiness");
  console.log("=".repeat(60));
  const rows = [];
  const add = (name, ok, detail) => rows.push({ name, ok, detail });

  add("cloudflared installed", have(bin), have(bin) ? spawnSync(bin, ["--version"], { stdio: "pipe" }).stdout.toString().trim() : "not on PATH");
  add("DASHBOARD_PASSWORD set", Boolean(process.env.DASHBOARD_PASSWORD), process.env.DASHBOARD_PASSWORD ? "set" : "required before exposing");
  add(
    "DASHBOARD_SESSION_SECRET set",
    Boolean(process.env.DASHBOARD_SESSION_SECRET),
    process.env.DASHBOARD_SESSION_SECRET ? "set — sessions survive restarts" : "unset — sessions reset on every restart (safe, just annoying)",
  );
  // Deliberately checks the running process rather than .env: every other row here
  // reads configuration, and configuration is exactly what can disagree with what is
  // actually listening on the port.
  const liveMode = serverAuthMode();
  add(
    "running dashboard is authenticated",
    liveMode === "password",
    liveMode === null
      ? `nothing at ${SERVICE} — run pnpm mcp:start`
      : liveMode === "none"
        ? `${SERVICE} is answering with NO auth — restart it: pnpm mcp:stop && pnpm mcp:start`
        : SERVICE,
  );
  add("tunnel config written", existsSync(configPath), existsSync(configPath) ? configPath : "run `create`");

  // The load-bearing one: cloudflared can only bind a hostname on a zone it controls.
  const ns = spawnSync(
    "curl",
    ["-fsS", "-m", "10", "-H", "accept: application/dns-json", "https://dns.google/resolve?name=jerrylockard.me&type=NS"],
    { stdio: "pipe" },
  );
  let nsList = [];
  try {
    nsList = (JSON.parse(ns.stdout.toString()).Answer ?? []).map((a) => a.data.replace(/\.$/, ""));
  } catch {
    nsList = [];
  }
  const onCloudflare = nsList.some((n) => n.endsWith("ns.cloudflare.com"));
  add("jerrylockard.me on Cloudflare DNS", onCloudflare, nsList.length ? nsList.join(", ") : "could not resolve NS");

  let failures = 0;
  for (const r of rows) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
    if (!r.ok) failures++;
  }
  console.log("=".repeat(60));

  if (!onCloudflare) {
    console.log(
      `\nThe DNS check is the blocking one for ${HOSTNAME}.\n\n` +
        `  jerrylockard.me is currently authoritative at Vercel. A Cloudflare Tunnel\n` +
        `  can only attach a public hostname to a zone Cloudflare serves, and a CNAME\n` +
        `  to *.cfargotunnel.com from another provider will not route.\n\n` +
        `  To use the real hostname you would move the zone's nameservers to Cloudflare\n` +
        `  and re-point the apex at Vercel there. That touches the live site, so it is\n` +
        `  deliberately not automated here.\n\n` +
        `  You do not need any of that to try it: \`pnpm dashboard:tunnel:quick\` gives\n` +
        `  you a working public URL right now, with the same auth in front of it.\n`,
    );
  } else if (failures === 0) {
    console.log(`\nReady. \`pnpm dashboard:tunnel:start\` will publish ${HOSTNAME}.\n`);
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

const commands = { quick, login, create, route, start, stop, status, logs, doctor };
const cmd = process.argv[2];
const handler = commands[cmd];
if (!handler) {
  console.error(`\nUsage: node mcp/gui/scripts/tunnel.mjs <command>\n
  doctor   check whether ${HOSTNAME} can be published from here
  quick    throwaway public URL, no DNS change (start here)

  login    authorize cloudflared against your Cloudflare account
  create   create the named tunnel + write its config
  route    bind ${HOSTNAME} to the tunnel
  start    run the tunnel in the background
  stop     stop it
  status   is it up, and is the dashboard behind it up
  logs     recent tunnel output
`);
  process.exit(1);
}
handler();
