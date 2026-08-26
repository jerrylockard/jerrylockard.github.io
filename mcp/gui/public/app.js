const sidebar = document.getElementById("sidebar");
const channelListEl = document.getElementById("channel-list");
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
const themeBtnLabel = document.getElementById("theme-btn-label");
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
const studioStatusEl = document.getElementById("studio-status");
const clearChatBtn = document.getElementById("clear-chat");
const reconcileChatBtn = document.getElementById("reconcile-chat");
const navButtons = [...document.querySelectorAll(".nav-btn")];
const views = [...document.querySelectorAll(".view")];
const pageEyebrowEl = document.getElementById("page-eyebrow");
const pageTitleEl = document.getElementById("page-title");
const badgeChatEl = document.getElementById("badge-chat");
const badgeApprovalsEl = document.getElementById("badge-approvals");
const rosterGridEl = document.getElementById("roster-grid");
const boardFiltersEl = document.getElementById("board-filters");
const boardNoticeEl = document.getElementById("board-notice");
const boardProgressCountEl = document.getElementById("board-progress-count");
const boardBacklogCountEl = document.getElementById("board-backlog-count");
const boardColumnEls = {
  backlog: document.getElementById("col-backlog"),
  "in-progress": document.getElementById("col-in-progress"),
  done: document.getElementById("col-done"),
};
const boardColumnCountEls = {
  backlog: document.getElementById("count-backlog"),
  "in-progress": document.getElementById("count-in-progress"),
  done: document.getElementById("count-done"),
};
const calendarCompletedEl = document.getElementById("calendar-completed");
const calendarUpcomingEl = document.getElementById("calendar-upcoming");
const newTaskBtn = document.getElementById("new-task-btn");
const taskOverlay = document.getElementById("task-overlay");
const taskPanel = document.getElementById("task-panel");
const taskPanelEyebrow = document.getElementById("task-panel-eyebrow");
const taskPanelBody = document.getElementById("task-panel-body");
const taskPanelClose = document.getElementById("task-panel-close");
const chatChannelEyebrow = document.getElementById("chat-channel-eyebrow");
const chatChannelTitle = document.getElementById("chat-channel-title");
const employeeOverlay = document.getElementById("employee-overlay");
const employeePanelBody = document.getElementById("employee-panel-body");
const employeePanelClose = document.getElementById("employee-panel-close");
const approvalsFullEl = document.getElementById("approvals-full");
const attentionListEl = document.getElementById("attention-list");
const attentionCountEl = document.getElementById("attention-count");
const teamStripEl = document.getElementById("team-strip");
const currentWorkListEl = document.getElementById("current-work-list");
const homeActivityListEl = document.getElementById("home-activity-list");
const homeGreetingEl = document.getElementById("home-greeting");
const askBar = document.getElementById("ask-bar");
const askInput = document.getElementById("ask-input");
let reconcilePollTimer = null;
let reconcileJobActive = false;
let activeHistoryLoaded = false;
let channelLoadGeneration = 0;
let eventsDisconnected = false;

const TEAM_CHANNEL = "team";
const QUICK_REPLIES = ["Yes, go ahead", "Looks good", "Not yet — hold off", "What's the status?", "Can you explain more?", "No, stop."];
const TAB_IDS = ["employees", "board", "calendar", "chat", "approvals"];
const PAGE_META = {
  home: { eyebrow: "Overview", title: "Today" },
  employees: { eyebrow: "Your agent team", title: "Team" },
  chat: { eyebrow: "Agent workspace", title: "Workroom" },
  board: { eyebrow: "Shared work", title: "Work" },
  calendar: { eyebrow: "Shared work", title: "Activity" },
  approvals: { eyebrow: "Needs your call", title: "Decisions" },
};
const STATUS_ORDER = ["backlog", "in-progress", "done"];
const STATUS_LABELS = { backlog: "Backlog", "in-progress": "In progress", done: "Done" };
const NEXT_STATUS = { backlog: "in-progress", "in-progress": "done" };
const NEXT_STATUS_LABEL = { backlog: "Start task", "in-progress": "Mark done" };

let personas = [];
let activeChannel = localStorage.getItem("gui-active-channel") || TEAM_CHANNEL;
const savedTab = localStorage.getItem("gui-active-tab");
const workspaceRevision = "workroom-v1";
const isNewWorkspace = localStorage.getItem("gui-workspace-revision") !== workspaceRevision;
let activeTab = isNewWorkspace ? "chat" : (TAB_IDS.includes(savedTab) ? savedTab : "chat");
if (isNewWorkspace) localStorage.setItem("gui-workspace-revision", workspaceRevision);
let roster = [];
let boardState = { backlog: [], "in-progress": [], done: [], categories: [] };
let approvalsList = [];
let lastActivityFeed = [];
let lastTeamUpdates = [];
let selectedCategory = "all";
let workRefreshTimer = null;
let taskPanelReturnFocus = null;
let taskPanelTaskId = null;
let taskPanelLoadGeneration = 0;
let taskPanelRefreshTimer = null;
let taskPanelRefreshSuppressedUntil = 0;
let employeeReturnFocus = null;
let rosterLoadGeneration = 0;
let boardLoadGeneration = 0;
let calendarLoadGeneration = 0;
let approvalsStateVersion = 0;
let approvalsRefreshTimer = null;
let approvalsLoadInFlight = false;
let approvalsLoadQueued = false;
let boardNoticeTimer = null;
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
  return [{ id: TEAM_CHANNEL, name: "Team", role: "Automatic routing", color: "var(--accent)" }, ...personas];
}

function statusFor(id) {
  return agentStatuses.get(id) || "available";
}

function statusLabel(status) {
  return { available: "Available", working: "Working", attention: "Needs attention", question: "Has a question", "hand-raised": "Hand raised", help: "Immediate help" }[status] || "Available";
}

function pendingDecisionCount() {
  const agentAlertCount = [...agentAlerts.values()].filter((alert) => alert.source !== "approval").length;
  return approvalsList.length + agentAlertCount;
}

function updateBadges() {
  const decisionCount = pendingDecisionCount();
  badgeApprovalsEl.hidden = decisionCount === 0;
  badgeApprovalsEl.textContent = String(decisionCount);
  badgeChatEl.hidden = unreadChannels.size === 0;
  badgeChatEl.textContent = String(unreadChannels.size);
}

function updatePulse() {
  const activeCount = [...agentStatuses.values()].filter((status) => status === "working").length;
  agentCountEl.textContent = String(personas.length);
  activeCountEl.textContent = String(activeCount);
  boardProgressCountEl.textContent = String(boardState["in-progress"].length);
  boardBacklogCountEl.textContent = String(boardState.backlog.length);
  approvalCountEl.textContent = String(pendingDecisionCount());
  const urgent = [...agentStatuses.values()].some((status) => status === "help");
  const hasQuestion = [...agentStatuses.values()].some((status) => status === "question");
  const handRaised = [...agentStatuses.values()].some((status) => status === "hand-raised");
  studioStatusEl.textContent = urgent ? "An agent needs immediate help" : handRaised ? "An agent has raised a hand" : hasQuestion ? "An agent has a question" : approvalsList.length ? "Your approval is needed" : activeCount ? `${activeCount} agent${activeCount === 1 ? " is" : "s are"} working` : "Ready for direction";
  updateBadges();
  if (activeTab === "home") renderHome();
}

function setAgentStatus(id, status, message = "") {
  if (!id) return;
  const previousStatus = agentStatuses.get(id);
  const previousMessage = agentStatusMessages.get(id);
  if (previousStatus === status && (!message || previousMessage === message)) return;
  agentStatuses.set(id, status);
  if (message) agentStatusMessages.set(id, message);
  renderChannelList();
  if (roster.length) renderRoster();
  renderAttention();
  updatePulse();
}

function setAgentAlert(id, status, message, source = "agent") {
  agentAlerts.set(id, { id, status, message, source });
  setAgentStatus(id, status, message);
}

