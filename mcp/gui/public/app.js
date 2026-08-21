const sidebar = document.getElementById("sidebar");
const channelListEl = document.getElementById("channel-list");
const approvalsEl = document.getElementById("approvals");
const approvalsPanel = document.getElementById("approvals-panel");
const agentAlertsPanel = document.getElementById("agent-alerts-panel");
const agentAlertsEl = document.getElementById("agent-alerts");
const bodyLayout = document.getElementById("body-layout");
const logEl = document.getElementById("log");
const emptyState = document.getElementById("empty-state");
const quickRepliesEl = document.getElementById("quick-replies");
const composer = document.getElementById("composer");
const composerError = document.getElementById("composer-error");
const recipientsPreview = document.getElementById("recipients-preview");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");
const mentionBtn = document.getElementById("mention-btn");
const mentionPopover = document.getElementById("mention-popover");
const themeBtn = document.getElementById("theme-btn");
const previewToggle = document.getElementById("preview-toggle");
const previewPane = document.getElementById("preview-pane");
const previewFrame = document.getElementById("preview-frame");
const previewOffline = document.getElementById("preview-offline");
const previewStartBtn = document.getElementById("preview-start-btn");
const previewRefreshBtn = document.getElementById("preview-refresh");
const profileToggle = document.getElementById("profile-toggle");
const profileOverlay = document.getElementById("profile-overlay");
const profileClose = document.getElementById("profile-close");
const profileEmpty = document.getElementById("profile-empty");
const profileListEl = document.getElementById("profile-list");
const agentCountEl = document.getElementById("agent-count");
const activeCountEl = document.getElementById("active-count");
const approvalCountEl = document.getElementById("approval-count");
const signalCountEl = document.getElementById("signal-count");
const studioStatusEl = document.getElementById("studio-status");
const clearChatBtn = document.getElementById("clear-chat");
const reconcileChatBtn = document.getElementById("reconcile-chat");
let reconcilePollTimer = null;

const TEAM_CHANNEL = "team";
const QUICK_REPLIES = ["Yes, go ahead", "Looks good", "Not yet — hold off", "What's the status?", "Can you explain more?", "No, stop."];

let personas = [];
let activeChannel = localStorage.getItem("gui-active-channel") || TEAM_CHANNEL;
const unreadChannels = new Set();
const agentStatuses = new Map();
const agentStatusMessages = new Map();
const agentAlerts = new Map();
const hopsRemainingByChannel = new Map(); // channel -> number of chain hops still in flight
const streaming = new Map(); // personaId -> { textEl, raw } — scoped to whichever channel is currently on screen
const hopIndicators = new Map(); // personaId -> "is replying…" element, live until that hop's first output
const toolCards = new Map(); // tool_use id -> { resultEl }

function isBusy(channel) {
  return (hopsRemainingByChannel.get(channel) || 0) > 0;
}

function channelEntries() {
  return [{ id: TEAM_CHANNEL, name: "Team", role: "Group channel", color: "var(--accent)" }, ...personas];
}

function statusFor(id) {
  return agentStatuses.get(id) || "available";
}

function statusLabel(status) {
  return { available: "Available", working: "Working", attention: "Needs attention", question: "Has a question", "hand-raised": "Hand raised", help: "Immediate help" }[status] || "Available";
}

function updatePulse() {
  const activeCount = [...agentStatuses.values()].filter((status) => status === "working").length;
  const approvalCount = approvalsEl.children.length;
  const signalCount = agentAlerts.size;
  agentCountEl.textContent = String(personas.length);
  activeCountEl.textContent = String(activeCount);
  approvalCountEl.textContent = String(approvalCount);
  signalCountEl.textContent = String(signalCount);
  const urgent = [...agentStatuses.values()].some((status) => status === "help");
  const hasQuestion = [...agentStatuses.values()].some((status) => status === "question");
  const handRaised = [...agentStatuses.values()].some((status) => status === "hand-raised");
  studioStatusEl.textContent = urgent ? "An agent needs immediate help" : handRaised ? "An agent has raised a hand" : hasQuestion ? "An agent has a question" : approvalCount ? "Your approval is needed" : activeCount ? `${activeCount} agent${activeCount === 1 ? " is" : "s are"} working` : "Ready for direction";
}

function setAgentStatus(id, status, message = "") {
  if (!id) return;
  agentStatuses.set(id, status);
  if (message) agentStatusMessages.set(id, message);
  renderChannelList();
  renderAgentAlerts();
  updatePulse();
}

