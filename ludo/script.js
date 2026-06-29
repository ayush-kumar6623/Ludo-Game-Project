// Sound Synthesizer via Web Audio API
const SoundSynth = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  play(type) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    switch (type) {
      case 'roll':
        // Roll sound: quick high-frequency white noise burst
        this.playNoise(0.15, 0.08);
        break;
      case 'move':
        // Move sound: short pleasant chirp
        this.playTone(320, 580, 0.06, 'sine');
        break;
      case 'capture':
        // Capture sound: retro dramatic descending sweep
        this.playTone(600, 80, 0.3, 'sawtooth');
        break;
      case 'home':
        // Home sound: dual bell-like chime
        this.playTone(523.25, 523.25, 0.12, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 659.25, 0.2, 'sine'), 80); // E5
        break;
      case 'win':
        // Win sound: Major arpeggio fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          setTimeout(() => this.playTone(freq, freq, 0.22, 'triangle'), idx * 120);
        });
        break;
    }
  },

  playTone(startFreq, endFreq, duration, type) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      if (startFreq !== endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      }

      gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.005, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  },

  playNoise(duration, volume) {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }
};

// Victory Confetti Particle System
const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  active: false,
  colors: ['#ff3366', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#e0f2fe'],

  init() {
    this.canvas = document.getElementById('victory-canvas');
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  },

  start() {
    this.active = true;
    this.canvas.style.display = 'block';
    this.particles = [];
    for (let i = 0; i < 120; i++) {
      this.particles.push(this.createParticle());
    }
    this.loop();
  },

  stop() {
    this.active = false;
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  },

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height - this.canvas.height,
      r: Math.random() * 5 + 3,
      d: Math.random() * this.canvas.height,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      tilt: Math.random() * 8 - 4,
      tiltAngleIncremental: Math.random() * 0.05 + 0.02,
      tiltAngle: 0
    };
  },

  loop() {
    if (!this.active) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  },

  update() {
    const height = this.canvas.height;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3.5 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle) * 12;

      if (p.y > height) {
        this.particles[i] = this.createParticle();
        this.particles[i].y = -15;
      }
    }
  },

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    }
  }
};

// 15x15 Ludo Board coordinates mapping for the common track
// Contains 52 coordinates in clockwise order starting from (6, 0)
const TRACK_COORDINATES = [
  { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // Left arm bottom going right
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }, // Top arm left going up
  { r: 0, c: 7 }, // Crossing top
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // Top arm right going down
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // Right arm top going right
  { r: 7, c: 14 }, // Crossing right
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // Right arm bottom going left
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // Bottom arm right going down
  { r: 14, c: 7 }, // Crossing bottom
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // Bottom arm left going up
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 }, // Left arm top going left
  { r: 7, c: 0 } // Crossing left
];

// Safe zones indexes on the track (Starts and Stars)
const SAFE_INDICES = [1, 9, 14, 22, 27, 35, 40, 47];

// Player configuration and path specifications
const PLAYERS = {
  red: {
    color: 'red',
    startIndex: 1,       // (6, 1)
    lastIndex: 51,       // (7, 0)
    homePath: [{r:7, c:1}, {r:7, c:2}, {r:7, c:3}, {r:7, c:4}, {r:7, c:5}],
    center: {r:7, c:6},
    yardSlots: [{r:2, c:2}, {r:2, c:3}, {r:3, c:2}, {r:3, c:3}],
    name: 'Red Player',
    displayName: 'Red'
  },
  green: {
    color: 'green',
    startIndex: 14,      // (1, 8)
    lastIndex: 12,      // (0, 7)
    homePath: [{r:1, c:7}, {r:2, c:7}, {r:3, c:7}, {r:4, c:7}, {r:5, c:7}],
    center: {r:6, c:7},
    yardSlots: [{r:2, c:11}, {r:2, c:12}, {r:3, c:11}, {r:3, c:12}],
    name: 'Green Player',
    displayName: 'Green'
  },
  yellow: {
    color: 'yellow',
    startIndex: 27,      // (8, 13)
    lastIndex: 25,      // (7, 14)
    homePath: [{r:7, c:13}, {r:7, c:12}, {r:7, c:11}, {r:7, c:10}, {r:7, c:9}],
    center: {r:7, c:8},
    yardSlots: [{r:11, c:11}, {r:11, c:12}, {r:12, c:11}, {r:12, c:12}],
    name: 'Yellow Player',
    displayName: 'Yellow'
  },
  blue: {
    color: 'blue',
    startIndex: 40,      // (13, 6)
    lastIndex: 38,      // (14, 7)
    homePath: [{r:13, c:7}, {r:12, c:7}, {r:11, c:7}, {r:10, c:7}, {r:9, c:7}],
    center: {r:8, c:7},
    yardSlots: [{r:11, c:2}, {r:11, c:3}, {r:12, c:2}, {r:12, c:3}],
    name: 'Blue Player',
    displayName: 'Blue'
  }
};

