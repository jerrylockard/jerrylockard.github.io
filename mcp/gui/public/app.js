const personasEl = document.getElementById("personas");
const approvalsEl = document.getElementById("approvals");
const logEl = document.getElementById("log");
const composer = document.getElementById("composer");
const input = document.getElementById("input");

let personas = [];
let activeId = null;
const streaming = new Map(); // personaId -> current assistant message text element

function personaById(id) {
  return personas.find((p) => p.id === id);
}

function renderPersonas() {
  personasEl.innerHTML = "";
  for (const p of personas) {
    const card = document.createElement("button");
    card.className = "persona-card" + (p.id === activeId ? " active" : "");
    card.innerHTML = `
      <div class="persona-name"><span class="persona-dot" style="background:${p.color}"></span>${p.name}</div>
      <div class="persona-role">${p.role}</div>
      <div class="persona-tagline">${p.tagline}</div>
    `;
    card.addEventListener("click", () => {
      activeId = p.id;
      renderPersonas();
    });
    personasEl.appendChild(card);
  }
}

function addMessage(kind, who, text) {
  const div = document.createElement("div");
  div.className = `msg ${kind}`;
  div.innerHTML = `<div class="who">${who}</div><div class="text"></div>`;
  div.querySelector(".text").textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  return div.querySelector(".text");
}

function renderApprovals(list) {
  approvalsEl.innerHTML = "";
  for (const approval of list) {
    approvalsEl.appendChild(approvalCard(approval));
  }
}

function approvalCard(approval) {
  const card = document.createElement("div");
  card.className = "approval-card";
  card.dataset.id = approval.id;
  const who = personaById(approval.personaId)?.name ?? approval.personaId;
  card.innerHTML = `
    <div class="reason">${who} wants to: ${approval.reason}</div>
    <div class="detail">${approval.detail}</div>
    <div class="buttons">
      <button class="approve">Approve</button>
      <button class="deny">Deny</button>
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

async function loadPersonas() {
  const res = await fetch("/api/personas");
  personas = await res.json();
  if (!activeId && personas.length) activeId = personas[0].id;
  renderPersonas();
}

async function loadApprovals() {
  const res = await fetch("/api/approvals");
  renderApprovals(await res.json());
}

function connectEvents() {
  const source = new EventSource("/api/events");
  source.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    handleEvent(data);
  };
  source.onerror = () => {
    // EventSource auto-reconnects; nothing to do here.
  };
}

function handleEvent(event) {
  const who = personaById(event.personaId)?.name ?? event.personaId ?? "agent";

  if (event.type === "text") {
    let el = streaming.get(event.personaId);
    if (!el) {
      el = addMessage("agent", who, "");
      streaming.set(event.personaId, el);
    }
    el.textContent += event.text;
    logEl.scrollTop = logEl.scrollHeight;
  } else if (event.type === "tool_use") {
    addMessage("tool", who, `→ using ${event.tool}`);
  } else if (event.type === "done") {
    streaming.delete(event.personaId);
  } else if (event.type === "error") {
    addMessage("error", who, event.message);
    streaming.delete(event.personaId);
  } else if (event.type === "approval_requested") {
    approvalsEl.appendChild(approvalCard(event.approval));
  } else if (event.type === "approval_resolved") {
    const card = approvalsEl.querySelector(`[data-id="${event.id}"]`);
    if (card) card.remove();
  }
}

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message || !activeId) return;
  input.value = "";
  addMessage("user", "You → " + (personaById(activeId)?.name ?? activeId), message);
  await fetch(`/api/chat/${activeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
});

loadPersonas();
loadApprovals();
connectEvents();