function setAgentAlert(id, status, message) {
  agentAlerts.set(id, { id, status, message });
  setAgentStatus(id, status, message);
}

function clearAgentAlert(id) {
  agentAlerts.delete(id);
  agentStatusMessages.delete(id);
  renderAgentAlerts();
  updatePulse();
}

function renderAgentAlerts() {
  agentAlertsEl.innerHTML = "";
  agentAlertsPanel.hidden = agentAlerts.size === 0;
  for (const alert of agentAlerts.values()) {
    const persona = personaById(alert.id);
    if (!persona) continue;
    const card = document.createElement("div");
    card.className = `agent-alert alert-${alert.status}`;
    card.innerHTML = `<div class="agent-alert-head"><span class="status-dot"></span><strong>${escapeHtml(persona.name)}</strong><span>${escapeHtml(statusLabel(alert.status))}</span></div><p>${escapeHtml(alert.message)}</p><button type="button">Open channel</button>`;
    card.querySelector("button").addEventListener("click", () => switchChannel(alert.id));
    agentAlertsEl.appendChild(card);
  }
}

const TOOL_LABELS = {
  Bash: "ran a command",
  Read: "read a file",
  Write: "wrote a file",
  Edit: "edited a file",
  Glob: "searched files",
  Grep: "searched code",
  ToolSearch: "looked up a tool",
  AskUserQuestion: "asked a question",
};

function toolLabel(tool) {
  if (tool.startsWith("mcp__site__")) return tool.slice("mcp__site__".length);
  return TOOL_LABELS[tool] || tool;
}

function personaById(id) {
  return personas.find((p) => p.id === id);
}

function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

// One small line-icon per persona, reflecting their job — a compass for the
// lead who sets direction, a wrench for DevOps, a quill for copy, and so on.
// Personas without an entry (e.g. a new one someone adds later) fall back to
// their initial letter, same as before this existed.
const AGENT_ICONS = {
  team: '<circle cx="8.5" cy="11" r="3"/><circle cx="15.5" cy="11" r="3"/><path d="M3.5 19c.5-2.7 2.3-4.3 5-4.3s4.5 1.6 5 4.3M10.5 19c.5-2.7 2.3-4.3 5-4.3s4.5 1.6 5 4.3"/>',
  shepard: '<circle cx="12" cy="12" r="8"/><path d="M12 8l2.2 3.8-2.2 3.8-2.2-3.8z"/>',
  desiree: '<rect x="7" y="7" width="10" height="10" rx="1.5" transform="rotate(45 12 12)"/>',
  devon:
    '<path d="M14.2 6.2a3.6 3.6 0 00-4.9 4.9L4 16.4 7.6 20l5.3-5.3a3.6 3.6 0 004.9-4.9l-2.1 2.1-2.6-2.6z"/>',
  quill:
    '<path d="M4.5 19.5l2.6-.9L16.4 9.3a1.9 1.9 0 00-2.7-2.7L4.4 16.9z"/><path d="M13 7.3l3.7 3.7"/>',
  ace: '<circle cx="12" cy="12" r="8"/><path d="M8.3 12.4l2.5 2.5 5-5.2"/>',
  ledger: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  ryder:
    '<rect x="9.3" y="3" width="5.4" height="10.5" rx="2.7"/><path d="M6.3 11a5.7 5.7 0 0011.4 0"/><path d="M12 16.5V20M9.3 20h5.4"/>',
};

function avatarInner(persona) {
  const path = persona && AGENT_ICONS[persona.id];
  if (!path) return escapeHtml(initial(persona?.name));
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return html;
}

function setEmptyState() {
  const hasMessages = logEl.querySelector(".msg") !== null;
  emptyState.style.display = hasMessages ? "none" : "flex";
}

function prettyValue(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function attachReasoningToggle(msgEl, reasoning) {
  if (!reasoning) return;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "reasoning-toggle";
  toggle.textContent = "Why?";
  const detail = document.createElement("div");
  detail.className = "reasoning-detail";
  detail.hidden = true;
  detail.innerHTML = `<p>${escapeHtml(reasoning)}</p>`;
  toggle.addEventListener("click", () => {
    detail.hidden = !detail.hidden;
    toggle.classList.toggle("open", !detail.hidden);
  });
  msgEl.appendChild(toggle);
  msgEl.appendChild(detail);
}

// ---------- theme ----------

function setTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  themeBtn.textContent = mode === "dark" ? "Light" : "Dark";
  localStorage.setItem("gui-theme", mode);
}

(function initTheme() {
  const saved = localStorage.getItem("gui-theme");
  const preferred = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(preferred);
})();

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