function clearAgentAlert(id, source) {
  const alert = agentAlerts.get(id);
  if (source && alert?.source !== source) return;
  agentAlerts.delete(id);
  if (alert && agentStatuses.get(id) === alert.status) agentStatuses.delete(id);
  agentStatusMessages.delete(id);
  renderChannelList();
  if (roster.length) renderRoster();
  renderAttention();
  updatePulse();
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
// lead who sets direction, a wrench for DevOps, a pen nib for copy, and so on.
// Personas without an entry (e.g. a new one someone adds later) fall back to
// their initial letter, same as before this existed.
const AGENT_ICONS = {
  team: '<circle cx="8.5" cy="11" r="3"/><circle cx="15.5" cy="11" r="3"/><path d="M3.5 19c.5-2.7 2.3-4.3 5-4.3s4.5 1.6 5 4.3M10.5 19c.5-2.7 2.3-4.3 5-4.3s4.5 1.6 5 4.3"/>',
  shepard: '<circle cx="12" cy="12" r="8"/><path d="M12 8l2.2 3.8-2.2 3.8-2.2-3.8z"/>',
  desiree: '<rect x="7" y="7" width="10" height="10" rx="1.5" transform="rotate(45 12 12)"/>',
  devon:
    '<path d="M14.2 6.2a3.6 3.6 0 00-4.9 4.9L4 16.4 7.6 20l5.3-5.3a3.6 3.6 0 004.9-4.9l-2.1 2.1-2.6-2.6z"/>',
  paige:
    '<path d="M4.5 19.5l2.6-.9L16.4 9.3a1.9 1.9 0 00-2.7-2.7L4.4 16.9z"/><path d="M13 7.3l3.7 3.7"/>',
  casey: '<circle cx="12" cy="12" r="8"/><path d="M8.3 12.4l2.5 2.5 5-5.2"/>',
  archie: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  ryder:
    '<rect x="9.3" y="3" width="5.4" height="10.5" rx="2.7"/><path d="M6.3 11a5.7 5.7 0 0011.4 0"/><path d="M12 16.5V20M9.3 20h5.4"/>',
  scout:
    '<circle cx="12" cy="12" r="8"/><path d="M12 12l3.6-2-1.6 4.6L10.4 16l1.6-4z"/>',
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
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function safePersonaColor(value) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#1e4c59";
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

// ---------- dashboard views ----------

async function requestJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("The dashboard server could not be reached.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // A useful HTTP error is better than exposing a JSON parse failure.
  }
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

function renderRegionState(container, message, kind = "empty", retry) {
  container.innerHTML = "";
  const state = document.createElement("div");
  state.className = `view-state view-state-${kind}`;
  if (kind === "error") state.setAttribute("role", "alert");
  const copy = document.createElement("p");
  copy.textContent = message;
  state.appendChild(copy);
  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "state-retry";
    button.textContent = "Try again";
    button.addEventListener("click", retry);
    state.appendChild(button);
  }
  container.appendChild(state);
}

function validDate(value) {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, includeTime = false) {
  const date = validDate(value);
  if (!date) return "Date unavailable";
  return date.toLocaleString([], includeTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" });
}

function personaForActor(actor) {
  const token = String(actor ?? "").trim().toLowerCase();
  return personas.find((persona) => persona.id.toLowerCase() === token || persona.name.toLowerCase() === token);
}

function actorName(actor, emptyLabel = "Unknown teammate") {
  const persona = personaForActor(actor);
  if (persona) return persona.name;
  const fallback = String(actor ?? "").trim();
  if (fallback.toLowerCase() === "jerry") return "Jerry";
  return fallback || emptyLabel;
}

function taskAssigneeName(task) {
  return task.assignee ? actorName(task.assignee) : "Unassigned";
}

function taskCompletionActor(task) {
  if (!task.completedAt || !Array.isArray(task.activity)) return null;
  const entry = [...task.activity].reverse().find((item) => item.at === task.completedAt);
  return entry ? actorName(entry.by) : null;
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late, Jerry";
  if (hour < 12) return "Good morning, Jerry";
  if (hour < 17) return "Good afternoon, Jerry";
  return "Good evening, Jerry";
}

function initialiseNav() {
  for (const button of navButtons) {
    const tab = button.dataset.tab;
    if (!TAB_IDS.includes(tab)) continue;
    button.addEventListener("click", () => void setActiveTab(tab));
  }
  for (const button of document.querySelectorAll("[data-goto]")) {
    button.addEventListener("click", () => void setActiveTab(button.dataset.goto));
  }
}

async function setActiveTab(tab, { refresh = true } = {}) {
  if (!TAB_IDS.includes(tab)) tab = "chat";
  activeTab = tab;
  localStorage.setItem("gui-active-tab", tab);
  for (const button of navButtons) {
    const buttonTab = button.dataset.tab;
    const active = buttonTab === tab || (buttonTab === "board" && tab === "calendar");
    button.setAttribute("aria-pressed", String(active));
  }
  for (const view of views) view.hidden = view.id !== `view-${tab}`;
  const meta = PAGE_META[tab] || PAGE_META.home;
  pageEyebrowEl.textContent = meta.eyebrow;
  pageTitleEl.textContent = meta.title;
  if (tab === "chat") applyChannelAccent(activeChannel);
  else document.documentElement.style.removeProperty("--channel-accent");

  if (!refresh) return;
  if (tab === "home") {
    await Promise.all([
      loadRoster({ silent: roster.length > 0 }),
      loadBoard({ silent: allBoardTasks().length > 0 }),
      loadCalendar({ silent: true }),
    ]);
    renderHome();
  }
  if (tab === "employees") await loadRoster({ silent: roster.length > 0 });
  if (tab === "board") await loadBoard({ silent: allBoardTasks().length > 0 });
  if (tab === "calendar") await loadCalendar({ silent: true });
  if (tab === "approvals") await loadApprovals();
}

// ---------- home / command center ----------

function renderHome() {
  homeGreetingEl.textContent = greetingForNow();
  renderAttention();
  renderTeamStrip();
  renderCurrentWork();
  renderHomeActivity();
}

function signalCard(alert) {
  const persona = personaById(alert.id);
  const card = document.createElement("div");
  card.className = `approval-card signal-card alert-${alert.status}`;
  card.innerHTML = `
    <div class="reason">${escapeHtml(persona?.name ?? alert.id)} · ${escapeHtml(statusLabel(alert.status))}</div>
    <div class="detail">${escapeHtml(alert.message)}</div>
    <div class="buttons"><button type="button" class="open-channel">Open channel</button></div>
  `;
  card.querySelector(".open-channel").addEventListener("click", async () => {
    await setActiveTab("chat", { refresh: false });
    await switchChannel(alert.id);
  });
  return card;
}

function renderAttention() {
  const signals = [...agentAlerts.values()].filter((alert) => alert.source !== "approval");
  const total = signals.length;
  attentionCountEl.textContent = String(total);
  attentionListEl.innerHTML = "";
  if (!total) {
    renderRegionState(attentionListEl, "No agent alerts right now.");
    return;
  }
  for (const alert of signals) attentionListEl.appendChild(signalCard(alert));
}

function renderTeamStrip() {
  teamStripEl.innerHTML = "";
  if (!roster.length) {
    renderRegionState(teamStripEl, "Loading team…");
    return;
  }
  for (const member of roster) {
    const status = statusFor(member.id);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "team-strip-row";
    row.innerHTML = `
      <span class="avatar" style="background:${safePersonaColor(member.color)}">${avatarInner(personaById(member.id) || member)}</span>
      <span class="team-strip-copy"><span class="team-strip-name">${escapeHtml(member.name)}</span><span class="team-strip-role">${escapeHtml(member.role)}</span></span>
      <span class="roster-status status-${escapeHtml(status)}"><span class="status-dot"></span></span>
    `;
    row.addEventListener("click", () => openEmployeeProfile(member.id));
    teamStripEl.appendChild(row);
  }
}

function renderCurrentWork() {
  currentWorkListEl.innerHTML = "";
  const inProgress = Array.isArray(boardState["in-progress"]) ? boardState["in-progress"] : [];
  if (!inProgress.length) {
    renderRegionState(currentWorkListEl, "Nothing in progress right now.");
    return;
  }
  for (const task of inProgress.slice(0, 5)) currentWorkListEl.appendChild(renderTaskCard(task));
}

function renderHomeActivity() {
  renderActivityItems(homeActivityListEl, lastActivityFeed.slice(0, 5));
}

askBar.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = askInput.value.trim();
  if (!text) return;
  askInput.value = "";
  await setActiveTab("chat", { refresh: false });
  if (activeChannel !== TEAM_CHANNEL) await switchChannel(TEAM_CHANNEL);
  input.value = text;
  input.dispatchEvent(new Event("input"));
  composer.requestSubmit();
});

