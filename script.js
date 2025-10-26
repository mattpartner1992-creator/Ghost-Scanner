// Persistent game state
let coins = parseInt(localStorage.getItem("coins")) || 0;
let steps = parseInt(localStorage.getItem("steps")) || 0;
let ghostFound = false;
let ghostAngle = Math.floor(Math.random() * 360);
let userHeading = 0;

// DOM elements
const coinCount = document.getElementById("coinCount");
const scanBtn = document.getElementById("scanBtn");
const feedback = document.getElementById("feedback");
const direction = document.getElementById("direction");
const ghost = document.getElementById("ghost");
const huntBtn = document.getElementById("huntBtn");
const minigame = document.getElementById("minigame");
const tapBtn = document.getElementById("tapBtn");
const ghostOverlay = document.getElementById("ghostOverlay");
const radarCanvas = document.getElementById("radarCanvas");
const radarCtx = radarCanvas?.getContext("2d");

// Display current coin count
if (coinCount) coinCount.textContent = coins;

// Start camera stream
const camera = document.getElementById("camera");
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    camera.srcObject = stream;
  } catch (err) {
    console.error("Camera access denied:", err);
  }
}
startCamera();

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(() =>
    console.log("Service Worker Registered")
  );
}

// Radar drawing
function drawRadar() {
  if (!radarCtx) return;
  radarCtx.clearRect(0, 0, 200, 200);
  const centerX = 100, centerY = 100;

  let delta = Math.abs(userHeading - ghostAngle);
  if (delta > 180) delta = 360 - delta;
  const proximity = Math.max(0, 180 - delta);
  const red = Math.floor(255 - (proximity / 180) * 255);
  const green = Math.floor((proximity / 180) * 255);
  const color = `rgb(${red},${green},0)`;

  for (let i = 1; i <= 3; i++) {
    radarCtx.beginPath();
    radarCtx.arc(centerX, centerY, i * 25 + 20, Math.PI, 2 * Math.PI);
    radarCtx.strokeStyle = color;
    radarCtx.lineWidth = 4 - i;
    radarCtx.stroke();
  }

  const ghostRad = (ghostAngle - 90) * (Math.PI / 180);
  const ghostX = centerX + 70 * Math.cos(ghostRad);
  const ghostY = centerY + 70 * Math.sin(ghostRad);
  radarCtx.fillStyle = "#8b5cf6";
  radarCtx.beginPath();
  radarCtx.arc(ghostX, ghostY, 6, 0, 2 * Math.PI);
  radarCtx.fill();

  const userRad = (userHeading - 90) * (Math.PI / 180);
  const arrowX = centerX + 60 * Math.cos(userRad);
  const arrowY = centerY + 60 * Math.sin(userRad);
  radarCtx.strokeStyle = "#facc15";
  radarCtx.beginPath();
  radarCtx.moveTo(centerX, centerY);
  radarCtx.lineTo(arrowX, arrowY);
  radarCtx.stroke();
}

// Animate radar continuously
function animateRadar() {
  drawRadar();
  requestAnimationFrame(animateRadar);
}
animateRadar();

// Orientation tracking
window.addEventListener("deviceorientation", (event) => {
  if (event.alpha !== null) {
    userHeading = Math.round(event.alpha);
    const delta = Math.abs(userHeading - ghostAngle);
    const aligned = delta < 10 || delta > 350;

    if (aligned) {
      ghost?.classList.remove("hidden");
      ghostOverlay?.classList.remove("hidden");
      feedback.textContent = "Ghost aligned! Tap to hunt!";
    } else {
      ghost?.classList.add("hidden");
      ghostOverlay?.classList.add("hidden");
    }
  }
});

// Scan button logic
scanBtn?.addEventListener("click", () => {
  steps += Math.floor(Math.random() * 10) + 5;
  localStorage.setItem("steps", steps);
  feedback.textContent = `Steps: ${steps}`;

  if (steps > 20) {
    ghostAngle = Math.floor(Math.random() * 360);
    feedback.textContent = "Scan active! Rotate to find ghost";
  } else {
    feedback.textContent = "Walk more to activate scan";
  }
});

// Hunt ghost
huntBtn?.addEventListener("click", () => {
  ghost?.classList.add("hidden");
  ghostOverlay?.classList.add("hidden");
  minigame?.classList.remove("hidden");
});

// Mini-game: tap to capture
tapBtn?.addEventListener("click", () => {
  coins += 10;
  steps = 0;
  localStorage.setItem("coins", coins);
  localStorage.setItem("steps", steps);
  if (coinCount) coinCount.textContent = coins;
  minigame?.classList.add("hidden");
  feedback.textContent = "Ghost captured!";
});