// ---------- live preview ----------

let previewPollTimer = null;

function setPreviewOpen(open) {
  previewPane.hidden = !open;
  previewToggle.setAttribute("aria-pressed", String(open));
  if (open) {
    refreshPreviewStatus();
    if (!previewPollTimer) previewPollTimer = setInterval(refreshPreviewStatus, 4000);
  } else if (previewPollTimer) {
    clearInterval(previewPollTimer);
    previewPollTimer = null;
  }
}

function restorePreviewGeometry() {
  const saved = localStorage.getItem("gui-preview-geometry");
  if (!saved) return;
  try {
    const { top, left, width, height } = JSON.parse(saved);
    Object.assign(previewPane.style, { top, left, right: "auto", width, height });
  } catch {
    // ignore malformed saved geometry
  }
}

function savePreviewGeometry() {
  const { top, left, width, height } = previewPane.style;
  localStorage.setItem("gui-preview-geometry", JSON.stringify({ top, left, width, height }));
}

function initPreviewDrag() {
  const handle = document.getElementById("preview-drag-handle");
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startTop = 0;
  let startLeft = 0;

  handle.addEventListener("mousedown", (e) => {
    if (e.target.closest("button, a")) return;
    dragging = true;
    const rect = previewPane.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startTop = rect.top;
    startLeft = rect.left;
    previewPane.style.right = "auto";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const maxLeft = window.innerWidth - previewPane.offsetWidth - 4;
    const maxTop = window.innerHeight - 40;
    const nextLeft = Math.min(Math.max(4, startLeft + (e.clientX - startX)), Math.max(4, maxLeft));
    const nextTop = Math.min(Math.max(4, startTop + (e.clientY - startY)), maxTop);
    previewPane.style.left = `${nextLeft}px`;
    previewPane.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    savePreviewGeometry();
  });

  new ResizeObserver(() => {
    if (!previewPane.hidden) savePreviewGeometry();
  }).observe(previewPane);
}

async function refreshPreviewStatus() {
  try {
    const res = await fetch("/api/preview/status");
    const data = await res.json();
    if (data.running) {
      previewOffline.hidden = true;
      previewFrame.hidden = false;
      if (!previewFrame.src) previewFrame.src = data.url;
    } else {
      previewOffline.hidden = false;
      previewFrame.hidden = true;
    }
  } catch {
    // server hiccup; try again on next poll
  }
}

previewToggle.addEventListener("click", () => {
  setPreviewOpen(previewPane.hidden);
});

previewStartBtn.addEventListener("click", async () => {
  previewStartBtn.disabled = true;
  previewStartBtn.textContent = "Starting…";
  await fetch("/api/preview/start", { method: "POST" });
  await refreshPreviewStatus();
  previewStartBtn.disabled = false;
  previewStartBtn.textContent = "Start preview";
});

previewRefreshBtn.addEventListener("click", () => {
  if (previewFrame.src) previewFrame.src = previewFrame.src;
});

document.getElementById("preview-close").addEventListener("click", () => setPreviewOpen(false));

restorePreviewGeometry();
initPreviewDrag();

// ---------- profile ----------

const CATEGORY_LABELS = {
  "communication-style": "Communication style",
  "decision-patterns": "Decision patterns",
  priorities: "Priorities",
  "technical-preferences": "Technical preferences",
  "working-style": "Working style",
};

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function renderProfile(observations) {
  profileListEl.innerHTML = "";
  profileEmpty.style.display = observations.length ? "none" : "block";

  for (const obs of observations) {
    const row = document.createElement("div");
    row.className = "profile-row";
    const evidence = obs.evidence ? `<p class="profile-evidence">“${escapeHtml(obs.evidence)}”</p>` : "";
    row.innerHTML = `
      <div class="profile-row-head">
        <span class="profile-category">${escapeHtml(categoryLabel(obs.category))}</span>
        <span class="profile-count">confirmed ×${obs.timesConfirmed}</span>
      </div>
      <p class="profile-text">${escapeHtml(obs.text)}</p>
      ${evidence}
      <p class="profile-meta">Noted by ${escapeHtml(obs.notedBy.join(", "))}</p>
    `;
    profileListEl.appendChild(row);
  }
}

async function openProfile() {
  profileOverlay.hidden = false;
  try {
    const res = await fetch("/api/profile");
    renderProfile(await res.json());
  } catch {
    profileEmpty.textContent = "Couldn't load the profile — server hiccup.";
    profileEmpty.style.display = "block";
  }
}

function closeProfile() {
  profileOverlay.hidden = true;
}

