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
const pageEyebrowEl = document.getElementById("page-eyebrow");
const pageTitleEl = document.getElementById("page-title");
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
const moveToBtn = document.getElementById("move-to-btn");
const movePopover = document.getElementById("move-popover");
const incognitoBtn = document.getElementById("incognito-btn");
const incognitoBanner = document.getElementById("incognito-banner");
const incognitoBannerNote = document.getElementById("incognito-banner-note");
const incognitoEndBtn = document.getElementById("incognito-end-btn");
const navButtons = [...document.querySelectorAll(".nav-btn")];
const views = [...document.querySelectorAll(".view")];
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
const currentWorkToggleBtn = document.getElementById("current-work-toggle");
const homeActivityListEl = document.getElementById("home-activity-list");
const homeActivityToggleBtn = document.getElementById("home-activity-toggle");
const homeGreetingEl = document.getElementById("home-greeting");
const askBar = document.getElementById("ask-bar");
const askInput = document.getElementById("ask-input");
const worklogKindFilterEl = document.getElementById("worklog-kind-filter");
const worklogTagFilterEl = document.getElementById("worklog-tag-filter");
const newWorklogBtn = document.getElementById("new-worklog-btn");
const activityChipsEl = document.getElementById("activity-chips");
const taskTemplatesEl = document.getElementById("task-templates");
const taskTemplateChipsEl = document.getElementById("task-template-chips");
const sampleDataBtn = document.getElementById("sample-data-btn");
const sidenavToggleEl = document.getElementById("sidenav-toggle");
const shellEl = document.querySelector(".shell");
const plannerGridEl = document.getElementById("planner-grid");
const plannerWeekdaysEl = document.getElementById("planner-weekdays");
const plannerMonthEl = document.getElementById("planner-month");
const plannerPrevEl = document.getElementById("planner-prev");
const plannerNextEl = document.getElementById("planner-next");
const plannerTodayEl = document.getElementById("planner-today");
const plannerOptionsEl = document.getElementById("planner-options");
const plannerOptionsToggleEl = document.getElementById("planner-options-toggle");
const plannerLayerTasksEl = document.getElementById("planner-layer-tasks");
const plannerLayerSchedulesEl = document.getElementById("planner-layer-schedules");
const plannerNewTaskEl = document.getElementById("planner-new-task");
const plannerNewScheduleEl = document.getElementById("planner-new-schedule");
const plannerUnscheduledListEl = document.getElementById("planner-unscheduled-list");
const plannerUnscheduledCountEl = document.getElementById("planner-unscheduled-count");
const plannerNoticeEl = document.getElementById("planner-notice");
const schedulesListEl = document.getElementById("schedules-list");
const schedulesPauseCheckbox = document.getElementById("schedules-pause-checkbox");
const newScheduleBtn = document.getElementById("new-schedule-btn");
const scheduleNoticeEl = document.getElementById("schedule-notice");
let reconcilePollTimer = null;

const TEAM_CHANNEL = "team";
const QUICK_REPLIES = ["Yes, go ahead", "Looks good", "Not yet — hold off", "What's the status?", "Can you explain more?", "No, stop."];
const TAB_IDS = ["home", "employees", "board", "schedules", "calendar", "activity", "chat", "approvals"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAGE_META = {
  home: { eyebrow: "Overview", title: "Command Center" },
  employees: { eyebrow: "Directory", title: "Employees" },
  chat: { eyebrow: "Internal comms", title: "Messages" },
  board: { eyebrow: "Work", title: "Tasks" },
  schedules: { eyebrow: "Automation", title: "Schedules" },
  calendar: { eyebrow: "Planner", title: "Calendar" },
  activity: { eyebrow: "Activity", title: "Activity" },
  approvals: { eyebrow: "Approval Center", title: "Approvals" },
};
const STATUS_ORDER = ["backlog", "in-progress", "done"];
const STATUS_LABELS = { backlog: "Backlog", "in-progress": "In progress", done: "Done" };
const NEXT_STATUS = { backlog: "in-progress", "in-progress": "done" };
const NEXT_STATUS_LABEL = { backlog: "Start task", "in-progress": "Mark done" };
const WORKLOG_KIND_LABELS = { update: "Update", "add-on": "Add-on", decision: "Decision", plan: "Plan", brainstorm: "Brainstorm" };

let personas = [];
let activeChannel = localStorage.getItem("gui-active-channel") || TEAM_CHANNEL;
const incognitoChannels = new Set();
const savedTab = localStorage.getItem("gui-active-tab");
let activeTab = TAB_IDS.includes(savedTab) ? savedTab : "home";
let roster = [];
let boardState = { backlog: [], "in-progress": [], done: [], categories: [] };
let approvalsList = [];
let lastActivityFeed = [];
let lastTeamUpdates = [];
let currentWorkExpanded = false;
let homeActivityExpanded = false;
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
let worklogTags = [];
let activityFilter = "all";
let plannerMonth = (() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
})();
const plannerLayers = { tasks: true, schedules: true };
let plannerDragTaskId = null;
let plannerNoticeTimer = null;
let schedulesList = [];
let schedulesPaused = false;
let schedulesLoadGeneration = 0;
let scheduleNoticeTimer = null;
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

function updateBadges() {
  badgeApprovalsEl.hidden = approvalsList.length === 0;
  badgeApprovalsEl.textContent = String(approvalsList.length);
  badgeChatEl.hidden = unreadChannels.size === 0;
  badgeChatEl.textContent = String(unreadChannels.size);
}

function updatePulse() {
  const activeCount = [...agentStatuses.values()].filter((status) => status === "working").length;
  agentCountEl.textContent = String(personas.length);
  activeCountEl.textContent = String(activeCount);
  boardProgressCountEl.textContent = String(boardState["in-progress"].length);
  boardBacklogCountEl.textContent = String(boardState.backlog.length);
  approvalCountEl.textContent = String(approvalsList.length);
  const urgent = [...agentStatuses.values()].some((status) => status === "help");
  const hasQuestion = [...agentStatuses.values()].some((status) => status === "question");
  const handRaised = [...agentStatuses.values()].some((status) => status === "hand-raised");
  studioStatusEl.textContent = urgent ? "An agent needs immediate help" : handRaised ? "An agent has raised a hand" : hasQuestion ? "An agent has a question" : approvalsList.length ? "Your approval is needed" : activeCount ? `${activeCount} agent${activeCount === 1 ? " is" : "s are"} working` : "Ready for direction";
  updateBadges();
  if (activeTab === "home") renderHome();
}

function setAgentStatus(id, status, message = "") {
  if (!id) return;
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
}

async function setActiveTab(tab, { refresh = true } = {}) {
  if (!TAB_IDS.includes(tab)) tab = "home";
  activeTab = tab;
  localStorage.setItem("gui-active-tab", tab);
  const meta = PAGE_META[tab];
  if (meta && pageEyebrowEl && pageTitleEl) {
    pageEyebrowEl.textContent = meta.eyebrow;
    pageTitleEl.textContent = meta.title;
  }
  for (const button of navButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.tab === tab));
  }
  for (const view of views) view.hidden = view.id !== `view-${tab}`;
  if (tab === "chat") applyChannelAccent(activeChannel);
  else document.documentElement.style.removeProperty("--channel-accent");

  if (!refresh) return;
  await loadTabData(tab);
}