// ---------- team roster ----------

function renderRoster() {
  rosterGridEl.innerHTML = "";
  if (!roster.length) {
    renderRegionState(rosterGridEl, "No teammates are available yet.");
    return;
  }

  for (const member of roster) {
    const persona = personaById(member.id) || member;
    const tasks = Array.isArray(member.activeTasks) ? member.activeTasks : [];
    const status = statusFor(member.id);
    const memberColor = safePersonaColor(member.color);
    const card = document.createElement("article");
    card.className = "roster-card";
    card.style.setProperty("--member-color", memberColor);
    card.innerHTML = `
      <div class="roster-card-head">
        <span class="avatar roster-avatar" style="background:${memberColor}">${avatarInner(persona)}</span>
        <div class="roster-identity">
          <h2>${escapeHtml(member.name)}</h2>
          <p class="roster-role">${escapeHtml(member.role)}</p>
        </div>
        <span class="roster-status status-${escapeHtml(status)}"><span class="status-dot"></span>${escapeHtml(statusLabel(status))}</span>
      </div>
      <p class="roster-department">${escapeHtml(member.department || member.role)}</p>
      <p class="roster-tagline">${escapeHtml(member.tagline || "")}</p>
      <div class="roster-work">
        <p class="roster-work-label">Assigned work <span>${tasks.length}</span></p>
        <div class="roster-task-list"></div>
      </div>
      <div class="roster-actions">
        <button type="button" class="roster-profile">View profile</button>
        <button type="button" class="roster-chat">Message</button>
      </div>`;

    const taskList = card.querySelector(".roster-task-list");
    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "roster-no-work";
      empty.textContent = "No active work assigned.";
      taskList.appendChild(empty);
    } else {
      for (const task of tasks) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "roster-task";
        button.innerHTML = `<span>${escapeHtml(task.title)}</span><small>${escapeHtml(STATUS_LABELS[task.status] || task.status)}</small>`;
        button.addEventListener("click", () => void openTaskDetail(task.id));
        taskList.appendChild(button);
      }
    }
    card.querySelector(".roster-card-head").addEventListener("click", () => openEmployeeProfile(member.id));
    card.querySelector(".roster-profile").addEventListener("click", () => openEmployeeProfile(member.id));
    card.querySelector(".roster-chat").addEventListener("click", async () => {
      await setActiveTab("chat", { refresh: false });
      await switchChannel(member.id);
    });
    rosterGridEl.appendChild(card);
  }
}

async function loadRoster({ silent = false } = {}) {
  const loadGeneration = ++rosterLoadGeneration;
  if (!silent) renderRegionState(rosterGridEl, "Loading the team…", "loading");
  try {
    const data = await requestJson("/api/roster");
    if (loadGeneration !== rosterLoadGeneration) return;
    roster = Array.isArray(data) ? data : [];
    renderRoster();
    if (activeTab === "home") renderTeamStrip();
  } catch (error) {
    if (loadGeneration !== rosterLoadGeneration) return;
    renderRegionState(rosterGridEl, error instanceof Error ? error.message : "The roster could not be loaded.", "error", () => void loadRoster());
  }
}

// ---------- employee profile ----------

function closeEmployeeProfile() {
  employeeOverlay.hidden = true;
  document.body.classList.remove("modal-open");
  employeePanelBody.innerHTML = "";
  if (employeeReturnFocus instanceof HTMLElement && employeeReturnFocus.isConnected) employeeReturnFocus.focus();
  employeeReturnFocus = null;
}

function openEmployeeProfile(id) {
  const persona = personaById(id);
  const member = roster.find((r) => r.id === id) || persona;
  if (!persona || !member) return;

  employeeReturnFocus = document.activeElement;
  const status = statusFor(id);
  const tasks = Array.isArray(member.activeTasks) ? member.activeTasks : [];
  const scope = Array.isArray(persona.scope) ? persona.scope : [];
  const scopeLine = !scope.length ? "" : scope.length === 1 && scope[0] === "**" ? "Whole repository" : scope.join(", ");
  const related = lastTeamUpdates.filter((update) => personaForActor(update.agent)?.id === id).slice(0, 5);

  employeePanelBody.innerHTML = `
    <div class="employee-profile-head">
      <span class="avatar employee-avatar" style="background:${safePersonaColor(persona.color)}">${avatarInner(persona)}</span>
      <div>
        <h2>${escapeHtml(persona.name)}</h2>
        <p class="employee-role">${escapeHtml(persona.role)}${persona.department ? ` · ${escapeHtml(persona.department)}` : ""}</p>
        <span class="roster-status status-${escapeHtml(status)}"><span class="status-dot"></span>${escapeHtml(statusLabel(status))}</span>
      </div>
    </div>
    ${persona.tagline ? `<p class="employee-tagline">${escapeHtml(persona.tagline)}</p>` : ""}
    <dl class="task-facts">
      <div><dt>Identity</dt><dd>${persona.email ? `<a href="mailto:${escapeHtml(persona.email)}">${escapeHtml(persona.email)}</a>` : "—"}</dd></div>
      ${scopeLine ? `<div><dt>Primarily works in</dt><dd>${escapeHtml(scopeLine)}</dd></div>` : ""}
    </dl>
    <section class="employee-section">
      <h3>Current work <span>${tasks.length}</span></h3>
      <div class="employee-task-list" id="employee-task-list"></div>
    </section>
    <section class="employee-section">
      <h3>Recent activity</h3>
      <div id="employee-activity-list"></div>
    </section>
    <div class="employee-actions">
      <button type="button" class="deck-action primary" id="employee-open-chat">Message ${escapeHtml(persona.name)}</button>
    </div>`;

  const taskListEl = employeePanelBody.querySelector("#employee-task-list");
  if (!tasks.length) {
    renderRegionState(taskListEl, "No active work assigned.");
  } else {
    for (const task of tasks) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "roster-task";
      button.innerHTML = `<span>${escapeHtml(task.title)}</span><small>${escapeHtml(STATUS_LABELS[task.status] || task.status)}</small>`;
      button.addEventListener("click", () => {
        closeEmployeeProfile();
        void openTaskDetail(task.id);
      });
      taskListEl.appendChild(button);
    }
  }

  const activityEl = employeePanelBody.querySelector("#employee-activity-list");
  if (!related.length) {
    renderRegionState(activityEl, `No recorded updates from ${persona.name} yet.`);
  } else {
    renderActivityItems(
      activityEl,
      related.map((update, index) => ({ id: `emp-update-${index}`, type: "team-update", timestamp: update.timestamp, update })),
    );
  }

  employeePanelBody.querySelector("#employee-open-chat").addEventListener("click", async () => {
    closeEmployeeProfile();
    await setActiveTab("chat", { refresh: false });
    await switchChannel(id);
  });

  employeeOverlay.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => (employeePanelBody.querySelector("button, a") || employeePanelClose).focus());
}