profileToggle.addEventListener("click", () => {
  profileToggle.setAttribute("aria-pressed", String(profileOverlay.hidden));
  if (profileOverlay.hidden) openProfile();
  else closeProfile();
});

profileClose.addEventListener("click", () => {
  profileToggle.setAttribute("aria-pressed", "false");
  closeProfile();
});

profileOverlay.addEventListener("click", (e) => {
  if (e.target === profileOverlay) {
    profileToggle.setAttribute("aria-pressed", "false");
    closeProfile();
  }
});

// ---------- @mentions ----------

let popoverMatches = [];
let popoverIndex = 0;
let popoverAnchor = null; // {start, end} span of the composer text a selected match replaces

function matchPersonas(query) {
  const q = query.toLowerCase();
  return personas.filter((p) => p.name.toLowerCase().startsWith(q) || p.id.startsWith(q));
}

function currentMentionQuery() {
  const pos = input.selectionStart;
  const upToCursor = input.value.slice(0, pos);
  const at = upToCursor.lastIndexOf("@");
  if (at === -1) return null;
  const between = upToCursor.slice(at + 1);
  if (/\s/.test(between)) return null;
  return { start: at, end: pos, query: between };
}

function closeMentionPopover() {
  popoverMatches = [];
  popoverAnchor = null;
  mentionPopover.hidden = true;
  mentionPopover.innerHTML = "";
}

function renderMentionPopover() {
  if (!popoverMatches.length) {
    closeMentionPopover();
    return;
  }
  mentionPopover.innerHTML = "";
  popoverMatches.forEach((p, i) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "mention-row" + (i === popoverIndex ? " active" : "");
    row.innerHTML = `
      <span class="avatar" style="background:${p.color}">${avatarInner(p)}</span>
      <span class="mention-info">
        <span class="mention-name">${p.name}</span>
        <span class="mention-role">${p.role}</span>
      </span>
    `;
    row.addEventListener("mousedown", (e) => {
      e.preventDefault();
      insertMention(p);
    });
    mentionPopover.appendChild(row);
  });
  mentionPopover.hidden = false;
}

function openMentionPopover(matches, anchor) {
  popoverMatches = matches;
  popoverIndex = 0;
  popoverAnchor = anchor;
  renderMentionPopover();
}

function insertMention(persona) {
  const text = input.value;
  const anchor = popoverAnchor ?? { start: input.selectionStart, end: input.selectionStart };
  const before = text.slice(0, anchor.start);
  const after = text.slice(anchor.end);
  const insertText = `@${persona.name} `;
  input.value = before + insertText + after;
  const cursor = before.length + insertText.length;
  input.setSelectionRange(cursor, cursor);
  closeMentionPopover();
  input.focus();
  updateRecipientsPreview();
}

mentionBtn.addEventListener("click", () => {
  if (!mentionPopover.hidden) {
    closeMentionPopover();
    return;
  }
  const pos = input.selectionStart;
  input.focus();
  openMentionPopover(matchPersonas(""), { start: pos, end: pos });
});

function extractMentions(text) {
  const found = [];
  const seen = new Set();
  const re = /@([a-zA-Z]+)/g;
  let m;
  while ((m = re.exec(text))) {
    const persona = personaByToken(m[1]);
    if (persona && !seen.has(persona.id)) {
      seen.add(persona.id);
      found.push(persona);
    }
  }
  return found;
}

function personaByToken(token) {
  const t = token.toLowerCase();
  return personas.find((p) => p.id.toLowerCase() === t || p.name.toLowerCase() === t);
}

function updateRecipientsPreview() {
  const chain = extractMentions(input.value);
  if (!chain.length) {
    recipientsPreview.hidden = true;
    return;
  }
  recipientsPreview.hidden = false;
  const arrow = ' <span class="chain-arrow">→</span> ';
  recipientsPreview.innerHTML =
    "To " + chain.map((p) => `<span class="recipient-pill" style="color:${p.color}">${escapeHtml(p.name)}</span>`).join(chain.length > 1 ? arrow : "");
}

// ---------- chat log ----------

function addMessage(kind, who, persona, when) {
  const color = persona?.color;
  const avatar = persona ? `<span class="msg-avatar" style="background:${color}">${avatarInner(persona)}</span>` : "";
  const div = document.createElement("div");
  div.className = `msg ${kind}`;
  div.innerHTML = `
    <div class="head">
      ${avatar}
      <span class="who" style="${color ? `color:${color}` : ""}">${who}</span>
      <span class="time">${formatTime(when ?? new Date())}</span>
    </div>
    <div class="text"></div>
  `;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  setEmptyState();
  return div.querySelector(".text");
}

