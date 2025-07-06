// Variables to control game state

// Game state variables
let gameRunning = false; // Is the game active?
let dropMaker; // Timer for making drops
let timer; // Timer for countdown
let score = 0; // Player's score
let lives = 3; // Player's lives
let timeLeft = 30; // Game time in seconds

// Get DOM elements
const scoreSpan = document.getElementById("score");
const timeSpan = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const gameContainer = document.getElementById("game-container");

// Create feedback message element
const feedback = document.createElement("div");
feedback.style.position = "absolute";
feedback.style.top = "50%";
feedback.style.left = "50%";
feedback.style.transform = "translate(-50%, -50%)";
feedback.style.fontSize = "32px";
feedback.style.fontWeight = "bold";
feedback.style.color = "#2E9DF7";
feedback.style.zIndex = "10";
feedback.style.pointerEvents = "none";
feedback.style.display = "none";
gameContainer.appendChild(feedback);

// Add cloud and bucket images
function setupImages() {
  // Only add once
  if (document.getElementById("cloud-img")) return;
  const cloud = document.createElement("img");
  cloud.src = "img/cloud.png";
  cloud.id = "cloud-img";
  cloud.style.position = "absolute";
  cloud.style.top = "-30px";
  cloud.style.left = "50%";
  cloud.style.transform = "translateX(-50%)";
  cloud.style.width = "1200px";
  cloud.style.height = "360px";
  cloud.style.objectFit = "contain";
  cloud.style.zIndex = "1";
  gameContainer.appendChild(cloud);

  // Use the transparent water can image
  const bucket = document.createElement("img");
  bucket.src = "img/water-can-transparent.png";
  bucket.id = "bucket-img";
  bucket.style.position = "absolute";
  bucket.style.bottom = "10px";
  bucket.style.left = "50%";
  bucket.style.transform = "translateX(-50%)";
  bucket.style.width = "120px";
  bucket.style.zIndex = "1";
  bucket.style.cursor = "grab";
  gameContainer.appendChild(bucket);

  // Make the bucket draggable left/right
  makeBucketDraggable(bucket);
}

// Allow the bucket to be dragged left/right
function makeBucketDraggable(bucket) {
  let isDragging = false;
  let startX = 0;
  let startLeft = 0;

  // Mouse events
  bucket.addEventListener("mousedown", function(e) {
    isDragging = true;
    startX = e.clientX;
    startLeft = bucket.offsetLeft;
    bucket.style.cursor = "grabbing";
    e.preventDefault();
  });
  document.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    let newLeft = startLeft + dx;
    // Keep bucket inside game area
    const minLeft = 0;
    const maxLeft = gameContainer.offsetWidth - bucket.offsetWidth;
    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    bucket.style.left = `${newLeft}px`;
    bucket.style.transform = "none"; // Remove centering transform
  });
  document.addEventListener("mouseup", function() {
    isDragging = false;
    bucket.style.cursor = "grab";
  });

  // Touch events for mobile
  bucket.addEventListener("touchstart", function(e) {
    isDragging = true;
    startX = e.touches[0].clientX;
    startLeft = bucket.offsetLeft;
    e.preventDefault();
  });
  document.addEventListener("touchmove", function(e) {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    let newLeft = startLeft + dx;
    const minLeft = 0;
    const maxLeft = gameContainer.offsetWidth - bucket.offsetWidth;
    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    bucket.style.left = `${newLeft}px`;
    bucket.style.transform = "none";
  });
  document.addEventListener("touchend", function() {
    isDragging = false;
  });
}

// Start button event
// Start/Reset button event
startBtn.addEventListener("click", function() {
  if (!gameRunning) {
    // Start the game
    gameRunning = true;
    score = 0;
    lives = 3;
    timeLeft = 30;
    updateScore();
    updateLives();
    updateTime();
    clearDrops();
    setupImages();
    feedback.style.display = "none";
    // Change button to Reset (red)
    startBtn.textContent = "Reset";
    startBtn.style.backgroundColor = "#F5402C"; // Brand Red
    startBtn.style.color = "#fff";
    // Start making drops every 1 second
    dropMaker = setInterval(createDrop, 1000);
    // Start countdown timer
    timer = setInterval(countdown, 1000);
  } else {
    // Reset the game
    endGame(true); // true = manual reset
  }
});