employeePanelClose.addEventListener("click", closeEmployeeProfile);
employeeOverlay.addEventListener("click", (event) => {
  if (event.target === employeeOverlay) closeEmployeeProfile();
});
document.addEventListener("keydown", (event) => {
  if (employeeOverlay.hidden) return;
  if (event.key === "Escape") {
    closeEmployeeProfile();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...document.getElementById("employee-panel").querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href]')]
    .filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// ---------- task board ----------

function allBoardTasks() {
  return STATUS_ORDER.flatMap((status) => Array.isArray(boardState[status]) ? boardState[status] : []);
}

function boardCategories() {
  const categories = [...(Array.isArray(boardState.categories) ? boardState.categories : [])];
  for (const task of allBoardTasks()) {
    if (task.category && !categories.includes(task.category)) categories.push(task.category);
  }
  return categories.filter((category, index) => category && categories.indexOf(category) === index);
}

function filteredTasks(status) {
  const tasks = Array.isArray(boardState[status]) ? boardState[status] : [];
  return selectedCategory === "all" ? tasks : tasks.filter((task) => task.category === selectedCategory);
}

function showBoardNotice(message, kind = "error") {
  clearTimeout(boardNoticeTimer);
  boardNoticeEl.className = `board-notice board-notice-${kind}`;
  boardNoticeEl.setAttribute("role", kind === "error" ? "alert" : "status");
  boardNoticeEl.textContent = message;
  boardNoticeEl.hidden = false;
  boardNoticeTimer = setTimeout(() => {
    boardNoticeEl.hidden = true;
    boardNoticeEl.textContent = "";
  }, 5000);
}

function focusBoardTask(taskId, selector) {
  if (activeTab !== "board" || !taskOverlay.hidden) return;
  const card = [...document.querySelectorAll(".task-card")].find((candidate) => candidate.dataset.taskId === taskId);
  requestAnimationFrame(() => (card?.querySelector(selector) || card?.querySelector(".task-title-button"))?.focus());
}

function captureBoardFocus() {
  if (activeTab !== "board" || !taskOverlay.hidden || !(document.activeElement instanceof HTMLElement)) return null;
  const card = document.activeElement.closest(".task-card");
  if (!card?.dataset.taskId) return null;
  let selector = ".task-title-button";
  if (document.activeElement.matches(".task-assignee")) selector = ".task-assignee";
  if (document.activeElement.matches(".task-advance")) selector = ".task-advance";
  return { taskId: card.dataset.taskId, selector };
}

function mergeBoardTask(task) {
  if (!task || !STATUS_ORDER.includes(task.status)) return;
  for (const status of STATUS_ORDER) {
    boardState[status] = (Array.isArray(boardState[status]) ? boardState[status] : []).filter((candidate) => candidate.id !== task.id);
  }
  boardState[task.status].unshift(task);
  if (task.category && !boardState.categories.includes(task.category)) boardState.categories.push(task.category);
  renderBoard();
  if (activeTab === "home") renderCurrentWork();
}

function renderBoardFilters() {
  boardFiltersEl.innerHTML = "";
  const tasks = allBoardTasks();
  const categories = boardCategories();
  if (selectedCategory !== "all" && !categories.includes(selectedCategory)) selectedCategory = "all";
  const filterValues = ["all", ...categories];
  for (const category of filterValues) {
    const count = category === "all" ? tasks.length : tasks.filter((task) => task.category === category).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "board-filter";
    button.setAttribute("aria-pressed", String(selectedCategory === category));
    button.innerHTML = `<span>${escapeHtml(category === "all" ? "All work" : category)}</span><small>${count}</small>`;
    button.addEventListener("click", () => {
      selectedCategory = category;
      renderBoard();
    });
    boardFiltersEl.appendChild(button);
  }
}

function makeAssigneeSelect(task, className = "task-assignee") {
  const select = document.createElement("select");
  select.className = className;
  select.setAttribute("aria-label", `Assign ${task.title}`);
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Unassigned";
  select.appendChild(empty);
  for (const persona of personas) {
    const option = document.createElement("option");
    option.value = persona.id;
    option.textContent = persona.name;
    select.appendChild(option);
  }
  if (task.assignee && !personaById(task.assignee)) {
    const unknown = document.createElement("option");
    unknown.value = task.assignee;
    unknown.textContent = actorName(task.assignee);
    select.appendChild(unknown);
  }
  select.value = task.assignee || "";
  return select;
}

function taskDateLine(task) {
  if (task.status === "done") return `Completed ${formatDate(task.completedAt || task.updatedAt)}`;
  if (task.dueDate) return `Due ${formatDate(task.dueDate)}`;
  return `Updated ${formatDate(task.updatedAt)}`;
}

function renderTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card priority-${["low", "normal", "high"].includes(task.priority) ? task.priority : "normal"}`;
  card.dataset.taskId = task.id;
  const head = document.createElement("div");
  head.className = "task-card-head";
  const category = document.createElement("button");
  category.type = "button";
  category.className = "task-category";
  category.textContent = task.category || "general";
  category.title = `Show ${category.textContent} tasks`;
  category.addEventListener("click", () => {
    selectedCategory = task.category || "general";
    renderBoard();
  });
  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = task.priority === "normal" ? "" : task.priority;
  head.append(category, priority);
  card.appendChild(head);

  const title = document.createElement("button");
  title.type = "button";
  title.className = "task-title-button";
  title.textContent = task.title;
  title.addEventListener("click", () => void openTaskDetail(task.id));
  card.appendChild(title);
  if (task.detail) {
    const detail = document.createElement("p");
    detail.className = "task-card-detail";
    detail.textContent = task.detail;
    card.appendChild(detail);
  }
  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.textContent = taskDateLine(task);
  card.appendChild(meta);

  const controls = document.createElement("div");
  controls.className = "task-controls";
  const assignment = makeAssigneeSelect(task);
  assignment.title = `Assigned to ${taskAssigneeName(task)}. Click to reassign.`;
  assignment.addEventListener("change", async () => {
    try {
      const updated = await assignBoardTask(task.id, assignment.value || null, assignment);
      showBoardNotice(`${updated.title} assigned to ${taskAssigneeName(updated)}.`, "success");
      focusBoardTask(task.id, ".task-assignee");
    } catch (error) {
      await loadBoard({ silent: true });
      showBoardNotice(error instanceof Error ? error.message : "The task could not be assigned.");
      focusBoardTask(task.id, ".task-assignee");
    }
  });
  controls.appendChild(assignment);
  const nextStatus = NEXT_STATUS[task.status];
  if (nextStatus) {
    const advance = document.createElement("button");
    advance.type = "button";
    advance.className = "task-advance";
    advance.textContent = `${NEXT_STATUS_LABEL[task.status]} →`;
    advance.setAttribute("aria-label", `${NEXT_STATUS_LABEL[task.status]}: ${task.title}`);
    advance.addEventListener("click", async () => {
      try {
        const updated = await advanceBoardTask(task, advance);
        showBoardNotice(`${updated.title} moved to ${STATUS_LABELS[updated.status]}.`, "success");
        focusBoardTask(task.id, ".task-advance");
      } catch (error) {
        await loadBoard({ silent: true });
        showBoardNotice(error instanceof Error ? error.message : "The task could not be moved.");
        focusBoardTask(task.id, ".task-advance");
      }
    });
    controls.appendChild(advance);
  } else {
    const complete = document.createElement("span");
    complete.className = "task-complete-label";
    complete.textContent = "Complete";
    controls.appendChild(complete);
  }
  card.appendChild(controls);
  return card;
}

function renderBoard() {
  renderBoardFilters();
  for (const status of STATUS_ORDER) {
    const tasks = filteredTasks(status);
    boardColumnCountEls[status].textContent = String(tasks.length);
    const body = boardColumnEls[status];
    body.innerHTML = "";
    if (!tasks.length) {
      renderRegionState(body, selectedCategory === "all" ? "No tasks here." : `No ${selectedCategory} tasks here.`);
      continue;
    }
    for (const task of tasks) body.appendChild(renderTaskCard(task));
  }
  updatePulse();
}

async function loadBoard({ silent = false } = {}) {
  const loadGeneration = ++boardLoadGeneration;
  if (!silent) {
    boardFiltersEl.innerHTML = "";
    for (const status of STATUS_ORDER) renderRegionState(boardColumnEls[status], "Loading tasks…", "loading");
  }
  try {
    const data = await requestJson("/api/board");
    if (loadGeneration !== boardLoadGeneration) return;
    const focusTarget = captureBoardFocus();
    boardState = {
      backlog: Array.isArray(data?.backlog) ? data.backlog : [],
      "in-progress": Array.isArray(data?.["in-progress"]) ? data["in-progress"] : [],
      done: Array.isArray(data?.done) ? data.done : [],
      categories: Array.isArray(data?.categories) ? data.categories : [],
    };
    renderBoard();
    if (activeTab === "home") renderCurrentWork();
    if (focusTarget) focusBoardTask(focusTarget.taskId, focusTarget.selector);
  } catch (error) {
    if (loadGeneration !== boardLoadGeneration) return;
    const message = error instanceof Error ? error.message : "The board could not be loaded.";
    renderRegionState(boardFiltersEl, message, "error", () => void loadBoard());
    for (const status of STATUS_ORDER) renderRegionState(boardColumnEls[status], "Tasks unavailable.", "error");
  }
}

async function assignBoardTask(taskId, assignee, control) {
  control.disabled = true;
  try {
    const updated = await requestJson(`/api/tasks/${encodeURIComponent(taskId)}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee }),
    });
    mergeBoardTask(updated);
    return updated;
  } finally {
    control.disabled = false;
  }
}

