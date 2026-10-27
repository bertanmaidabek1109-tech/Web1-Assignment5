"use strict";

/* =====================================================
   Task 1 – Higher or Lower (Option A)
   Guess if the next gadget price is higher or lower.
   ===================================================== */

// ---------- Constants: all numbers of the game live here ----------
const START_LIVES = 3;      // lives at the start of every game
const MIN_PRICE = 50;       // smallest possible price (included)
const MAX_PRICE = 2000;     // largest possible price (included)
const POINTS_PER_WIN = 1;   // streak growth after a right guess

const PRODUCTS = [
  "Smartphone", "Laptop", "Headphones", "Smartwatch", "Tablet",
  "Camera", "Gaming console", "Monitor", "Keyboard", "Drone"
];

// ---------- DOM elements ----------
const gameEl = document.getElementById("game");
const livesEl = document.getElementById("lives");
const streakEl = document.getElementById("streak");
const bestEl = document.getElementById("best");
const currentNameEl = document.getElementById("current-name");
const currentPriceEl = document.getElementById("current-price");
const nextNameEl = document.getElementById("next-name");
const messageEl = document.getElementById("message");
const higherBtn = document.getElementById("btn-higher");
const lowerBtn = document.getElementById("btn-lower");
const restartBtn = document.getElementById("btn-restart");

// ---------- Game state ----------
let lives = START_LIVES;
let streak = 0;
let best = 0;
let gameOver = false;
let current = null; // item shown with its price
let next = null;    // hidden item

// ---------- Helpers ----------
// Whole number from min to max, both included
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem() {
  return {
    name: PRODUCTS[randomInt(0, PRODUCTS.length - 1)],
    price: randomInt(MIN_PRICE, MAX_PRICE)
  };
}

function formatPrice(value) {
  return "$" + value;
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message" + (type ? " " + type : "");
}

// ---------- Rendering ----------
function renderLives() {
  livesEl.replaceChildren();
  for (let i = 0; i < START_LIVES; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "♥";
    if (i >= lives) {
      heart.classList.add("lost");
    }
    livesEl.appendChild(heart);
  }
  livesEl.setAttribute("aria-label", lives + " lives left");
}

function render() {
  renderLives();
  streakEl.textContent = streak;
  bestEl.textContent = best;
  currentNameEl.textContent = current.name;
  currentPriceEl.textContent = formatPrice(current.price);
  nextNameEl.textContent = next.name;

  higherBtn.disabled = gameOver;
  lowerBtn.disabled = gameOver;
  restartBtn.hidden = !gameOver;
  gameEl.classList.toggle("over", gameOver);
}

// ---------- Game logic ----------
function startGame() {
  lives = START_LIVES;
  streak = 0;
  gameOver = false;
  current = randomItem();
  next = randomItem();
  gameEl.classList.remove("win", "loss");
  showMessage("New game! Will the next " + next.name + " cost more or less than " +
    formatPrice(current.price) + "?");
  render();
  higherBtn.focus();
}

function makeGuess(choice) {
  // Invalid moves are rejected and the state is NOT changed
  if (gameOver) {
    showMessage("The game is over. Press “Play again” to start a new one.", "warn");
    return;
  }
  if (choice !== "higher" && choice !== "lower") {
    showMessage("Invalid move. Choose “Higher” or “Lower”.", "error");
    return;
  }

  // Equal prices count as a right guess
  const isCorrect =
    (choice === "higher" && next.price >= current.price) ||
    (choice === "lower" && next.price <= current.price);

  const summary = next.name + " costs " + formatPrice(next.price) +
    " (previous: " + formatPrice(current.price) + "). ";

  if (isCorrect) {
    streak += POINTS_PER_WIN;
    let text = summary + "Right! Streak: " + streak + ".";
    if (streak > best) {
      best = streak;
      text += " New best streak!";
    }
    gameEl.classList.remove("loss");
    gameEl.classList.add("win");
    showMessage(text, "ok");
  } else {
    lives -= 1;
    streak = 0;
    gameEl.classList.remove("win");
    gameEl.classList.add("loss");
    if (lives === 0) {
      gameOver = true;
      showMessage(summary + "Wrong, and no lives left. Game over! Best streak: " + best + ".", "error");
    } else {
      showMessage(summary + "Wrong! Lives left: " + lives + ".", "error");
    }
  }

  // The hidden item becomes the visible one, a new hidden item appears
  current = next;
  next = randomItem();
  render();
}

// ---------- Events ----------
higherBtn.addEventListener("click", function () { makeGuess("higher"); });
lowerBtn.addEventListener("click", function () { makeGuess("lower"); });
restartBtn.addEventListener("click", startGame);

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    makeGuess("higher");
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    makeGuess("lower");
  }
});

startGame();
