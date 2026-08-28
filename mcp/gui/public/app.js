/*
 * Dashboard front end.
 *
 * Two rules run through this file.
 *
 * 1. Nothing is invented. Every name, role, status and count on screen comes from
 *    /api/personas, /api/roster, /api/board or /api/calendar. The previous design
 *    comp hard-coded a second agent registry, and it had already drifted from the
 *    real one (wrong roles, skills this project does not use, fabricated "live
 *    monitoring" states). A control plane that decorates itself with plausible
 *    status is worse than one that shows less.
 *
 * 2. Text goes in as text. Elements are built with el()/setText rather than
 *    innerHTML, so agent output and task titles cannot become markup. The CSP
 *    (script-src 'self') is the backstop, not the plan.
 */

// ---------------------------------------------------------------- utilities

/** Build an element. `props` sets attributes; `class` and `text` are special-cased. */
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "style") node.setAttribute("style", value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

const $ = (id) => document.getElementById(id);
const icon = (name, size = "") => el("span", { class: `icon ${size} i-${name}`.trim(), "aria-hidden": "true" });

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function setText(node, value) {
  node.textContent = value == null ? "" : String(value);
}

/**
 * Minimal inline formatting for agent prose. Escapes first, then re-introduces
 * only a fixed set of tags, so no path exists from model output to live markup.
 */
function formatProse(raw) {
  const escaped = String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function proseNode(raw) {
  const wrap = el("div", { class: "prose-agent" });
  wrap.innerHTML = `<p>${formatProse(raw)}</p>`; // input escaped above
  return wrap;
}

function timeOf(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayOf(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function relative(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Not signed in.");
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

let toastTimer;
function toast(message, kind = "ok") {
  const host = $("toast");
  clear(host);
  host.append(
    el("div", {
      class: `chip ${kind === "err" ? "chip-err" : kind === "warn" ? "chip-warn" : "chip-ok"} shadow-lg`,
      style: "pointer-events:auto;padding:.4rem .75rem;font-size:.75rem",
      text: message,
    }),
  );
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => clear(host), 4000);
}

// ---------------------------------------------------------------- state

/**
 * Icons are the one piece of per-agent presentation that is not server data —
 * there is no icon field on a persona. Keyed by id with a neutral fallback so a
 * ninth agent renders sensibly on day one instead of breaking the rail.
 */
const AGENT_ICONS = {
  team: "sparkles",
  shepard: "compass",
  devon: "wrench",
  desiree: "layout-grid",
  paige: "square-pen",
  casey: "square-check",
  archie: "book-open",
  ryder: "megaphone",
  scout: "radar",
};
const iconFor = (id) => AGENT_ICONS[id] || "bot";

const TEAM = {
  id: "team",
  name: "Team",
  role: "Automatic routing",
  department: "Whole team",
  tagline: "Describe the work and it goes to whoever owns it. Mention someone with @ to choose yourself.",
  color: "#1D6F68",
  email: "",
  scope: [],
};

const state = {
  personas: [],
  byId: new Map(),
  roster: new Map(),      // persona id -> activeTasks[]
  channel: "team",
  busy: new Set(),        // persona ids mid-turn
  approvals: [],
  alerts: [],             // recent agent errors, newest first
  board: { backlog: [], "in-progress": [], done: [] },
  categories: [],
  categoryFilter: null,
  view: "chat",
  streamBubbles: new Map(), // personaId -> { body, text }
  changelog: { candidates: [], selected: new Set(), published: "" },
  calendar: { month: null, tasks: [], activity: [], upcoming: [], selected: null },
};

function persona(id) {
  return id === "team" ? TEAM : state.byId.get(id) || { id, name: id, role: "", department: "", tagline: "", color: "#827F75", scope: [] };
}

/** Honest status: only what the server told us, plus whether a turn is running. */
function statusOf(id) {
  if (state.busy.has(id)) return { label: "working", cls: "chip-brand", live: true };
  const open = state.roster.get(id);
  if (open && open.length) return { label: `${open.length} open`, cls: "", live: false };
  return { label: "idle", cls: "", live: false };
}

// ---------------------------------------------------------------- theme

const THEME_KEY = "dash-theme";

function applyTheme(mode) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (mode === "dark" || mode === "light") root.classList.add(mode);
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const glyph = $("theme-icon");
  glyph.className = `icon i-${dark ? "moon" : "sun"}`;
  $("theme-toggle").setAttribute("title", dark ? "Switch to light" : "Switch to dark");
}

function initTheme() {
  let saved = "system";
  try {
    saved = localStorage.getItem(THEME_KEY) || "system";
  } catch {
    // Private windows and blocked site data both throw here. System default is fine.
  }
  applyTheme(saved);
  $("theme-toggle").addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark")
      || (!document.documentElement.classList.contains("light") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* not worth failing over */ }
  });
}

// ---------------------------------------------------------------- views

/**
 * Chat is the ground state, so it has no nav button. Every nav item navigates
 * away from it; the brand button and picking anyone in the rail come back. That
 * matches how the dashboard is actually used — the conversation is where you
 * live, and the other four are places you visit.
 */
function showView(name) {
  state.view = name;
  for (const section of document.querySelectorAll("main > section")) {
    section.hidden = section.id !== `view-${name}`;
  }
  for (const btn of document.querySelectorAll(".nav-btn[data-view]")) {
    if (btn.dataset.view === name) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }
  if (name === "tasks") { loadBoard(); loadRoutines(); }
  if (name === "calendar") loadCalendar();
  if (name === "changelog") loadChangelog();
  if (name === "team") renderTeamList();
}

// ---------------------------------------------------------------- roster rail

function avatarNode(p, sizeClass, iconSize) {
  return el("span", { class: `avatar ${sizeClass}`, style: `background:${p.color}`, "aria-hidden": "true" }, [
    icon(iconFor(p.id), iconSize),
  ]);
}

/**
 * Repaints a persistent avatar in place.
 *
 * The obvious version — replaceWith(avatarNode(...)) then re-find the node to
 * restore its id — reads fine and is a trap: the replacement has no id, so
 * re-finding it means a positional selector, and both of these avatars live in
 * containers that later fill with message bubbles carrying .avatar of their own.
 * It works only while the header happens to come first in document order.
 * Mutating the existing node keeps the id and depends on nothing.
 */
function paintAvatar(node, p, iconSize) {
  node.setAttribute("style", `background:${p.color}`);
  clear(node);
  node.append(icon(iconFor(p.id), iconSize));
}

function renderRoster() {
  const host = $("roster");
  const query = $("agent-search").value.trim().toLowerCase();
  clear(host);

  const matches = (p) =>
    !query ||
    [p.name, p.role, p.department, p.tagline].filter(Boolean).some((v) => v.toLowerCase().includes(query));

  const rows = [];
  if (matches(TEAM)) rows.push(agentRow(TEAM));

  // Grouped by department, which is real persona data — so the grouping stays
  // correct if the roster changes, without a hand-maintained section list.
  const groups = new Map();
  for (const p of state.personas) {
    if (!matches(p)) continue;
    const key = p.department || "Team";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  host.append(...rows);
  for (const [department, members] of groups) {
    host.append(
      el("p", { class: "label mt-3 mb-1 px-1.5", text: department }),
      ...members.map(agentRow),
    );
  }

  if (!rows.length && !groups.size) {
    host.append(el("p", { class: "px-1.5 py-3 text-[12px] text-ink-3", text: `Nobody matches “${query}”.` }));
  }
}

function agentRow(p) {
  const status = statusOf(p.id);
  const openCount = (state.roster.get(p.id) || []).length;

  return el(
    "button",
    {
      type: "button",
      class: "agent-item",
      "aria-current": state.channel === p.id ? "true" : null,
      "data-agent": p.id,
      onclick: () => selectChannel(p.id),
    },
    [
      avatarNode(p, "h-8 w-8", "icon-sm"),
      el("span", { class: "min-w-0 flex-1" }, [
        el("span", { class: "block truncate text-[13px] font-medium", text: p.name }),
        el("span", { class: "block truncate text-[11px] text-ink-3", text: p.role }),
      ]),
      status.live
        ? el("span", { class: "dot dot-live", style: "background:var(--c-ok)", title: "Running a turn now" })
        : openCount
          ? el("span", { class: "chip px-1.5 py-0", text: String(openCount), title: `${openCount} open task(s)` })
          : null,
    ],
  );
}

// ---------------------------------------------------------------- drawer

function renderDrawer() {
  const p = persona(state.channel);
  paintAvatar($("drawer-avatar"), p, "icon-lg");
  setText($("drawer-name"), p.name);
  setText($("drawer-role"), p.role);
  setText($("drawer-department"), p.department || "—");
  setText($("drawer-tagline"), p.tagline || "—");
  setText($("drawer-email"), p.email || "—");

  const scopeHost = $("drawer-scope");
  clear(scopeHost);
  if (p.scope && p.scope.length) {
    scopeHost.append(...p.scope.map((s) => el("span", { class: "chip", text: s })));
    setText(
      $("drawer-scope-note"),
      "Declared ownership. Not enforced yet — any agent can currently write any file.",
    );
  } else {
    scopeHost.append(el("span", { class: "text-[13px] text-ink-3", text: p.id === "team" ? "Routed to whoever owns the work." : "—" }));
    setText($("drawer-scope-note"), "");
  }

  const taskHost = $("drawer-tasks");
  clear(taskHost);
  const open = state.roster.get(p.id) || [];
  if (!open.length) {
    taskHost.append(el("p", { class: "text-[13px] text-ink-3", text: "Nothing open." }));
  } else {
    taskHost.append(
      ...open.map((t) =>
        el("p", { class: "flex items-start gap-1.5" }, [
          icon("arrow-right", "icon-sm mt-0.5 text-ink-3"),
          el("span", { class: "min-w-0 flex-1", text: t.title }),
        ]),
      ),
    );
  }
}

function setDrawer(open) {
  $("drawer").hidden = !open;
  $("drawer-toggle").setAttribute("aria-pressed", String(open));
  if (open) renderDrawer();
}

// ---------------------------------------------------------------- chat

function selectChannel(id) {
  state.channel = id;
  const p = persona(id);
  setText($("active-name"), p.name);
  setText($("active-role"), p.tagline || p.role);
  paintAvatar($("active-avatar"), p, "");
  $("chat-input").placeholder = id === "team"
    ? "Tell the team what you want done…"
    : `Ask ${p.name} for something…`;
  setText($("empty-title"), id === "team" ? "Ready for direction" : `${p.name} is ready`);
  setText($("empty-desc"), p.tagline || p.role);

  renderQuickPrompts();
  renderRoster();
  refreshStatusChip();
  if (!$("drawer").hidden) renderDrawer();
  loadTranscript();
  showView("chat");
}

function refreshStatusChip() {
  const status = statusOf(state.channel);
  const chip = $("active-status");
  chip.className = `chip ${status.cls}`.trim();
  setText(chip, status.label);
}

/**
 * Prompts are phrased from the persona's own brief rather than a hand-written list
 * per agent. A canned prompt naming a capability an agent does not have (the comp
 * offered Scout "fetch Covington calendar updates", and Scout has no calendar or
 * network tool) trains you to expect answers it cannot give.
 */
function renderQuickPrompts() {
  const host = $("quick-prompts");
  clear(host);
  const p = persona(state.channel);
  const prompts = p.id === "team"
    ? ["What should I work on next?", "What's blocked right now?", "Summarise this week"]
    : [`What are you working on?`, `What would you change first in your area?`, `Anything you need from me?`];
  host.append(
    ...prompts.map((text) =>
      el("button", {
        type: "button",
        class: "btn btn-quiet text-[12px]",
        text,
        onclick: () => { $("chat-input").value = text; $("chat-input").focus(); },
      }),
    ),
  );
}

function messageRow(p, nodes, meta) {
  return el("div", { class: "flex items-start gap-2.5" }, [
    avatarNode(p, "h-7 w-7", "icon-sm"),
    el("div", { class: "min-w-0 flex-1" }, [
      el("div", { class: "bubble-theirs" }, [
        el("div", { class: "mb-1.5 flex items-center gap-2 border-b border-line-soft pb-1" }, [
          el("span", { class: "text-[13px] font-semibold", text: p.name }),
          el("span", { class: "font-mono text-[10px] text-ink-3", text: p.role }),
          el("span", { class: "ml-auto font-mono text-[10px] text-ink-3", text: meta || timeOf() }),
        ]),
        ...[].concat(nodes),
      ]),
    ]),
  ]);
}

function appendMine(text) {
  hideEmpty();
  $("messages").append(
    el("div", { class: "flex items-start justify-end gap-2.5" }, [
      el("div", { class: "bubble-mine max-w-xl" }, [
        proseNode(text),
        el("span", { class: "mt-1 block font-mono text-[10px] opacity-60", text: timeOf() }),
      ]),
      el("span", { class: "avatar h-7 w-7 text-[10px] font-bold", style: "background:var(--c-mine);color:var(--c-on-mine)", text: "JL" }),
    ]),
  );
  scrollChat();
}

function hideEmpty() {
  $("chat-empty").hidden = true;
}

function scrollChat() {
  const stream = $("chat-stream");
  stream.scrollTop = stream.scrollHeight;
}

/** Streaming text lands in one growing bubble per agent turn. */
function streamText(personaId, chunk) {
  hideEmpty();
  let entry = state.streamBubbles.get(personaId);
  if (!entry) {
    const body = el("div", { class: "prose-agent" });
    $("messages").append(messageRow(persona(personaId), body));
    entry = { body, text: "" };
    state.streamBubbles.set(personaId, entry);
  }
  entry.text += chunk;
  entry.body.innerHTML = `<p>${formatProse(entry.text)}</p>`; // escaped in formatProse
  scrollChat();
}

function appendToolUse(event) {
  hideEmpty();
  const input = event.input && typeof event.input === "object" ? event.input : {};
  const summary = input.command || input.file_path || input.pattern || input.title || "";
  const block = el("details", { class: "tool-block mt-2" }, [
    el("summary", { class: "cursor-pointer select-none text-ink-2" }, [
      `${event.tool}`,
      summary ? el("span", { class: "text-ink-3", text: `  ${String(summary).slice(0, 90)}` }) : null,
    ]),
    el("pre", { class: "mt-1.5 whitespace-pre-wrap", text: JSON.stringify(event.input, null, 2).slice(0, 4000) }),
  ]);
  attachToTurn(event.personaId, block, `${event.tool}`);
  state.toolNodes ||= new Map();
  state.toolNodes.set(event.id, block);
  scrollChat();
}

function appendToolResult(event) {
  const block = state.toolNodes?.get(event.id);
  const result = String(event.result ?? "");
  const node = el("pre", {
    class: "tool-block mt-1 whitespace-pre-wrap",
    text: result.slice(0, 4000) + (result.length > 4000 ? "\n… (truncated)" : ""),
  });
  if (block) block.append(node);
  else attachToTurn(event.personaId, node, "result");
  scrollChat();
}

/** Put a node inside the agent's current bubble if there is one, else start one. */
function attachToTurn(personaId, node, label) {
  const entry = state.streamBubbles.get(personaId);
  if (entry) {
    entry.body.parentElement.append(node);
    return;
  }
  const body = el("div", { class: "prose-agent" });
  $("messages").append(messageRow(persona(personaId), [body, node], label ? undefined : undefined));
  state.streamBubbles.set(personaId, { body, text: "" });
}

function appendTeamUpdate(event) {
  hideEmpty();
  $("messages").append(
    el("div", { class: "mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-brand-line bg-brand-soft px-3 py-2" }, [
      icon("activity", "icon-sm mt-0.5 text-brand-ink"),
      el("div", { class: "min-w-0 text-[12px]" }, [
        el("span", { class: "font-semibold", text: `${event.agent} → team: ` }),
        el("span", { text: event.message }),
        event.affects?.length
          ? el("span", { class: "mt-1 block font-mono text-[10px] text-ink-3", text: `affects: ${event.affects.join(", ")}` })
          : null,
      ]),
    ]),
  );
  scrollChat();
}

function appendError(event) {
  hideEmpty();
  state.alerts.unshift({ personaId: event.personaId, message: event.message, at: new Date().toISOString() });
  state.alerts = state.alerts.slice(0, 25);
  renderAlerts();
  $("messages").append(
    el("div", { class: "mx-auto flex max-w-2xl items-start gap-2 rounded-xl border px-3 py-2", style: "border-color:color-mix(in oklab, var(--c-err) 35%, transparent);background:var(--c-err-soft)" }, [
      icon("triangle-alert", "icon-sm mt-0.5"),
      el("div", { class: "min-w-0 text-[12px]" }, [
        el("span", { class: "font-semibold", text: `${persona(event.personaId).name} hit an error: ` }),
        el("span", { text: event.message }),
      ]),
    ]),
  );
  scrollChat();
}

function appendChainNotice(event) {
  hideEmpty();
  const names = event.chain.map((id) => persona(id).name).join(" → ");
  $("messages").append(
    el("p", { class: "text-center font-mono text-[10px] text-ink-3", text: event.routed ? `routed to ${names}` : `relay: ${names}` }),
  );
}

// ---------------------------------------------------------------- transcript

async function loadTranscript() {
  const channel = state.channel;
  clear($("messages"));
  state.streamBubbles.clear();
  $("chat-empty").hidden = false;
  try {
    const history = await api(`/api/transcript?channel=${encodeURIComponent(channel)}`);
    if (state.channel !== channel) return; // switched away mid-fetch
    for (const { event } of history) replayEvent(event);
    if (history.length) hideEmpty();
  } catch (err) {
    console.error("transcript load failed", err);
  }
  loadEmptyPanels();
}

/** Replay is deliberately narrower than live: no partial text, no open turns. */
function replayEvent(event) {
  switch (event?.type) {
    case "user_message": appendMine(event.text); break;
    case "done": if (event.result) { state.streamBubbles.delete(event.personaId); streamText(event.personaId, event.result); state.streamBubbles.delete(event.personaId); } break;
    case "tool_use": appendToolUse(event); break;
    case "tool_result": appendToolResult(event); break;
    case "team_update": appendTeamUpdate(event); break;
    case "error": appendError(event); break;
    case "mention_chain": appendChainNotice(event); break;
    default: break;
  }
}

async function loadEmptyPanels() {
  try {
    const [board, calendar] = await Promise.all([api("/api/board"), api("/api/calendar?days=14")]);
    const work = $("empty-work");
    clear(work);
    const active = board["in-progress"] || [];
    if (!active.length) work.append(el("p", { class: "text-ink-3", text: "Nothing in progress." }));
    else work.append(...active.slice(0, 4).map((t) => el("p", { class: "truncate" }, [
      el("span", { class: "font-mono text-[10px] text-ink-3", text: `${persona(t.assignee || "team").name} ` }),
      el("span", { text: t.title }),
    ])));

    const act = $("empty-activity");
    clear(act);
    const items = (calendar.activity || []).slice(0, 4);
    if (!items.length) act.append(el("p", { class: "text-ink-3", text: "Quiet so far." }));
    else act.append(...items.map((a) => el("p", { class: "truncate" }, [
      el("span", { class: "font-mono text-[10px] text-ink-3", text: `${relative(a.timestamp)} ` }),
      el("span", { text: a.type === "completed" ? a.task.title : a.update.message }),
    ])));
  } catch { /* panels are a nicety; a failure here must not blank the chat */ }
}

// ---------------------------------------------------------------- sending

async function send(text) {
  const message = text.trim();
  if (!message) return;
  const channel = state.channel;
  $("composer-error").hidden = true;
  appendMine(message);
  $("chat-input").value = "";
  autoGrow();
  try {
    const res = await api("/api/chat", { method: "POST", body: JSON.stringify({ message, channel }) });
    for (const id of res.chain || []) state.busy.add(id);
    renderRoster();
    refreshStatusChip();
  } catch (err) {
    const box = $("composer-error");
    setText(box, err.message);
    box.hidden = false;
  }
}

function autoGrow() {
  const input = $("chat-input");
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

// ---------------------------------------------------------------- @mentions

function mentionCandidates(prefix) {
  const q = prefix.toLowerCase();
  return state.personas.filter((p) => p.id.startsWith(q) || p.name.toLowerCase().startsWith(q)).slice(0, 6);
}

function updateMentionPopover() {
  const input = $("chat-input");
  const pop = $("mention-popover");
  const upto = input.value.slice(0, input.selectionStart ?? input.value.length);
  const match = /@([a-z]*)$/i.exec(upto);
  if (!match) { pop.hidden = true; return; }
  const options = mentionCandidates(match[1]);
  if (!options.length) { pop.hidden = true; return; }
  clear(pop);
  pop.append(
    ...options.map((p) =>
      el("button", {
        type: "button",
        class: "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] hover:bg-sunken",
        onclick: () => {
          input.value = input.value.slice(0, upto.length - match[0].length) + `@${p.id} ` + input.value.slice(upto.length);
          pop.hidden = true;
          input.focus();
          updateRecipients();
        },
      }, [
        avatarNode(p, "h-5 w-5", "icon-sm"),
        el("span", { text: p.name }),
        el("span", { class: "ml-auto font-mono text-[10px] text-ink-3", text: p.role }),
      ]),
    ),
  );
  pop.hidden = false;
}

function updateRecipients() {
  const hint = $("recipients-hint");
  const ids = [...$("chat-input").value.matchAll(/@([a-z]+)/gi)].map((m) => m[1].toLowerCase()).filter((id) => state.byId.has(id));
  if (state.channel !== "team") setText(hint, `direct to ${persona(state.channel).name}`);
  else if (ids.length) setText(hint, `relay: ${ids.map((id) => persona(id).name).join(" → ")}`);
  else setText(hint, "no @mention — the router will pick who answers");
}

// ---------------------------------------------------------------- board

async function loadRoutines() {
  try {
    const { groups, routines } = await api("/api/routines");
    const host = $("routines");
    clear(host);
    for (const group of groups) {
      const mine = routines.filter((r) => r.group === group.id);
      if (!mine.length) continue;
      host.append(
        el("div", {}, [
          el("p", { class: "mb-1.5" }, [
            el("span", { class: "label", text: group.label }),
            el("span", { class: "ml-2 text-[11px] text-ink-3", text: group.blurb }),
          ]),
          el("div", { class: "flex flex-wrap gap-1.5" }, mine.map(routinePill)),
        ]),
      );
    }
  } catch (err) {
    console.error("routines load failed", err);
  }
}

function routinePill(routine) {
  // A dormant routine (out of season, or off the end of a published schedule)
  // stays visible but unclickable, with the reason on it — quietly hiding it
  // would read as the feature being broken.
  const dormant = Boolean(routine.dormant);
  return el("button", {
    type: "button",
    class: `chip ${dormant ? "" : "hover:border-brand"}`.trim(),
    style: dormant ? "opacity:.55;cursor:not-allowed" : "cursor:pointer",
    disabled: dormant,
    title: dormant ? routine.dormant : `${routine.title}\n\n${routine.detail}`,
    onclick: dormant ? undefined : () => addRoutine(routine),
  }, [
    icon("plus", "icon-sm"),
    el("span", { text: routine.pill }),
    routine.nextLabel ? el("span", { class: "text-ink-3", text: routine.nextLabel }) : null,
  ]);
}

async function addRoutine(routine) {
  try {
    await api(`/api/routines/${encodeURIComponent(routine.id)}`, { method: "POST" });
    await Promise.all([loadBoard(), loadRoster()]);
    toast(routine.nextDate ? `Added — due ${routine.nextLabel}` : "Added to Next");
  } catch (err) {
    toast(err.message, "err");
  }
}

async function loadBoard() {
  try {
    const [board, categories] = await Promise.all([api("/api/board"), api("/api/task-categories")]);
    state.board = board;
    state.categories = categories;
    renderBoard();
    renderBoardFilters();
  } catch (err) {
    toast(err.message, "err");
  }
}

function renderBoardFilters() {
  const host = $("task-filters");
  clear(host);
  const make = (label, value) =>
    el("button", {
      type: "button",
      class: `chip ${state.categoryFilter === value ? "chip-brand" : ""}`.trim(),
      text: label,
      onclick: () => { state.categoryFilter = value; renderBoard(); renderBoardFilters(); },
    });
  host.append(make("All", null), ...state.categories.map((c) => make(c, c)));
}

function renderBoard() {
  for (const status of LIVE_COLUMNS) {
    const host = $(`col-${status}`);
    clear(host);
    const tasks = (state.board[status] || []).filter((t) => !state.categoryFilter || t.category === state.categoryFilter);
    setText($(`count-${status}`), String(tasks.length));
    if (!tasks.length) {
      host.append(el("p", { class: "px-1 py-2 text-[12px] text-ink-3", text: status === "on-hold" ? "Nothing parked." : "Empty." }));
      continue;
    }
    host.append(...tasks.map(taskCard));
  }
  // Finished work is intentionally not shown here — checking a task off moves it
  // out of Tasks and into the Changelog, which is where it waits for publishing.
  const badge = $("badge-tasks");
  const active = (state.board["in-progress"] || []).length;
  badge.hidden = active === 0;
  setText(badge, String(active));

  const done = (state.board.done || []).length;
  const clBadge = $("badge-changelog");
  clBadge.hidden = done === 0;
  setText(clBadge, String(done));
}

// Stored value -> the label Jerry sees. See TaskStatus in mcp/server/src/tasks.ts
// for why the stored names were not renamed.
const STATUS_LABEL = { "in-progress": "Now", backlog: "Next", "on-hold": "On hold", done: "Done" };
const LIVE_COLUMNS = ["in-progress", "backlog", "on-hold"];

/** The moves offered on a card, per column. Finishing is the primary action. */
const MOVES = {
  "in-progress": [
    { to: "done", label: "Done", primary: true },
    { to: "on-hold", label: "Hold" },
  ],
  backlog: [
    { to: "in-progress", label: "Start", primary: true },
    { to: "on-hold", label: "Hold" },
  ],
  "on-hold": [
    { to: "in-progress", label: "Pick back up", primary: true },
    { to: "backlog", label: "Queue" },
  ],
};

function taskCard(task) {
  const who = task.assignee ? persona(task.assignee) : null;
  return el("article", { class: "card p-2.5" }, [
    el("div", { class: "flex items-start gap-2" }, [
      el("p", { class: "min-w-0 flex-1 text-[13px] font-medium", text: task.title }),
      task.priority === "high" ? el("span", { class: "chip chip-warn px-1.5 py-0", text: "high" }) : null,
    ]),
    task.detail ? el("p", { class: "mt-1 line-clamp-2 text-[12px] text-ink-3", text: task.detail }) : null,
    el("div", { class: "mt-2 flex flex-wrap items-center gap-1.5" }, [
      el("span", { class: "chip", text: task.category }),
      task.dueDate ? el("span", { class: "chip" }, [icon("clock", "icon-sm"), el("span", { text: dayOf(task.dueDate) })]) : null,
      who ? el("span", { class: "chip" }, [avatarNode(who, "h-3.5 w-3.5", "icon-sm"), el("span", { text: who.name })]) : el("span", { class: "chip", text: "unassigned" }),
    ]),
    el("div", { class: "mt-2 flex items-center gap-1.5" },
      (MOVES[task.status] || []).map((move) =>
        el("button", {
          type: "button",
          class: `btn ${move.primary ? "btn-primary" : "btn-quiet"} flex-1 py-1 text-[12px]`,
          text: move.label,
          onclick: (ev) => moveTask(task, move.to, ev.currentTarget),
        }),
      ),
    ),
  ]);
}

/**
 * expectedStatus is required by the API and is the point: two agents and a browser
 * share this board, so a stale card must lose rather than silently overwrite. A 409
 * is a normal outcome here, not an error to swallow.
 */
async function moveTask(task, next, button) {
  button.disabled = true;
  try {
    await api(`/api/tasks/${encodeURIComponent(task.id)}/status`, {
      method: "POST",
      body: JSON.stringify({ status: next, expectedStatus: task.status }),
    });
    $("task-notice").hidden = true;
    await loadBoard();
    if (next === "done") {
      toast("Done — it's in the Changelog now");
      if (state.view === "changelog") loadChangelog();
    }
  } catch (err) {
    if (err.status === 409) {
      const notice = $("task-notice");
      setText(notice, `${err.message} (now: ${err.data?.currentStatus ?? "unknown"})`);
      notice.hidden = false;
      await loadBoard();
    } else {
      toast(err.message, "err");
      button.disabled = false;
    }
  }
}

// ---------------------------------------------------------------- new task

function openTaskModal() {
  const assignee = $("task-assignee");
  clear(assignee);
  assignee.append(el("option", { value: "", text: "Unassigned" }), ...state.personas.map((p) => el("option", { value: p.id, text: `${p.name} — ${p.role}` })));
  const category = $("task-category");
  clear(category);
  category.append(...(state.categories.length ? state.categories : ["general"]).map((c) => el("option", { value: c, text: c })));
  $("task-error").hidden = true;
  $("task-form").reset();
  $("task-overlay").hidden = false;
  $("task-title").focus();
}

async function submitTask(ev) {
  ev.preventDefault();
  const body = {
    title: $("task-title").value.trim(),
    detail: $("task-detail").value.trim(),
    category: $("task-category").value || "general",
    priority: $("task-priority").value,
    assignee: $("task-assignee").value || null,
  };
  const due = $("task-due").value;
  if (due) body.dueDate = due;
  try {
    await api("/api/tasks", { method: "POST", body: JSON.stringify(body) });
    $("task-overlay").hidden = true;
    toast("Task created");
    await Promise.all([loadBoard(), loadRoster()]);
    if (state.view !== "board") showView("board");
  } catch (err) {
    const box = $("task-error");
    setText(box, err.message);
    box.hidden = false;
  }
}

// ---------------------------------------------------------------- changelog

async function loadChangelog() {
  try {
    const data = await api("/api/changelog?days=365");
    state.changelog.candidates = data.candidates || [];
    state.changelog.published = data.published || "";
    // Drop selections for anything that is no longer a candidate, so publishing
    // cannot act on a task that was reopened while this view sat open.
    const live = new Set(state.changelog.candidates.map((c) => c.key));
    for (const key of [...state.changelog.selected]) if (!live.has(key)) state.changelog.selected.delete(key);
    renderChangelog();
  } catch (err) {
    toast(err.message, "err");
  }
}

function renderChangelog() {
  const host = $("changelog-candidates");
  clear(host);
  const items = state.changelog.candidates;

  setText($("changelog-published"), state.changelog.published.trim() || "CHANGELOG.md does not exist yet. Publishing something creates it.");

  if (!items.length) {
    host.append(el("p", { class: "text-[13px] text-ink-3", text: "Nothing waiting. Check a task off in Tasks and it turns up here." }));
  } else {
    // Grouped by day, because that is how the published file is structured.
    const byDate = new Map();
    for (const c of items) {
      if (!byDate.has(c.date)) byDate.set(c.date, []);
      byDate.get(c.date).push(c);
    }
    for (const [date, group] of byDate) {
      host.append(
        el("div", {}, [
          el("p", { class: "mb-1.5 font-mono text-[11px] text-ink-3", text: date }),
          el("div", { class: "space-y-1.5" }, group.map(candidateRow)),
        ]),
      );
    }
  }

  const selected = state.changelog.selected.size;
  const btn = $("changelog-publish");
  btn.disabled = selected === 0;
  setText(btn.querySelector("span:last-child"), selected ? `Publish ${selected}` : "Publish selected");
}

function candidateRow(c) {
  const blocked = Boolean(c.blocked?.length);
  const box = el("input", {
    type: "checkbox",
    class: "mt-0.5",
    "aria-label": `Include: ${c.text}`,
    disabled: blocked,
    onchange: (ev) => {
      if (ev.currentTarget.checked) state.changelog.selected.add(c.key);
      else state.changelog.selected.delete(c.key);
      renderChangelog();
    },
  });
  box.checked = state.changelog.selected.has(c.key);

  return el("label", {
    class: "flex items-start gap-2 rounded-lg border p-2.5",
    style: blocked
      ? "border-color:color-mix(in oklab, var(--c-err) 40%, transparent);background:var(--c-err-soft)"
      : "border-color:var(--c-line-soft)",
  }, [
    box,
    el("div", { class: "min-w-0 flex-1" }, [
      el("p", { class: "text-[13px]", text: c.text }),
      el("div", { class: "mt-1 flex flex-wrap items-center gap-1.5" }, [
        el("span", { class: "chip", text: c.kind === "task" ? "task" : "team update" }),
        c.category ? el("span", { class: "chip", text: c.category }) : null,
        c.agent ? el("span", { class: "chip", text: persona(c.agent).name }) : null,
      ]),
      // The whole point of the screen: CHANGELOG.md is tracked in a public repo,
      // and a git commit is permanent. Say why it is held back, not just that it is.
      blocked
        ? el("p", { class: "mt-1.5 text-[12px] font-medium text-err", text: `Held back — reads as ${c.blocked.map((v) => v.label).join(" and ")}. CHANGELOG.md is public and permanent.` })
        : null,
    ]),
  ]);
}

async function publishChangelog() {
  const keys = [...state.changelog.selected];
  if (!keys.length) return;
  const notice = $("changelog-notice");
  notice.hidden = true;
  try {
    const result = await api("/api/changelog/publish", { method: "POST", body: JSON.stringify({ keys }) });
    state.changelog.selected.clear();
    await loadChangelog();
    await loadBoard();
    notice.setAttribute("style", "border:1px solid color-mix(in oklab, var(--c-ok) 40%, transparent);background:var(--c-ok-soft);color:var(--c-ok)");
    setText(notice, `Wrote ${result.count} ${result.count === 1 ? "entry" : "entries"} to CHANGELOG.md. Review it, then commit — nothing is pushed for you.`);
    notice.hidden = false;
    if (result.skipped?.length) toast(`${result.skipped.length} held back`, "warn");
  } catch (err) {
    notice.setAttribute("style", "border:1px solid color-mix(in oklab, var(--c-err) 40%, transparent);background:var(--c-err-soft);color:var(--c-err)");
    setText(notice, err.data?.skipped?.length ? err.data.skipped.map((sk) => sk.reason).join(" ") : err.message);
    notice.hidden = false;
  }
}

// ---------------------------------------------------------------- calendar

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadCalendar() {
  if (!state.calendar.month) state.calendar.month = monthStart(new Date());
  try {
    // A wide window on purpose: the grid can be scrolled to any month, so the
    // data behind it has to cover more than the default 30 days.
    const data = await api("/api/calendar?days=365");
    state.calendar.activity = data.activity || [];
    state.calendar.upcoming = data.upcoming || [];
    renderCalendar();
  } catch (err) {
    toast(err.message, "err");
  }
}

/** date (YYYY-MM-DD) -> { due: Task[], done: Task[], updates: [] } */
function calendarIndex() {
  const index = new Map();
  const bucket = (day) => {
    if (!index.has(day)) index.set(day, { due: [], done: [], updates: [] });
    return index.get(day);
  };
  for (const task of state.calendar.upcoming) {
    if (task.dueDate) bucket(task.dueDate).due.push(task);
  }
  for (const entry of state.calendar.activity) {
    const day = entry.timestamp.slice(0, 10);
    if (entry.type === "completed") bucket(day).done.push(entry.task);
    else bucket(day).updates.push(entry.update);
  }
  return index;
}

function renderCalendar() {
  const month = state.calendar.month;
  const index = calendarIndex();
  const today = isoDay(new Date());

  setText($("calendar-title"), month.toLocaleDateString([], { month: "long", year: "numeric" }));

  const head = $("calendar-weekdays");
  clear(head);
  head.append(...WEEKDAYS.map((d) =>
    el("div", { class: "px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-wide text-ink-3", text: d }),
  ));

  // Weeks start Monday: the civic calendar this feeds off runs on business weeks,
  // and a Sunday-first grid splits the working week across two rows.
  const first = monthStart(month);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(1 - offset);

  const grid = $("calendar-grid");
  clear(grid);
  for (let i = 0; i < 42; i++) {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + i);
    const day = isoDay(cell);
    const inMonth = cell.getMonth() === month.getMonth();
    const data = index.get(day);
    const isToday = day === today;
    const isSelected = state.calendar.selected === day;

    grid.append(
      el("button", {
        type: "button",
        class: "flex min-h-[74px] flex-col items-start gap-1 border-b border-r border-line-soft p-1.5 text-left hover:bg-raised",
        style: [
          !inMonth ? "opacity:.4" : "",
          isSelected ? "background:var(--c-brand-soft);box-shadow:inset 0 0 0 2px var(--c-brand)" : "",
        ].filter(Boolean).join(";"),
        "aria-current": isToday ? "date" : null,
        "aria-pressed": String(isSelected),
        onclick: () => { state.calendar.selected = day; renderCalendar(); },
      }, [
        el("span", {
          class: `font-mono text-[11px] ${isToday ? "font-bold" : ""}`.trim(),
          style: isToday ? "background:var(--c-brand);color:var(--c-on-brand);border-radius:4px;padding:0 4px" : "",
          text: String(cell.getDate()),
        }),
        data
          ? el("span", { class: "flex flex-wrap gap-1" }, [
              ...data.due.slice(0, 3).map((t) => el("span", { class: "dot", style: "background:var(--c-warn)", title: `Due: ${t.title}` })),
              ...data.done.slice(0, 3).map((t) => el("span", { class: "dot", style: "background:var(--c-ok)", title: `Done: ${t.title}` })),
              ...data.updates.slice(0, 3).map((u) => el("span", { class: "dot", style: "background:var(--c-brand)", title: `${u.agent}: ${u.message}` })),
            ])
          : null,
      ]),
    );
  }

  renderCalendarDay(index);

  const up = $("calendar-upcoming");
  clear(up);
  const dated = state.calendar.upcoming.filter((t) => t.dueDate).slice(0, 6);
  if (!dated.length) up.append(el("p", { class: "text-ink-3", text: "Nothing with a date on it." }));
  else up.append(...dated.map((t) =>
    el("p", { class: "flex items-start gap-2" }, [
      el("span", { class: "chip", text: dayOf(t.dueDate) }),
      el("span", { class: "min-w-0 flex-1", text: t.title }),
    ]),
  ));
}

function renderCalendarDay(index) {
  const host = $("calendar-day-items");
  clear(host);
  const day = state.calendar.selected;
  if (!day) {
    setText($("calendar-day-label"), "Pick a day");
    host.append(el("p", { class: "text-ink-3", text: "Select a date to see what is on it." }));
    return;
  }
  setText($("calendar-day-label"), new Date(`${day}T12:00:00`).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
  const data = index.get(day);
  if (!data) {
    host.append(el("p", { class: "text-ink-3", text: "Nothing on this day." }));
    return;
  }
  const row = (label, text, color) => el("p", { class: "flex items-start gap-2" }, [
    el("span", { class: "chip", style: `color:${color};border-color:${color}`, text: label }),
    el("span", { class: "min-w-0 flex-1", text }),
  ]);
  host.append(
    ...data.due.map((t) => row("due", t.title, "var(--c-warn)")),
    ...data.done.map((t) => row("done", t.title, "var(--c-ok)")),
    ...data.updates.map((u) => row(u.agent, u.message, "var(--c-brand)")),
  );
}

// ---------------------------------------------------------------- team grid

function renderTeamList() {
  const host = $("team-list");
  clear(host);
  host.append(...state.personas.map((p) => {
    const status = statusOf(p.id);
    const open = state.roster.get(p.id) || [];
    return el("article", { class: "card p-4" }, [
      el("div", { class: "flex items-start gap-3" }, [
        avatarNode(p, "h-11 w-11", "icon-lg"),
        el("div", { class: "min-w-0 flex-1" }, [
          el("div", { class: "flex flex-wrap items-center gap-2" }, [
            el("h2", { class: "font-serif text-[17px] font-semibold", text: p.name }),
            el("span", { class: "chip chip-brand", text: p.role }),
            el("span", { class: `chip ${status.cls}`.trim() }, [
              status.live ? el("span", { class: "dot dot-live", style: "background:var(--c-ok)" }) : null,
              el("span", { text: status.label }),
            ]),
          ]),
          el("p", { class: "mt-0.5 font-mono text-[11px] text-ink-3", text: `${p.department} · ${p.email}` }),
          el("p", { class: "mt-2 text-[13px] leading-relaxed text-ink-2", text: p.tagline }),
        ]),
        el("button", {
          type: "button",
          class: "btn btn-primary",
          onclick: () => selectChannel(p.id),
        }, [icon("terminal", "icon-sm"), el("span", { text: "Chat" })]),
      ]),

      el("div", { class: "mt-3 grid gap-4 border-t border-line-soft pt-3 sm:grid-cols-2" }, [
        el("div", {}, [
          el("p", { class: "label mb-1.5", text: "Duties" }),
          el("ul", { class: "space-y-1" }, (p.responsibilities || []).map((r) =>
            el("li", { class: "flex items-start gap-1.5 text-[13px] leading-snug" }, [
              icon("check", "icon-sm mt-[3px] text-brand"),
              el("span", { class: "min-w-0 flex-1", text: r }),
            ]),
          )),
          // Rendered only when the persona declares one. Listing a duty an agent
          // has no tool for would make this page assert something untrue.
          p.caveat
            ? el("p", {
                class: "mt-2 rounded-lg px-2.5 py-2 text-[12px] leading-snug",
                style: "border:1px solid color-mix(in oklab, var(--c-warn) 40%, transparent);background:var(--c-warn-soft);color:var(--c-warn)",
                text: p.caveat,
              })
            : null,
        ]),
        el("div", {}, [
          el("p", { class: "label mb-1.5", text: "Owns" }),
          el("div", { class: "flex flex-wrap gap-1" },
            (p.scope || []).length
              ? p.scope.map((sc) => el("span", { class: "chip", text: sc }))
              : [el("span", { class: "text-[13px] text-ink-3", text: "No file ownership — works from live sources." })]),
          el("p", { class: "label mb-1.5 mt-3", text: "On right now" }),
          open.length
            ? el("ul", { class: "space-y-1" }, open.map((t) =>
                el("li", { class: "flex items-start gap-1.5 text-[13px] leading-snug" }, [
                  icon("arrow-right", "icon-sm mt-[3px] text-ink-3"),
                  el("span", { class: "min-w-0 flex-1", text: t.title }),
                ]),
              ))
            : el("p", { class: "text-[13px] text-ink-3", text: "Nothing open." }),
        ]),
      ]),
    ]);
  }));
}

// ---------------------------------------------------------------- decisions

/**
 * Approvals render in two places, never as a tab of their own.
 *
 * The header bar is the one that matters: the agent is paused mid-turn and
 * approvals.ts denies automatically after five minutes, so this cannot be
 * somewhere Jerry has to remember to look. The Tasks panel is the fuller list
 * for when several stack up. A desktop notification covers the case where the
 * dashboard is open in a tab he is not looking at, which on an always-on box is
 * most of the time.
 */
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;
let interruptTicker;

function renderApprovals() {
  const pending = state.approvals;
  renderInterrupt(pending);
  renderApprovalPanel(pending);
}

function renderInterrupt(pending) {
  const bar = $("interrupt");
  if (!pending.length) {
    bar.hidden = true;
    clearInterval(interruptTicker);
    interruptTicker = undefined;
    return;
  }

  const first = pending[0];
  const who = persona(first.personaId);
  setText($("interrupt-text"),
    pending.length === 1
      ? `${who.name} needs to run ${first.toolName} — ${first.reason}.`
      : `${who.name} needs to run ${first.toolName} — ${first.reason}. ${pending.length - 1} more waiting.`);
  setText($("interrupt-detail"), first.detail);
  $("interrupt-approve").onclick = () => resolveApproval(first.id, true);
  $("interrupt-deny").onclick = () => resolveApproval(first.id, false);
  bar.hidden = false;

  // Counting down rather than showing a static "5 min" — the deadline is real and
  // silent, and a number that moves is the only honest way to show that.
  const tick = () => {
    const left = APPROVAL_TIMEOUT_MS - (Date.now() - new Date(first.createdAt).getTime());
    const chip = $("interrupt-timer");
    if (left <= 0) { setText(chip, "expiring"); return; }
    const mins = Math.floor(left / 60000);
    const secs = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
    setText(chip, `${mins}:${secs} to auto-deny`);
  };
  tick();
  clearInterval(interruptTicker);
  interruptTicker = setInterval(tick, 1000);
}

function renderApprovalPanel(pending) {
  const wrap = $("tasks-approvals");
  const host = $("tasks-approvals-list");
  clear(host);
  wrap.hidden = pending.length === 0;
  if (!pending.length) return;

  host.append(...pending.map((a) => {
    const who = persona(a.personaId);
    return el("article", { class: "card p-3" }, [
      el("div", { class: "flex items-center gap-2" }, [
        avatarNode(who, "h-7 w-7", "icon-sm"),
        el("div", { class: "min-w-0 flex-1" }, [
          el("p", { class: "text-[13px] font-semibold", text: `${who.name} wants to run ${a.toolName}` }),
          el("p", { class: "font-mono text-[10px] text-ink-3", text: `${a.reason} · asked ${relative(a.createdAt)}` }),
        ]),
        el("button", { type: "button", class: "btn btn-primary py-1 text-[12px]", text: "Approve", onclick: () => resolveApproval(a.id, true) }),
        el("button", { type: "button", class: "btn btn-danger py-1 text-[12px]", text: "Deny", onclick: () => resolveApproval(a.id, false) }),
      ]),
      el("pre", { class: "tool-block mt-2", text: a.detail }),
    ]);
  }));
}

// ---------- desktop notifications ----------

/**
 * Permission is requested on the first approval rather than at load, so the
 * browser prompt arrives attached to something that just happened and is
 * obviously worth allowing. Notification requires a secure context, which both
 * ways in provide: localhost through the SSH forward counts as secure, and the
 * Cloudflare tunnel is real HTTPS.
 */
function notifyDesktop(approval) {
  if (!("Notification" in window)) return;
  const who = persona(approval.personaId).name;
  const show = () => {
    try {
      const note = new Notification(`${who} needs a decision`, {
        body: `${approval.toolName} — ${approval.reason}\nAuto-denied in 5 minutes.`,
        tag: approval.id,
        requireInteraction: true,
      });
      note.onclick = () => { window.focus(); showView("tasks"); note.close(); };
    } catch {
      // Some browsers refuse construction outside a service worker. The header
      // bar is the real mechanism; this is only the nudge.
    }
  };
  if (Notification.permission === "granted") show();
  else if (Notification.permission === "default") Notification.requestPermission().then((p) => { if (p === "granted") show(); });
}

function renderAlerts() {
  const host = $("alerts-list");
  const wrap = $("tasks-alerts");
  clear(host);
  // Hidden entirely when clean, rather than showing a reassuring empty state that
  // costs a row of vertical space on every visit.
  wrap.hidden = state.alerts.length === 0;
  if (!state.alerts.length) return;
  host.append(...state.alerts.map((a) => el("div", { class: "card p-3" }, [
    el("p", { class: "text-[12px] font-semibold", text: persona(a.personaId).name }),
    el("p", { class: "mt-0.5 text-[12px] text-ink-2", text: a.message }),
    el("p", { class: "mt-1 font-mono text-[10px] text-ink-3", text: relative(a.at) }),
  ])));
}

// ---------------------------------------------------------------- overlays

const FIELD_SECTIONS = {
  identity: "Identity",
  contact: "Contact",
  civic: "Civic",
  background: "Background",
  positions: "Positions",
  logistics: "Logistics",
  assets: "Assets",
};

let profileCategories = Object.keys(FIELD_SECTIONS);

async function openProfile() {
  $("profile-overlay").hidden = false;
  await loadProfile();
}

async function loadProfile() {
  const fieldHost = $("profile-fields");
  const obsHost = $("profile-observations");
  clear(fieldHost);
  fieldHost.append(el("p", { class: "text-[13px] text-ink-3", text: "Loading…" }));
  try {
    const doc = await api("/api/profile");
    profileCategories = doc.categories?.length ? doc.categories : profileCategories;
    renderProfileFields(doc.fields || []);
    renderObservations(doc.observations || []);
    populateFieldCategories();
  } catch (err) {
    clear(fieldHost);
    fieldHost.append(el("p", { class: "text-[13px] text-err", text: err.message }));
    clear(obsHost);
  }
}

function populateFieldCategories() {
  const select = $("field-category");
  if (select.options.length) return;
  select.append(...profileCategories.map((c) => el("option", { value: c, text: FIELD_SECTIONS[c] || c })));
}

function renderProfileFields(fields) {
  const host = $("profile-fields");
  clear(host);
  if (!fields.length) {
    host.append(el("p", { class: "text-[13px] text-ink-3", text: "Nothing yet. Add a fact below, or just tell an agent in chat and it will save one." }));
    return;
  }
  const grouped = new Map();
  for (const f of fields) {
    if (!grouped.has(f.category)) grouped.set(f.category, []);
    grouped.get(f.category).push(f);
  }
  for (const [category, items] of grouped) {
    host.append(
      el("div", {}, [
        el("p", { class: "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-ink", text: FIELD_SECTIONS[category] || category }),
        el("div", { class: "space-y-1.5" }, items.map(fieldRow)),
      ]),
    );
  }
}

function fieldRow(field) {
  const value = el("p", { class: "whitespace-pre-wrap text-[13px]", text: field.value });
  return el("div", { class: "rounded-lg border border-line-soft bg-surface p-2.5" }, [
    el("div", { class: "flex items-start gap-2" }, [
      el("div", { class: "min-w-0 flex-1" }, [
        el("p", { class: "text-[11px] font-medium text-ink-3", text: field.label }),
        value,
      ]),
      el("button", {
        type: "button",
        class: "icon-btn h-6 w-6",
        "aria-label": `Edit ${field.label}`,
        title: "Edit",
        onclick: () => editField(field, value),
      }, [icon("square-pen", "icon-sm")]),
      el("button", {
        type: "button",
        class: "icon-btn h-6 w-6",
        "aria-label": `Remove ${field.label}`,
        title: "Remove",
        onclick: () => removeField(field),
      }, [icon("trash-2", "icon-sm")]),
    ]),
    el("p", { class: "mt-1.5 font-mono text-[10px] text-ink-3", text: `${field.source === "jerry" ? "you" : field.source} · ${relative(field.updatedAt)}` }),
  ]);
}

/** Inline edit. Saving reuses the same key, so the field is updated not duplicated. */
function editField(field, valueNode) {
  const input = el("textarea", { class: "field resize-none text-[13px]", rows: "3" });
  input.value = field.value;
  const error = el("p", { class: "mt-1 text-[12px] text-err", hidden: true });
  const save = async () => {
    try {
      await api("/api/profile/fields", {
        method: "POST",
        body: JSON.stringify({ key: field.key, label: field.label, value: input.value, category: field.category }),
      });
      await loadProfile();
      toast("Saved");
    } catch (err) {
      setText(error, profileError(err));
      error.hidden = false;
    }
  };
  const editor = el("div", {}, [
    input,
    error,
    el("div", { class: "mt-1.5 flex gap-1.5" }, [
      el("button", { type: "button", class: "btn btn-primary py-1 text-[12px]", text: "Save", onclick: save }),
      el("button", { type: "button", class: "btn btn-quiet py-1 text-[12px]", text: "Cancel", onclick: () => editor.replaceWith(valueNode) }),
    ]),
  ]);
  valueNode.replaceWith(editor);
  input.focus();
}

async function removeField(field) {
  try {
    await api(`/api/profile/fields/${encodeURIComponent(field.key)}`, { method: "DELETE" });
    await loadProfile();
    toast(`Removed “${field.label}”`);
  } catch (err) {
    toast(err.message, "err");
  }
}

function renderObservations(observations) {
  const host = $("profile-observations");
  clear(host);
  if (!observations.length) {
    host.append(el("p", { class: "text-[13px] text-ink-3", text: "Nothing worked out yet. These build up as you work with the team." }));
    return;
  }
  host.append(...observations.map((o) =>
    el("div", { class: "rounded-lg border border-line-soft p-2.5" }, [
      el("div", { class: "flex items-start gap-2" }, [
        el("div", { class: "min-w-0 flex-1" }, [
          el("p", { class: "text-[13px]", text: o.text }),
          o.evidence ? el("p", { class: "mt-1 border-l-2 border-line pl-2 text-[12px] italic text-ink-3", text: o.evidence }) : null,
        ]),
        el("button", {
          type: "button",
          class: "icon-btn h-6 w-6",
          "aria-label": "Strike this observation",
          title: "That's not right — forget it",
          onclick: async () => {
            try {
              await api(`/api/profile/observations/${encodeURIComponent(o.id)}`, { method: "DELETE" });
              await loadProfile();
              toast("Struck from the profile");
            } catch (err) { toast(err.message, "err"); }
          },
        }, [icon("x", "icon-sm")]),
      ]),
      el("div", { class: "mt-1.5 flex flex-wrap items-center gap-1.5" }, [
        el("span", { class: "chip", text: o.category.replace(/-/g, " ") }),
        // Confirmation count is the honest confidence signal: a pattern seen once
        // is a guess, one seen repeatedly by several agents is established.
        el("span", { class: `chip ${o.timesConfirmed >= 3 ? "chip-ok" : ""}`.trim(), text: `seen ${o.timesConfirmed}×` }),
        el("span", { class: "font-mono text-[10px] text-ink-3", text: `${o.notedBy.join(", ")} · ${relative(o.lastConfirmed)}` }),
      ]),
    ]),
  ));
}

/** A guardrail refusal comes back as 422 with the categories that matched. */
function profileError(err) {
  if (err.status === 422 && err.data?.violations?.length) {
    return `Not saved — that looks like ${err.data.violations.map((v) => v.label).join(" and ")}, which is on the excluded list.`;
  }
  return err.message;
}

async function submitField(ev) {
  ev.preventDefault();
  const label = $("field-label").value.trim();
  const body = {
    key: label,          // the server slugifies this; editing reuses the slug
    label,
    value: $("field-value").value.trim(),
    category: $("field-category").value,
  };
  try {
    await api("/api/profile/fields", { method: "POST", body: JSON.stringify(body) });
    $("field-form").reset();
    $("add-field-details").open = false;
    $("field-error").hidden = true;
    await loadProfile();
    toast("Fact saved");
  } catch (err) {
    const box = $("field-error");
    setText(box, profileError(err));
    box.hidden = false;
  }
}

async function openPreview() {
  $("preview-overlay").hidden = false;
  await refreshPreview();
}

async function refreshPreview() {
  try {
    const { running, url } = await api("/api/preview/status");
    setText($("preview-url"), url);
    $("preview-offline").hidden = running;
    $("preview-frame").hidden = !running;
    $("preview-start").disabled = running;
    setText($("preview-start"), running ? "Running" : "Start dev server");
    if (running) $("preview-frame").src = url;
  } catch (err) {
    toast(err.message, "err");
  }
}

// ---------------------------------------------------------------- SSE

function setStream(label, cls) {
  setText($("stream-label"), label);
  $("stream-dot").className = `dot ${cls}`;
}

function connectStream() {
  const source = new EventSource("/api/events");

  source.addEventListener("open", () => setStream("live", "bg-ok dot-live"));
  source.addEventListener("error", () => setStream("reconnecting", "bg-err"));

  source.addEventListener("message", (raw) => {
    let event;
    try { event = JSON.parse(raw.data); } catch { return; }

    // Anything the current channel did not produce is still worth counting, but
    // must not appear in this transcript.
    const mine = !event.channel || event.channel === state.channel;

    switch (event.type) {
      case "heartbeat":
      case "dashboard_sync":
        setStream("live", "bg-ok dot-live");
        break;

      case "text": if (mine) streamText(event.personaId, event.text); break;
      case "tool_use": if (mine) appendToolUse(event); break;
      case "tool_result": if (mine) appendToolResult(event); break;
      case "team_update": if (mine) appendTeamUpdate(event); break;
      case "error":
        state.busy.delete(event.personaId);
        if (mine) appendError(event);
        else { state.alerts.unshift({ personaId: event.personaId, message: event.message, at: new Date().toISOString() }); renderAlerts(); }
        renderRoster();
        refreshStatusChip();
        break;

      case "mention_chain": if (mine) appendChainNotice(event); break;
      case "hop_start": state.busy.add(event.personaId); renderRoster(); refreshStatusChip(); break;

      case "done":
        state.busy.delete(event.personaId);
        state.streamBubbles.delete(event.personaId);
        renderRoster();
        refreshStatusChip();
        if (!$("drawer").hidden) renderDrawer();
        break;

      case "approval_requested":
        state.approvals.push(event.approval);
        renderApprovals();
        notifyDesktop(event.approval);
        toast(`${persona(event.approval.personaId).name} needs a decision`, "warn");
        break;

      case "approval_resolved":
        state.approvals = state.approvals.filter((a) => a.id !== event.id);
        renderApprovals();
        if (event.timedOut) toast("A request timed out and was denied", "warn");
        break;

      case "board_updated":
        loadRoster();
        if (state.view === "tasks") loadBoard();
        if (state.view === "changelog") loadChangelog();
        break;

      case "calendar_updated":
        if (state.view === "calendar") loadCalendar();
        break;

      case "changelog_updated":
        if (state.view === "changelog") loadChangelog();
        break;

      default: break;
    }
  });
}

// ---------------------------------------------------------------- boot

async function loadRoster() {
  try {
    const roster = await api("/api/roster");
    state.roster = new Map(roster.map((r) => [r.id, r.activeTasks || []]));
    renderRoster();
    refreshStatusChip();
    if (state.view === "team") renderTeamList();
    if (!$("drawer").hidden) renderDrawer();
  } catch (err) {
    console.error("roster load failed", err);
  }
}

function wireEvents() {
  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  }

  $("agent-search").addEventListener("input", renderRoster);

  $("rail-toggle").addEventListener("click", () => {
    const rail = $("rail");
    const open = rail.hidden;
    rail.hidden = !open;
    $("rail-toggle").setAttribute("aria-pressed", String(open));
  });

  $("drawer-toggle").addEventListener("click", () => setDrawer($("drawer").hidden));
  $("drawer-close").addEventListener("click", () => setDrawer(false));

  const input = $("chat-input");
  input.addEventListener("input", () => { autoGrow(); updateMentionPopover(); updateRecipients(); });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); send(input.value); }
    if (ev.key === "Escape") $("mention-popover").hidden = true;
  });
  $("composer").addEventListener("submit", (ev) => { ev.preventDefault(); send(input.value); });

  $("history-menu-btn").addEventListener("click", () => {
    const menu = $("history-menu");
    menu.hidden = !menu.hidden;
    $("history-menu-btn").setAttribute("aria-expanded", String(!menu.hidden));
  });
  document.addEventListener("click", (ev) => {
    if (!$("history-menu").hidden && !ev.target.closest("#history-menu, #history-menu-btn")) {
      $("history-menu").hidden = true;
      $("history-menu-btn").setAttribute("aria-expanded", "false");
    }
  });

  $("clear-chat-btn").addEventListener("click", async () => {
    $("history-menu").hidden = true;
    try {
      await api("/api/transcript/clear", { method: "POST", body: JSON.stringify({ channel: state.channel }) });
      loadTranscript();
      toast("Conversation cleared");
    } catch (err) { toast(err.message, "err"); }
  });

  $("reconcile-btn").addEventListener("click", async () => {
    $("history-menu").hidden = true;
    try {
      const { job } = await api("/api/transcript/reconcile", { method: "POST", body: JSON.stringify({ channel: state.channel }) });
      toast("Archie is reconciling this history");
      pollReconcile(job.id);
    } catch (err) { toast(err.message, "err"); }
  });

  for (const btn of document.querySelectorAll("[data-close-overlay]")) {
    btn.addEventListener("click", () => { $(btn.dataset.closeOverlay).hidden = true; });
  }
  for (const overlay of document.querySelectorAll(".overlay")) {
    overlay.addEventListener("click", (ev) => { if (ev.target === overlay) overlay.hidden = true; });
  }
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    for (const overlay of document.querySelectorAll(".overlay")) overlay.hidden = true;
  });

  $("new-task-btn").addEventListener("click", openTaskModal);
  $("tasks-new").addEventListener("click", openTaskModal);
  $("task-form").addEventListener("submit", submitTask);

  $("home-btn").addEventListener("click", () => showView("chat"));

  $("digest-send").addEventListener("click", async () => {
    const btn = $("digest-send");
    const notice = $("digest-notice");
    btn.disabled = true;
    notice.hidden = true;
    const ok = "border:1px solid color-mix(in oklab, var(--c-ok) 40%, transparent);background:var(--c-ok-soft);color:var(--c-ok)";
    const bad = "border:1px solid color-mix(in oklab, var(--c-err) 40%, transparent);background:var(--c-err-soft);color:var(--c-err)";
    try {
      const result = await api("/api/digest/send", { method: "POST" });
      notice.setAttribute("style", ok);
      setText(notice, `Sent: ${result.subject}`);
    } catch (err) {
      notice.setAttribute("style", bad);
      setText(notice, err.message);
    } finally {
      notice.hidden = false;
      btn.disabled = false;
    }
  });

  $("interrupt-all").addEventListener("click", () => showView("tasks"));

  $("changelog-publish").addEventListener("click", publishChangelog);
  $("changelog-select-all").addEventListener("click", () => {
    for (const c of state.changelog.candidates) if (!c.blocked?.length) state.changelog.selected.add(c.key);
    renderChangelog();
  });

  const shiftMonth = (by) => {
    const m = state.calendar.month || monthStart(new Date());
    state.calendar.month = new Date(m.getFullYear(), m.getMonth() + by, 1);
    renderCalendar();
  };
  $("calendar-prev").addEventListener("click", () => shiftMonth(-1));
  $("calendar-next").addEventListener("click", () => shiftMonth(1));
  $("calendar-today").addEventListener("click", () => {
    state.calendar.month = monthStart(new Date());
    state.calendar.selected = isoDay(new Date());
    renderCalendar();
  });

  $("profile-toggle").addEventListener("click", openProfile);
  $("field-form").addEventListener("submit", submitField);

  $("preview-toggle").addEventListener("click", openPreview);
  $("preview-start").addEventListener("click", async () => {
    $("preview-start").disabled = true;
    try { await api("/api/preview/start", { method: "POST" }); setTimeout(refreshPreview, 1500); }
    catch (err) { toast(err.message, "err"); $("preview-start").disabled = false; }
  });
}

async function pollReconcile(id) {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const job = await api(`/api/transcript/reconcile/${encodeURIComponent(id)}`);
      if (job.state === "complete") { toast("Archie finished reconciling"); loadTranscript(); return; }
      if (job.state === "error") { toast(job.message, "err"); return; }
    } catch { return; }
  }
}

async function boot() {
  initTheme();
  wireEvents();
  setStream("connecting", "bg-ink-3");

  try {
    state.personas = await api("/api/personas");
    state.byId = new Map(state.personas.map((p) => [p.id, p]));
  } catch (err) {
    setStream("offline", "bg-err");
    toast(err.message, "err");
    return;
  }

  await loadRoster();
  try {
    state.approvals = await api("/api/approvals");
  } catch { /* non-fatal */ }
  renderApprovals();
  renderAlerts();

  selectChannel("team");
  connectStream();
}

boot();