const ORDER = ['red', 'green', 'yellow', 'blue'];

// Game State variables
let tokens = [];
let currentPlayer = 'red';
let gameState = 'roll'; // 'roll', 'move', 'finished'
let currentRoll = null;
let consecutiveSixes = 0;

// Settings
const settings = {
  speed: 400,
  extraRollOnSix: true,
  extraRollOnCapture: true,
  extraRollOnHome: true
};

// UI Cache elements
let boardEl, btnRollEl, rollValDisplayEl, currentTurnBadgeEl, currentTurnNameEl, turnStatusTextEl, logContainerEl;
let settingsModalEl, victoryModalEl, victoryTitleEl;

// Initialize Game elements and bindings
document.addEventListener('DOMContentLoaded', () => {
  boardEl = document.getElementById('ludo-board');
  btnRollEl = document.getElementById('btn-roll');
  rollValDisplayEl = document.getElementById('roll-val-display');
  currentTurnBadgeEl = document.getElementById('current-player-display');
  currentTurnNameEl = document.getElementById('current-player-name');
  turnStatusTextEl = document.getElementById('turn-status-text');
  logContainerEl = document.getElementById('log-entries');
  
  settingsModalEl = document.getElementById('settings-modal');
  victoryModalEl = document.getElementById('victory-modal');
  victoryTitleEl = document.getElementById('victory-title');

  // Build the board track cells and home paths
  generatePathCells();

  // Load setup listeners
  setupEvents();

  // Initialize confetti canvas
  Confetti.init();

  // Reset/Start the game
  resetGame();
});

// Setup DOM event listeners
function setupEvents() {
  // Roll Actions
  btnRollEl.addEventListener('click', rollAction);
  document.getElementById('cube').addEventListener('click', rollAction);

  // Settings Overlay toggling
  document.getElementById('btn-settings').addEventListener('click', () => {
    settingsModalEl.classList.add('open');
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    settingsModalEl.classList.remove('open');
  });
  
  // Close setting on clicking outside modal
  settingsModalEl.addEventListener('click', (e) => {
    if (e.target === settingsModalEl) settingsModalEl.classList.remove('open');
  });

  // Sound toggle button
  const soundBtn = document.getElementById('btn-sound');
  soundBtn.addEventListener('click', () => {
    SoundSynth.enabled = !SoundSynth.enabled;
    soundBtn.querySelector('.sound-icon').textContent = SoundSynth.enabled ? '🔊' : '🔇';
    soundBtn.classList.toggle('disabled', !SoundSynth.enabled);
  });

  // Settings values binding
  const speedSelect = document.getElementById('setting-speed');
  speedSelect.addEventListener('change', () => {
    settings.speed = parseInt(speedSelect.value, 10);
  });
  
  const checkSix = document.getElementById('setting-extra-roll');
  checkSix.addEventListener('change', () => {
    settings.extraRollOnSix = checkSix.checked;
  });
  
  const checkCapture = document.getElementById('setting-extra-capture');
  checkCapture.addEventListener('change', () => {
    settings.extraRollOnCapture = checkCapture.checked;
  });

  const checkHome = document.getElementById('setting-extra-home');
  checkHome.addEventListener('change', () => {
    settings.extraRollOnHome = checkHome.checked;
  });

  // Restart buttons
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Restart game? Progress will be lost.")) resetGame();
  });
  
  document.getElementById('btn-victory-restart').addEventListener('click', () => {
    victoryModalEl.classList.remove('open');
    Confetti.stop();
    resetGame();
  });

  // Player type selection dropdowns
  ORDER.forEach(color => {
    document.getElementById(`select-${color}`).addEventListener('change', () => {
      addLog(`${PLAYERS[color].displayName} set to ${document.getElementById(`select-${color}`).value.toUpperCase()}`, 'system');
      // If we change players and the current player is no longer active, go to next
      if (gameState === 'roll' && getPlayerType(currentPlayer) === 'off') {
        passTurn();
      } else {
        triggerTurnPhase();
      }
    });
  });
}

