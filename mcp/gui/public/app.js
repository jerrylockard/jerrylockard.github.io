const sidebar = document.getElementById("sidebar");
const approvalsEl = document.getElementById("approvals");
const approvalsPanel = document.getElementById("approvals-panel");
const bodyLayout = document.getElementById("body-layout");
const logEl = document.getElementById("log");
const emptyState = document.getElementById("empty-state");
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

let personas = [];
let chatBusy = false;
let hopsRemaining = 0;
const streaming = new Map(); // personaId -> { textEl, raw }
const hopIndicators = new Map(); // personaId -> "is replying…" element, live until that hop's first output
const toolCards = new Map(); // tool_use id -> { resultEl }

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
      <span class="avatar" style="background:${p.color}">${initial(p.name)}</span>
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

function addMessage(kind, who, color) {
  const div = document.createElement("div");
  div.className = `msg ${kind}`;
  div.innerHTML = `
    <div class="head">
      <span class="who" style="${color ? `color:${color}` : ""}">${who}</span>
      <span class="time">${formatTime(new Date())}</span>
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

function addChainBanner(chain) {
  const names = chain.map((id) => personaById(id)?.name ?? id);
  const div = document.createElement("div");
  div.className = "msg chain-banner";
  div.innerHTML =
    names.length > 1
      ? `<span class="team-note-icon">◆</span> Tagged in order: ${names.map(escapeHtml).join(" → ")}`
      : `<span class="team-note-icon">◆</span> Tagged ${escapeHtml(names[0] ?? "")}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  setEmptyState();
}

function showHopIndicator(personaId) {
  const persona = personaById(personaId);
  const div = document.createElement("div");
  div.className = "msg hop-indicator";
  div.style.color = persona?.color ?? "";
  div.textContent = `${persona?.name ?? personaId} is replying…`;
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

// ---------- approvals ----------

function syncSidebarVisibility() {
  sidebar.hidden = approvalsPanel.hidden;
  bodyLayout.classList.toggle("no-sidebar", approvalsPanel.hidden);
}

function renderApprovals(list) {
  approvalsEl.innerHTML = "";
  for (const approval of list) approvalsEl.appendChild(approvalCard(approval));
  approvalsPanel.hidden = list.length === 0;
  syncSidebarVisibility();
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
  input.disabled = chatBusy;
  sendBtn.disabled = chatBusy;
  input.placeholder = chatBusy ? "Team is replying…" : "Tag someone with @, then say hello…";
}

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
  setComposerError(null);
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
  if (!message || chatBusy) return;
  closeMentionPopover();
  setComposerError(null);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();

  if (!res.ok) {
    setComposerError(data.error || "Couldn't send that.");
    return;
  }

  input.value = "";
  input.style.height = "auto";
  recipientsPreview.hidden = true;

  const chainPersonas = data.chain.map((id) => personaById(id)).filter(Boolean);
  const userMsg = addMessage("user", "You", null);
  userMsg.textContent =
    message
      .replace(/@([a-zA-Z]+)/g, (m, w) => (personaByToken(w) ? "" : m))
      .replace(/[ \t]+/g, " ")
      .replace(/\s+([.,!?])/g, "$1")
      .trim() || message;
  const recipientsLine = document.createElement("div");
  recipientsLine.className = "affects";
  recipientsLine.textContent = "→ " + chainPersonas.map((p) => p.name).join(" → ");
  userMsg.parentElement.appendChild(recipientsLine);

  chatBusy = true;
  hopsRemaining = data.chain.length;
  updateComposerState();
});

// ---------- data + events ----------

async function loadPersonas() {
  const res = await fetch("/api/personas");
  personas = await res.json();
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

function endHop() {
  hopsRemaining = Math.max(0, hopsRemaining - 1);
  chatBusy = hopsRemaining > 0;
  updateComposerState();
}

function handleEvent(event) {
  const persona = personaById(event.personaId);
  const who = persona?.name ?? event.personaId ?? "agent";

  if (event.type === "mention_chain") {
    addChainBanner(event.chain);
  } else if (event.type === "hop_start") {
    showHopIndicator(event.personaId);
  } else if (event.type === "text") {
    clearHopIndicator(event.personaId);
    let entry = streaming.get(event.personaId);
    if (!entry) {
      const textEl = addMessage("agent", who, persona?.color);
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
    endHop();
  } else if (event.type === "error") {
    clearHopIndicator(event.personaId);
    addMessage("error", who, null).textContent = event.message;
    const entry = streaming.get(event.personaId);
    if (entry) entry.textEl.classList.remove("streaming-cursor");
    streaming.delete(event.personaId);
    endHop();
  } else if (event.type === "approval_requested") {
    approvalsPanel.hidden = false;
    approvalsEl.appendChild(approvalCard(event.approval));
    syncSidebarVisibility();
  } else if (event.type === "approval_resolved") {
    const card = approvalsEl.querySelector(`[data-id="${event.id}"]`);
    if (event.timedOut) {
      const personaId = card?.dataset.personaId;
      const who = (personaId && personaById(personaId)?.name) ?? personaId ?? "An agent";
      addMessage("error", who, null).textContent = `${who}'s request timed out waiting for a response and was denied automatically.`;
    }
    if (card) card.remove();
    approvalsPanel.hidden = approvalsEl.children.length === 0;
    syncSidebarVisibility();
  }
}

loadPersonas();
loadApprovals();
connectEvents();
setEmptyState();
