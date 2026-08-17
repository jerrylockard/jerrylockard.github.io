const personasEl = document.getElementById("personas");
const approvalsEl = document.getElementById("approvals");
const approvalsPanel = document.getElementById("approvals-panel");
const logEl = document.getElementById("log");
const emptyState = document.getElementById("empty-state");
const composer = document.getElementById("composer");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");
const themeBtn = document.getElementById("theme-btn");
const previewToggle = document.getElementById("preview-toggle");
const previewPane = document.getElementById("preview-pane");
const previewFrame = document.getElementById("preview-frame");
const previewOffline = document.getElementById("preview-offline");
const previewStartBtn = document.getElementById("preview-start-btn");
const previewRefreshBtn = document.getElementById("preview-refresh");

let personas = [];
let activeId = null;
const streaming = new Map(); // personaId -> { textEl, raw }
const inFlight = new Set(); // personaId currently mid-turn
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

// ---------- personas ----------

function renderPersonas() {
  personasEl.innerHTML = "";
  for (const p of personas) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "persona-card" + (p.id === activeId ? " active" : "");
    card.innerHTML = `
      <span class="avatar" style="background:${p.color}">${initial(p.name)}</span>
      <span class="persona-info">
        <span class="persona-name">${p.name}</span>
        <div class="persona-role">${p.role}</div>
        <div class="persona-tagline">${p.tagline}</div>
      </span>
    `;
    card.addEventListener("click", () => {
      activeId = p.id;
      renderPersonas();
      updateComposerState();
      input.focus();
    });
    personasEl.appendChild(card);
  }
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

function fillToolResult(id, result) {
  const card = toolCards.get(id);
  if (!card) return;
  card.resultEl.textContent = result && result.trim() ? result : "(empty)";
}

// ---------- approvals ----------

function renderApprovals(list) {
  approvalsEl.innerHTML = "";
  for (const approval of list) approvalsEl.appendChild(approvalCard(approval));
  approvalsPanel.hidden = list.length === 0;
}

function approvalCard(approval) {
  const card = document.createElement("div");
  card.className = "approval-card";
  card.dataset.id = approval.id;
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

function updateComposerState() {
  const busy = activeId && inFlight.has(activeId);
  input.disabled = !activeId || busy;
  sendBtn.disabled = !activeId || busy;
  input.placeholder = busy ? `${personaById(activeId)?.name ?? "Agent"} is working…` : "Message…";
}

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message || !activeId) return;
  input.value = "";
  input.style.height = "auto";

  const persona = personaById(activeId);
  addMessage("user", "You", null).textContent = message;

  inFlight.add(activeId);
  updateComposerState();

  await fetch(`/api/chat/${activeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
});

// ---------- data + events ----------

async function loadPersonas() {
  const res = await fetch("/api/personas");
  personas = await res.json();
  if (!activeId && personas.length) activeId = personas[0].id;
  renderPersonas();
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

function handleEvent(event) {
  const persona = personaById(event.personaId);
  const who = persona?.name ?? event.personaId ?? "agent";

  if (event.type === "text") {
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
    addToolCard(event);
  } else if (event.type === "tool_result") {
    fillToolResult(event.id, event.result);
  } else if (event.type === "team_update") {
    addTeamNote(event);
  } else if (event.type === "done") {
    const entry = streaming.get(event.personaId);
    if (entry) {
      entry.textEl.classList.remove("streaming-cursor");
      attachReasoningToggle(entry.textEl.parentElement, event.reasoning);
    }
    streaming.delete(event.personaId);
    inFlight.delete(event.personaId);
    updateComposerState();
  } else if (event.type === "error") {
    addMessage("error", who, null).textContent = event.message;
    const entry = streaming.get(event.personaId);
    if (entry) entry.textEl.classList.remove("streaming-cursor");
    streaming.delete(event.personaId);
    inFlight.delete(event.personaId);
    updateComposerState();
  } else if (event.type === "approval_requested") {
    approvalsPanel.hidden = false;
    approvalsEl.appendChild(approvalCard(event.approval));
  } else if (event.type === "approval_resolved") {
    const card = approvalsEl.querySelector(`[data-id="${event.id}"]`);
    if (card) card.remove();
    approvalsPanel.hidden = approvalsEl.children.length === 0;
  }
}

loadPersonas();
loadApprovals();
connectEvents();
setEmptyState();