function addToolCard(event) {
  const div = document.createElement("div");
  div.className = "msg tool";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "tool-toggle";
  toggle.innerHTML = `<span class="chevron">▸</span><span class="tool-label">→ ${escapeHtml(toolLabel(event.tool))}</span>`;

  const detail = document.createElement("div");
  detail.className = "tool-detail";
  detail.hidden = true;

  if (event.reasoning) {
    detail.innerHTML += `
      <div class="tool-section">
        <p class="tool-section-label">Why</p>
        <p class="tool-reasoning">${escapeHtml(event.reasoning)}</p>
      </div>`;
  }

  const inputStr = prettyValue(event.input);
  detail.innerHTML += `
    <div class="tool-section">
      <p class="tool-section-label">Input</p>
      <pre class="tool-io">${inputStr ? escapeHtml(inputStr) : "(none)"}</pre>
    </div>
    <div class="tool-section">
      <p class="tool-section-label">Result</p>
      <pre class="tool-io tool-result-io">waiting…</pre>
    </div>`;

  toggle.addEventListener("click", () => {
    detail.hidden = !detail.hidden;
    toggle.classList.toggle("open", !detail.hidden);
  });

  div.appendChild(toggle);
  div.appendChild(detail);
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  setEmptyState();

  if (event.id) toolCards.set(event.id, { resultEl: detail.querySelector(".tool-result-io") });
}

function addTeamNote(event) {
  const div = document.createElement("div");
  div.className = "msg team-note";
  const affects = event.affects && event.affects.length ? ` <span class="affects">→ ${event.affects.map(escapeHtml).join(", ")}</span>` : "";
  div.innerHTML = `
    <span class="team-note-icon">◆</span>
    <span class="team-note-body"><strong>${escapeHtml(event.agent)}</strong> to the team: ${escapeHtml(event.message)}${affects}</span>
  `;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  setEmptyState();
}

