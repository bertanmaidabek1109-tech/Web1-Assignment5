"use strict";

/* =====================================================
   Task 2 – Kanban board (Option A)
   The whole page is built from the `tasks` array.
   ===================================================== */

// ---------- Constants ----------
const WIP_LIMIT = 3; // max cards in "In progress"
const STATUSES = [
  { id: "todo", title: "To do" },
  { id: "progress", title: "In progress" },
  { id: "done", title: "Done" }
];
const TAGS = ["design", "code", "content", "bug"];
const PRIORITY_LABELS = { 1: "Low", 2: "Medium", 3: "High" };

// ---------- Data: array of objects ----------
// id (number), title (string), tag (string), priority (number),
// hours (number), status (string), urgent (boolean)
let tasks = [
  { id: 1,  title: "Design hero banner",      tag: "design",  priority: 3, hours: 6, status: "todo",     urgent: true },
  { id: 2,  title: "Write About page text",   tag: "content", priority: 1, hours: 3, status: "todo",     urgent: false },
  { id: 3,  title: "Fix broken nav link",     tag: "bug",     priority: 3, hours: 1, status: "todo",     urgent: true },
  { id: 4,  title: "Create contact form",     tag: "code",    priority: 2, hours: 5, status: "todo",     urgent: false },
  { id: 5,  title: "Choose color palette",    tag: "design",  priority: 2, hours: 2, status: "todo",     urgent: false },
  { id: 6,  title: "Add image gallery",       tag: "code",    priority: 2, hours: 8, status: "todo",     urgent: false },
  { id: 7,  title: "Build responsive footer", tag: "code",    priority: 2, hours: 4, status: "progress", urgent: false },
  { id: 8,  title: "Write blog post",         tag: "content", priority: 1, hours: 4, status: "progress", urgent: false },
  { id: 9,  title: "Set up GitHub repo",      tag: "code",    priority: 3, hours: 1, status: "done",     urgent: false },
  { id: 10, title: "Draw site wireframes",    tag: "design",  priority: 3, hours: 5, status: "done",     urgent: false },
  { id: 11, title: "Fix mobile menu bug",     tag: "bug",     priority: 2, hours: 2, status: "done",     urgent: false },
  { id: 12, title: "Collect page content",    tag: "content", priority: 1, hours: 3, status: "done",     urgent: false }
];

// ---------- Current filters ----------
const filters = { search: "", tag: "all", sort: "none" };

// ---------- DOM elements ----------
const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const searchEl = document.getElementById("search");
const filterTagEl = document.getElementById("filter-tag");
const sortEl = document.getElementById("sort");
const progressBarEl = document.getElementById("progress-bar");
const progressLabelEl = document.getElementById("progress-label");
const addFormEl = document.getElementById("add-form");
const newTitleEl = document.getElementById("new-title");
const newTagEl = document.getElementById("new-tag");
const newPriorityEl = document.getElementById("new-priority");
const newHoursEl = document.getElementById("new-hours");

// ---------- Helpers ----------
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message" + (type ? " " + type : "");
}

function countByStatus(statusId) {
  let count = 0;
  for (const task of tasks) {
    if (task.status === statusId) {
      count++;
    }
  }
  return count;
}

function nextId() {
  let max = 0;
  for (const task of tasks) {
    if (task.id > max) {
      max = task.id;
    }
  }
  return max + 1;
}

function getVisibleTasks() {
  const search = filters.search.trim().toLowerCase();
  let result = tasks.filter(function (task) {
    const matchesTag = filters.tag === "all" || task.tag === filters.tag;
    const matchesSearch = search === "" || task.title.toLowerCase().includes(search);
    return matchesTag && matchesSearch;
  });

  if (filters.sort === "high") {
    result = result.slice().sort(function (a, b) { return b.priority - a.priority || a.id - b.id; });
  } else if (filters.sort === "low") {
    result = result.slice().sort(function (a, b) { return a.priority - b.priority || a.id - b.id; });
  }
  return result;
}

// ---------- Building elements ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function createButton(label, action, id, extraClass, disabled, ariaLabel) {
  const btn = el("button", "btn small " + extraClass, label);
  btn.type = "button";
  btn.dataset.action = action;
  btn.dataset.id = id;
  btn.disabled = disabled;
  btn.setAttribute("aria-label", ariaLabel);
  return btn;
}

function createCard(task, statusIndex) {
  const card = el("article", "card p" + task.priority);
  card.classList.toggle("urgent", task.urgent);
  card.dataset.id = task.id;

  card.appendChild(el("div", "card-title", task.title));

  const badges = el("div", "badges");
  badges.appendChild(el("span", "badge", "#" + task.tag));
  badges.appendChild(el("span", "badge", PRIORITY_LABELS[task.priority] + " priority"));
  badges.appendChild(el("span", "badge", task.hours + " h"));
  card.appendChild(badges);

  const actions = el("div", "card-actions");
  actions.appendChild(createButton("←", "left", task.id, "secondary", statusIndex === 0, "Move left: " + task.title));
  actions.appendChild(createButton("→", "right", task.id, "secondary", statusIndex === STATUSES.length - 1, "Move right: " + task.title));
  actions.appendChild(createButton("Delete", "delete", task.id, "danger", false, "Delete: " + task.title));
  card.appendChild(actions);
  return card;
}

