import { createTransport, type Transporter } from "nodemailer";
import { PERSONAS, getPersona } from "../../agents/src/personas.js";
import { readTeamUpdates } from "../../server/src/memory.js";
import { recentlyCompleted, upcomingWork, getBoard } from "../../server/src/tasks.js";

/**
 * Emails Jerry a digest of what his team did.
 *
 * The important design decision is what does NOT happen here: agents have no
 * send-mail tool. They keep calling post_team_update, which writes to
 * .remember/team.jsonl, and this module — part of the trusted server, not the
 * agent loop — reads that file and sends. Two properties follow, and both matter
 * more than the convenience of letting an agent compose its own mail:
 *
 *   1. SMTP credentials live only in this process. Agents can read .env through
 *      the Bash tool (see the audit), so a per-agent mail tool would hand every
 *      agent the ability to send as Jerry.
 *   2. The recipient comes from the environment and cannot be set per call. So
 *      the worst a confused or injected agent can achieve is filling Jerry's own
 *      inbox — never mailing a third party in his name. For someone applying to
 *      city government, that containment is the whole point.
 *
 * Approvals are deliberately NOT emailed. They auto-deny after five minutes, and
 * email cannot beat that deadline; the header interrupt and desktop notification
 * are that path. Email is for the daily picture, not for anything with a fuse.
 */

export interface DigestConfig {
  enabled: boolean;
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  /** Fixed recipient. Never taken from a request or an agent. */
  to?: string;
  from?: string;
  /** Local hour (0-23) to send the daily digest. */
  hour: number;
}

export function loadDigestConfig(): DigestConfig {
  const host = process.env.SMTP_HOST || undefined;
  const user = process.env.SMTP_USER || undefined;
  const pass = process.env.SMTP_PASSWORD || undefined;
  const to = process.env.DIGEST_TO || undefined;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const hourRaw = Number(process.env.DIGEST_HOUR ?? 8);
  return {
    // All four are required. A half-configured mailer that throws at 8am every
    // morning into a log nobody reads is worse than one that is plainly off.
    enabled: Boolean(host && user && pass && to),
    host,
    port,
    secure: port === 465,
    user,
    pass,
    to,
    from: process.env.SMTP_FROM || user,
    hour: Number.isInteger(hourRaw) && hourRaw >= 0 && hourRaw <= 23 ? hourRaw : 8,
  };
}

let transport: Transporter | undefined;

function getTransport(config: DigestConfig): Transporter {
  if (!transport) {
    transport = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user!, pass: config.pass! },
    });
  }
  return transport;
}

export interface Digest {
  subject: string;
  text: string;
  /** False when there is genuinely nothing to say. */
  hasContent: boolean;
}

