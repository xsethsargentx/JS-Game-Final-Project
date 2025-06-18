// ----- SETUP -----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load background
const backgroundImg = new Image();
// backgroundImg.onload = onImageLoad;
backgroundImg.src = "/images/bgImage.jpg";

// // UI Elements display
// const formDisplay = document.getElementById("formDisplay");
// const energyDisplay = document.getElementById("energyDisplay");

// ----- PLAYER -----
const player = {
  x: 100, y: 300,
  width: 30, height: 40,
  vx: 0, vy: 0,
  speed: 4,
  jumpPower: 8,
  onGround: false,
  form: "vampire",
  energy: 100,
  facing: "right"
};

let gameWon = false;

let displayedEnergy = player.energy;
const particles = [];

// ----- SPRITES -----
const vampireImg = new Image();
vampireImg.src = "/sprites/vampire.png";

const batImg = new Image();
batImg.src = "/sprites/bat.png";

const goalPortal = {
  x: 0,
  y: 0,
  width: 64,
  height: 64,
  visible: false,
  summoned: false,
  image: new Image()
};
goalPortal.image.src = "/sprites/redPortal.png";
let portalSummonTimerStarted = false;
let spawnPortalOverPlayer = false;

// Collect before portal opens
let bloodVials = [
  { x: 160, y: 280, collected: false },
  { x: 320, y: 230, collected: false },
  { x: 720, y: 160, collected: false }
];

function allVialsCollected() {
  return bloodVials.every(vial => vial.collected);
}

const totalImagesToLoad = 4;
let imagesLoaded = 0;

function onImageLoad() {
  imagesLoaded++;
  console.log(`Image loaded (${imagesLoaded}/${totalImagesToLoad})`);
  if (imagesLoaded === totalImagesToLoad) {
    console.log("All images loaded. Starting game loop.");
    gameLoop();
  }
}


// Loads images
const imageSources = [
  { image: backgroundImg, src: "/images/bgImage.jpg" },
  { image: vampireImg, src: "/sprites/vampire.png" },
  { image: batImg, src: "/sprites/bat.png" },
  { image: goalPortal.image, src: "/sprites/redPortal.png" }
];

imageSources.forEach(({ image, src }) => {
  image.onload = onImageLoad;
  image.src = src; // <- this MUST come after assigning .onload
});

// ----- PLATFORMS -----
const platforms = [
  { x: 0, y: 350, width: 800, height: 50 },
  { x: 150, y: 300, width: 100, height: 10 },
  { x: 300, y: 250, width: 100, height: 10 },
  { x: 500, y: 220, width: 120, height: 10 },
  { x: 700, y: 180, width: 80, height: 10 },
  { x: 50, y: 100, width: 100, height: 10}
];

const batGates = [
  { x: 650, y: 150, width: 30, height: 100 }
];

function drawGate(gate) {
  const barWidth = 4;
  const barGap = 6;
  const barCount = Math.floor(gate.width / (barWidth + barGap));

  ctx.fillStyle = "#999";
  for (let i = 0; i < barCount; i++) {
    const bx = gate.x + i * (barWidth + barGap);
    ctx.fillRect(bx, gate.y, barWidth, gate.height);
  }

  ctx.strokeStyle = "#888";
  ctx.beginPath();
  ctx.arc(
    gate.x + gate.width / 2,
    gate.y + gate.height,
    gate.width / 2,
    Math.PI,
    2 * Math.PI
  );
  ctx.stroke();
}

