import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response, type Express } from "express";

/**
 * Security layer for the dashboard.
 *
 * The dashboard is a control plane, not a content site: `/api/chat` drives agents
 * that run shell commands and write files in the repo working tree. On localhost
 * that's fine — the OS is the boundary. The moment it's reachable over a tunnel at
 * dashboard.jerrylockard.me, the app itself has to be the boundary.
 *
 * Everything here is deliberately built on node: builtins. `mcp/AGENTS.md` requires
 * Jerry's approval before adding dependencies, and auth/rate-limiting/headers are
 * small enough to own outright rather than take four packages for.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const auditPath = join(repoRoot, ".remember", "dashboard-access.log");

const SESSION_COOKIE = "dash_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h — a working day, then re-auth.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const API_WINDOW_MS = 60 * 1000;
const API_MAX_REQUESTS = 600; // generous: the UI polls and streams; this only stops floods.

export interface SecurityConfig {
  /** Password gate. Absent is only legal on loopback, and only with allowNoAuth. */
  password?: string;
  user: string;
  /** Signing key for session cookies. Ephemeral per boot unless pinned via env. */
  secret: string;
  /** e.g. https://dashboard.jerrylockard.me — set when served through the tunnel. */
  publicOrigin?: string;
  host: string;
  port: number;
  /** True when traffic arrives via cloudflared/a reverse proxy. */
  trustProxy: boolean;
  /**
   * Deliberate opt-out for running unauthenticated on loopback while hacking
   * locally. It can never permit exposure — see assertSafeExposure.
   */
  allowNoAuth: boolean;
}

function envFlag(name: string): boolean {
  const v = process.env[name];
  return v === "1" || v?.toLowerCase() === "true";
}

export function loadSecurityConfig(): SecurityConfig {
  // Load the repo-root .env explicitly. providers.ts happens to do this too as an
  // import side effect, but relying on another module's import order to decide
  // whether this process has a password is exactly the kind of coupling that turns
  // into an unauthenticated dashboard later. Shell-set vars still win — Node's
  // loadEnvFile does not overwrite an already-populated process.env entry.
  try {
    process.loadEnvFile(join(repoRoot, ".env"));
  } catch {
    // No .env is a normal, supported setup.
  }

  const host = process.env.HOST || "127.0.0.1";
  const publicOrigin = process.env.DASHBOARD_PUBLIC_ORIGIN?.replace(/\/+$/, "") || undefined;
  return {
    password: process.env.DASHBOARD_PASSWORD || undefined,
    user: process.env.DASHBOARD_USER || "jerry",
    secret: process.env.DASHBOARD_SESSION_SECRET || randomBytes(32).toString("hex"),
    publicOrigin,
    host,
    port: Number(process.env.PORT ?? 4405),
    trustProxy: envFlag("DASHBOARD_TRUST_PROXY") || Boolean(publicOrigin),
    allowNoAuth: envFlag("DASHBOARD_ALLOW_NO_AUTH"),
  };
}

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);

/**
 * Authentication is the default. Running without it is something you have to ask
 * for by name.
 *
 * This used to infer privacy from the bind address: a password was required only
 * when HOST was non-loopback or DASHBOARD_PUBLIC_ORIGIN was set. Every way of
 * publishing a loopback port leaves both untouched — `cloudflared tunnel --url
 * http://127.0.0.1:4405`, `ngrok http 4405`, `tailscale funnel`, `ssh -R`, an
 * editor's "forward a port" — so the process went on concluding it was private
 * while serving the internet. A bind address cannot answer "can someone else
 * reach this", so it is no longer asked.
 *
 * Refusing to boot stays the failure mode: a warning scrolls past, and the thing
 * it would scroll past is an unauthenticated shell.
 */
