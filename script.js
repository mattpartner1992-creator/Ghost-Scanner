let coins = parseInt(localStorage.getItem("coins")) || 0;
let steps = parseInt(localStorage.getItem("steps")) || 0;
let ghostAngle = null;
let ghostActive = false;
let userHeading = 0;
let smoothedHeading = 0;

const coinCount = document.getElementById("coinCount");
const feedback = document.getElementById("feedback");
const direction = document.getElementById("direction");
const ghost = document.getElementById("ghost");
const huntBtn = document.getElementById("huntBtn");
const minigame = document.getElementById("minigame");
const tapBtn = document.getElementById("tapBtn");
const ghostOverlay = document.getElementById("ghostOverlay");
const radarCanvas = document.getElementById("radarCanvas");
const radarCtx = radarCanvas.getContext("2d");

if (coinCount) coinCount.textContent = coins;

// Simulate steps with tap or movement
document.body.addEventListener("click", () => {
  steps += 1;
  localStorage.setItem("steps", steps);
  feedback.textContent = `Steps: ${steps}`;
  trySpawnGhost();
});

// Ghost spawn logic based on steps
function trySpawnGhost() {
  if (!ghostActive && steps >= 20 && Math.random() < steps / 200) {
    ghostAngle = Math.floor(Math.random() * 360);
    ghostActive = true;
    feedback.textContent = "Ghost detected! Rotate to align";
  }
}

// Radar drawing
function drawRadar() {
  radarCtx.clearRect(0, 0, 200, 200);
  const centerX = 100, centerY = 100;

  let proximity = 0;
  if (ghostActive && ghostAngle !== null) {
    let delta = Math.abs(smoothedHeading - ghostAngle);
    if (delta > 180) delta = 360 - delta;
    proximity = Math.max(0, 180 - delta);
  }

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

  if (ghostActive && ghostAngle !== null) {
    const ghostRad = (ghostAngle - 90) * (Math.PI / 180);
    const ghostX = centerX + 70 * Math.cos(ghostRad);
    const ghostY = centerY + 70 * Math.sin(ghostRad);
    radarCtx.fillStyle = "#8b5cf6";
    radarCtx.beginPath();
    radarCtx.arc(ghostX, ghostY, 6, 0, 2 * Math.PI);
    radarCtx.fill();
  }

  const userRad = (smoothedHeading - 90) * (Math.PI / 180);
  const arrowX = centerX + 60 * Math.cos(userRad);
  const arrowY = centerY + 60 * Math.sin(userRad);
  radarCtx.strokeStyle = "#facc15";
  radarCtx.beginPath();
  radarCtx.moveTo(centerX, centerY);
  radarCtx.lineTo(arrowX, arrowY);
  radarCtx.stroke();
}

function animateRadar() {
  drawRadar();
  requestAnimationFrame(animateRadar);
}
animateRadar();

// Orientation tracking with smoothing
window.addEventListener("deviceorientation", (event) => {
  if (event.alpha !== null) {
    userHeading = Math.round(event.alpha);
    smoothedHeading += (userHeading - smoothedHeading) * 0.1;

    direction.textContent = ["⬅️", "➡️", "⬆️", "⬇️"][Math.floor(smoothedHeading / 90) % 4];

    if (ghostActive && ghostAngle !== null) {
      const delta = Math.abs(smoothedHeading - ghostAngle);
      const aligned = delta < 10 || delta > 350;

      if (aligned) {
        ghost.classList.remove("hidden");
        ghostOverlay.classList.remove("hidden");
        feedback.textContent = "Ghost aligned! Tap to hunt!";
      } else {
        ghost.classList.add("hidden");
        ghostOverlay.classList.add("hidden");
      }
    }
  }
});

// Hunt ghost
huntBtn?.addEventListener("click", () => {
  ghost.classList.add("hidden");
  ghostOverlay.classList.add("hidden");
  minigame.classList.remove("hidden");
});

// Mini-game: tap to capture
tapBtn?.addEventListener("click", () => {
  coins += 10;
  steps = 0;
  ghostActive = false;
  ghostAngle = null;
  localStorage.setItem("coins", coins);
  localStorage.setItem("steps", steps);
  coinCount.textContent = coins;
  minigame.classList.add("hidden");
  feedback.textContent = "Ghost captured!";
});
