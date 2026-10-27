"use strict";

/* =====================================================
   Task 3 – Ticket builder (Option A)
   Live preview + live validation + result built with DOM
   ===================================================== */

// ---------- Constants and data ----------
const EVENTS = [
  { id: "rock",   name: "Rock Night" },
  { id: "jazz",   name: "Jazz Evening" },
  { id: "tech",   name: "Tech Conference" }
];

// seatsLeft is changed after every successful booking
const TICKET_TYPES = [
  { id: "standard", name: "Standard",   price: 20, seatsLeft: 12 },
  { id: "vip",      name: "VIP",        price: 50, seatsLeft: 4 },
  { id: "student",  name: "Student",    price: 10, seatsLeft: 8 },
  { id: "early",    name: "Early bird", price: 15, seatsLeft: 0 }
];

const PROMO_CODES = [
  { code: "STUDENT10", discount: 10 },
  { code: "SUMMER20",  discount: 20 }
];

const BLOCKED_EMAIL_DOMAINS = ["mailinator.com", "tempmail.com", "10minutemail.com"];
const SOLD_OUT_DAY_OFFSETS = [3, 7, 14]; // sold-out dates = today + N days
const BOOKING_DAYS_AHEAD = 365;
const CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ---------- DOM elements ----------
const form = document.getElementById("ticket-form");
form.noValidate = true; // turn off browser bubbles, keep HTML attributes

const fieldNames = ["event", "date", "type", "quantity", "name", "email", "promo"];
const fields = {};
for (const n of fieldNames) {
  fields[n] = document.getElementById(n);
}
const summaryEl = document.getElementById("error-summary");
const resultEl = document.getElementById("result");
const touched = {}; // which fields the user has already left (blur)

// ---------- Helpers ----------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function toISO(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const TODAY = new Date();
const MIN_DATE = toISO(TODAY);
const MAX_DATE = toISO(addDays(TODAY, BOOKING_DAYS_AHEAD));
const SOLD_OUT_DATES = SOLD_OUT_DAY_OFFSETS.map(function (d) { return toISO(addDays(TODAY, d)); });

function findType(id) {
  return TICKET_TYPES.find(function (t) { return t.id === id; });
}

function findPromo(code) {
  const upper = code.trim().toUpperCase();
  return PROMO_CODES.find(function (p) { return p.code === upper; });
}

function randomBookingCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[randomInt(0, CODE_CHARS.length - 1)];
  }
  return "TKT-" + code;
}

// ---------- Validation ----------
// 1) Messages for rules that HTML attributes can express
function htmlError(field) {
  const v = field.validity;
  if (v.valueMissing) {
    return "This field is required.";
  }
  if (v.typeMismatch) {
    return "Enter a valid email like name@example.com.";
  }
  if (v.badInput) {
    return "Enter a valid value.";
  }
  if (v.tooShort) {
    return "Enter at least " + field.minLength + " characters.";
  }
  if (v.tooLong) {
    return "Enter no more than " + field.maxLength + " characters.";
  }
  if (v.rangeUnderflow) {
    return field.type === "date" ? "The date cannot be in the past." : "The minimum value is " + field.min + ".";
  }
  if (v.rangeOverflow) {
    return field.type === "date" ? "Booking is open for one year ahead only." : "The maximum value is " + field.max + ".";
  }
  if (v.stepMismatch) {
    return "Enter a whole number.";
  }
  return "";
}