export function assertSafeExposure(config: SecurityConfig): void {
  if (config.password) return;

  const exposed = !LOOPBACK.has(config.host) || Boolean(config.publicOrigin);

  // The opt-out below is for loopback hacking, and is deliberately not an escape
  // hatch from this branch. "I wanted no auth locally" is never a reason to
  // publish a shell, so an explicitly-exposed process still needs a real password.
  if (exposed) {
    throw new Error(
      "Refusing to start: the dashboard is set to be reachable off-localhost " +
        `(HOST=${config.host}${config.publicOrigin ? `, DASHBOARD_PUBLIC_ORIGIN=${config.publicOrigin}` : ""}) ` +
        "but DASHBOARD_PASSWORD is not set. This app runs shell commands in the repo — " +
        "it must never be exposed unauthenticated. Set DASHBOARD_PASSWORD (see .env.example) " +
        "or unset HOST/DASHBOARD_PUBLIC_ORIGIN. DASHBOARD_ALLOW_NO_AUTH does not lift this.",
    );
  }

  if (!config.allowNoAuth) {
    throw new Error(
      "Refusing to start: DASHBOARD_PASSWORD is not set.\n\n" +
        "  This app runs shell commands in the repo, and binding to 127.0.0.1 does not mean\n" +
        "  nobody else can reach it — a tunnel or a forwarded port is invisible from in here.\n" +
        "  So a password is required by default, not only when exposure is detected.\n\n" +
        "  Set one (see .env.example):\n" +
        "    DASHBOARD_PASSWORD=<a long random passphrase>\n\n" +
        "  Or, to run unauthenticated on loopback on purpose:\n" +
        "    DASHBOARD_ALLOW_NO_AUTH=1\n\n" +
        "  Do not use that opt-out on a machine you tunnel from.",
    );
  }
}

// ---------- audit ----------

export function audit(event: string, req: Request, extra: Record<string, unknown> = {}): void {
  try {
    mkdirSync(dirname(auditPath), { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ip: clientIp(req),
      method: req.method,
      path: req.originalUrl?.split("?")[0] ?? req.path,
      ua: String(req.headers["user-agent"] ?? "").slice(0, 200),
      ...extra,
    });
    appendFileSync(auditPath, line + "\n", "utf-8");
  } catch {
    // Auditing must never take the dashboard down.
  }
}

function clientIp(req: Request): string {
  const fwd = req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd ?? "").split(",")[0].trim();
  return first || req.socket.remoteAddress || "unknown";
}

// ---------- sessions ----------

/**
 * Signed cookie + server-side id set. The signature stops forgery; the set makes
 * logout an actual revocation rather than a client-side suggestion. A restart
 * clears every session, which is the correct bias for a control plane.
 */