async function advanceBoardTask(task, control) {
  const status = NEXT_STATUS[task.status];
  if (!status) return;
  control.disabled = true;
  try {
    const updated = await requestJson(`/api/tasks/${encodeURIComponent(task.id)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, expectedStatus: task.status }),
    });
    mergeBoardTask(updated);
    return updated;
  } finally {
    control.disabled = false;
  }
}

function openTaskPanel(eyebrow) {
  if (taskOverlay.hidden) taskPanelReturnFocus = document.activeElement;
  taskPanelEyebrow.textContent = eyebrow;
  taskOverlay.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => (taskPanelBody.querySelector("input, textarea, select, button") || taskPanelClose).focus());
}

function closeTaskPanel() {
  taskPanelTaskId = null;
  taskPanelLoadGeneration += 1;
  clearTimeout(taskPanelRefreshTimer);
  taskPanelRefreshSuppressedUntil = 0;
  taskOverlay.hidden = true;
  document.body.classList.remove("modal-open");
  taskPanelBody.innerHTML = "";
  if (taskPanelReturnFocus instanceof HTMLElement && taskPanelReturnFocus.isConnected) taskPanelReturnFocus.focus();
  else navButtons.find((button) => button.dataset.tab === activeTab)?.focus();
  taskPanelReturnFocus = null;
}

function setTaskPanelError(form, message) {
  let error = form.querySelector(".task-form-error");
  if (!error) {
    error = document.createElement("p");
    error.className = "task-form-error";
    error.setAttribute("role", "alert");
    form.prepend(error);
  }
  error.textContent = message;
}

function openNewTaskPanel() {
  taskPanelTaskId = null;
  taskPanelLoadGeneration += 1;
  const categories = boardCategories();
  taskPanelBody.innerHTML = `
    <form class="task-form" id="new-task-form">
      <div class="task-field task-field-wide">
        <label for="task-title">Title</label>
        <input id="task-title" name="title" required maxlength="160" autocomplete="off">
      </div>
      <div class="task-field task-field-wide">
        <label for="task-detail">Details</label>
        <textarea id="task-detail" name="detail" rows="4" maxlength="2000"></textarea>
      </div>
      <div class="task-field">
        <label for="task-category">Category</label>
        <input id="task-category" name="category" list="task-category-list" value="general" required autocomplete="off">
        <datalist id="task-category-list">${categories.map((category) => `<option value="${escapeHtml(category)}"></option>`).join("")}</datalist>
      </div>
      <div class="task-field">
        <label for="task-priority">Priority</label>
        <select id="task-priority" name="priority"><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select>
      </div>
      <div class="task-field">
        <label for="task-assignee-new">Assign to</label>
        <select id="task-assignee-new" name="assignee"><option value="">Unassigned</option>${personas.map((persona) => `<option value="${escapeHtml(persona.id)}">${escapeHtml(persona.name)}</option>`).join("")}</select>
      </div>
      <div class="task-field">
        <label for="task-due">Due date</label>
        <input id="task-due" name="dueDate" type="date">
      </div>
      <div class="task-form-actions task-field-wide"><button type="button" class="task-cancel">Cancel</button><button type="submit" class="task-submit">Create task</button></div>
    </form>`;
  openTaskPanel("New task");
  const form = taskPanelBody.querySelector("#new-task-form");
  form.querySelector(".task-cancel").addEventListener("click", closeTaskPanel);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector(".task-submit");
    const values = new FormData(form);
    submit.disabled = true;
    submit.textContent = "Creating…";
    try {
      const created = await requestJson("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(values.get("title") || "").trim(),
          detail: String(values.get("detail") || "").trim(),
          category: String(values.get("category") || "general").trim().toLowerCase(),
          priority: String(values.get("priority") || "normal"),
          assignee: String(values.get("assignee") || "") || null,
          dueDate: String(values.get("dueDate") || "") || undefined,
        }),
      });
      mergeBoardTask(created);
      closeTaskPanel();
      await setActiveTab("board", { refresh: false });
    } catch (error) {
      setTaskPanelError(form, error instanceof Error ? error.message : "The task could not be created.");
      submit.disabled = false;
      submit.textContent = "Create task";
    }
  });
}

function renderTaskActivity(task) {
  const activity = Array.isArray(task.activity) ? [...task.activity] : [];
  activity.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  if (!activity.length) return '<p class="task-activity-empty">No activity recorded yet.</p>';
  return `<ol class="task-activity-list">${activity.map((entry) => `
    <li><span class="task-activity-dot"></span><div><p>${escapeHtml(entry.note)}</p><small>${escapeHtml(actorName(entry.by))} · <time datetime="${escapeHtml(entry.at)}">${escapeHtml(formatDate(entry.at, true))}</time></small></div></li>`).join("")}</ol>`;
}

async function openTaskDetail(taskId, { background = false } = {}) {
  taskPanelTaskId = taskId;
  const loadGeneration = ++taskPanelLoadGeneration;
  if (!background) taskPanelBody.innerHTML = '<div class="task-panel-loading">Loading task…</div>';
  if (taskOverlay.hidden) openTaskPanel("Task detail");
  else taskPanelEyebrow.textContent = "Task detail";
  try {
    const task = await requestJson(`/api/tasks/${encodeURIComponent(taskId)}`);
    if (loadGeneration !== taskPanelLoadGeneration || taskPanelTaskId !== taskId || taskOverlay.hidden) return;
    const focusedControl = background && taskPanelBody.contains(document.activeElement)
      ? document.activeElement.matches("#task-note")
        ? "#task-note"
        : document.activeElement.matches(".task-detail-assignee")
          ? ".task-detail-assignee"
          : document.activeElement.matches(".task-detail-advance")
            ? ".task-detail-advance"
            : document.activeElement.closest(".task-note-form")
              ? ".task-note-form button"
              : null
      : null;
    const noteDraft = background ? taskPanelBody.querySelector("#task-note")?.value ?? "" : "";
    const nextStatus = NEXT_STATUS[task.status];
    taskPanelBody.innerHTML = `
      <article class="task-detail-view">
        <div class="task-detail-heading">
          <div><span class="task-category static">${escapeHtml(task.category || "general")}</span><h2>${escapeHtml(task.title)}</h2></div>
          <span class="task-status-badge status-${escapeHtml(task.status)}">${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span>
        </div>
        ${task.detail ? `<p class="task-detail-copy">${escapeHtml(task.detail)}</p>` : '<p class="task-detail-copy muted">No details provided.</p>'}
        <dl class="task-facts">
          <div><dt>Priority</dt><dd>${escapeHtml(task.priority || "normal")}</dd></div>
          <div><dt>Due</dt><dd>${escapeHtml(task.dueDate ? formatDate(task.dueDate) : "No due date")}</dd></div>
          <div><dt>Created</dt><dd>${escapeHtml(formatDate(task.createdAt, true))}</dd></div>
          <div><dt>Updated</dt><dd>${escapeHtml(formatDate(task.updatedAt, true))}</dd></div>
        </dl>
        <div class="task-detail-controls">
          <label><span>Assigned to</span><span id="task-detail-assignee-slot"></span></label>
          ${nextStatus ? `<button type="button" class="task-detail-advance">${escapeHtml(NEXT_STATUS_LABEL[task.status])} →</button>` : '<span class="task-complete-label">Complete</span>'}
        </div>
        <section class="task-activity"><h3>Activity</h3>${renderTaskActivity(task)}</section>
        <form class="task-note-form"><label for="task-note">Add a progress note</label><div><input id="task-note" name="note" required maxlength="500" autocomplete="off" placeholder="What changed?"><button type="submit">Add note</button></div></form>
      </article>`;
    const assignment = makeAssigneeSelect(task, "task-detail-assignee");
    taskPanelBody.querySelector("#task-detail-assignee-slot").appendChild(assignment);
    assignment.addEventListener("change", async () => {
      try {
        await assignBoardTask(task.id, assignment.value || null, assignment);
        suppressTaskPanelRefresh();
        if (!taskOverlay.hidden) {
          await openTaskDetail(task.id, { background: true });
          taskPanelBody.querySelector(".task-detail-assignee")?.focus();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "The task could not be assigned.";
        suppressTaskPanelRefresh();
        await openTaskDetail(task.id, { background: true });
        setTaskPanelError(taskPanelBody.querySelector(".task-detail-view") || taskPanelBody, message);
      }
    });
    const advance = taskPanelBody.querySelector(".task-detail-advance");
    if (advance) {
      advance.addEventListener("click", async () => {
        try {
          await advanceBoardTask(task, advance);
          suppressTaskPanelRefresh();
          if (!taskOverlay.hidden) {
            await openTaskDetail(task.id, { background: true });
            (taskPanelBody.querySelector(".task-detail-advance") || taskPanelClose).focus();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "The task could not be moved.";
          suppressTaskPanelRefresh();
          await openTaskDetail(task.id, { background: true });
          setTaskPanelError(taskPanelBody.querySelector(".task-detail-view") || taskPanelBody, message);
          (taskPanelBody.querySelector(".task-detail-advance") || taskPanelClose).focus();
        }
      });
    }
    const noteForm = taskPanelBody.querySelector(".task-note-form");
    noteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = String(new FormData(noteForm).get("note") || "").trim();
      const button = noteForm.querySelector("button");
      if (!note) return;
      button.disabled = true;
      try {
        const updated = await requestJson(`/api/tasks/${encodeURIComponent(task.id)}/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        });
        mergeBoardTask(updated);
        suppressTaskPanelRefresh();
        await openTaskDetail(task.id);
        taskPanelBody.querySelector("#task-note")?.focus();
      } catch (error) {
        setTaskPanelError(noteForm, error instanceof Error ? error.message : "The note could not be added.");
        button.disabled = false;
      }
    });
    if (noteDraft) taskPanelBody.querySelector("#task-note").value = noteDraft;
    if (focusedControl) requestAnimationFrame(() => taskPanelBody.querySelector(focusedControl)?.focus());
  } catch (error) {
    if (loadGeneration !== taskPanelLoadGeneration || taskPanelTaskId !== taskId || taskOverlay.hidden) return;
    const message = error instanceof Error ? error.message : "The task could not be loaded.";
    if (background) setTaskPanelError(taskPanelBody.querySelector(".task-detail-view") || taskPanelBody, message);
    else renderRegionState(taskPanelBody, message, "error", () => void openTaskDetail(taskId));
  }
}