// Generate board path divs dynamically
function generatePathCells() {
  // 1. Create the outer track cells
  TRACK_COORDINATES.forEach((coord, idx) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.gridRow = coord.r + 1;
    cell.style.gridColumn = coord.c + 1;

    // Apply safe classes
    if (SAFE_INDICES.includes(idx)) {
      cell.classList.add('cell-safe');
    }

    // Apply start markers
    ORDER.forEach(color => {
      if (PLAYERS[color].startIndex === idx) {
        cell.classList.add('cell-start', `cell-${color}`);
      }
    });

    boardEl.appendChild(cell);
  });

  // 2. Create home columns
  ORDER.forEach(color => {
    PLAYERS[color].homePath.forEach(coord => {
      const cell = document.createElement('div');
      cell.classList.add('cell', `cell-${color}`);
      cell.style.gridRow = coord.r + 1;
      cell.style.gridColumn = coord.c + 1;
      boardEl.appendChild(cell);
    });
  });
}

// Get the coordinates for a token depending on its step count
function getTokenCoordinates(playerColor, tokenIndex, steps) {
  const p = PLAYERS[playerColor];
  
  if (steps === 0) {
    // In yard slots
    return p.yardSlots[tokenIndex];
  }
  
  if (steps >= 1 && steps <= 51) {
    // Clockwise common path indices
    const trackIndex = (p.startIndex + steps - 1) % 52;
    return TRACK_COORDINATES[trackIndex];
  }
  
  if (steps >= 52 && steps <= 56) {
    // Home stretch columns
    return p.homePath[steps - 52];
  }
  
  if (steps === 57) {
    // Center triangle endpoint
    return p.center;
  }
  
  return null;
}

// Check if coordinates match safe zones
function isSafeCoordinate(coords) {
  const safeCoords = [
    {r: 6, c: 1}, {r: 2, c: 6},
    {r: 1, c: 8}, {r: 6, c: 12},
    {r: 8, c: 13}, {r: 12, c: 8},
    {r: 13, c: 6}, {r: 8, c: 3}
  ];
  return safeCoords.some(sc => sc.r === coords.r && sc.c === coords.c);
}

// Helper: check if coordinates are equal
function coordinatesEqual(a, b) {
  return a && b && a.r === b.r && a.c === b.c;
}

// Check if an opponent token occupies a coordinate
function isOpponentOnCoordinate(playerColor, coords) {
  return tokens.some(t => 
    t.player !== playerColor && 
    t.steps > 0 && 
    t.steps < 57 && 
    coordinatesEqual(getTokenCoordinates(t.player, t.index, t.steps), coords)
  );
}

// Reset entire state and re-start
function resetGame() {
  tokens = [];
  ORDER.forEach(color => {
    for (let i = 0; i < 4; i++) {
      tokens.push({
        player: color,
        index: i,
        steps: 0
      });
    }
  });

  currentPlayer = 'red';
  gameState = 'roll';
  currentRoll = null;
  consecutiveSixes = 0;

  // Clear feed logs
  logContainerEl.innerHTML = '';
  addLog("Game restarted. Roll the die to start!", "system");

  // Re-build UI
  updateBoardUI();
  updateSidebarUI();

  // Run start phase
  triggerTurnPhase();
}

// Update token locations and UI overlays
function updateBoardUI() {
  // 1. Remove all old token containers
  document.querySelectorAll('.tokens-container').forEach(el => el.remove());

  // 2. Map coordinates to tokens inside them
  const yardSlotsMapped = {};
  const boardCellsMapped = {};

  tokens.forEach(t => {
    if (t.steps === 0) {
      // Yard: unique slot
      const key = `yard-${t.player}-${t.index}`;
      yardSlotsMapped[key] = t;
    } else {
      // Board cells: stackable
      const coords = getTokenCoordinates(t.player, t.index, t.steps);
      if (coords) {
        const key = `${coords.r}_${coords.c}`;
        if (!boardCellsMapped[key]) boardCellsMapped[key] = [];
        boardCellsMapped[key].push(t);
      }
    }
  });

  // 3. Render tokens in yards
  ORDER.forEach(color => {
    for (let i = 0; i < 4; i++) {
      const key = `yard-${color}-${i}`;
      const slotEl = document.getElementById(key);
      if (slotEl) {
        slotEl.innerHTML = '';
        if (yardSlotsMapped[key]) {
          const t = yardSlotsMapped[key];
          const tEl = createTokenEl(t);
          slotEl.appendChild(tEl);
        }
      }
    }
  });

  // 4. Render tokens on paths
  Object.keys(boardCellsMapped).forEach(key => {
    const parts = key.split('_');
    const r = parseInt(parts[0], 10);
    const c = parseInt(parts[1], 10);
    const tokenList = boardCellsMapped[key];

    // Create container
    const container = document.createElement('div');
    container.classList.add('tokens-container', `count-${tokenList.length}`);
    container.style.gridRow = r + 1;
    container.style.gridColumn = c + 1;

    tokenList.forEach(t => {
      container.appendChild(createTokenEl(t));
    });

    boardEl.appendChild(container);
  });
}