function line(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Builds the digest from the same stores the dashboard reads, grouped by agent so
 * it reads like the team reporting in rather than a log dump.
 */
export function buildDigest(hours = 24): Digest {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const updates = readTeamUpdates(Number.MAX_SAFE_INTEGER).filter(
    (u) => new Date(u.timestamp).getTime() >= since,
  );
  const days = Math.max(1, Math.ceil(hours / 24));
  const completed = recentlyCompleted(days).filter(
    (t) => new Date(t.completedAt ?? t.updatedAt).getTime() >= since,
  );
  const board = getBoard();
  const upcoming = upcomingWork().filter((t) => t.dueDate).slice(0, 8);

  const parts: string[] = [];

  if (completed.length) {
    parts.push("FINISHED");
    for (const task of completed) {
      const who = task.assignee ? getPersona(task.assignee)?.name ?? task.assignee : "unassigned";
      parts.push(`  - ${line(task.title)} (${who})`);
    }
    parts.push("");
  }

  if (updates.length) {
    parts.push("FROM THE TEAM");
    const byAgent = new Map<string, string[]>();
    for (const update of updates) {
      if (!byAgent.has(update.agent)) byAgent.set(update.agent, []);
      byAgent.get(update.agent)!.push(line(update.message));
    }
    for (const [agent, messages] of byAgent) {
      parts.push(`  ${agent}:`);
      for (const message of messages) parts.push(`    - ${message}`);
    }
    parts.push("");
  }

  const now = board["in-progress"] ?? [];
  if (now.length) {
    parts.push("IN PROGRESS");
    for (const task of now) {
      const who = task.assignee ? getPersona(task.assignee)?.name ?? task.assignee : "unassigned";
      parts.push(`  - ${line(task.title)} (${who})`);
    }
    parts.push("");
  }

  if (upcoming.length) {
    parts.push("DATED");
    for (const task of upcoming) parts.push(`  - ${task.dueDate}  ${line(task.title)}`);
    parts.push("");
  }

  const onHold = board["on-hold"] ?? [];
  if (onHold.length) {
    parts.push(`ON HOLD (${onHold.length})`);
    for (const task of onHold.slice(0, 5)) parts.push(`  - ${line(task.title)}`);
    parts.push("");
  }

  const hasContent = completed.length > 0 || updates.length > 0 || now.length > 0;
  if (!hasContent) {
    parts.push("Nothing moved in the last day.");
    parts.push("");
    parts.push("Reported as quiet rather than padded out — a digest that always has");
    parts.push("something in it stops being worth opening.");
    parts.push("");
  }

  parts.push("--");
  parts.push("Sent by the dashboard on the Pi. Reply-to goes to the agent named above,");
  parts.push("which forwards back to you; the agents cannot read replies yet.");

  const headline = completed.length
    ? `${completed.length} finished`
    : updates.length
      ? `${updates.length} update${updates.length === 1 ? "" : "s"}`
      : "quiet day";

  return {
    subject: `Lockard HQ — ${new Date().toISOString().slice(0, 10)} (${headline})`,
    text: parts.join("\n"),
    hasContent,
  };
}

export interface SendResult {
  sent: boolean;
  reason?: string;
  subject?: string;
}

/**
 * `force` is what the dashboard button passes: an explicit request should send
 * even on a quiet day, because the useful answer to "did anything happen?" is
 * sometimes "no". The scheduled run stays quiet instead.
 */
export async function sendDigest(config: DigestConfig, opts: { force?: boolean; hours?: number } = {}): Promise<SendResult> {
  if (!config.enabled) {
    return { sent: false, reason: "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and DIGEST_TO in .env." };
  }
  const digest = buildDigest(opts.hours ?? 24);
  if (!digest.hasContent && !opts.force) {
    return { sent: false, reason: "Nothing to report, so nothing was sent." };
  }

  // Reply-To is set to Shepard, the Chief of Staff, so a reply lands on an address
  // Jerry can forward to himself. From stays the authenticated mailbox: IONOS
  // rejects a From it has not authorised for the account, which would fail every
  // send rather than looking like it came from the agent.
  const shepard = PERSONAS.find((p) => p.id === "shepard");

  await getTransport(config).sendMail({
    from: { name: "Lockard HQ", address: config.from! },
    to: config.to!,
    replyTo: shepard?.email,
    subject: digest.subject,
    text: digest.text,
  });

  return { sent: true, subject: digest.subject };
}

/**
 * Fires once per day at the configured local hour.
 *
 * Checked every 15 minutes against the wall clock rather than scheduled with a
 * 24-hour timer: this process is meant to run for months on a Pi, and a long
 * timer drifts, does not survive a suspend, and silently never fires again if it
 * is missed once. The last-sent day is remembered so a restart cannot send twice.
 */
export function scheduleDigest(config: DigestConfig): () => void {
  if (!config.enabled) return () => undefined;
  let lastSentDay = "";
  const check = async () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (now.getHours() !== config.hour || lastSentDay === day) return;
    lastSentDay = day;
    try {
      const result = await sendDigest(config);
      console.log(result.sent ? `digest sent: ${result.subject}` : `digest skipped: ${result.reason}`);
    } catch (error) {
      console.error("digest failed:", error instanceof Error ? error.message : "unknown error");
    }
  };
  const timer = setInterval(check, 15 * 60 * 1000);
  timer.unref();
  void check();
  return () => clearInterval(timer);
}