// ---------- calendar / activity ----------

function calendarItemDate(timestamp) {
  const time = document.createElement("time");
  if (timestamp) time.dateTime = timestamp;
  time.textContent = formatDate(timestamp, true);
  return time;
}

function renderActivityItems(container, entries) {
  container.innerHTML = "";
  if (!entries.length) {
    renderRegionState(container, "No recent activity yet.");
    return;
  }
  for (const entry of entries) {
    const item = document.createElement("article");
    item.className = `calendar-item activity-${entry.type || "unknown"}`;
    const body = document.createElement("div");
    body.className = "calendar-item-body";
    if (entry.type === "completed" && entry.task) {
      const title = document.createElement("button");
      title.type = "button";
      title.className = "calendar-title-button";
      title.textContent = entry.task.title;
      title.addEventListener("click", () => void openTaskDetail(entry.task.id));
      body.appendChild(title);
      const meta = document.createElement("p");
      const completedBy = taskCompletionActor(entry.task);
      meta.textContent = `${entry.task.category || "general"}${completedBy ? ` · completed by ${completedBy}` : " · completed"}`;
      body.appendChild(meta);
    } else if (entry.type === "team-update" && entry.update) {
      const title = document.createElement("strong");
      title.textContent = actorName(entry.update.agent);
      body.appendChild(title);
      const copy = document.createElement("p");
      copy.textContent = entry.update.message || "Team update";
      body.appendChild(copy);
    } else {
      const copy = document.createElement("p");
      copy.textContent = "Activity recorded.";
      body.appendChild(copy);
    }
    item.append(calendarItemDate(entry.timestamp), body);
    container.appendChild(item);
  }
}

function renderUpcoming(tasks) {
  calendarUpcomingEl.innerHTML = "";
  if (!tasks.length) {
    renderRegionState(calendarUpcomingEl, "Nothing is planned yet.");
    return;
  }
  for (const task of tasks) {
    const item = document.createElement("article");
    item.className = "calendar-item calendar-upcoming-item";
    const date = document.createElement("div");
    date.className = "calendar-date calendar-date-upcoming";
    date.textContent = task.dueDate ? formatDate(task.dueDate) : "No due date";
    const body = document.createElement("div");
    body.className = "calendar-item-body";
    const title = document.createElement("button");
    title.type = "button";
    title.className = "calendar-title-button";
    title.textContent = task.title;
    title.addEventListener("click", () => void openTaskDetail(task.id));
    const meta = document.createElement("p");
    meta.textContent = `${STATUS_LABELS[task.status] || task.status} · ${taskAssigneeName(task)} · ${task.category || "general"}`;
    body.append(title, meta);
    item.append(date, body);
    calendarUpcomingEl.appendChild(item);
  }
}

async function loadCalendar({ silent = false } = {}) {
  const loadGeneration = ++calendarLoadGeneration;
  if (!silent) {
    renderRegionState(calendarCompletedEl, "Loading activity…", "loading");
    renderRegionState(calendarUpcomingEl, "Loading planned work…", "loading");
  }
  try {
    const data = await requestJson("/api/calendar");
    if (loadGeneration !== calendarLoadGeneration) return;
    const completed = Array.isArray(data?.completed) ? data.completed : [];
    const updates = Array.isArray(data?.teamUpdates) ? data.teamUpdates : [];
    const activity = Array.isArray(data?.activity) ? data.activity : [
      ...completed.map((task) => ({ id: `completed-${task.id}`, type: "completed", timestamp: task.completedAt || task.updatedAt, task })),
      ...updates.map((update, index) => ({ id: `update-${index}`, type: "team-update", timestamp: update.timestamp, update })),
    ].sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    lastActivityFeed = activity;
    lastTeamUpdates = updates;
    renderActivityItems(calendarCompletedEl, activity);
    renderUpcoming(Array.isArray(data?.upcoming) ? data.upcoming : []);
    if (activeTab === "home") renderHomeActivity();
  } catch (error) {
    if (loadGeneration !== calendarLoadGeneration) return;
    const message = error instanceof Error ? error.message : "Calendar activity could not be loaded.";
    renderRegionState(calendarCompletedEl, message, "error", () => void loadCalendar());
    renderRegionState(calendarUpcomingEl, "Planned work unavailable.", "error");
  }
}

async function refreshWorkViews({ silent = true } = {}) {
  await Promise.all([loadBoard({ silent }), loadRoster({ silent }), loadCalendar({ silent })]);
  if (activeTab === "home") renderHome();
}

function scheduleWorkRefresh() {
  if (workRefreshTimer) clearTimeout(workRefreshTimer);
  workRefreshTimer = setTimeout(() => {
    workRefreshTimer = null;
    void refreshWorkViews({ silent: true });
  }, 120);
}

function scheduleTaskPanelRefresh() {
  if (!taskPanelTaskId || taskOverlay.hidden) return;
  if (taskPanelRefreshTimer) clearTimeout(taskPanelRefreshTimer);
  const taskId = taskPanelTaskId;
  const delay = Math.max(120, taskPanelRefreshSuppressedUntil - Date.now() + 10);
  taskPanelRefreshTimer = setTimeout(() => {
    taskPanelRefreshTimer = null;
    if (taskPanelTaskId === taskId && !taskOverlay.hidden) void openTaskDetail(taskId, { background: true });
  }, delay);
}