const activeSessions = new Set<string>();

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function issueSession(config: SecurityConfig): { cookie: string; id: string } {
  const id = randomBytes(24).toString("base64url");
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${id}.${expires}`;
  activeSessions.add(id);
  return { cookie: `${payload}.${sign(payload, config.secret)}`, id };
}

function verifySession(raw: string | undefined, config: SecurityConfig): boolean {
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [id, expires, signature] = parts;
  if (!safeEqual(signature, sign(`${id}.${expires}`, config.secret))) return false;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) {
    activeSessions.delete(id);
    return false;
  }
  return activeSessions.has(id);
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    if (pair.slice(0, idx).trim() === name) return decodeURIComponent(pair.slice(idx + 1).trim());
  }
  return undefined;
}

/**
 * Decided per-request, not per-config. Pinning `Secure` to the public origin would
 * mean that once the tunnel is configured, signing in over plain-http localhost
 * silently fails — the browser accepts the cookie and then refuses to send it back.
 * `req.secure` reads X-Forwarded-Proto (cloudflared sets it) when trust proxy is on,
 * so the same server hands out a Secure cookie over the tunnel and a plain one to
 * loopback.
 */
function cookieAttrs(req: Request, config: SecurityConfig): string {
  const secure = req.secure || String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim() === "https";
  void config;
  return [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]
    .filter(Boolean)
    .join("; ");
}

// ---------- rate limiting ----------

type Bucket = { count: number; resetAt: number };
const loginBuckets = new Map<string, Bucket>();
const apiBuckets = new Map<string, Bucket>();

function hit(buckets: Map<string, Bucket>, key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}

// Unbounded Maps are a slow memory leak on a long-lived process; sweep expired buckets.
setInterval(() => {
  const now = Date.now();
  for (const map of [loginBuckets, apiBuckets]) {
    for (const [key, bucket] of map) if (bucket.resetAt <= now) map.delete(key);
  }
}, 5 * 60 * 1000).unref();

// ---------- login page ----------

function loginPage(error?: string): string {
  // Self-contained on purpose. /app.css sits behind the auth gate, so styling this
  // from the compiled stylesheet would mean either serving it unauthenticated or
  // shipping an unstyled sign-in page. The tokens below are copied from
  // styles/app.css and are the only duplicated colours in the project — keep them
  // in step if the palette moves.
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign in — Agent Workspace</title>
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,600&family=JetBrains+Mono:wght@400&display=swap">
<style>
  :root{
    --paper:#F4F2EB; --surface:#FFFFFF; --line:#E3DFD2; --sunken:#EFEDE4;
    --ink:#1C1B19; --ink-2:#55534C; --ink-3:#827F75;
    --brand:#1D6F68; --brand-hover:#155752; --brand-soft:#EAF6F4; --brand-line:#B1E1DC;
    --err:#A63A2E; --err-soft:#FAEBE8;
    color-scheme:light;
  }
  @media (prefers-color-scheme:dark){
    :root{
      --paper:#171815; --surface:#1F211D; --line:#333630; --sunken:#131411;
      --ink:#ECEAE3; --ink-2:#B2AFA4; --ink-3:#86837A;
      --brand:#46A79B; --brand-hover:#5CBCAF; --brand-soft:#16302C; --brand-line:#2C534D;
      --err:#E28A7C; --err-soft:#2E1B17;
      color-scheme:dark;
    }
  }
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1.5rem;
       background:var(--paper);color:var(--ink);
       font:15px/1.6 "Inter",ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  form{width:min(360px,100%);padding:1.75rem;border:1px solid var(--line);border-radius:1rem;
       background:var(--surface)}
  .mark{display:grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:.625rem;
        background:var(--brand);color:#fff;font-weight:700;font-size:.8rem;margin-bottom:1rem}
  h1{margin:0;font-family:"Newsreader",Georgia,serif;font-size:1.3rem;font-weight:600}
  p.sub{margin:.35rem 0 1.5rem;font-size:.8rem;color:var(--ink-3)}
  label{display:block;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.625rem;
        letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin-bottom:.35rem}
  input{width:100%;padding:.5rem .6rem;margin-bottom:1rem;border-radius:.5rem;
        border:1px solid var(--line);background:var(--surface);color:inherit;font-size:.875rem;
        font-family:inherit}
  input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-soft)}
  button{width:100%;padding:.55rem;border:0;border-radius:.625rem;background:var(--brand);
         color:#fff;font-size:.875rem;font-weight:500;font-family:inherit;cursor:pointer}
  button:hover{background:var(--brand-hover)}
  .err{margin:0 0 1rem;padding:.5rem .65rem;border-radius:.5rem;background:var(--err-soft);
       border:1px solid var(--err);color:var(--err);font-size:.8rem}
  .note{margin:1rem 0 0;padding-top:1rem;border-top:1px solid var(--line);
        font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.625rem;
        line-height:1.6;color:var(--ink-3)}
</style></head>
<body>
  <form method="POST" action="/login">
    <div class="mark">JL</div>
    <h1>Agent Workspace</h1>
    <p class="sub">This workspace runs commands in the repository. Sign in to continue.</p>
    ${error ? `<p class="err">${error}</p>` : ""}
    <label for="u">User</label>
    <input id="u" name="username" autocomplete="username" autofocus required>
    <label for="p">Password</label>
    <input id="p" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Sign in</button>
    <p class="note">Sessions last 12 hours. A server restart signs every device out.</p>
  </form>
</body></html>`;
}

// ---------- installation ----------

const PUBLIC_PATHS = new Set(["/login", "/logout", "/healthz", "/favicon.svg"]);

/**
 * "Same origin" means the Origin header matches the host the browser actually used
 * to reach us — which is the real security property, and the only one that holds
 * for every hostname this can be served on. An allowlist built from config cannot
 * know the hostname of an ad-hoc tunnel, so it silently 403s every write instead;
 * deriving it from the request is both stricter and configuration-free.
 */
function isSameOrigin(origin: string, req: Request, config: SecurityConfig): boolean {
  if (config.publicOrigin && origin === config.publicOrigin) return true;
  const host = req.headers.host;
  if (!host) return false;
  const forwarded = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const proto = forwarded || (req.secure ? "https" : "http");
  // Accept either scheme on loopback: the dev server is plain http, but a browser
  // that has seen HSTS from the tunnel may upgrade a localhost request.
  if (origin === `${proto}://${host}`) return true;
  const bareHost = host.split(":")[0];
  if (LOOPBACK.has(bareHost)) return origin === `http://${host}` || origin === `https://${host}`;
  return false;
}

