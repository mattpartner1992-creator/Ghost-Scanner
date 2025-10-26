let coins = parseInt(localStorage.getItem("coins")) || 0;
let ghostAngle = null;
let ghostElevation = null;
let ghostZone = null;
let ghostActive = false;
let userHeading = 0;
let smoothedHeading = 0;
let pitch = 0;
let metersWalked = 0;
let lastPosition = null;
let unlockedGhosts = JSON.parse(localStorage.getItem("unlockedGhosts")) || [];

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

// Define ghost zones
const ghostZones = [
  { name: "Forest Ruins", lat: 53.29, lon: -3.72, radius: 100 },
  { name: "Seaside Graveyard", lat: 53.30, lon: -3.73, radius: 80 },
  { name: "Abandoned Arcade", lat: 53.28, lon: -3.71, radius: 60 }
];

// GPS tracking
navigator.geolocation.watchPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    if (lastPosition) {
      const d = getDistanceFromLatLonInMeters(
        lastPosition.lat,
        lastPosition.lon,
        latitude,
        longitude
      );
      metersWalked += d;
      feedback.textContent = `Moved: ${Math.floor(metersWalked)}m`;
      checkZones(latitude, longitude);
    }
    lastPosition = { lat: latitude, lon: longitude };
  },
  (err) => console.error("GPS error:", err),
  { enableHighAccuracy: true }
);

// Check if user is in a ghost zone
function checkZones(lat, lon) {
  for (const zone of ghostZones) {
    if (isInZone(lat, lon, zone)) {
      if (!unlockedGhosts.includes(zone.name)) {
        unlockedGhosts.push(zone.name);
        localStorage.setItem("unlockedGhosts", JSON.stringify(unlockedGhosts));
        feedback.textContent = `New zone unlocked: ${zone.name}`;
      }
      trySpawnGhost(zone);
      break;
    }
  }
}

// Spawn ghost in zone
function trySpawnGhost(zone) {
  if (!ghostActive && metersWalked > 30 && Math.random() < 0.5) {
    ghostAngle = Math.floor(Math.random() * 360);
    ghostElevation = ["low", "mid", "high"][Math.floor(Math.random() * 3)];
    ghostZone = zone.name;
    ghostActive = true;
    feedback.textContent = `Ghost in ${zone.name}! Rotate and tilt to align`;
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

// Orientation tracking
window.addEventListener("deviceorientation", (event) => {
  if (event.alpha !== null) {
    userHeading = Math.round(event.alpha);
    smoothedHeading += (userHeading - smoothedHeading) * 0.1;
    pitch = event.beta;

    direction.textContent = ["⬅️", "➡️", "⬆️", "⬇️"][Math.floor(smoothedHeading / 90) % 4];

    if (ghostActive && ghostAngle !== null) {
      const delta = Math.abs(smoothedHeading - ghostAngle);
      const alignedHeading = delta < 10 || delta > 350;
      const elevationMatch =
        (ghostElevation === "low" && pitch < -20) ||
        (ghostElevation === "mid" && pitch >= -20 && pitch <= 30) ||
        (ghostElevation === "high" && pitch > 30);

      if (alignedHeading && elevationMatch) {
        ghost.classList.remove("hidden");
        ghostOverlay.classList.remove("hidden");
        feedback.textContent = `Ghost aligned in ${ghostZone}! Tap to hunt!`;
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
  metersWalked = 0;
  ghostActive = false;
  ghostAngle = null;
  ghostElevation = null;
  ghostZone = null;
  localStorage.setItem("coins", coins);
  coinCount.textContent = coins;
  minigame.classList.add("hidden");
  feedback.textContent = "Ghost captured!";
});

// Distance calculator
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isInZone(userLat, userLon, zone) {
  return getDistanceFromLatLonInMeters(userLat, userLon, zone.lat, zone.lon) < zone.radius;
}