function suppressTaskPanelRefresh(duration = 750) {
  const refreshWasQueued = Boolean(taskPanelRefreshTimer);
  taskPanelRefreshSuppressedUntil = Date.now() + duration;
  clearTimeout(taskPanelRefreshTimer);
  taskPanelRefreshTimer = null;
  if (refreshWasQueued) scheduleTaskPanelRefresh();
}

taskPanel.setAttribute("role", "dialog");
taskPanel.setAttribute("aria-modal", "true");
taskPanel.setAttribute("aria-labelledby", "task-panel-eyebrow");
newTaskBtn.addEventListener("click", openNewTaskPanel);
taskPanelClose.addEventListener("click", closeTaskPanel);
taskOverlay.addEventListener("click", (event) => {
  if (event.target === taskOverlay) closeTaskPanel();
});
document.addEventListener("keydown", (event) => {
  if (taskOverlay.hidden) return;
  if (event.key === "Escape") {
    closeTaskPanel();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...taskPanel.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// ---------- theme ----------

function setTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  themeBtnLabel.textContent = mode === "dark" ? "Light mode" : "Dark mode";
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
  try {
    const result = await requestJson("/api/preview/start", { method: "POST" });
    if (!result?.ok) {
      throw new Error(result?.message || "The local preview could not be started.");
    }
    await refreshPreviewStatus();
  } catch (error) {
    const message = previewOffline.querySelector("p");
    if (message) message.textContent = error instanceof Error ? error.message : "The local preview could not be started.";
    previewOffline.hidden = false;
    previewFrame.hidden = true;
  } finally {
    previewStartBtn.disabled = false;
    previewStartBtn.textContent = "Start preview";
  }
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
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => profileClose.focus());
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
  document.body.classList.remove("modal-open");
  profileToggle.setAttribute("aria-pressed", "false");
  profileToggle.focus();
}

profileToggle.addEventListener("click", () => {
  profileToggle.setAttribute("aria-pressed", String(profileOverlay.hidden));
  if (profileOverlay.hidden) openProfile();
  else closeProfile();
});

profileClose.addEventListener("click", () => {
  closeProfile();
});

profileOverlay.addEventListener("click", (e) => {
  if (e.target === profileOverlay) {
    closeProfile();
  }
});

document.addEventListener("keydown", (event) => {
  if (profileOverlay.hidden) return;
  if (event.key === "Escape") {
    closeProfile();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...profileOverlay.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href]')]
    .filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
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
  updateBadges();
}

function clearLog() {
  logEl.innerHTML = "";
  logEl.appendChild(emptyState);
  setEmptyState();
}

function historyActionLabel() {
  return activeChannel === TEAM_CHANNEL
    ? "all conversation history (Team and every agent)"
    : `${personaById(activeChannel)?.name ?? activeChannel}'s conversation history`;
}

function syncHistoryActions() {
  clearChatBtn.textContent = activeChannel === TEAM_CHANNEL ? "Clear all channels" : "Clear this conversation";
  reconcileChatBtn.textContent = activeChannel === TEAM_CHANNEL ? "Reconcile & clear all" : "Reconcile & clear";
  const disabled = !activeHistoryLoaded || reconcileJobActive;
  clearChatBtn.disabled = disabled;
  reconcileChatBtn.disabled = disabled;
}

async function clearChat() {
  if (!window.confirm(`Clear ${historyActionLabel()}? This cannot be undone.`)) return;
  clearChatBtn.disabled = true;
  reconcileChatBtn.disabled = true;
  try {
    const res = await fetch("/api/transcript/clear", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: activeChannel }) });
    if (!res.ok) throw new Error("The chat history could not be cleared.");
    clearLog();
  } catch (err) {
    setComposerError(err instanceof Error ? err.message : "The chat history could not be cleared.");
  } finally {
    syncHistoryActions();
  }
}