// ---------- ONE render function, called after every change ----------
function render() {
  const visible = getVisibleTasks();
  boardEl.replaceChildren();

  // Nothing found: show a message instead of empty columns
  if (visible.length === 0) {
    boardEl.appendChild(el("p", "empty big", "Nothing found. Try another search word or choose “All tags”."));
  } else {
    STATUSES.forEach(function (status, statusIndex) {
      const column = el("section", "column");
      column.classList.toggle("full", status.id === "progress" && countByStatus("progress") >= WIP_LIMIT);

      const heading = el("h2", "", status.title);
      const columnTasks = visible.filter(function (t) { return t.status === status.id; });
      const countText = status.id === "progress"
        ? countByStatus("progress") + "/" + WIP_LIMIT
        : String(columnTasks.length);
      heading.appendChild(el("span", "count", countText));
      column.appendChild(heading);

      if (columnTasks.length === 0) {
        column.appendChild(el("p", "empty", "No cards here"));
      }
      for (const task of columnTasks) {
        column.appendChild(createCard(task, statusIndex));
      }
      boardEl.appendChild(column);
    });
  }
  renderProgress();
}

// Own loop: count finished cards and the hours still left
function renderProgress() {
  let done = 0;
  let hoursLeft = 0;
  for (const task of tasks) {
    if (task.status === "done") {
      done++;
    } else {
      hoursLeft += task.hours;
    }
  }
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  progressBarEl.max = total === 0 ? 1 : total;
  progressBarEl.value = done;
  progressLabelEl.textContent = "Progress: " + done + " of " + total + " cards done (" + percent + "%) · " + hoursLeft + " h left";
}

// ---------- Actions (change the array first, then render) ----------
function moveTask(id, direction) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) {
    return;
  }
  const currentIndex = STATUSES.findIndex(function (s) { return s.id === task.status; });
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= STATUSES.length) {
    return;
  }
  const target = STATUSES[newIndex];

  // Rule: the middle column holds at most WIP_LIMIT cards
  if (target.id === "progress" && countByStatus("progress") >= WIP_LIMIT) {
    showMessage("Blocked: “In progress” already has " + WIP_LIMIT + " cards. Finish one of them first.", "error");
    return;
  }

  task.status = target.id;
  showMessage("“" + task.title + "” moved to " + target.title + ".", "ok");
  render();
}

function deleteTask(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) {
    return;
  }
  tasks = tasks.filter(function (t) { return t.id !== id; });
  showMessage("Card “" + task.title + "” deleted.", "warn");
  render();
}

function addTask(event) {
  event.preventDefault();
  const title = newTitleEl.value.trim();
  const hours = Number(newHoursEl.value);
  const duplicate = tasks.some(function (t) { return t.title.toLowerCase() === title.toLowerCase(); });

  if (title.length < 3) {
    showMessage("Title must have at least 3 characters.", "error");
    newTitleEl.focus();
    return;
  }
  if (duplicate) {
    showMessage("A card with this title already exists.", "error");
    newTitleEl.focus();
    return;
  }
  if (!Number.isInteger(hours) || hours < 1 || hours > 40) {
    showMessage("Hours must be a whole number from 1 to 40.", "error");
    newHoursEl.focus();
    return;
  }

  tasks.push({
    id: nextId(),
    title: title,
    tag: newTagEl.value,
    priority: Number(newPriorityEl.value),
    hours: hours,
    status: "todo",
    urgent: false
  });
  addFormEl.reset();
  showMessage("Card “" + title + "” added to “To do”.", "ok");
  render();
}

// ---------- Fill selects from the TAGS array ----------
function fillTagSelects() {
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All tags";
  filterTagEl.appendChild(all);
  for (const tag of TAGS) {
    const o1 = document.createElement("option");
    o1.value = tag;
    o1.textContent = tag;
    filterTagEl.appendChild(o1);
    const o2 = document.createElement("option");
    o2.value = tag;
    o2.textContent = tag;
    newTagEl.appendChild(o2);
  }
}

// ---------- Events ----------
// Event delegation: ONE listener on the board for all buttons
boardEl.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  if (action === "left") {
    moveTask(id, -1);
  } else if (action === "right") {
    moveTask(id, 1);
  } else if (action === "delete") {
    deleteTask(id);
  }
});

searchEl.addEventListener("input", function () {
  filters.search = searchEl.value;
  render();
});
filterTagEl.addEventListener("change", function () {
  filters.tag = filterTagEl.value;
  render();
});
sortEl.addEventListener("change", function () {
  filters.sort = sortEl.value;
  render();
});
addFormEl.addEventListener("submit", addTask);

fillTagSelects();
showMessage("Move cards with the arrow buttons. “In progress” holds at most " + WIP_LIMIT + " cards.");
render();