// Create token HTML element with appropriate events
function createTokenEl(token) {
  const el = document.createElement('div');
  el.classList.add('token', `token-${token.player}`);
  el.setAttribute('data-player', token.player);
  el.setAttribute('data-index', token.index);

  // If token is movable in this turn phase, mark it
  if (gameState === 'move' && token.player === currentPlayer) {
    const valid = getValidMoves(currentPlayer, currentRoll);
    const isMovable = valid.some(m => m.token.index === token.index);
    if (isMovable && getPlayerType(currentPlayer) === 'human') {
      el.classList.add('movable');
      el.addEventListener('click', () => {
        handleTokenClick(token);
      });
    }
  }

  return el;
}

// Update player card indicators and types
function updateSidebarUI() {
  ORDER.forEach(color => {
    const card = document.getElementById(`card-${color}`);
    const statusText = document.getElementById(`status-tokens-${color}`);

    // active player glow
    card.classList.toggle('active', color === currentPlayer);

    // count tokens in yard / board / home
    const playerTokens = tokens.filter(t => t.player === color);
    const inYard = playerTokens.filter(t => t.steps === 0).length;
    const finished = playerTokens.filter(t => t.steps === 57).length;
    const onBoard = 4 - inYard - finished;

    let desc = '';
    if (finished === 4) desc = 'All Home! 🏆';
    else desc = `${finished} Finished • ${onBoard} on track`;

    statusText.textContent = desc;
  });

  // current turn badge update
  currentTurnBadgeEl.className = `player-turn-badge player-${currentPlayer}`;
  currentTurnNameEl.textContent = `${PLAYERS[currentPlayer].displayName} Turn`;
}

// Get player controller: 'human', 'ai', or 'off'
function getPlayerType(color) {
  const select = document.getElementById(`select-${color}`);
  return select ? select.value : 'off';
}

// Check how many players are set to active
function getActivePlayerCount() {
  return ORDER.filter(color => getPlayerType(color) !== 'off').length;
}

// Logic flow handler when transitioning stages
function triggerTurnPhase() {
  updateSidebarUI();

  // Check if game is completed
  if (checkVictory(currentPlayer)) {
    handleVictory(currentPlayer);
    return;
  }

  const type = getPlayerType(currentPlayer);
  
  if (type === 'off') {
    passTurn();
    return;
  }

  if (gameState === 'roll') {
    turnStatusTextEl.textContent = type === 'ai' ? 'CPU is thinking...' : 'Roll the die!';
    btnRollEl.classList.toggle('disabled', type === 'ai');
    rollValDisplayEl.textContent = '-';

    if (type === 'ai') {
      setTimeout(() => {
        performRoll();
      }, 700);
    }
  } else if (gameState === 'move') {
    const validMoves = getValidMoves(currentPlayer, currentRoll);
    
    if (validMoves.length === 0) {
      turnStatusTextEl.textContent = 'No moves available!';
      addLog(`No valid moves for ${PLAYERS[currentPlayer].displayName}.`, currentPlayer);
      setTimeout(() => {
        passTurn();
      }, settings.speed * 2);
    } else {
      turnStatusTextEl.textContent = type === 'ai' ? 'CPU is moving...' : 'Move a highlighted token!';
      btnRollEl.classList.add('disabled');
      
      // Auto move for human if only one option exists (optional - here we let them click for feedback or move auto)
      // For AI: execute choice
      if (type === 'ai') {
        setTimeout(() => {
          const chosenToken = getBestMove(validMoves);
          executeMove(chosenToken);
        }, settings.speed * 1.5);
      }
    }
  }
}