async function reconcileAndClearChat() {
  if (!window.confirm(`Ask Archie to reconcile ${historyActionLabel()} against the current repository, then clear it?`)) return;
  clearChatBtn.disabled = true;
  reconcileChatBtn.disabled = true;
  reconcileJobActive = true;
  studioStatusEl.textContent = "Archie is reconciling history";
  reconcileChatBtn.textContent = "Starting…";
  try {
    const data = await requestJson("/api/transcript/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: activeChannel }) });
    if (!data?.job?.id) throw new Error("Archie did not return a reconciliation job.");
    await watchReconcile(data.job.id);
  } catch (err) {
    setComposerError(err instanceof Error ? err.message : "Archie could not reconcile this history.");
    studioStatusEl.textContent = "Reconciliation needs attention";
    reconcileJobActive = false;
    syncHistoryActions();
  } finally {
    updatePulse();
  }
}

async function watchReconcile(jobId) {
  const started = Date.now();
  const finish = (success, message) => {
    reconcilePollTimer = null;
    reconcileJobActive = false;
    syncHistoryActions();
    studioStatusEl.textContent = message;
    if (success) clearLog();
    else setComposerError(message);
  };
  const poll = async () => {
    try {
      const job = await requestJson(`/api/transcript/reconcile/${encodeURIComponent(jobId)}`);
      if (!["queued", "working", "waiting", "complete", "error"].includes(job?.state)) {
        throw new Error("Archie returned an unknown reconciliation status.");
      }
      const jobMessage = typeof job.message === "string" && job.message ? job.message : `Reconciliation is ${job.state}.`;
      const elapsed = Math.max(1, Math.round((Date.now() - started) / 1000));
      const progressLabel = job.state === "queued" ? "Queued" : job.state === "waiting" ? "Waiting" : "Working";
      reconcileChatBtn.textContent = `${progressLabel}… ${elapsed}s`;
      studioStatusEl.textContent = jobMessage;
      if (job.state === "complete") return finish(true, jobMessage);
      if (job.state === "error") return finish(false, jobMessage);
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
  const loadGeneration = ++channelLoadGeneration;
  if (id !== activeChannel) {
    activeChannel = id;
    localStorage.setItem("gui-active-channel", id);
  }
  const channelPersona = personaById(id);
  chatChannelEyebrow.textContent = id === TEAM_CHANNEL ? "Automatically routed" : "Direct conversation";
  chatChannelTitle.textContent = id === TEAM_CHANNEL ? "Team" : (channelPersona?.name || actorName(id));
  const emptyTitle = emptyState.querySelector("strong");
  const emptyCopy = emptyState.querySelector("p");
  if (emptyTitle) emptyTitle.textContent = id === TEAM_CHANNEL ? "What should the team work on?" : `What do you want ${channelPersona?.name ?? "this agent"} to handle?`;
  if (emptyCopy) emptyCopy.textContent = id === TEAM_CHANNEL
    ? "Team will route your request to the right agent, or choose a specialist above."
    : `${channelPersona?.name ?? "This agent"} is ready for a direct request.`;
  activeHistoryLoaded = false;
  syncHistoryActions();
  clearChatBtn.closest("details")?.removeAttribute("open");
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
    const lines = await requestJson(`/api/transcript?channel=${encodeURIComponent(id)}`);
    if (loadGeneration !== channelLoadGeneration || id !== activeChannel) return;
    if (!Array.isArray(lines)) throw new Error("The dashboard returned invalid conversation history.");
    for (const line of lines) applyHistoryEvent(line.channel, line.event, line.ts);
    activeHistoryLoaded = true;
    syncHistoryActions();
  } catch (error) {
    if (loadGeneration !== channelLoadGeneration || id !== activeChannel) return;
    const message = error instanceof Error ? error.message : "Conversation history could not be loaded.";
    setComposerError(`${message} History actions are disabled until this channel loads successfully.`);
    addMessage("error", "Dashboard", null).textContent = "Conversation history is unavailable. Refresh this channel before relying on or clearing its history.";
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

function renderApprovalsFull() {
  approvalsFullEl.innerHTML = "";
  if (!approvalsList.length) {
    renderRegionState(approvalsFullEl, "No approval requests are currently pending.");
    return;
  }
  for (const approval of approvalsList) approvalsFullEl.appendChild(approvalCard(approval));
}

function renderApprovalsUnavailable() {
  if (approvalsList.length) renderApprovalsFull();
  else approvalsFullEl.innerHTML = "";
  const notice = document.createElement("div");
  notice.className = "view-state view-state-error";
  const message = document.createElement("p");
  message.textContent = approvalsList.length
    ? "Approval status could not be refreshed. Showing the last known requests."
    : "Approval status is unavailable. Retry before assuming nothing needs approval.";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Retry";
  retry.addEventListener("click", () => void loadApprovals());
  notice.append(message, retry);
  approvalsFullEl.prepend(notice);
}

function reconcileApprovalAlerts() {
  const pendingByPersona = new Map();
  for (const approval of approvalsList) pendingByPersona.set(approval.personaId, approval);

  for (const [personaId, alert] of [...agentAlerts.entries()]) {
    if (alert.source === "approval" && !pendingByPersona.has(personaId)) clearAgentAlert(personaId, "approval");
  }
  for (const [personaId, approval] of pendingByPersona) {
    const current = agentAlerts.get(personaId);
    if (current && current.source !== "approval") continue;
    const message = `${approval.reason}. Your approval is needed.`;
    if (current?.message !== message || current.status !== "hand-raised") {
      setAgentAlert(personaId, "hand-raised", message, "approval");
    }
  }
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
  const approveButton = card.querySelector(".approve");
  const denyButton = card.querySelector(".deny");
  const handleDecision = async (approved) => {
    approveButton.disabled = true;
    denyButton.disabled = true;
    card.querySelector(".approval-card-error")?.remove();
    try {
      await respond(approval.id, approved);
    } catch (error) {
      const message = document.createElement("p");
      message.className = "approval-card-error";
      message.setAttribute("role", "alert");
      message.textContent = error instanceof Error ? error.message : "That decision could not be saved.";
      card.appendChild(message);
      approveButton.disabled = false;
      denyButton.disabled = false;
    }
  };
  approveButton.addEventListener("click", () => void handleDecision(true));
  denyButton.addEventListener("click", () => void handleDecision(false));
  return card;
}

async function respond(id, approve) {
  await requestJson(`/api/approvals/${id}`, {
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
  input.disabled = busy || eventsDisconnected;
  sendBtn.disabled = busy || eventsDisconnected;
  mentionBtn.style.display = activeChannel === TEAM_CHANNEL ? "" : "none";
  if (eventsDisconnected) {
    input.placeholder = "Reconnecting live updates…";
  } else if (busy) {
    input.placeholder = "Replying…";
  } else if (activeChannel === TEAM_CHANNEL) {
    input.placeholder = "Describe what you want done — Team will route it…";
  } else {
    input.placeholder = `Ask ${personaById(activeChannel)?.name ?? "this agent"} to help…`;
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

  let data;
  try {
    data = await requestJson("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, channel }),
    });
  } catch (error) {
    setComposerError(error instanceof Error ? error.message : "Couldn't send that.");
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
  try {
    const data = await requestJson("/api/personas");
    personas = Array.isArray(data) ? data : [];
  } catch (error) {
    personas = [];
    setComposerError(error instanceof Error ? error.message : "The team list could not be loaded.");
  }
  renderChannelList();
  updateComposerState();
}

async function loadApprovals() {
  if (approvalsLoadInFlight) {
    approvalsLoadQueued = true;
    return;
  }
  approvalsLoadInFlight = true;
  const stateVersion = approvalsStateVersion;
  try {
    const approvals = await requestJson("/api/approvals");
    if (stateVersion !== approvalsStateVersion) {
      approvalsLoadQueued = true;
      return;
    }
    approvalsList = Array.isArray(approvals) ? approvals : [];
    reconcileApprovalAlerts();
    renderApprovalsFull();
    renderAttention();
    updatePulse();
  } catch {
    renderApprovalsUnavailable();
    studioStatusEl.textContent = "Approval status unavailable";
  } finally {
    approvalsLoadInFlight = false;
    if (approvalsLoadQueued) {
      approvalsLoadQueued = false;
      scheduleApprovalsRefresh();
    }
  }
}

function scheduleApprovalsRefresh() {
  clearTimeout(approvalsRefreshTimer);
  approvalsRefreshTimer = setTimeout(() => {
    approvalsRefreshTimer = null;
    void loadApprovals();
  }, 80);
}

function connectEvents() {
  const source = new EventSource("/api/events");
  source.onopen = () => {
    if (!eventsDisconnected) return;
    eventsDisconnected = false;
    hopsRemainingByChannel.clear();
    for (const indicator of hopIndicators.values()) indicator.remove();
    hopIndicators.clear();
    for (const entry of streaming.values()) entry.textEl.classList.remove("streaming-cursor");
    streaming.clear();
    updateComposerState();
    setComposerError("Live updates reconnected. The conversation has been refreshed.");
    void switchChannel(activeChannel);
    void refreshWorkViews({ silent: true });
    void loadApprovals();
  };
  source.onerror = () => {
    eventsDisconnected = true;
    studioStatusEl.textContent = "Reconnecting live updates";
    setComposerError("Live updates were interrupted. The dashboard is reconnecting automatically.");
    updateComposerState();
  };
  source.onmessage = (evt) => {
    try {
      handleEvent(JSON.parse(evt.data));
    } catch {
      // Ignore a malformed event; EventSource will continue with the next one.
    }
  };
}

function endHop(channel) {
  const remaining = Math.max(0, (hopsRemainingByChannel.get(channel) || 0) - 1);
  hopsRemainingByChannel.set(channel, remaining);
  if (channel === activeChannel) updateComposerState();
}

function handleEvent(event, when) {
  if (event.type === "dashboard_sync") {
    scheduleWorkRefresh();
    scheduleTaskPanelRefresh();
    void loadApprovals();
    return;
  }
  if (event.type === "board_updated") {
    scheduleWorkRefresh();
    scheduleTaskPanelRefresh();
    return;
  }
  if (event.type === "calendar_updated") {
    scheduleWorkRefresh();
    return;
  }
  if (event.type === "approval_requested") {
    approvalsStateVersion += 1;
    const idx = approvalsList.findIndex((a) => a.id === event.approval.id);
    if (idx === -1) approvalsList.push(event.approval);
    else approvalsList[idx] = event.approval;
    renderApprovalsFull();
    renderAttention();
    updatePulse();
    const currentAlert = agentAlerts.get(event.approval.personaId);
    if (!currentAlert || currentAlert.source === "approval") {
      setAgentAlert(event.approval.personaId, "hand-raised", `${event.approval.reason}. Your approval is needed.`, "approval");
    }
    scheduleApprovalsRefresh();
    return;
  }
  if (event.type === "approval_resolved") {
    approvalsStateVersion += 1;
    const resolved = approvalsList.find((a) => a.id === event.id);
    if (event.timedOut) {
      const personaId = resolved?.personaId;
      const who = (personaId && personaById(personaId)?.name) ?? personaId ?? "An agent";
      addMessage("error", who, null).textContent = `${who}'s request timed out waiting for a response and was denied automatically.`;
    }
    approvalsList = approvalsList.filter((a) => a.id !== event.id);
    renderApprovalsFull();
    renderAttention();
    updatePulse();
    const personaId = resolved?.personaId;
    if (personaId) {
      const hasAnotherApproval = approvalsList.some((item) => item.personaId === personaId);
      if (!hasAnotherApproval) {
        clearAgentAlert(personaId, "approval");
        if (!agentAlerts.has(personaId)) {
          setAgentStatus(personaId, event.approved ? "working" : "attention", event.approved ? "Approval received; continuing." : "Approval was denied.");
        }
      }
    }
    scheduleApprovalsRefresh();
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
    if (event.type === "tool_use" && event.tool === "AskUserQuestion") setAgentAlert(event.personaId, "question", "Archie needs an answer before continuing.");
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
    scheduleWorkRefresh();
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
  initialiseNav();
  await loadPersonas();
  if (activeChannel !== TEAM_CHANNEL && !personaById(activeChannel)) activeChannel = TEAM_CHANNEL;
  renderQuickReplies();
  await switchChannel(activeChannel);
  await setActiveTab(activeTab, { refresh: false });
  await refreshWorkViews({ silent: false });
  void loadApprovals();
  if (activeTab === "home") renderHome();
  connectEvents();
}

bootstrap().catch((error) => {
  setComposerError(error instanceof Error ? error.message : "The dashboard could not finish loading.");
});