export function installSecurity(app: Express, config: SecurityConfig): void {
  if (config.trustProxy) app.set("trust proxy", true);

  // Security headers on everything, including the login page and static assets.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        // app.js builds DOM with innerHTML in places; blocking inline script is what
        // keeps that from becoming an injection path for agent-authored output.
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        "connect-src 'self'",
        "frame-src 'self' http://localhost:4321 http://127.0.0.1:4321",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; "),
    );
    // Per-request, same reasoning as the session cookie: HSTS should follow the
    // scheme the browser actually used, not a static config value that may be
    // unset (quick tunnel) or stale.
    const overHttps = req.secure || String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim() === "https";
    if (overHttps) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Health check stays open so the tunnel can probe without a credential, and
  // reports the auth mode plus nothing else — no version, no hostname, no config.
  //
  // The mode is the load-bearing part. Whether this process installed auth was
  // decided from .env at ITS boot, which can be hours before a tunnel script reads
  // the same file and gets a different answer, the file having gained a password in
  // between with nothing restarting the server. A probe that only asks "are you
  // alive" cannot see that gap. One that asks "are you authenticated" can.
  app.get("/healthz", (_req: Request, res: Response) => {
    res.type("text/plain").send(config.password ? "ok auth=password" : "ok auth=none");
  });

  if (!config.password) {
    // Localhost-only mode: no auth, exactly as before. assertSafeExposure has
    // already guaranteed we are not reachable off-box.
    return;
  }

  app.use(express.urlencoded({ extended: false }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!hit(apiBuckets, clientIp(req), API_WINDOW_MS, API_MAX_REQUESTS)) {
      audit("rate_limited", req);
      res.status(429).type("text/plain").send("Too many requests.");
      return;
    }
    next();
  });

  app.get("/login", (req: Request, res: Response) => {
    if (verifySession(readCookie(req, SESSION_COOKIE), config)) {
      res.redirect("/");
      return;
    }
    res.type("html").send(loginPage());
  });

  app.post("/login", (req: Request, res: Response) => {
    const ip = clientIp(req);
    if (!hit(loginBuckets, ip, LOGIN_WINDOW_MS, LOGIN_MAX_ATTEMPTS)) {
      audit("login_rate_limited", req);
      res.status(429).type("html").send(loginPage("Too many attempts. Try again in a few minutes."));
      return;
    }
    const username = String(req.body?.username ?? "");
    const password = String(req.body?.password ?? "");
    // Compare both fields every time so a wrong username and a wrong password
    // cost the same, and neither short-circuits into a timing signal.
    const userOk = safeEqual(username, config.user);
    const passOk = safeEqual(password, config.password!);
    if (!userOk || !passOk) {
      audit("login_failed", req, { username: username.slice(0, 64) });
      res.status(401).type("html").send(loginPage("Incorrect user or password."));
      return;
    }
    const { cookie, id } = issueSession(config);
    loginBuckets.delete(ip);
    audit("login_ok", req, { session: id.slice(0, 8) });
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${cookie}; ${cookieAttrs(req, config)}`);
    res.redirect("/");
  });

  app.post("/logout", (req: Request, res: Response) => {
    const raw = readCookie(req, SESSION_COOKIE);
    if (raw) activeSessions.delete(raw.split(".")[0]);
    audit("logout", req);
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
    res.redirect("/login");
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (PUBLIC_PATHS.has(req.path)) {
      next();
      return;
    }

    if (!verifySession(readCookie(req, SESSION_COOKIE), config)) {
      if (req.path.startsWith("/api/")) {
        res.status(401).json({ error: "Not signed in." });
        return;
      }
      res.redirect("/login");
      return;
    }

    // Same-origin enforcement for anything that changes state. SameSite=Lax already
    // blocks cross-site POSTs in current browsers; this is the belt to that suspenders
    // and also catches a stale/misconfigured origin coming through the tunnel.
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.headers.origin;
      if (origin && !isSameOrigin(origin, req, config)) {
        audit("origin_rejected", req, { origin });
        res.status(403).json({ error: "Cross-origin request refused." });
        return;
      }
      audit("mutation", req);
    }

    next();
  });
}