// ----- INPUT -----
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ----- PARTICLES -----
function spawnSmoke(x, y) {
  const colors = ["#800080", "#5e005e", "#cc0000", "#000000", "#550055"];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x + Math.random() * 10 - 5,
      y: y + Math.random() * 10 - 5,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.floor(Math.random() * 4) + 4,
      life: 30,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

// ----- GAME LOOP -----
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function resetPlayerPosition() {
  player.x = 100;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.energy = 100;
}
function update() {
    const previousForm = player.form;
    player.form = keys[" "] && player.energy > 0 ? "bat" : "vampire";
    if (player.form !== previousForm) {
      spawnSmoke(player.x + player.width / 2, player.y + player.height / 2);
  }


  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Direction
  if (player.vx > 0) player.facing = "right";
  else if (player.vx < 0) player.facing = "left";

  // Energy smoothing
  const smoothing = 0.1;
  displayedEnergy += (player.energy - displayedEnergy) * smoothing;

  // // UI display
  // formDisplay.textContent = player.form;
  // energyDisplay.textContent = Math.floor(displayedEnergy);

  player.vx = 0;
  if (player.form === "vampire") {
    if (keys["arrowleft"] || keys["a"]) player.vx = -player.speed;
    if (keys["arrowright"] || keys["d"]) player.vx = player.speed;
    player.vy += 0.5;
    if ((keys[" "] || keys["w"]) && player.onGround) {
      player.vy = -player.jumpPower;
      player.onGround = false;
    }
  } else if (player.energy > 0) {
    const ax = 3.5, ay = 1.8, maxX = 6, maxY = 3.5, damp = 0.92;
    if (keys["arrowleft"] || keys["a"]) player.vx -= ax;
    if (keys["arrowright"] || keys["d"]) player.vx += ax;
    if (keys["arrowup"] || keys["w"]) player.vy -= ay;
    if (keys["arrowdown"] || keys["s"]) player.vy += ay;
    player.vx *= damp;
    player.vy *= damp;
    player.vx = Math.max(Math.min(player.vx, maxX), -maxX);
    player.vy = Math.max(Math.min(player.vy, maxY), -maxY);
    player.energy -= 0.5;
  } else player.vy += 0.5;

  player.x += player.vx;
  player.y += player.vy;

  // Blood Vials
  bloodVials.forEach(vial => {
    if (!vial.collected && isColliding(player, { x: vial.x, y: vial.y, width: 20, height: 20 })) {
      vial.collected = true;
    }
  });

  // ----- SPAWN PORTAL WITH MAGICAL DELAY -----
  if (allVialsCollected() && !goalPortal.summoned && !portalSummonTimerStarted) {
    portalSummonTimerStarted = true;

    setTimeout(() => {
      if (spawnPortalOverPlayer) {
        goalPortal.x = player.x + player.width / 2 - goalPortal.width / 2;
        goalPortal.y = player.y + player.height / 2 - goalPortal.height / 2;
      } else {
        const topPlatform = platforms.reduce((highest, p) => p.y < highest.y ? p : highest, platforms[0]);
        goalPortal.x = topPlatform.x + topPlatform.width / 2 - goalPortal.width / 2;
        goalPortal.y = topPlatform.y - goalPortal.height;
      }

      goalPortal.visible = true;
      goalPortal.summoned = true;
      spawnSmoke(goalPortal.x + goalPortal.width / 2, goalPortal.y + goalPortal.height / 2);
    }, 1000); // 1 second delay

    console.log("Spawning portal at", goalPortal.x, goalPortal.y);
  }

  if (!gameWon && goalPortal.visible && isColliding(player, goalPortal)) {
    document.getElementById("winMessage").style.display = "block";
    document.getElementById("resetButton").style.display = "block";
    gameWon = true;
  }

  document.getElementById("resetButton").addEventListener("click", () => {
    function resetGame() {
      gameWon = false;
      document.getElementById("winMessage").style.display = "none";
      document.getElementById("resetButton").style.display = "none";
    
      // Reset player
      player.x = 100;
      player.y = 300;
      player.vx = 0;
      player.vy = 0;
      player.energy = 100;
      player.form = "vampire";
      player.facing = "right";
    
      // Reset vials
      bloodVials.forEach(v => v.collected = false);
    
      // Reset portal
      goalPortal.visible = false;
      goalPortal.summoned = false;
      portalSummonTimerStarted = false;
    
      // Clear particles
      particles.length = 0;
    }
    
    document.getElementById("resetButton").addEventListener("click", resetGame); // simple and effective for a demo
  });

  if (player.form === "vampire") {
    batGates.forEach(gate => {
      if (isColliding(player, gate)) {
        if (player.vx > 0) player.x = gate.x - player.width;
        else if (player.vx < 0) player.x = gate.x + gate.width;
        if (player.vy > 0) player.y = gate.y - player.height;
        else if (player.vy < 0) player.y = gate.y + gate.height;
        player.vx = 0; player.vy = 0;
      }
    });
  }

  player.onGround = false;
  platforms.forEach(p => {
    if (isColliding(player, p)) {
      if (player.vy > 0) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.onGround = true;
        if (player.form === "vampire") {
          player.energy = Math.min(player.energy + 1, 100);
        }
      }
    }
  });
}


// ----- COLLISION DETECTION -----
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ----- RESET BUTTON -----
document.getElementById("resetButton").addEventListener("click", () => {
  function resetGame() {
    gameWon = false;
    document.getElementById("winMessage").style.display = "none";
    document.getElementById("resetButton").style.display = "none";
  
    // Reset player
    player.x = 100;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.energy = 100;
    player.form = "vampire";
    player.facing = "right";
  
    // Reset vials
    bloodVials.forEach(v => v.collected = false);
  
    // Reset portal
    goalPortal.visible = false;
    goalPortal.summoned = false;
    portalSummonTimerStarted = false;
  
    // Clear particles
    particles.length = 0;
  }
  
  document.getElementById("resetButton").addEventListener("click", resetGame);
});

// ----- RENDER -----
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  // Vial Counter
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Vials: ${bloodVials.filter(v => v.collected).length}/3`, 716, 30);

  // Energy Bar
  ctx.fillStyle = "#2e2e2e";
  ctx.fillRect(20, 20, 104, 14);

  const blood = ctx.createLinearGradient(0, 0, 0, 40);
  blood.addColorStop(0, "#ff0033");
  blood.addColorStop(1, "#990000");
  ctx.fillStyle = blood;
  ctx.fillRect(22, 22, displayedEnergy, 10);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, 104, 14);

  ctx.fillStyle = "white";
  ctx.beginPath(); ctx.moveTo(20, 34); ctx.lineTo(24, 44); ctx.lineTo(28, 34); ctx.fill();
  ctx.beginPath(); ctx.moveTo(124, 34); ctx.lineTo(120, 44); ctx.lineTo(116, 34); ctx.fill();

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  // Player
  ctx.save();
  if (player.facing === "left") {
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(
      player.form === "vampire" ? vampireImg : batImg,
      -player.width / 2, -player.height / 2,
      player.width, player.height
    );
  } else {
    ctx.drawImage(
      player.form === "vampire" ? vampireImg : batImg,
      player.x, player.y,
      player.width, player.height
    );
  }
  ctx.restore();

  // Platforms
  ctx.fillStyle = "gray";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

  
  // Bat gates
  batGates.forEach(drawGate);
  
  // Draw blood vials
  bloodVials.forEach(vial => {
    if (!vial.collected) {
      ctx.fillStyle = "#cc0000";
      ctx.beginPath();
      ctx.arc(vial.x + 10, vial.y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#550000";
      ctx.stroke();
    }
  });

  // Goal Portal - if all vials are collected
  if (goalPortal.visible) {
    ctx.save();
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 20;
    ctx.drawImage(
      goalPortal.image,
      goalPortal.x,
      goalPortal.y,
      goalPortal.width,
      goalPortal.height
    );
    ctx.restore();
  }
}
