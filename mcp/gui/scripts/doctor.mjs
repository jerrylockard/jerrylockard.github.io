import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const checks = [];

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, ok: true, detail: detail || "" });
  } catch (err) {
    checks.push({ name, ok: false, detail: err.message.split("\n")[0].slice(0, 160) });
  }
}

check("Node >= 22.12", () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error(`found ${process.versions.node}`);
  return process.versions.node;
});

check("pnpm available", () => `v${execSync("pnpm --version", { cwd: repoRoot }).toString().trim()}`);

for (const pkg of ["", "mcp/server", "mcp/agents", "mcp/gui"]) {
  check(`deps installed: ${pkg || "root"}`, () => {
    if (!existsSync(join(repoRoot, pkg, "node_modules"))) throw new Error("run `pnpm install`");
    return "ok";
  });
}

for (const pkg of ["mcp-server", "mcp-agents", "mcp-gui"]) {
  check(`typecheck: ${pkg}`, () => {
    execSync(`pnpm --filter ${pkg} check`, { cwd: repoRoot, stdio: "pipe" });
    return "ok";
  });
}

check("MCP server starts cleanly", () => {
  const serverPath = join(repoRoot, "mcp", "server", "src", "index.ts");
  const result = spawnSync(process.execPath, ["--import", "tsx", serverPath], { cwd: repoRoot, timeout: 3000 });
  if (result.signal) return "ok (ran, stopped after check)";
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString().slice(0, 200) : "";
    throw new Error(`exited ${result.status}: ${stderr}`);
  }
  return "ok";
});

check("Astro site source present", () => {
  if (!existsSync(join(repoRoot, "src", "pages", "index.astro"))) throw new Error("missing src/pages/index.astro");
  return "ok";
});

check("mockup.html present", () => {
  if (!existsSync(join(repoRoot, "mockup.html"))) throw new Error("missing");
  return "ok";
});

for (const f of ["AGENTS.md", "CLAUDE.md", "GEMINI.md", "mcp/AGENTS.md"]) {
  check(`${f} present`, () => {
    if (!existsSync(join(repoRoot, f))) throw new Error("missing");
    return "ok";
  });
}

check("GitHub CLI authenticated", () => {
  execSync("gh auth status", { cwd: repoRoot, stdio: "pipe" });
  return "ok";
});

check("git branch is main", () => {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: repoRoot }).toString().trim();
  if (branch !== "main") throw new Error(`on '${branch}', expected 'main'`);
  return branch;
});

check(".remember/ present", () => {
  if (!existsSync(join(repoRoot, ".remember"))) throw new Error("missing");
  return "ok";
});

check("AI_GATEWAY_API_KEY", () => {
  const envPath = join(repoRoot, ".env");
  const inEnvFile = existsSync(envPath) && readFileSync(envPath, "utf-8").includes("AI_GATEWAY_API_KEY=");
  if (process.env.AI_GATEWAY_API_KEY || inEnvFile) return "set — agents can run";
  // Non-fatal: the dashboard and CLI still start fine without it, an agent
  // turn just reports this clearly instead of running. See CHEATSHEET.md.
  return "not set — chat/agent turns will show a clear in-app error until you add one";
});

// ---- dashboard exposure ----
// These are informational on a laptop-only setup and load-bearing the moment the
// dashboard is published at dashboard.jerrylockard.me. See mcp/gui/server/security.ts.
const envText = existsSync(join(repoRoot, ".env")) ? readFileSync(join(repoRoot, ".env"), "utf-8") : "";
const hasVar = (name) => Boolean(process.env[name]) || new RegExp(`^${name}=.+$`, "m").test(envText);

check("dashboard auth configured", () => {
  if (hasVar("DASHBOARD_PASSWORD")) return "DASHBOARD_PASSWORD set — remote access possible";
  return "not set — loopback-only mode (the server refuses to expose itself without it)";
});

check("dashboard session secret", () => {
  if (hasVar("DASHBOARD_SESSION_SECRET")) return "pinned — sessions survive a restart";
  return "unset — a new one is generated per boot, so restarting signs you out";
});

check("dashboard not misconfigured for exposure", () => {
  const exposed = (process.env.HOST && !["127.0.0.1", "::1", "localhost"].includes(process.env.HOST)) || hasVar("DASHBOARD_PUBLIC_ORIGIN");
  if (exposed && !hasVar("DASHBOARD_PASSWORD")) {
    throw new Error("configured to listen off-localhost with no password — the server will refuse to start");
  }
  return "ok";
});

console.log("\nDoctor report");
console.log("=".repeat(44));
let failures = 0;
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  if (!c.ok) failures++;
}
console.log("=".repeat(44));

if (failures === 0) {
  console.log(`All ${checks.length} checks passed. The agent system is ready to work.\n`);
} else {
  console.log(`${failures}/${checks.length} checks failed — fix the above before starting agent work.\n`);
  console.log("For remote access at dashboard.jerrylockard.me, run: pnpm dashboard:tunnel:doctor\n");
  process.exitCode = 1;
}