/**
 * Fetches and renders whatever the given tab needs. Shared by setActiveTab and by bootstrap, which
 * restores the last-used tab from localStorage — without this being callable separately, reloading
 * on a tab that refreshWorkViews doesn't cover (Calendar, Schedules) left it rendering nothing.
 */
async function loadTabData(tab) {
  if (tab === "home") {
    await Promise.all([
      loadRoster({ silent: roster.length > 0 }),
      loadBoard({ silent: allBoardTasks().length > 0 }),
      loadCalendar({ silent: true }),
    ]);
    renderHome();
  }
  if (tab === "employees") await loadRoster({ silent: roster.length > 0 });
  if (tab === "board") await Promise.all([loadBoard({ silent: allBoardTasks().length > 0 }), loadTaskTemplates()]);
  if (tab === "schedules") await loadSchedules();
  if (tab === "activity") {
    await Promise.all([loadCalendar({ silent: true }), loadWorkLogTags()]);
  }
  if (tab === "calendar") await loadPlanner();
  if (tab === "approvals") renderApprovalsFull();
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
  const total = approvalsList.length + signals.length;
  attentionCountEl.textContent = String(total);
  attentionListEl.innerHTML = "";
  if (!total) {
    renderRegionState(attentionListEl, "All caught up — nothing needs you right now.");
    return;
  }
  for (const approval of approvalsList) attentionListEl.appendChild(approvalCard(approval));
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
  currentWorkToggleBtn.hidden = inProgress.length <= 5;
  currentWorkToggleBtn.textContent = currentWorkExpanded ? "Show less ←" : "View all →";
  if (!inProgress.length) {
    renderRegionState(currentWorkListEl, "Nothing in progress right now.");
    return;
  }
  const visible = currentWorkExpanded ? inProgress : inProgress.slice(0, 5);
  for (const task of visible) currentWorkListEl.appendChild(renderTaskCard(task));
}

function renderHomeActivity() {
  homeActivityToggleBtn.hidden = lastActivityFeed.length <= 5;
  homeActivityToggleBtn.textContent = homeActivityExpanded ? "Show less ←" : "View all →";
  renderActivityItems(homeActivityListEl, homeActivityExpanded ? lastActivityFeed : lastActivityFeed.slice(0, 5));
}

currentWorkToggleBtn.addEventListener("click", () => {
  currentWorkExpanded = !currentWorkExpanded;
  renderCurrentWork();
});

homeActivityToggleBtn.addEventListener("click", () => {
  homeActivityExpanded = !homeActivityExpanded;
  renderHomeActivity();
});

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