// Click callback to roll the die
function rollAction() {
  if (gameState !== 'roll' || getPlayerType(currentPlayer) === 'off' || getPlayerType(currentPlayer) === 'ai') {
    return;
  }
  performRoll();
}

// Execute die roll mechanics and 3D animations
function performRoll() {
  gameState = 'busy'; // prevent double actions
  btnRollEl.classList.add('disabled');
  SoundSynth.play('roll');

  const cube = document.getElementById('cube');
  cube.classList.remove('show-1', 'show-2', 'show-3', 'show-4', 'show-5', 'show-6');
  cube.classList.add('rolling');

  // Roll output
  const roll = Math.floor(Math.random() * 6) + 1;
  currentRoll = roll;

  // Let 3D cube spin for 600ms
  setTimeout(() => {
    cube.classList.remove('rolling');
    cube.classList.add(`show-${roll}`);
    rollValDisplayEl.textContent = roll;
    
    addLog(`${PLAYERS[currentPlayer].displayName} rolled a ${roll}!`, currentPlayer);
    
    gameState = 'move';
    updateBoardUI(); // refresh movable markers
    triggerTurnPhase();
  }, 600);
}

// Check valid moves for current player
function getValidMoves(playerColor, roll) {
  const list = tokens.filter(t => t.player === playerColor);
  const valid = [];

  list.forEach(token => {
    if (token.steps === 0) {
      // In base, only 6 can deploy
      if (roll === 6) {
        valid.push({ token, targetSteps: 1 });
      }
    } else {
      // On board, cannot overshoot center (57)
      if (token.steps + roll <= 57) {
        valid.push({ token, targetSteps: token.steps + roll });
      }
    }
  });

  return valid;
}

// Move token with animation along cell path
async function executeMove(token) {
  gameState = 'busy';
  const startSteps = token.steps;
  const targetSteps = startSteps === 0 ? 1 : startSteps + currentRoll;

  // Clear highlight classes immediately
  document.querySelectorAll('.token').forEach(el => el.classList.remove('movable'));

  if (startSteps === 0) {
    // Jump directly out of yard to start cell
    token.steps = 1;
    updateBoardUI();
    SoundSynth.play('move');
    await sleep(settings.speed);
  } else {
    // Step by step transition
    for (let s = startSteps + 1; s <= targetSteps; s++) {
      token.steps = s;
      updateBoardUI();
      SoundSynth.play('move');
      await sleep(settings.speed);
    }
  }

  // Final landing checks
  evaluateLanding(token);
}

// Triggered on clicking highlighted token
function handleTokenClick(token) {
  if (gameState !== 'move' || token.player !== currentPlayer) return;
  executeMove(token);
}

// Evaluate captures, safety and extra roll flags
function evaluateLanding(token) {
  const finalCoords = getTokenCoordinates(token.player, token.index, token.steps);
  let captured = false;

  // Opponent captures
  if (token.steps > 0 && token.steps < 57 && !isSafeCoordinate(finalCoords)) {
    tokens.forEach(t => {
      if (t.player !== currentPlayer && t.steps > 0 && t.steps < 57) {
        const tc = getTokenCoordinates(t.player, t.index, t.steps);
        if (coordinatesEqual(tc, finalCoords)) {
          t.steps = 0; // send to yard
          captured = true;
          addLog(`${PLAYERS[currentPlayer].displayName} captured ${PLAYERS[t.player].displayName}'s token!`, currentPlayer);
        }
      }
    });
  }

  if (captured) {
    SoundSynth.play('capture');
  }

  // Re-roll conditions
  let extraRoll = false;

  if (captured && settings.extraRollOnCapture) {
    extraRoll = true;
  }
  
  if (token.steps === 57) {
    SoundSynth.play('home');
    addLog(`${PLAYERS[currentPlayer].displayName} token reached home!`, currentPlayer);
    if (settings.extraRollOnHome) {
      extraRoll = true;
    }
  }

  if (currentRoll === 6 && settings.extraRollOnSix) {
    consecutiveSixes++;
    if (consecutiveSixes === 3) {
      addLog(`Three 6s! Turn forfeited.`, currentPlayer);
      consecutiveSixes = 0;
      extraRoll = false;
    } else {
      extraRoll = true;
    }
  } else {
    consecutiveSixes = 0;
  }

  // check if player won
  if (checkVictory(currentPlayer)) {
    handleVictory(currentPlayer);
    return;
  }

  if (extraRoll) {
    addLog(`${PLAYERS[currentPlayer].displayName} gets an extra roll!`, currentPlayer);
    gameState = 'roll';
    triggerTurnPhase();
  } else {
    passTurn();
  }
}