function addChainBanner(chain, routed) {
  const names = chain.map((id) => personaById(id)?.name ?? id);
  const div = document.createElement("div");
  div.className = "msg chain-banner";
  const verb = routed ? "Routed to" : "Tagged";
  div.innerHTML =
    names.length > 1
      ? `<span class="team-note-icon">◆</span> ${verb} in order: ${names.map(escapeHtml).join(" → ")}`
      : `<span class="team-note-icon">◆</span> ${verb} ${escapeHtml(names[0] ?? "")}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  setEmptyState();
}

function showHopIndicator(personaId) {
  const persona = personaById(personaId);
  const div = document.createElement("div");
  div.className = "msg hop-indicator";
  div.style.color = persona?.color ?? "";
  const avatar = persona ? `<span class="msg-avatar" style="background:${persona.color}">${avatarInner(persona)}</span>` : "";
  div.innerHTML = `${avatar}${escapeHtml(persona?.name ?? personaId)} is replying…`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  hopIndicators.set(personaId, div);
}

function clearHopIndicator(personaId) {
  const el = hopIndicators.get(personaId);
  if (el) el.remove();
  hopIndicators.delete(personaId);
}

function fillToolResult(id, result) {
  const card = toolCards.get(id);
  if (!card) return;
  card.resultEl.textContent = result && result.trim() ? result : "(empty)";
}

// ---------- channels ----------

function renderChannelList() {
  channelListEl.innerHTML = "";
  for (const entry of channelEntries()) {
    const status = statusFor(entry.id);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "channel-row" + (entry.id === activeChannel ? " active" : "");
    row.dataset.channel = entry.id;
    row.innerHTML = `
      <span class="avatar" style="background:${entry.color}">${avatarInner(entry)}</span>
      <span class="channel-copy"><span class="channel-name">${escapeHtml(entry.name)}</span><span class="channel-role">${escapeHtml(entry.role)}</span></span>
      <span class="agent-status status-${status}" title="${escapeHtml(agentStatusMessages.get(entry.id) || statusLabel(status))}"><span class="status-dot"></span>${statusLabel(status)}</span>
      ${unreadChannels.has(entry.id) ? '<span class="unread-dot" aria-label="Unread"></span>' : ""}
    `;
    row.addEventListener("click", () => switchChannel(entry.id));
    channelListEl.appendChild(row);
  }
}

function clearLog() {
  logEl.innerHTML = "";
  logEl.appendChild(emptyState);
  setEmptyState();
}

function historyActionLabel() {
  return activeChannel === TEAM_CHANNEL ? "team chat" : `${personaById(activeChannel)?.name ?? activeChannel} chat`;
}

async function clearChat() {
  if (!window.confirm(`Clear ${historyActionLabel()} history? This cannot be undone.`)) return;
  clearChatBtn.disabled = true;
  reconcileChatBtn.disabled = true;
  try {
    const res = await fetch("/api/transcript/clear", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: activeChannel }) });
    if (!res.ok) throw new Error("The chat history could not be cleared.");
    clearLog();
  } catch (err) {
    setComposerError(err instanceof Error ? err.message : "The chat history could not be cleared.");
  } finally {
    clearChatBtn.disabled = false;
    reconcileChatBtn.disabled = false;
  }
}

async function reconcileAndClearChat() {
  if (!window.confirm(`Ask Ledger to reconcile ${historyActionLabel()} against the current repository, then clear the history?`)) return;
  clearChatBtn.disabled = true;
  reconcileChatBtn.disabled = true;
  studioStatusEl.textContent = "Ledger is reconciling history";
  reconcileChatBtn.textContent = "Starting…";
  try {
    const res = await fetch("/api/transcript/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: activeChannel }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ledger could not reconcile this history.");
    await watchReconcile(data.job.id);
  } catch (err) {
    setComposerError(err instanceof Error ? err.message : "Ledger could not reconcile this history.");
    studioStatusEl.textContent = "Reconciliation needs attention";
    reconcileChatBtn.textContent = "Reconcile & clear";
  } finally {
    clearChatBtn.disabled = false;
    if (!reconcilePollTimer) reconcileChatBtn.disabled = false;
    updatePulse();
  }
}

async function watchReconcile(jobId) {
  const started = Date.now();
  const finish = (success, message) => {
    reconcilePollTimer = null;
    clearChatBtn.disabled = false;
    reconcileChatBtn.disabled = false;
    reconcileChatBtn.textContent = "Reconcile & clear";
    studioStatusEl.textContent = message;
    if (success) clearLog();
    else setComposerError(message);
  };
  const poll = async () => {
    try {
      const res = await fetch(`/api/transcript/reconcile/${encodeURIComponent(jobId)}`);
      const job = await res.json();
      const elapsed = Math.max(1, Math.round((Date.now() - started) / 1000));
      reconcileChatBtn.textContent = `${job.state === "waiting" ? "Waiting" : "Working"}… ${elapsed}s`;
      studioStatusEl.textContent = job.message;
      if (job.state === "complete") return finish(true, job.message);
      if (job.state === "error") return finish(false, job.message);
      reconcilePollTimer = setTimeout(poll, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not read reconciliation status.";
      finish(false, message);
    }
  };
  await poll();
}

clearChatBtn.addEventListener("click", clearChat);
reconcileChatBtn.addEventListener("click", reconcileAndClearChat);

function applyHistoryEvent(channel, event, ts) {
  const when = ts ? new Date(ts) : new Date();
  if (event.type === "user_message") {
    addMessage("user", "You", null, when).textContent = event.text;
    return;
  }
  handleEvent({ ...event, channel }, when);
}

function applyChannelAccent(id) {
  const color = id === TEAM_CHANNEL ? null : personaById(id)?.color;
  if (color) document.documentElement.style.setProperty("--channel-accent", color);
  else document.documentElement.style.removeProperty("--channel-accent");
}

async function switchChannel(id) {
  if (id !== activeChannel) {
    activeChannel = id;
    localStorage.setItem("gui-active-channel", id);
  }
  unreadChannels.delete(id);
  streaming.clear();
  hopIndicators.clear();
  toolCards.clear();
  closeMentionPopover();
  clearLog();
  applyChannelAccent(id);
  updateComposerState();
  renderChannelList();

  try {
    const res = await fetch(`/api/transcript?channel=${encodeURIComponent(id)}`);
    const lines = await res.json();
    for (const line of lines) applyHistoryEvent(line.channel, line.event, line.ts);
  } catch {
    // server hiccup; channel just opens empty
  }
}

function renderQuickReplies() {
  quickRepliesEl.innerHTML = "";
  for (const text of QUICK_REPLIES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "quick-reply-chip";
    chip.textContent = text;
    chip.addEventListener("click", () => {
      input.value = text;
      input.dispatchEvent(new Event("input"));
      input.focus();
    });
    quickRepliesEl.appendChild(chip);
  }
}

// ---------- approvals ----------

function renderApprovals(list) {
  approvalsEl.innerHTML = "";
  for (const approval of list) approvalsEl.appendChild(approvalCard(approval));
  approvalsPanel.hidden = list.length === 0;
  updatePulse();
}

function approvalCard(approval) {
  const card = document.createElement("div");
  card.className = "approval-card";
  card.dataset.id = approval.id;
  card.dataset.personaId = approval.personaId;
  const who = personaById(approval.personaId)?.name ?? approval.personaId;
  card.innerHTML = `
    <div class="reason">${escapeHtml(who)} wants to: ${escapeHtml(approval.reason)}</div>
    <div class="detail">${escapeHtml(approval.detail)}</div>
    <div class="buttons">
      <button type="button" class="approve">Approve</button>
      <button type="button" class="deny">Deny</button>
    </div>
  `;
  card.querySelector(".approve").addEventListener("click", () => respond(approval.id, true));
  card.querySelector(".deny").addEventListener("click", () => respond(approval.id, false));
  return card;
}

async function respond(id, approve) {
  await fetch(`/api/approvals/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approve }),
  });
}