function chipRow(values, className) {
  if (!Array.isArray(values) || !values.length) return "";
  return `<div class="${className}">${values.map((value) => `<span class="employee-chip">${escapeHtml(value)}</span>`).join("")}</div>`;
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
  const inProgress = tasks.filter((task) => task.status === "in-progress").length;
  const partnerNames = (persona.partnersWith || []).map((partnerId) => personaById(partnerId)?.name ?? partnerId);

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
    ${persona.bio ? `<p class="employee-bio">${escapeHtml(persona.bio)}</p>` : ""}
    <div class="employee-workload">
      <div><span class="employee-workload-value">${tasks.length}</span><span class="employee-workload-label">assigned</span></div>
      <div><span class="employee-workload-value">${inProgress}</span><span class="employee-workload-label">in progress</span></div>
    </div>
    <dl class="task-facts">
      <div><dt>Identity</dt><dd>${persona.email ? `<a href="mailto:${escapeHtml(persona.email)}">${escapeHtml(persona.email)}</a>` : "—"}</dd></div>
      ${persona.workingHours ? `<div><dt>Working hours</dt><dd>${escapeHtml(persona.workingHours)}</dd></div>` : ""}
      ${persona.startedAt ? `<div><dt>On the team since</dt><dd>${escapeHtml(formatDate(persona.startedAt))}</dd></div>` : ""}
      ${partnerNames.length ? `<div><dt>Works closely with</dt><dd>${escapeHtml(partnerNames.join(", "))}</dd></div>` : ""}
      ${scopeLine ? `<div><dt>Primarily works in</dt><dd>${escapeHtml(scopeLine)}</dd></div>` : ""}
    </dl>
    ${persona.focusAreas?.length ? `<section class="employee-section"><h3>Focus areas</h3>${chipRow(persona.focusAreas, "employee-chips")}</section>` : ""}
    ${persona.tools?.length ? `<section class="employee-section"><h3>Tools they reach for</h3>${chipRow(persona.tools, "employee-chips")}</section>` : ""}
    <section class="employee-section">
      <h3>Current work <span>${tasks.length}</span></h3>
      <div class="employee-task-list" id="employee-task-list"></div>
    </section>
    <section class="employee-section">
      <h3>Work log</h3>
      <div id="employee-worklog-list"><p class="task-activity-empty">Loading…</p></div>
    </section>
    <section class="employee-section">
      <h3>Recent activity</h3>
      <div id="employee-activity-list"></div>
    </section>
    <div class="employee-actions">
      <button type="button" class="deck-action primary" id="employee-open-chat">Message ${escapeHtml(persona.name)}</button>
    </div>`;

  // Their own work-log history — fetched per profile rather than held in memory, since it's only
  // needed while this panel is open.
  void (async () => {
    const listEl = employeePanelBody.querySelector("#employee-worklog-list");
    if (!listEl) return;
    try {
      const entries = await requestJson(`/api/worklog?personaId=${encodeURIComponent(id)}&limit=5`);
      if (!listEl.isConnected) return;
      listEl.innerHTML = "";
      if (!Array.isArray(entries) || !entries.length) {
        renderRegionState(listEl, `Nothing logged by ${persona.name} yet.`);
        return;
      }
      for (const entry of entries) listEl.appendChild(workLogCard(entry));
    } catch {
      if (listEl.isConnected) renderRegionState(listEl, "Work log unavailable.", "error");
    }
  })();

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
  if (event.key === "Escape") closeEmployeeProfile();
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

function openNewTaskPanel({ dueDate = "" } = {}) {
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
        <input id="task-due" name="dueDate" type="date" value="${escapeHtml(dueDate)}">
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
      // Creating from the calendar shouldn't yank you over to the board — stay put and re-render.
      if (activeTab === "calendar") {
        renderPlanner();
        showPlannerNotice(`Added "${created.title}".`, "success");
      } else {
        await setActiveTab("board", { refresh: false });
      }
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

function renderTaskWorkLog(entries) {
  if (!Array.isArray(entries) || !entries.length) return '<p class="task-activity-empty">No work-log entries yet.</p>';
  return `<ul class="task-worklog-list">${entries.map((entry) => `
    <li><span class="worklog-kind-badge small">${escapeHtml(WORKLOG_KIND_LABELS[entry.kind] || entry.kind)}</span> <button type="button" class="task-worklog-link" data-id="${escapeHtml(entry.id)}">${escapeHtml(entry.summary)}</button> <small>${escapeHtml(actorName(entry.by))} · ${escapeHtml(formatDate(entry.at))}</small></li>`).join("")}</ul>`;
}

async function openTaskDetail(taskId, { background = false } = {}) {
  taskPanelTaskId = taskId;
  const loadGeneration = ++taskPanelLoadGeneration;
  if (!background) taskPanelBody.innerHTML = '<div class="task-panel-loading">Loading task…</div>';
  if (taskOverlay.hidden) openTaskPanel("Task detail");
  else taskPanelEyebrow.textContent = "Task detail";
  try {
    const [task, linkedWorklog] = await Promise.all([
      requestJson(`/api/tasks/${encodeURIComponent(taskId)}`),
      requestJson(`/api/worklog?taskId=${encodeURIComponent(taskId)}`).catch(() => []),
    ]);
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
        <section class="task-worklog"><h3>Work log</h3>${renderTaskWorkLog(linkedWorklog)}</section>
        <form class="task-note-form"><label for="task-note">Add a progress note</label><div><input id="task-note" name="note" required maxlength="500" autocomplete="off" placeholder="What changed?"><button type="submit">Add note</button></div></form>
      </article>`;
    for (const link of taskPanelBody.querySelectorAll(".task-worklog-link")) {
      link.addEventListener("click", () => void setActiveTab("activity"));
    }
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
    // Work-log entries get their full card treatment (rationale, tag, task link, sign-off)
    // rather than a one-line row — they're the richest thing in this feed.
    if (entry.type === "worklog" && entry.entry) {
      container.appendChild(workLogCard(entry.entry));
      continue;
    }
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

/**
 * The Activity feed is a merged stream — work-log entries, completed tasks, and team updates.
 * The kind/tag selects only mean anything for work-log entries, so setting either implicitly
 * narrows the feed to work-log items rather than silently showing unfiltered rows alongside.
 */
function filteredActivity() {
  const kind = worklogKindFilterEl.value;
  const tag = worklogTagFilterEl.value;
  const worklogOnly = activityFilter === "worklog" || Boolean(kind) || Boolean(tag);
  return lastActivityFeed.filter((entry) => {
    if (worklogOnly) {
      if (entry.type !== "worklog" || !entry.entry) return false;
      if (kind && entry.entry.kind !== kind) return false;
      if (tag && entry.entry.tag !== tag) return false;
      return true;
    }
    if (activityFilter === "all") return true;
    return entry.type === activityFilter;
  });
}

function renderFilteredActivity() {
  for (const chip of activityChipsEl.querySelectorAll("[data-activity-filter]")) {
    chip.setAttribute("aria-pressed", String(chip.dataset.activityFilter === activityFilter));
  }
  const entries = filteredActivity();
  if (!entries.length && lastActivityFeed.length) {
    renderRegionState(calendarCompletedEl, "Nothing matches these filters.");
    return;
  }
  renderActivityItems(calendarCompletedEl, entries);
}

for (const chip of activityChipsEl.querySelectorAll("[data-activity-filter]")) {
  chip.addEventListener("click", () => {
    activityFilter = chip.dataset.activityFilter;
    renderFilteredActivity();
  });
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
    renderFilteredActivity();
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

// ---------- work log ----------

function workLogCard(entry) {
  const card = document.createElement("article");
  card.className = `worklog-card worklog-kind-${escapeHtml(entry.kind)}`;
  const who = actorName(entry.by);
  const rationale = entry.rationale
    ? `<details class="worklog-why"><summary>Why</summary><p>${escapeHtml(entry.rationale)}</p></details>`
    : "";
  const taskLink = entry.taskId ? `<button type="button" class="worklog-task-link">View task →</button>` : "";
  const tag = entry.tag ? `<button type="button" class="worklog-tag">${escapeHtml(entry.tag)}</button>` : "";
  const signOff = entry.signOff
    ? `<p class="worklog-signoff">Signed off by ${escapeHtml(actorName(entry.signOff.by))} · ${escapeHtml(formatDate(entry.signOff.at))}${entry.signOff.note ? ` — ${escapeHtml(entry.signOff.note)}` : ""}</p>`
    : `<button type="button" class="worklog-signoff-btn">Sign off</button>`;
  card.innerHTML = `
    <div class="worklog-card-head">
      <span class="worklog-kind-badge">${escapeHtml(WORKLOG_KIND_LABELS[entry.kind] || entry.kind)}</span>
      <span class="worklog-who">${escapeHtml(who)}</span>
      <time class="worklog-when" datetime="${escapeHtml(entry.at)}">${escapeHtml(formatDate(entry.at, true))}</time>
    </div>
    <p class="worklog-summary">${escapeHtml(entry.summary)}</p>
    ${rationale}
    <div class="worklog-card-foot">${tag}${taskLink}</div>
    ${signOff}
  `;
  card.querySelector(".worklog-task-link")?.addEventListener("click", () => void openTaskDetail(entry.taskId));
  card.querySelector(".worklog-tag")?.addEventListener("click", () => {
    worklogTagFilterEl.value = entry.tag;
    renderFilteredActivity();
  });
  card.querySelector(".worklog-signoff-btn")?.addEventListener("click", async (clickEvent) => {
    const button = clickEvent.currentTarget;
    button.disabled = true;
    try {
      const updated = await requestJson(`/api/worklog/${encodeURIComponent(entry.id)}/signoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const item = lastActivityFeed.find((candidate) => candidate.type === "worklog" && candidate.entry?.id === updated.id);
      if (item) item.entry = updated;
      renderFilteredActivity();
    } catch {
      button.disabled = false;
    }
  });
  return card;
}

async function loadWorkLogTags() {
  try {
    worklogTags = await requestJson("/api/worklog/tags");
  } catch {
    worklogTags = [];
  }
  const current = worklogTagFilterEl.value;
  worklogTagFilterEl.innerHTML = `<option value="">All tags</option>${worklogTags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("")}`;
  worklogTagFilterEl.value = worklogTags.includes(current) ? current : "";
}

worklogKindFilterEl.addEventListener("change", renderFilteredActivity);
worklogTagFilterEl.addEventListener("change", renderFilteredActivity);

function openNewWorkLogPanel() {
  taskPanelTaskId = null;
  taskPanelLoadGeneration += 1;
  taskPanelBody.innerHTML = `
    <form class="task-form" id="new-worklog-form">
      <div class="task-field">
        <label for="worklog-kind">Kind</label>
        <select id="worklog-kind" name="kind">
          <option value="update">Update</option>
          <option value="add-on">Add-on</option>
          <option value="decision">Decision</option>
          <option value="plan">Plan</option>
          <option value="brainstorm">Brainstorm</option>
        </select>
      </div>
      <div class="task-field">
        <label for="worklog-tag">Tag</label>
        <input id="worklog-tag" name="tag" list="worklog-tag-list" autocomplete="off">
        <datalist id="worklog-tag-list">${worklogTags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join("")}</datalist>
      </div>
      <div class="task-field task-field-wide">
        <label for="worklog-summary">Summary</label>
        <input id="worklog-summary" name="summary" required maxlength="300" autocomplete="off">
      </div>
      <div class="task-field task-field-wide">
        <label for="worklog-rationale">Why (optional)</label>
        <textarea id="worklog-rationale" name="rationale" rows="3" maxlength="2000"></textarea>
      </div>
      <div class="task-form-actions task-field-wide"><button type="button" class="task-cancel">Cancel</button><button type="submit" class="task-submit">Post entry</button></div>
    </form>`;
  openTaskPanel("New work-log entry");
  const form = taskPanelBody.querySelector("#new-worklog-form");
  form.querySelector(".task-cancel").addEventListener("click", closeTaskPanel);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector(".task-submit");
    const values = new FormData(form);
    const summary = String(values.get("summary") || "").trim();
    if (!summary) return;
    submit.disabled = true;
    submit.textContent = "Posting…";
    try {
      await requestJson("/api/worklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: String(values.get("kind") || "update"),
          summary,
          rationale: String(values.get("rationale") || "").trim() || undefined,
          tag: String(values.get("tag") || "").trim() || undefined,
        }),
      });
      closeTaskPanel();
      await setActiveTab("activity", { refresh: false });
      await Promise.all([loadCalendar({ silent: true }), loadWorkLogTags()]);
    } catch (error) {
      setTaskPanelError(form, error instanceof Error ? error.message : "The entry could not be posted.");
      submit.disabled = false;
      submit.textContent = "Post entry";
    }
  });
}

newWorklogBtn.addEventListener("click", openNewWorkLogPanel);

// ---------- calendar / planner ----------

/** Local-time YYYY-MM-DD. Task due dates are already date-only strings; schedule run times are ISO timestamps that have to be read in the viewer's zone, not UTC, or an evening run lands on the wrong day. */
function dateKey(value) {
  const date = value instanceof Date ? value : validDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function showPlannerNotice(message, kind = "error") {
  clearTimeout(plannerNoticeTimer);
  plannerNoticeEl.className = `board-notice board-notice-${kind}`;
  plannerNoticeEl.setAttribute("role", kind === "error" ? "alert" : "status");
  plannerNoticeEl.textContent = message;
  plannerNoticeEl.hidden = false;
  plannerNoticeTimer = setTimeout(() => {
    plannerNoticeEl.hidden = true;
    plannerNoticeEl.textContent = "";
  }, 4000);
}

function plannerTaskChip(task) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = `planner-chip planner-chip-task priority-${escapeHtml(task.priority || "normal")} status-${escapeHtml(task.status)}`;
  chip.draggable = true;
  chip.dataset.taskId = task.id;
  chip.title = `${task.title} — ${STATUS_LABELS[task.status] || task.status}, ${taskAssigneeName(task)}`;
  chip.innerHTML = `<span class="planner-chip-dot"></span><span class="planner-chip-text">${escapeHtml(task.title)}</span>`;
  chip.addEventListener("click", () => void openTaskDetail(task.id));
  chip.addEventListener("dragstart", (event) => {
    plannerDragTaskId = task.id;
    chip.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    // Firefox refuses to start a drag unless some data is set.
    event.dataTransfer.setData("text/plain", task.id);
  });
  chip.addEventListener("dragend", () => {
    plannerDragTaskId = null;
    chip.classList.remove("dragging");
    for (const cell of plannerGridEl.querySelectorAll(".planner-day.drop-target")) cell.classList.remove("drop-target");
  });
  return chip;
}

function plannerScheduleChip(schedule) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "planner-chip planner-chip-schedule";
  const who = personaById(schedule.personaId)?.name ?? schedule.personaId;
  chip.title = `${schedule.name} — ${who}, ${formatCadence(schedule.cadence)}`;
  chip.innerHTML = `<span class="planner-chip-dot"></span><span class="planner-chip-text">${escapeHtml(schedule.name)}</span>`;
  chip.addEventListener("click", () => void setActiveTab("schedules"));
  return chip;
}

async function movePlannerTask(taskId, nextDueDate) {
  const task = allBoardTasks().find((candidate) => candidate.id === taskId);
  if (!task) return;
  if ((task.dueDate ?? null) === nextDueDate) return;
  try {
    const updated = await requestJson(`/api/tasks/${encodeURIComponent(taskId)}/due-date`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: nextDueDate }),
    });
    mergeBoardTask(updated);
    renderPlanner();
    showPlannerNotice(
      nextDueDate ? `"${updated.title}" moved to ${formatDate(nextDueDate)}.` : `"${updated.title}" no longer has a due date.`,
      "success",
    );
  } catch (error) {
    showPlannerNotice(error instanceof Error ? error.message : "That task could not be moved.");
  }
}

function attachDayDropTarget(cell, dayKey) {
  cell.addEventListener("dragover", (event) => {
    if (!plannerDragTaskId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    cell.classList.add("drop-target");
  });
  cell.addEventListener("dragleave", () => cell.classList.remove("drop-target"));
  cell.addEventListener("drop", (event) => {
    if (!plannerDragTaskId) return;
    event.preventDefault();
    cell.classList.remove("drop-target");
    void movePlannerTask(plannerDragTaskId, dayKey);
  });
}

function renderPlanner() {
  const year = plannerMonth.getFullYear();
  const month = plannerMonth.getMonth();
  plannerMonthEl.textContent = `${MONTH_NAMES[month]} ${year}`;

  if (!plannerWeekdaysEl.childElementCount) {
    for (const label of WEEKDAY_LABELS) {
      const cell = document.createElement("span");
      cell.textContent = label;
      plannerWeekdaysEl.appendChild(cell);
    }
  }

  const tasksByDay = new Map();
  if (plannerLayers.tasks) {
    for (const task of allBoardTasks()) {
      if (!task.dueDate) continue;
      const key = dateKey(task.dueDate);
      if (!tasksByDay.has(key)) tasksByDay.set(key, []);
      tasksByDay.get(key).push(task);
    }
  }
  const schedulesByDay = new Map();
  if (plannerLayers.schedules) {
    for (const schedule of schedulesList) {
      if (!schedule.nextRunAt) continue;
      const key = dateKey(schedule.nextRunAt);
      if (!schedulesByDay.has(key)) schedulesByDay.set(key, []);
      schedulesByDay.get(key).push(schedule);
    }
  }

  const todayKey = dateKey(new Date());
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  // Always six rows, so the grid height doesn't jump between months.
  const cellCount = 42;

  plannerGridEl.innerHTML = "";
  for (let i = 0; i < cellCount; i++) {
    const offset = i - firstWeekday;
    let cellDate;
    let outside = false;
    if (offset < 0) {
      cellDate = new Date(year, month - 1, daysInPrev + offset + 1);
      outside = true;
    } else if (offset >= daysInMonth) {
      cellDate = new Date(year, month + 1, offset - daysInMonth + 1);
      outside = true;
    } else {
      cellDate = new Date(year, month, offset + 1);
    }
    const key = dateKey(cellDate);
    const cell = document.createElement("div");
    cell.className = `planner-day${outside ? " outside" : ""}${key === todayKey ? " today" : ""}`;
    cell.dataset.day = key;

    const header = document.createElement("button");
    header.type = "button";
    header.className = "planner-day-num";
    header.textContent = String(cellDate.getDate());
    header.title = `Add a task due ${formatDate(key)}`;
    header.addEventListener("click", () => openNewTaskPanel({ dueDate: key }));
    cell.appendChild(header);

    const items = document.createElement("div");
    items.className = "planner-day-items";
    for (const task of tasksByDay.get(key) ?? []) items.appendChild(plannerTaskChip(task));
    for (const schedule of schedulesByDay.get(key) ?? []) items.appendChild(plannerScheduleChip(schedule));
    cell.appendChild(items);

    attachDayDropTarget(cell, key);
    plannerGridEl.appendChild(cell);
  }

  const undated = allBoardTasks().filter((task) => !task.dueDate && task.status !== "done");
  plannerUnscheduledCountEl.textContent = String(undated.length);
  plannerUnscheduledListEl.innerHTML = "";
  if (!undated.length) {
    renderRegionState(plannerUnscheduledListEl, "Everything open has a due date.");
  } else {
    for (const task of undated) plannerUnscheduledListEl.appendChild(plannerTaskChip(task));
  }
}

async function loadPlanner() {
  await Promise.all([
    loadBoard({ silent: allBoardTasks().length > 0 }),
    // The planner needs each schedule's computed nextRunAt, which only /api/schedules returns.
    (async () => {
      try {
        const data = await requestJson("/api/schedules");
        schedulesList = Array.isArray(data?.schedules) ? data.schedules : [];
        schedulesPaused = Boolean(data?.paused);
      } catch {
        schedulesList = [];
      }
    })(),
  ]);
  renderPlanner();
}

plannerPrevEl.addEventListener("click", () => {
  plannerMonth = new Date(plannerMonth.getFullYear(), plannerMonth.getMonth() - 1, 1);
  renderPlanner();
});
plannerNextEl.addEventListener("click", () => {
  plannerMonth = new Date(plannerMonth.getFullYear(), plannerMonth.getMonth() + 1, 1);
  renderPlanner();
});
plannerTodayEl.addEventListener("click", () => {
  const now = new Date();
  plannerMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  renderPlanner();
});
plannerOptionsToggleEl.addEventListener("click", () => {
  const open = plannerOptionsEl.hidden;
  plannerOptionsEl.hidden = !open;
  plannerOptionsToggleEl.setAttribute("aria-expanded", String(open));
  plannerOptionsToggleEl.textContent = open ? "Show on calendar ▴" : "Show on calendar ▾";
});
plannerLayerTasksEl.addEventListener("change", () => {
  plannerLayers.tasks = plannerLayerTasksEl.checked;
  renderPlanner();
});
plannerLayerSchedulesEl.addEventListener("change", () => {
  plannerLayers.schedules = plannerLayerSchedulesEl.checked;
  renderPlanner();
});
plannerNewTaskEl.addEventListener("click", () => openNewTaskPanel({ dueDate: dateKey(new Date()) }));
plannerNewScheduleEl.addEventListener("click", () => openNewSchedulePanel());

// Dropping a chip back into the unscheduled tray clears its due date.
plannerUnscheduledListEl.addEventListener("dragover", (event) => {
  if (!plannerDragTaskId) return;
  event.preventDefault();
  plannerUnscheduledListEl.classList.add("drop-target");
});
plannerUnscheduledListEl.addEventListener("dragleave", () => plannerUnscheduledListEl.classList.remove("drop-target"));
plannerUnscheduledListEl.addEventListener("drop", (event) => {
  if (!plannerDragTaskId) return;
  event.preventDefault();
  plannerUnscheduledListEl.classList.remove("drop-target");
  void movePlannerTask(plannerDragTaskId, null);
});

// ---------- task templates ----------

async function loadTaskTemplates() {
  let templates = [];
  try {
    templates = await requestJson("/api/task-templates");
  } catch {
    templates = [];
  }
  taskTemplateChipsEl.innerHTML = "";
  if (!Array.isArray(templates) || !templates.length) {
    taskTemplatesEl.hidden = true;
    return;
  }
  taskTemplatesEl.hidden = false;
  for (const template of templates) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "task-template-chip";
    const who = personaById(template.assignee)?.name ?? template.assignee;
    chip.innerHTML = `<span>${escapeHtml(template.label)}</span><small>${escapeHtml(who)}</small>`;
    chip.title = template.detail || template.title;
    chip.addEventListener("click", async () => {
      chip.disabled = true;
      try {
        const created = await requestJson("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: template.title,
            detail: template.detail,
            category: template.category,
            priority: template.priority,
            assignee: template.assignee || null,
          }),
        });
        mergeBoardTask(created);
        renderBoard();
        showBoardNotice(`Added "${created.title}" to Backlog.`, "success");
      } catch (error) {
        showBoardNotice(error instanceof Error ? error.message : "That task could not be added.");
      } finally {
        chip.disabled = false;
      }
    });
    taskTemplateChipsEl.appendChild(chip);
  }
}

// ---------- sample data ----------

function openSampleDataPanel() {
  taskPanelTaskId = null;
  taskPanelLoadGeneration += 1;
  taskPanelBody.innerHTML = `
    <div class="sample-data-panel">
      <p class="sample-data-copy">Fill the board, work log, and team updates with a couple of weeks of realistic sample work, so every page has something to show. Safe to run more than once — it adds, it doesn't replace.</p>
      <button type="button" class="deck-action primary" id="sample-load">Load sample data</button>
      <hr>
      <p class="sample-data-copy sample-data-warn">Clearing removes <strong>everything</strong> in the task board, work log, and team updates — including anything real, not just sample rows. Schedules and chat history are left alone.</p>
      <button type="button" class="deck-action" id="sample-clear">Clear all board &amp; log data</button>
    </div>`;
  openTaskPanel("Sample data");

  const setBusy = (button, label) => {
    button.disabled = true;
    button.textContent = label;
  };

  taskPanelBody.querySelector("#sample-load").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    setBusy(button, "Loading…");
    try {
      const result = await requestJson("/api/sample-data", { method: "POST" });
      closeTaskPanel();
      await refreshWorkViews({ silent: false });
      await Promise.all([loadWorkLogTags(), loadTaskTemplates()]);
      showBoardNotice(`Loaded ${result.tasks} tasks, ${result.worklog} work-log entries, ${result.teamUpdates} team updates.`, "success");
    } catch (error) {
      setTaskPanelError(taskPanelBody.querySelector(".sample-data-panel"), error instanceof Error ? error.message : "Sample data could not be loaded.");
      button.disabled = false;
      button.textContent = "Load sample data";
    }
  });

  taskPanelBody.querySelector("#sample-clear").addEventListener("click", async (event) => {
    if (!window.confirm("Clear ALL tasks, work-log entries, and team updates? This cannot be undone.")) return;
    const button = event.currentTarget;
    setBusy(button, "Clearing…");
    try {
      await requestJson("/api/sample-data", { method: "DELETE" });
      closeTaskPanel();
      await refreshWorkViews({ silent: false });
      await loadWorkLogTags();
      showBoardNotice("Cleared the board, work log, and team updates.", "success");
    } catch (error) {
      setTaskPanelError(taskPanelBody.querySelector(".sample-data-panel"), error instanceof Error ? error.message : "Data could not be cleared.");
      button.disabled = false;
      button.textContent = "Clear all board & log data";
    }
  });
}

sampleDataBtn.addEventListener("click", openSampleDataPanel);

// ---------- schedules ----------

function showScheduleNotice(message, kind = "error") {
  clearTimeout(scheduleNoticeTimer);
  scheduleNoticeEl.className = `schedule-notice schedule-notice-${kind}`;
  scheduleNoticeEl.setAttribute("role", kind === "error" ? "alert" : "status");
  scheduleNoticeEl.textContent = message;
  scheduleNoticeEl.hidden = false;
  scheduleNoticeTimer = setTimeout(() => {
    scheduleNoticeEl.hidden = true;
    scheduleNoticeEl.textContent = "";
  }, 5000);
}

function formatCadence(cadence) {
  if (!cadence) return "—";
  const pad = (value) => String(value).padStart(2, "0");
  if (cadence.kind === "daily") return `Daily at ${pad(cadence.hour)}:${pad(cadence.minute)}`;
  if (cadence.kind === "weekly") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${days[cadence.dayOfWeek] || "Weekly"} at ${pad(cadence.hour)}:${pad(cadence.minute)}`;
  }
  if (cadence.kind === "interval") return `Every ${cadence.minutes} minutes`;
  return "—";
}

function scheduleCard(schedule) {
  const card = document.createElement("article");
  card.className = "schedule-card";
  const who = personaById(schedule.personaId)?.name ?? schedule.personaId;
  const nextRun = schedule.nextRunAt ? formatDate(schedule.nextRunAt, true) : "—";
  const lastRun = schedule.lastRunAt ? `${formatDate(schedule.lastRunAt, true)}${schedule.lastRunOutcome ? ` · ${schedule.lastRunOutcome}` : ""}` : "Never run yet";
  card.innerHTML = `
    <div class="schedule-card-head">
      <div><strong>${escapeHtml(schedule.name)}</strong><p class="schedule-persona">${escapeHtml(who)} · ${escapeHtml(formatCadence(schedule.cadence))}${schedule.readOnly ? " · read-only" : ""}</p></div>
      <span class="schedule-status-badge ${schedule.enabled ? "on" : "off"}">${schedule.enabled ? "Active" : "Paused"}</span>
    </div>
    <dl class="schedule-facts">
      <div><dt>Next run</dt><dd>${escapeHtml(nextRun)}</dd></div>
      <div><dt>Last run</dt><dd>${escapeHtml(lastRun)}</dd></div>
    </dl>
    <div class="schedule-card-actions">
      <button type="button" class="schedule-toggle">${schedule.enabled ? "Pause" : "Resume"}</button>
      <button type="button" class="schedule-run-now" ${schedule.inFlight ? "disabled" : ""}>${schedule.inFlight ? "Running…" : "Run now"}</button>
      <button type="button" class="schedule-delete">Delete</button>
    </div>
  `;
  card.querySelector(".schedule-toggle").addEventListener("click", async () => {
    try {
      await requestJson(`/api/schedules/${encodeURIComponent(schedule.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      });
      await loadSchedules();
    } catch (error) {
      showScheduleNotice(error instanceof Error ? error.message : "Could not update this schedule.");
    }
  });
  card.querySelector(".schedule-run-now").addEventListener("click", async (clickEvent) => {
    clickEvent.currentTarget.disabled = true;
    try {
      await requestJson(`/api/schedules/${encodeURIComponent(schedule.id)}/run-now`, { method: "POST" });
    } catch (error) {
      showScheduleNotice(error instanceof Error ? error.message : "Could not start this run.");
    }
    await loadSchedules();
  });
  card.querySelector(".schedule-delete").addEventListener("click", async () => {
    if (!window.confirm(`Delete "${schedule.name}"? This can't be undone.`)) return;
    try {
      await requestJson(`/api/schedules/${encodeURIComponent(schedule.id)}`, { method: "DELETE" });
      await loadSchedules();
    } catch (error) {
      showScheduleNotice(error instanceof Error ? error.message : "Could not delete this schedule.");
    }
  });
  return card;
}

function renderSchedules() {
  schedulesListEl.innerHTML = "";
  if (!schedulesList.length) {
    renderRegionState(schedulesListEl, "No schedules yet — create one to let the team work on a cadence.");
    return;
  }
  for (const schedule of schedulesList) schedulesListEl.appendChild(scheduleCard(schedule));
}

async function loadSchedules() {
  const loadGeneration = ++schedulesLoadGeneration;
  renderRegionState(schedulesListEl, "Loading schedules…", "loading");
  try {
    const data = await requestJson("/api/schedules");
    if (loadGeneration !== schedulesLoadGeneration) return;
    schedulesPaused = Boolean(data?.paused);
    schedulesList = Array.isArray(data?.schedules) ? data.schedules : [];
    schedulesPauseCheckbox.checked = schedulesPaused;
    renderSchedules();
  } catch (error) {
    if (loadGeneration !== schedulesLoadGeneration) return;
    renderRegionState(schedulesListEl, error instanceof Error ? error.message : "Schedules could not be loaded.", "error", () => void loadSchedules());
  }
}

schedulesPauseCheckbox.addEventListener("change", async () => {
  const paused = schedulesPauseCheckbox.checked;
  schedulesPauseCheckbox.disabled = true;
  try {
    await requestJson("/api/schedules/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused }),
    });
  } catch (error) {
    schedulesPauseCheckbox.checked = !paused;
    showScheduleNotice(error instanceof Error ? error.message : "Could not update automation pause state.");
  } finally {
    schedulesPauseCheckbox.disabled = false;
  }
});

function openNewSchedulePanel() {
  taskPanelTaskId = null;
  taskPanelLoadGeneration += 1;
  taskPanelBody.innerHTML = `
    <form class="task-form" id="new-schedule-form">
      <div class="task-field task-field-wide">
        <label for="schedule-name">Name</label>
        <input id="schedule-name" name="name" required maxlength="120" autocomplete="off">
      </div>
      <div class="task-field">
        <label for="schedule-persona">Persona</label>
        <select id="schedule-persona" name="personaId">${personas.map((persona) => `<option value="${escapeHtml(persona.id)}">${escapeHtml(persona.name)}</option>`).join("")}</select>
      </div>
      <div class="task-field">
        <label for="schedule-cadence-kind">Cadence</label>
        <select id="schedule-cadence-kind" name="cadenceKind">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="interval">Every N minutes</option>
        </select>
      </div>
      <div class="task-field" id="schedule-cadence-weekday-field">
        <label for="schedule-cadence-weekday">Day</label>
        <select id="schedule-cadence-weekday" name="dayOfWeek">
          <option value="0">Sunday</option><option value="1" selected>Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option>
        </select>
      </div>
      <div class="task-field" id="schedule-cadence-time-field">
        <label for="schedule-cadence-time">Time</label>
        <input id="schedule-cadence-time" name="time" type="time" value="08:00">
      </div>
      <div class="task-field" id="schedule-cadence-minutes-field" hidden>
        <label for="schedule-cadence-minutes">Minutes between runs</label>
        <input id="schedule-cadence-minutes" name="minutes" type="number" min="60" step="1" value="60">
      </div>
      <div class="task-field task-field-wide">
        <label for="schedule-prompt">Prompt</label>
        <textarea id="schedule-prompt" name="prompt" rows="3" required maxlength="2000" placeholder="What should they do each time this runs?"></textarea>
      </div>
      <label class="task-field task-field-wide schedule-readonly-field"><input type="checkbox" id="schedule-readonly" name="readOnly"> Read-only (idle/brainstorm — no file or shell changes allowed)</label>
      <div class="task-form-actions task-field-wide"><button type="button" class="task-cancel">Cancel</button><button type="submit" class="task-submit">Create schedule</button></div>
    </form>`;
  openTaskPanel("New schedule");
  const form = taskPanelBody.querySelector("#new-schedule-form");
  const kindSelect = form.querySelector("#schedule-cadence-kind");
  const weekdayField = form.querySelector("#schedule-cadence-weekday-field");
  const timeField = form.querySelector("#schedule-cadence-time-field");
  const minutesField = form.querySelector("#schedule-cadence-minutes-field");
  const syncCadenceFields = () => {
    const kind = kindSelect.value;
    weekdayField.hidden = kind !== "weekly";
    timeField.hidden = kind === "interval";
    minutesField.hidden = kind !== "interval";
  };
  kindSelect.addEventListener("change", syncCadenceFields);
  syncCadenceFields();
  form.querySelector(".task-cancel").addEventListener("click", closeTaskPanel);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector(".task-submit");
    const values = new FormData(form);
    const kind = String(values.get("cadenceKind") || "daily");
    let cadence;
    if (kind === "interval") {
      cadence = { kind: "interval", minutes: Number(values.get("minutes") || 60) };
    } else {
      const [hourStr, minuteStr] = String(values.get("time") || "08:00").split(":");
      const hour = Number(hourStr || 8);
      const minute = Number(minuteStr || 0);
      cadence = kind === "weekly"
        ? { kind: "weekly", dayOfWeek: Number(values.get("dayOfWeek") || 1), hour, minute }
        : { kind: "daily", hour, minute };
    }
    submit.disabled = true;
    submit.textContent = "Creating…";
    try {
      await requestJson("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(values.get("name") || "").trim(),
          personaId: String(values.get("personaId") || ""),
          prompt: String(values.get("prompt") || "").trim(),
          cadence,
          readOnly: values.get("readOnly") === "on",
        }),
      });
      closeTaskPanel();
      await setActiveTab("schedules", { refresh: false });
      await loadSchedules();
    } catch (error) {
      setTaskPanelError(form, error instanceof Error ? error.message : "The schedule could not be created.");
      submit.disabled = false;
      submit.textContent = "Create schedule";
    }
  });
}

newScheduleBtn.addEventListener("click", openNewSchedulePanel);

// ---------- sidenav collapse ----------
// Collapsed state is a pin: the panel stays narrow until toggled back, but hovering it slides it
// open temporarily (CSS-only, see .sidenav:hover) so you can still read labels without unpinning.
// Below the 980px breakpoint the sidenav is already a horizontal icon strip, so collapsing is
// meaningless there — the toggle hides itself and the pinned state is ignored until the window grows.

const NARROW_QUERY = window.matchMedia("(max-width: 980px)");

function applySidenavCollapsed(collapsed) {
  shellEl.dataset.nav = collapsed ? "collapsed" : "expanded";
  sidenavToggleEl.setAttribute("aria-expanded", String(!collapsed));
  sidenavToggleEl.title = collapsed ? "Expand the menu" : "Collapse the menu";
}

function setSidenavCollapsed(collapsed, { persist = true } = {}) {
  if (persist) localStorage.setItem("gui-nav-collapsed", collapsed ? "1" : "0");
  applySidenavCollapsed(collapsed);
}

function sidenavPinnedCollapsed() {
  return localStorage.getItem("gui-nav-collapsed") === "1";
}

function syncSidenavForViewport() {
  // Narrow viewports always show the full horizontal strip, regardless of the pinned preference.
  applySidenavCollapsed(NARROW_QUERY.matches ? false : sidenavPinnedCollapsed());
}

sidenavToggleEl.addEventListener("click", (event) => {
  const collapsing = shellEl.dataset.nav !== "collapsed";
  setSidenavCollapsed(collapsing);
  // A mouse click leaves this button focused, and :focus-within holds the panel in its peeked-open
  // state — so collapsing would look like it did nothing until you clicked somewhere else. Drop
  // focus for pointer activation only; keyboard activation (detail === 0) keeps it so Tab order
  // isn't lost mid-navigation.
  if (collapsing && event.detail > 0) sidenavToggleEl.blur();
});
NARROW_QUERY.addEventListener("change", syncSidenavForViewport);
syncSidenavForViewport();

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

// ---------- move to a specific person ----------

function closeMovePopover() {
  movePopover.hidden = true;
  movePopover.innerHTML = "";
}

function renderMovePopover() {
  movePopover.innerHTML = `<p class="move-popover-hint">Continue this conversation with…</p>`;
  const targets = activeChannel === TEAM_CHANNEL ? personas : personas.filter((p) => p.id !== activeChannel);
  if (activeChannel !== TEAM_CHANNEL) {
    const teamRow = document.createElement("button");
    teamRow.type = "button";
    teamRow.className = "mention-row";
    teamRow.innerHTML = `
      <span class="avatar" style="background:var(--accent)">◆</span>
      <span class="mention-info"><span class="mention-name">Team</span><span class="mention-role">Group channel</span></span>
    `;
    teamRow.addEventListener("click", () => {
      closeMovePopover();
      switchChannel(TEAM_CHANNEL);
    });
    movePopover.appendChild(teamRow);
  }
  for (const p of targets) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "mention-row";
    row.innerHTML = `
      <span class="avatar" style="background:${p.color}">${avatarInner(p)}</span>
      <span class="mention-info"><span class="mention-name">${escapeHtml(p.name)}</span><span class="mention-role">${escapeHtml(p.role)}</span></span>
    `;
    row.addEventListener("click", () => {
      closeMovePopover();
      switchChannel(p.id);
    });
    movePopover.appendChild(row);
  }
}