// Helper to set button to Start state
function setStartButton() {
  startBtn.textContent = "Start Game";
  startBtn.style.backgroundColor = "#4FCB53"; // Brand Green
  startBtn.style.color = "#fff";
}

// Create a new drop (good or bad)
function createDrop() {
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Randomly decide if this is a good (blue) or bad (red) drop
  const isBad = Math.random() < 0.25; // 25% chance for bad drop
  if (isBad) {
    drop.classList.add("bad-drop");
  }

  // Random size for variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Random horizontal position
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Drop falls for 4 seconds
  drop.style.animationDuration = "4s";

  // Add drop to game
  gameContainer.appendChild(drop);

  // When drop is clicked (optional: you can keep this for bonus points)
  drop.addEventListener("click", function handleDropClick() {
    if (!gameRunning) return;
    // Remove drop immediately if clicked
    drop.remove();
  });

  // When drop reaches the bottom, check if it lands in the bucket
  drop.addEventListener("animationend", function() {
    if (!gameRunning || !drop.parentNode) return;
    const bucket = document.getElementById("bucket-img");
    const dropRect = drop.getBoundingClientRect();
    const bucketRect = bucket.getBoundingClientRect();
    // Check for horizontal overlap (simple collision)
    const overlap = dropRect.right > bucketRect.left && dropRect.left < bucketRect.right;
    // Check if drop is close enough to the top of the bucket (bottom of drop near top of bucket)
    const closeEnough = dropRect.bottom > bucketRect.top + 10;

    if (overlap && closeEnough) {
      // Drop is caught by the bucket
      if (drop.classList.contains("bad-drop")) {
        // Bad drop caught: lose a life
        lives--;
        showFeedback("Oops! -1 life", "#F5402C");
        updateLives();
        if (lives <= 0) {
          endGame();
        }
      } else {
        // Good drop caught: gain score
        score++;
        showFeedback("Great! +1", "#2E9DF7");
        updateScore();
      }
    } else {
      // Drop missed the bucket
      // Good drops missed: nothing happens
    }
    drop.remove();
  });
}

// Countdown timer
function countdown() {
  timeLeft--;
  updateTime();
  if (timeLeft <= 0) {
    endGame();
  }
}

// Update score display
function updateScore() {
  scoreSpan.textContent = score;
}

// Update lives display (add to score panel if not present)
function updateLives() {
  let livesDiv = document.getElementById("lives");
  if (!livesDiv) {
    livesDiv = document.createElement("div");
    livesDiv.id = "lives";
    livesDiv.style.flex = "0 1 auto";
    livesDiv.style.fontSize = "24px";
    livesDiv.style.fontWeight = "bold";
    livesDiv.style.color = "#2E9DF7";
    // Insert after score
    const scorePanel = document.querySelector(".score-panel");
    scorePanel.insertBefore(livesDiv, scorePanel.children[1]);
  }
  livesDiv.innerHTML = `Lives: <span>${lives}</span>`;
}

// Update time display
function updateTime() {
  timeSpan.textContent = timeLeft;
}

// Show feedback message in the center
function showFeedback(msg, color) {
  feedback.textContent = msg;
  feedback.style.color = color;
  feedback.style.display = "block";
  setTimeout(() => {
    feedback.style.display = "none";
  }, 700);
}

// Remove all drops from the game area
function clearDrops() {
  const drops = document.querySelectorAll(".water-drop");
  drops.forEach(drop => drop.remove());
}

// End the game
// End the game
// If reset=true, don't show feedback
function endGame(reset = false) {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(timer);
  setStartButton();
  if (!reset) {
    showFeedback(lives <= 0 ? "Game Over!" : "Time's up!", "#F5402C");
  }
  clearDrops();
}