// ---------- composer ----------

function setComposerError(message) {
  if (!message) {
    composerError.hidden = true;
    composerError.textContent = "";
    return;
  }
  composerError.hidden = false;
  composerError.textContent = message;
}

function updateComposerState() {
  const busy = isBusy(activeChannel);
  input.disabled = busy;
  sendBtn.disabled = busy;
  mentionBtn.style.display = activeChannel === TEAM_CHANNEL ? "" : "none";
  if (busy) {
    input.placeholder = "Replying…";
  } else if (activeChannel === TEAM_CHANNEL) {
    input.placeholder = "Tag someone with @, or just ask…";
  } else {
    input.placeholder = `Message ${personaById(activeChannel)?.name ?? "agent"}…`;
  }
}

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
  setComposerError(null);
  if (activeChannel !== TEAM_CHANNEL) return;

  updateRecipientsPreview();

  const mention = currentMentionQuery();
  if (mention) {
    openMentionPopover(matchPersonas(mention.query), { start: mention.start, end: mention.end });
  } else {
    closeMentionPopover();
  }
});

input.addEventListener("keydown", (e) => {
  if (!mentionPopover.hidden && popoverMatches.length) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      popoverIndex = (popoverIndex + 1) % popoverMatches.length;
      renderMentionPopover();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      popoverIndex = (popoverIndex - 1 + popoverMatches.length) % popoverMatches.length;
      renderMentionPopover();
      return;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(popoverMatches[popoverIndex]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeMentionPopover();
      return;
    }
  }

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

document.addEventListener("click", (e) => {
  if (!mentionPopover.hidden && !mentionPopover.contains(e.target) && e.target !== input && e.target !== mentionBtn) {
    closeMentionPopover();
  }
});

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  const channel = activeChannel;
  if (!message || isBusy(channel)) return;
  closeMentionPopover();
  setComposerError(null);

  input.disabled = true;
  sendBtn.disabled = true;
  if (channel === TEAM_CHANNEL && extractMentions(message).length === 0) {
    input.placeholder = "Finding the right person to answer…";
  }

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, channel }),
  });
  const data = await res.json();

  if (!res.ok) {
    setComposerError(data.error || "Couldn't send that.");
    updateComposerState();
    return;
  }

  input.value = "";
  input.style.height = "auto";
  recipientsPreview.hidden = true;

  const userMsg = addMessage("user", "You", null);
  if (channel === TEAM_CHANNEL) {
    userMsg.textContent =
      message
        .replace(/@([a-zA-Z]+)/g, (m, w) => (personaByToken(w) ? "" : m))
        .replace(/[ \t]+/g, " ")
        .replace(/\s+([.,!?])/g, "$1")
        .trim() || message;
    const chainPersonas = data.chain.map((id) => personaById(id)).filter(Boolean);
    const recipientsLine = document.createElement("div");
    recipientsLine.className = "affects";
    recipientsLine.textContent = "→ " + chainPersonas.map((p) => p.name).join(" → ");
    userMsg.parentElement.appendChild(recipientsLine);
  } else {
    userMsg.textContent = message;
  }

  hopsRemainingByChannel.set(channel, data.chain.length);
  updateComposerState();
});

// ---------- data + events ----------

async function loadPersonas() {
  const res = await fetch("/api/personas");
  personas = await res.json();
  renderChannelList();
  updateComposerState();
}

async function loadApprovals() {
  const res = await fetch("/api/approvals");
  renderApprovals(await res.json());
}

function connectEvents() {
  const source = new EventSource("/api/events");
  source.onmessage = (evt) => handleEvent(JSON.parse(evt.data));
}