moveToBtn.addEventListener("click", () => {
  if (!movePopover.hidden) {
    closeMovePopover();
    return;
  }
  closeMentionPopover();
  renderMovePopover();
  movePopover.hidden = false;
});

// ---------- incognito ----------

function updateIncognitoUI() {
  const eligible = activeChannel !== TEAM_CHANNEL;
  const active = eligible && incognitoChannels.has(activeChannel);
  incognitoBtn.hidden = !eligible || active;
  moveToBtn.hidden = active;
  incognitoBanner.hidden = !active;
  logEl.classList.toggle("incognito", active);
  if (active) {
    const persona = personaById(activeChannel);
    incognitoBannerNote.textContent = persona?.id === "ryder" ? " — they'll review it privately and suggest content once you end it" : "";
  }
}

async function startIncognitoChat() {
  incognitoBtn.disabled = true;
  try {
    const res = await fetch(`/api/incognito/${encodeURIComponent(activeChannel)}/start`, { method: "POST" });
    if (!res.ok) throw new Error();
    incognitoChannels.add(activeChannel);
    updateIncognitoUI();
  } catch {
    setComposerError("Could not start an incognito conversation.");
  } finally {
    incognitoBtn.disabled = false;
  }
}

async function endIncognitoChat() {
  incognitoEndBtn.disabled = true;
  const channel = activeChannel;
  try {
    const res = await fetch(`/api/incognito/${encodeURIComponent(channel)}/end`, { method: "POST" });
    if (!res.ok) throw new Error();
    incognitoChannels.delete(channel);
    if (channel === activeChannel) updateIncognitoUI();
    if (channel === "ryder") setAgentStatus("ryder", "working", "Reviewing your private conversation.");
  } catch {
    setComposerError("Could not end the incognito conversation.");
  } finally {
    incognitoEndBtn.disabled = false;
  }
}