// 2) Custom rules that HTML attributes cannot express
const customRules = {
  date: function (value) {
    if (SOLD_OUT_DATES.includes(value)) {
      return "Sold out on this date. Please choose another date.";
    }
    return "";
  },
  type: function (value) {
    const type = findType(value);
    if (type && type.seatsLeft === 0) {
      return type.name + " tickets are sold out.";
    }
    return "";
  },
  quantity: function (value) {
    const type = findType(fields.type.value);
    const qty = Number(value);
    if (type && type.seatsLeft > 0 && qty > type.seatsLeft) {
      return "Only " + type.seatsLeft + " " + type.name + " seats left.";
    }
    return "";
  },
  name: function (value) {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) {
      return "Enter first name and last name.";
    }
    const lettersOnly = words.every(function (w) { return /^\p{L}[\p{L}'’-]+$/u.test(w); });
    if (!lettersOnly) {
      return "Use letters only, at least 2 letters in each word.";
    }
    return "";
  },
  email: function (value) {
    const domain = value.trim().toLowerCase().split("@")[1];
    if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
      return "Temporary email addresses are not accepted.";
    }
    return "";
  },
  promo: function (value) {
    if (value.trim() !== "" && !findPromo(value)) {
      return "Unknown promo code.";
    }
    return "";
  }
};

function validateField(name) {
  const field = fields[name];
  const generic = htmlError(field);
  if (generic) {
    return generic;
  }
  if (customRules[name]) {
    return customRules[name](field.value);
  }
  return "";
}

function showFieldError(name) {
  const message = validateField(name);
  const wrapper = document.getElementById("field-" + name);
  const errorEl = document.getElementById("error-" + name);
  errorEl.textContent = message;
  fields[name].setAttribute("aria-invalid", message ? "true" : "false");
  wrapper.classList.toggle("invalid", message !== "");
  wrapper.classList.toggle("valid", message === "" && fields[name].value.trim() !== "");
  return message;
}

function clearAllErrors() {
  for (const name of fieldNames) {
    touched[name] = false;
    document.getElementById("error-" + name).textContent = "";
    fields[name].removeAttribute("aria-invalid");
    const wrapper = document.getElementById("field-" + name);
    wrapper.classList.remove("invalid", "valid");
  }
  summaryEl.hidden = true;
  summaryEl.textContent = "";
}

// ---------- Options and hints ----------
function buildEventOptions() {
  fields.event.replaceChildren(new Option("Choose an event…", ""));
  for (const ev of EVENTS) {
    fields.event.appendChild(new Option(ev.name, ev.id));
  }
}

function buildTypeOptions() {
  fields.type.replaceChildren(new Option("Choose a ticket type…", ""));
  for (const t of TICKET_TYPES) {
    const label = t.name + " — $" + t.price + " (" + (t.seatsLeft === 0 ? "sold out" : t.seatsLeft + " left") + ")";
    fields.type.appendChild(new Option(label, t.id));
  }
}

function setupDateField() {
  fields.date.min = MIN_DATE;
  fields.date.max = MAX_DATE;
  document.getElementById("hint-date").textContent = "Sold-out dates: " + SOLD_OUT_DATES.join(", ") + ".";
}

// ---------- Live preview ----------
function setPreview(id, text, emptyText) {
  const node = document.getElementById(id);
  const isEmpty = text === "";
  node.textContent = isEmpty ? emptyText : text;
  node.classList.toggle("placeholder", isEmpty);
}

function updatePreview() {
  const ev = EVENTS.find(function (e) { return e.id === fields.event.value; });
  const type = findType(fields.type.value);
  const qty = Number(fields.quantity.value);
  const promo = findPromo(fields.promo.value);

  setPreview("pv-event", ev ? ev.name : "", "Your event");
  setPreview("pv-date", fields.date.value, "—");
  setPreview("pv-type", type ? type.name : "", "—");
  setPreview("pv-quantity", qty > 0 ? String(qty) : "", "—");
  setPreview("pv-name", fields.name.value.trim(), "—");
  setPreview("pv-email", fields.email.value.trim(), "—");
  setPreview("pv-promo", promo ? promo.code + " (−" + promo.discount + "%)" : "", "none");

  if (type && qty > 0) {
    const subtotal = type.price * qty;
    const total = promo ? subtotal * (100 - promo.discount) / 100 : subtotal;
    setPreview("pv-total", "$" + total.toFixed(2), "—");
  } else {
    setPreview("pv-total", "", "—");
  }
}

// ---------- Final result (built with the DOM) ----------
function buildTicket(data) {
  const ticket = document.createElement("div");
  ticket.className = "ticket final";

  const title = document.createElement("h3");
  title.textContent = "Booking confirmed ✔";
  ticket.appendChild(title);

  const code = document.createElement("p");
  code.className = "booking-code";
  code.textContent = data.code;
  ticket.appendChild(code);

  const dl = document.createElement("dl");
  const rows = [
    ["Event", data.eventName],
    ["Date", data.date],
    ["Type", data.typeName],
    ["Quantity", String(data.quantity)],
    ["Name", data.name],
    ["Email", data.email],
    ["Paid", "$" + data.total.toFixed(2)]
  ];
  for (const row of rows) {
    const dt = document.createElement("dt");
    dt.textContent = row[0];
    const dd = document.createElement("dd");
    dd.textContent = row[1];
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
  ticket.appendChild(dl);
  return ticket;
}

// ---------- Events ----------
function onFieldChange(name) {
  updatePreview();
  if (touched[name]) {
    showFieldError(name);
  }
  // quantity depends on the ticket type
  if (name === "type" && touched.quantity) {
    showFieldError("quantity");
  }
}

for (const name of fieldNames) {
  const field = fields[name];
  field.addEventListener("blur", function () {
    touched[name] = true;
    showFieldError(name);
  });
  field.addEventListener("input", function () { onFieldChange(name); });
  field.addEventListener("change", function () { onFieldChange(name); });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const errors = [];
  for (const name of fieldNames) {
    touched[name] = true;
    if (showFieldError(name)) {
      errors.push(name);
    }
  }

  if (errors.length > 0) {
    summaryEl.hidden = false;
    summaryEl.textContent = errors.length + (errors.length === 1 ? " error" : " errors") +
      " found. Please fix the fields marked in red.";
    fields[errors[0]].focus();
    return;
  }

  // All data is correct: create the result
  const type = findType(fields.type.value);
  const ev = EVENTS.find(function (e) { return e.id === fields.event.value; });
  const qty = Number(fields.quantity.value);
  const promo = findPromo(fields.promo.value);
  const subtotal = type.price * qty;
  const total = promo ? subtotal * (100 - promo.discount) / 100 : subtotal;

  const data = {
    code: randomBookingCode(),
    eventName: ev.name,
    date: fields.date.value,
    typeName: type.name,
    quantity: qty,
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    total: total
  };

  type.seatsLeft -= qty; // seats are used up
  resultEl.replaceChildren(buildTicket(data));
  form.reset();
  clearAllErrors();
  buildTypeOptions();
  updatePreview();
  resultEl.focus();
});

// ---------- Start ----------
buildEventOptions();
buildTypeOptions();
setupDateField();
clearAllErrors(); // no errors on page load
updatePreview();