// Pass current player cursor
function passTurn() {
  if (getActivePlayerCount() <= 1) {
    // If fewer than 2 active players, don't pass infinitely, just keep status
    gameState = 'roll';
    triggerTurnPhase();
    return;
  }

  let idx = ORDER.indexOf(currentPlayer);
  do {
    idx = (idx + 1) % 4;
  } while (getPlayerType(ORDER[idx]) === 'off');

  currentPlayer = ORDER[idx];
  gameState = 'roll';
  consecutiveSixes = 0;
  
  addLog(`Turn shifted to ${PLAYERS[currentPlayer].displayName}.`, currentPlayer);
  triggerTurnPhase();
}

// Check if player won
function checkVictory(playerColor) {
  const pTokens = tokens.filter(t => t.player === playerColor);
  return pTokens.every(t => t.steps === 57);
}

// Victory animations and modal overlays
function handleVictory(playerColor) {
  gameState = 'finished';
  btnRollEl.classList.add('disabled');
  SoundSynth.play('win');
  
  // Show overlays
  victoryTitleEl.textContent = `${PLAYERS[playerColor].displayName} Player Wins!`;
  victoryModalEl.classList.add('open');

  // Start confetti celebration
  Confetti.start();
  addLog(`🏆 ${PLAYERS[playerColor].displayName} Player is the champion! 🏆`, 'system');
}

// AI decision choosing
function getBestMove(validMoves) {
  // Heuristic priorities:
  
  // 1. Capture: can we eliminate opponent?
  const captureMove = validMoves.find(m => {
    const coords = getTokenCoordinates(m.token.player, m.token.index, m.targetSteps);
    return isOpponentOnCoordinate(m.token.player, coords) && !isSafeCoordinate(coords);
  });
  if (captureMove) return captureMove.token;

  // 2. Win: can we enter home center?
  const winMove = validMoves.find(m => m.targetSteps === 57);
  if (winMove) return winMove.token;

  // 3. Escape: is token under immediate threat?
  const escapeMove = validMoves.find(m => {
    const currentlyThreatened = isTokenThreatened(m.token);
    const futureCoords = getTokenCoordinates(m.token.player, m.token.index, m.targetSteps);
    const willBeThreatened = isCoordThreatened(m.token.player, futureCoords);
    return currentlyThreatened && !willBeThreatened;
  });
  if (escapeMove) return escapeMove.token;

  // 4. Deploy: exit yard with 6
  const deployMove = validMoves.find(m => m.token.steps === 0 && m.targetSteps === 1);
  if (deployMove) return deployMove.token;

  // 5. Advance closest to home
  const sorted = [...validMoves].sort((a, b) => b.token.steps - a.token.steps);
  return sorted[0].token;
}

// AI helper: check if token is threatened (opponent is 1-6 spaces behind)
function isTokenThreatened(token) {
  if (token.steps === 0 || token.steps >= 52) return false;
  const coords = getTokenCoordinates(token.player, token.index, token.steps);
  return isCoordThreatened(token.player, coords);
}

// AI helper: check if coordinate is threatened (opponent is 1-6 spaces behind)
function isCoordThreatened(playerColor, coords) {
  if (isSafeCoordinate(coords)) return false;

  // Check all opponent tokens
  return tokens.some(t => {
    if (t.player === playerColor || t.steps === 0 || t.steps === 57) return false;
    
    // Find track indices
    const opponentCoords = getTokenCoordinates(t.player, t.index, t.steps);
    // Find distance along outer track
    const ownIndex = TRACK_COORDINATES.findIndex(tc => coordinatesEqual(tc, coords));
    const opponentIndex = TRACK_COORDINATES.findIndex(tc => coordinatesEqual(tc, opponentCoords));

    if (ownIndex !== -1 && opponentIndex !== -1) {
      let dist = ownIndex - opponentIndex;
      if (dist < 0) dist += 52;
      return dist >= 1 && dist <= 6;
    }
    return false;
  });
}

// Print messages to visual console feed
function addLog(text, category) {
  const entry = document.createElement('div');
  entry.classList.add('log-entry', category);
  entry.textContent = text;
  logContainerEl.appendChild(entry);
  logContainerEl.scrollTop = logContainerEl.scrollHeight;
}

// Sleep promise
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