incognitoBtn.addEventListener("click", startIncognitoChat);
incognitoEndBtn.addEventListener("click", endIncognitoChat);

mentionBtn.addEventListener("click", () => {
  if (!mentionPopover.hidden) {
    closeMentionPopover();
    return;
  }
  closeMovePopover();
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

// Consecutive messages from the same sender, close together in time, collapse into one
// visual cluster (avatar/name/time shown once) — the grouping every real chat app does.
let lastMessageSenderKey = null;
let lastMessageAt = 0;
const GROUP_WINDOW_MS = 3 * 60 * 1000;

function addMessage(kind, who, persona, when) {
  const color = persona?.color;
  const avatar = persona ? `<span class="msg-avatar" style="background:${color}">${avatarInner(persona)}</span>` : "";
  const at = (when ?? new Date()).getTime();
  const senderKey = persona?.id ?? (kind === "user" ? "user" : who);
  const grouped = kind !== "error" && senderKey === lastMessageSenderKey && at - lastMessageAt < GROUP_WINDOW_MS;
  lastMessageSenderKey = senderKey;
  lastMessageAt = at;

  const div = document.createElement("div");
  div.className = `msg ${kind}${grouped ? " grouped" : ""}`;
  div.setAttribute("aria-label", `${who}, ${formatTime(when ?? new Date())}`);
  div.innerHTML = `
    <div class="head">
      ${avatar}
      <span class="who" style="${color ? `color:${color}` : ""}">${who}</span>
      <span class="time">${formatTime(when ?? new Date())}</span>
    </div>
    <div class="text" style="--msg-accent:${color || "var(--rule)"}"></div>
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

function addHandoffBanner(fromPersonaId, toPersonaId) {
  const fromName = personaById(fromPersonaId)?.name ?? fromPersonaId;
  const toName = personaById(toPersonaId)?.name ?? toPersonaId;
  const div = document.createElement("div");
  div.className = "msg chain-banner handoff-banner";
  div.innerHTML = `<span class="team-note-icon">⇄</span> ${escapeHtml(fromName)} handed off to ${escapeHtml(toName)}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  setEmptyState();
}

function addHandoffLimitNotice(chain, blockedPersonaId) {
  const names = chain.map((id) => personaById(id)?.name ?? id);
  const blockedName = personaById(blockedPersonaId)?.name ?? blockedPersonaId;
  const div = document.createElement("div");
  div.className = "msg chain-banner handoff-limit-notice";
  div.innerHTML = `<span class="team-note-icon">⚠</span> Hand-off chain stopped after ${names.length} hop${names.length === 1 ? "" : "s"} (${names.map(escapeHtml).join(" → ")}) before reaching ${escapeHtml(blockedName)} — the task is assigned and waiting.`;
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
  lastMessageSenderKey = null;
  lastMessageAt = 0;
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
  if (!window.confirm(`Ask Archie to reconcile ${historyActionLabel()} against the current repository, then clear the history?`)) return;
  clearChatBtn.disabled = true;
  reconcileChatBtn.disabled = true;
  studioStatusEl.textContent = "Archie is reconciling history";
  reconcileChatBtn.textContent = "Starting…";
  try {
    const res = await fetch("/api/transcript/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: activeChannel }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Archie could not reconcile this history.");
    await watchReconcile(data.job.id);
  } catch (err) {
    setComposerError(err instanceof Error ? err.message : "Archie could not reconcile this history.");
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
  const channelPersona = personaById(id);
  chatChannelEyebrow.textContent = id === TEAM_CHANNEL ? "Team channel" : "Direct channel";
  chatChannelTitle.textContent = id === TEAM_CHANNEL ? "Team" : (channelPersona?.name || actorName(id));
  unreadChannels.delete(id);
  streaming.clear();
  hopIndicators.clear();
  toolCards.clear();
  closeMentionPopover();
  closeMovePopover();
  clearLog();
  applyChannelAccent(id);
  updateComposerState();
  renderChannelList();

  if (id !== TEAM_CHANNEL) {
    try {
      const res = await fetch(`/api/incognito/${encodeURIComponent(id)}/status`);
      const data = await res.json();
      if (data.active) incognitoChannels.add(id);
      else incognitoChannels.delete(id);
    } catch {
      // server hiccup; assume not incognito
    }
  }
  updateIncognitoUI();

  try {
    const isIncognitoChannel = id !== TEAM_CHANNEL && incognitoChannels.has(id);
    const res = await fetch(isIncognitoChannel ? `/api/incognito/${encodeURIComponent(id)}/transcript` : `/api/transcript?channel=${encodeURIComponent(id)}`);
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

function renderApprovalsFull() {
  approvalsFullEl.innerHTML = "";
  if (!approvalsList.length) {
    renderRegionState(approvalsFullEl, "No approvals pending. Agents will surface anything sensitive or externally visible here before acting.");
    return;
  }
  for (const approval of approvalsList) approvalsFullEl.appendChild(approvalCard(approval));
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
  if (!movePopover.hidden && !movePopover.contains(e.target) && !moveToBtn.contains(e.target)) {
    closeMovePopover();
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
    // The event stream will still deliver new approvals if the first read fails.
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
  if (event.type === "worklog_updated") {
    scheduleWorkRefresh();
    if (activeTab === "activity") void loadWorkLogTags();
    return;
  }
  if (event.type === "schedule_updated" || event.type === "schedule_run_started" || event.type === "schedule_run_finished") {
    if (activeTab === "schedules") void loadSchedules();
    return;
  }
  if (event.type === "schedule_paused") {
    schedulesPaused = event.paused;
    if (activeTab === "schedules") schedulesPauseCheckbox.checked = event.paused;
    return;
  }
  if (event.type === "incognito_state") {
    if (event.active) incognitoChannels.add(event.personaId);
    else incognitoChannels.delete(event.personaId);
    if (event.personaId === activeChannel) updateIncognitoUI();
    return;
  }

  // Team is the union view (everything, not just multi-agent chains), so any
  // channel's events are visible there — only a persona channel is exclusive
  // to its own events.
  const ch = event.channel;
  if (event.type === "handoff_start" && ch) {
    // A dynamic hand-off is an extra turn nobody pre-counted when the message was sent —
    // without this, the composer could re-enable while a delegated hop is still running.
    hopsRemainingByChannel.set(ch, (hopsRemainingByChannel.get(ch) || 0) + 1);
  }
  const visible = activeChannel === TEAM_CHANNEL || ch === activeChannel;
  if (ch && !visible) {
    // Off-screen from here — keep busy-state bookkeeping honest, but don't render.
    if (event.type === "done" || event.type === "error") endHop(ch);
    if (event.type !== "hop_start" && event.type !== "mention_chain" && event.type !== "handoff_start" && event.type !== "handoff_limit_reached") {
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
  if (event.type === "handoff_start") setAgentStatus(event.toPersonaId, "working", "Working on a hand-off.");

  if (event.type === "mention_chain") {
    addChainBanner(event.chain, event.routed);
  } else if (event.type === "hop_start") {
    showHopIndicator(event.personaId);
  } else if (event.type === "handoff_start") {
    showHopIndicator(event.toPersonaId);
    addHandoffBanner(event.fromPersonaId, event.toPersonaId);
  } else if (event.type === "handoff_limit_reached") {
    addHandoffLimitNotice(event.chain, event.blockedPersonaId);
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
  // refreshWorkViews first: the topbar pulse counts and nav badges read board/roster state and
  // are visible on every tab. Then hydrate whichever tab was restored from localStorage.
  await refreshWorkViews({ silent: false });
  void loadApprovals();
  await loadTabData(activeTab);
  connectEvents();
}

bootstrap().catch((error) => {
  setComposerError(error instanceof Error ? error.message : "The dashboard could not finish loading.");
});