function endHop(channel) {
  const remaining = Math.max(0, (hopsRemainingByChannel.get(channel) || 0) - 1);
  hopsRemainingByChannel.set(channel, remaining);
  if (channel === activeChannel) updateComposerState();
}

function handleEvent(event, when) {
  if (event.type === "approval_requested") {
    approvalsPanel.hidden = false;
    approvalsEl.appendChild(approvalCard(event.approval));
    setAgentAlert(event.approval.personaId, "hand-raised", `${event.approval.reason}. Your approval is needed.`);
    return;
  }
  if (event.type === "approval_resolved") {
    const card = approvalsEl.querySelector(`[data-id="${event.id}"]`);
    if (event.timedOut) {
      const personaId = card?.dataset.personaId;
      const who = (personaId && personaById(personaId)?.name) ?? personaId ?? "An agent";
      addMessage("error", who, null).textContent = `${who}'s request timed out waiting for a response and was denied automatically.`;
    }
    if (card) card.remove();
    approvalsPanel.hidden = approvalsEl.children.length === 0;
    const personaId = card?.dataset.personaId;
    if (personaId) {
      clearAgentAlert(personaId);
      setAgentStatus(personaId, event.approved ? "working" : "attention", event.approved ? "Approval received; continuing." : "Approval was denied.");
    }
    return;
  }

  // Team is the union view (everything, not just multi-agent chains), so any
  // channel's events are visible there — only a persona channel is exclusive
  // to its own events.
  const ch = event.channel;
  const visible = activeChannel === TEAM_CHANNEL || ch === activeChannel;
  if (ch && !visible) {
    // Off-screen from here — keep busy-state bookkeeping honest, but don't render.
    if (event.type === "done" || event.type === "error") endHop(ch);
    if (event.type !== "hop_start" && event.type !== "mention_chain") {
      unreadChannels.add(ch);
      renderChannelList();
    }
    return;
  }

  const persona = personaById(event.personaId);
  const who = persona?.name ?? event.personaId ?? "agent";

  if (event.personaId) {
    if (event.type === "hop_start" || event.type === "text") setAgentStatus(event.personaId, "working", "Working on your request.");
    if (event.type === "tool_use" && event.tool === "AskUserQuestion") setAgentAlert(event.personaId, "question", "Ledger needs an answer before continuing.");
    else if (event.type === "tool_use") setAgentStatus(event.personaId, "working", `Using ${toolLabel(event.tool)}.`);
    if (event.type === "done") {
      clearAgentAlert(event.personaId);
      setAgentStatus(event.personaId, "available", "Ready for another request.");
    }
    if (event.type === "error") setAgentAlert(event.personaId, "help", event.message || "The agent encountered an error.");
  }

  if (event.type === "mention_chain") {
    addChainBanner(event.chain, event.routed);
  } else if (event.type === "hop_start") {
    showHopIndicator(event.personaId);
  } else if (event.type === "text") {
    clearHopIndicator(event.personaId);
    let entry = streaming.get(event.personaId);
    if (!entry) {
      const textEl = addMessage("agent", who, persona, when);
      textEl.classList.add("streaming-cursor");
      entry = { textEl, raw: "" };
      streaming.set(event.personaId, entry);
    }
    entry.raw += event.text;
    entry.textEl.innerHTML = renderInline(entry.raw);
    logEl.scrollTop = logEl.scrollHeight;
  } else if (event.type === "tool_use") {
    clearHopIndicator(event.personaId);
    addToolCard(event);
  } else if (event.type === "tool_result") {
    fillToolResult(event.id, event.result);
  } else if (event.type === "team_update") {
    addTeamNote(event);
  } else if (event.type === "done") {
    clearHopIndicator(event.personaId);
    const entry = streaming.get(event.personaId);
    if (entry) {
      entry.textEl.classList.remove("streaming-cursor");
      attachReasoningToggle(entry.textEl.parentElement, event.reasoning);
    }
    streaming.delete(event.personaId);
    endHop(ch);
  } else if (event.type === "error") {
    clearHopIndicator(event.personaId);
    addMessage("error", who, null, when).textContent = event.message;
    const entry = streaming.get(event.personaId);
    if (entry) entry.textEl.classList.remove("streaming-cursor");
    streaming.delete(event.personaId);
    endHop(ch);
  }
}

async function bootstrap() {
  await loadPersonas();
  renderQuickReplies();
  await switchChannel(activeChannel);
  loadApprovals();
  connectEvents();
}

bootstrap();
