/**
 * NEON SNAKE - Game Engine
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const remapBtn = document.getElementById('remap-btn');
const helpBtn = document.getElementById('help-btn');
const speedBtns = document.querySelectorAll('.speed-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

const closeHelpBtn = document.getElementById('close-help-btn');
const helpModalOverlay = document.getElementById('help-modal-overlay');

const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const modalOverlay = document.getElementById('modal-overlay');
const keyMapBtns = document.querySelectorAll('.key-map-btn');
const saveKeysBtn = document.getElementById('save-keys-btn');
const cancelKeysBtn = document.getElementById('cancel-keys-btn');
const keyListenerOverlay = document.getElementById('key-listener-overlay');
const bindingDirEl = document.getElementById('binding-dir');
const controlsHintEl = document.getElementById('current-controls-hint');

// Game Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;
const COLORS = {
    snakeHead: '#00f2ff',
    snakeBody: 'rgba(0, 242, 255, 0.3)',
    food: '#ff0055',
    grid: 'rgba(255, 255, 255, 0.03)'
};

// Game State
let snake = [];
let food = { x: 0, y: 0 };
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snake-high-score') || 0;
let gameTime = 0; // In seconds
let bestTime = localStorage.getItem('snake-best-time') || 0;
let gameLoop = null;
let timerLoop = null;
let isPaused = false;
let gameActive = false;
let speedLevel = parseInt(localStorage.getItem('snake-speed')) || 1;
let difficultyMode = localStorage.getItem('snake-mode') || 'medium';

const MODES = {
    easy: { size: 15, pixels: 300 },
    medium: { size: 20, pixels: 400 },
    hard: { size: 30, pixels: 600 }
};

const timerEl = document.getElementById('timer');
const bestTimeEl = document.getElementById('best-time');

// Default Controls
let keyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    pause: 'p',
    reboot: 'r',
    lvl1: '1',
    lvl2: '2',
    lvl3: '3',
    lvl4: '4',
    lvl5: '5'
};

// Load saved controls
const savedKeys = localStorage.getItem('snake-keys');
if (savedKeys) {
    try { keyMap = JSON.parse(savedKeys); } catch (e) { }
}

highScoreEl.textContent = String(highScore).padStart(4, '0');
bestTimeEl.textContent = formatTime(bestTime);

// Update Speed UI to match loaded speed level
speedBtns.forEach(btn => {
    if (parseInt(btn.dataset.level) === speedLevel) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
});

/**
 * Initialization & Setup
 */
function initCanvas() {
    const config = MODES[difficultyMode];
    canvas.width = config.pixels;
    canvas.height = config.pixels;

    // Update active UI
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === difficultyMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

window.addEventListener('resize', initCanvas);
initCanvas();

/**
 * Persistence Logic
 */
function saveCurrentState() {
    if (!gameActive) {
        localStorage.removeItem('snake-active-state');
        return;
    }
    const state = {
        snake,
        food,
        direction,
        nextDirection,
        score,
        gameTime,
        isPaused,
        speedLevel,
        difficultyMode
    };
    localStorage.setItem('snake-active-state', JSON.stringify(state));
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerEl.textContent = formatTime(gameTime);
    if (gameTime > bestTime) {
        bestTime = gameTime;
        bestTimeEl.textContent = formatTime(bestTime);
        localStorage.setItem('snake-best-time', bestTime);
    }
}

function startTimer() {
    if (timerLoop) clearInterval(timerLoop);
    timerLoop = setInterval(() => {
        if (!isPaused && gameActive) {
            gameTime++;
            updateTimerDisplay();
            saveCurrentState();
        }
    }, 1000);
}

function loadState() {
    const savedState = localStorage.getItem('snake-active-state');
    if (!savedState) return false;

    try {
        const state = JSON.parse(savedState);
        snake = state.snake;
        food = state.food;
        direction = state.direction;
        nextDirection = state.nextDirection;
        score = state.score;
        gameTime = state.gameTime || 0;
        difficultyMode = state.difficultyMode || localStorage.getItem('snake-mode') || 'medium';

        initCanvas(); // Apply correctly sized board
        updateScore();
        updateTimerDisplay();
        gameActive = true;
        isPaused = true; // Force pause on refresh
        draw(); // Show current position immediately
        saveCurrentState(); // Persist the pause status

        showScreen('pause-screen');
        overlay.classList.remove('hidden');

        // Ensure timer is ready but not counting until resume
        startTimer();
        return true;
    } catch (e) {
        return false;
    }
}

function startGame() {
    initGame();
    hideScreens();
    overlay.classList.add('hidden');
    startLoop();
    startTimer();
}

function startLoop() {
    if (gameLoop) clearInterval(gameLoop);
    const interval = 175 - (speedLevel * 25);
    gameLoop = setInterval(step, interval);
}

function gameOver() {
    gameActive = false;
    if (gameLoop) clearInterval(gameLoop);
    if (timerLoop) clearInterval(timerLoop);
    localStorage.removeItem('snake-active-state');
    finalScoreEl.textContent = score;
    showScreen('game-over-screen');
    overlay.classList.remove('hidden');
}

function requestConfirmation(onConfirmed) {
    const wasPaused = isPaused;
    isPaused = true;
    if (gameLoop) clearInterval(gameLoop);

    showScreen('confirm-screen');
    overlay.classList.remove('hidden');

    confirmYesBtn.onclick = () => {
        onConfirmed();
    };

    confirmNoBtn.onclick = () => {
        isPaused = wasPaused;
        if (!isPaused) {
            startLoop();
            hideScreens();
            overlay.classList.add('hidden');
        } else {
            showScreen('pause-screen');
        }
    };
}

function requestReboot() {
    if (!gameActive || !document.getElementById('game-over-screen').classList.contains('hidden')) {
        startGame();
        return;
    }
    requestConfirmation(() => startGame());
}

/**
 * Game Logic Functions
 */
function initGame() {
    const center = Math.floor(canvas.width / GRID_SIZE / 2);
    snake = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.push({ x: center - i, y: center });
    }
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameTime = 0;
    updateScore();
    updateTimerDisplay();
    spawnFood();
    gameActive = true;
    isPaused = false;
}

function spawnFood() {
    const cols = canvas.width / GRID_SIZE;
    const rows = canvas.height / GRID_SIZE;

    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
        // Ensure food doesn't spawn on snake body
        const conflict = snake.some(part => part.x === newFood.x && part.y === newFood.y);
        if (!conflict) break;
    }
    food = newFood;
}

function step() {
    if (isPaused) return;

    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === 'up') head.y--;
    if (direction === 'down') head.y++;
    if (direction === 'left') head.x--;
    if (direction === 'right') head.x++;

    // Collision Detection: Walls
    const cols = canvas.width / GRID_SIZE;
    const rows = canvas.height / GRID_SIZE;
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        gameOver();
        return;
    }

    // Collision Detection: Self
    if (snake.some(part => part.x === head.x && part.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Collision Detection: Food
    if (head.x === food.x && head.y === food.y) {
        score += 10 * speedLevel;
        updateScore();
        spawnFood();
    } else {
        snake.pop();
    }

    saveCurrentState();
    draw();
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    const fx = food.x * GRID_SIZE + GRID_SIZE / 2;
    const fy = food.y * GRID_SIZE + GRID_SIZE / 2;
    ctx.arc(fx, fy, GRID_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Inner glow for food
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.food;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    snake.forEach((part, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snakeBody;

        const padding = 1;
        const x = part.x * GRID_SIZE + padding;
        const y = part.y * GRID_SIZE + padding;
        const size = GRID_SIZE - padding * 2;

        if (isHead) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.snakeHead;
            ctx.fillRect(x, y, size, size);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillRect(x, y, size, size);
        }
    });
}

function updateScore() {
    scoreEl.textContent = String(score).padStart(4, '0');
    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = String(highScore).padStart(4, '0');
        localStorage.setItem('snake-high-score', highScore);
    }
}

function setSpeed(level) {
    if (level < 1 || level > 5) return;
    speedLevel = level;
    localStorage.setItem('snake-speed', speedLevel);

    // Update UI
    speedBtns.forEach(btn => {
        if (parseInt(btn.dataset.level) === speedLevel) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // If game is running, restart loop with new speed
    if (gameActive && !isPaused) {
        startLoop();
    }
    saveCurrentState();
}

speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setSpeed(parseInt(btn.dataset.level));
    });
});

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    saveCurrentState();
    if (isPaused) {
        if (gameLoop) clearInterval(gameLoop);
        showScreen('pause-screen');
        overlay.classList.remove('hidden');
    } else {
        startLoop();
        hideScreens();
        overlay.classList.add('hidden');
    }
}

/**
 * UI Utilities
 */
function showScreen(id) {
    hideScreens();
    document.getElementById(id).classList.remove('hidden');
}

function hideScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.add('hidden'));
}

/**
 * Event Listeners
 */
window.addEventListener('keydown', (e) => {
    // Prevent scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    // Handle key binding if modal is active
    if (currentlyBinding) {
        tempKeyMap[currentlyBinding] = e.key;
        updateModalUI();
        currentlyBinding = null;
        keyListenerOverlay.classList.add('hidden');
        return;
    }

    if (e.key === 'Escape' || e.key === keyMap.pause) {
        togglePause();
        return;
    }

    // reboot shortcut
    if (e.key.toLowerCase() === keyMap.reboot.toLowerCase()) {
        requestReboot();
        return;
    }

    // Confirmation screen shortcuts
    if (!document.getElementById('confirm-screen').classList.contains('hidden')) {
        if (e.key === 'Enter' || e.key.toLowerCase() === 'y') {
            startGame();
            return;
        }
        if (e.key === 'Escape' || e.key.toLowerCase() === 'n') {
            confirmNoBtn.click();
            return;
        }
    }

    // Level shortcuts
    if (e.key === keyMap.lvl1) { setSpeed(1); return; }
    if (e.key === keyMap.lvl2) { setSpeed(2); return; }
    if (e.key === keyMap.lvl3) { setSpeed(3); return; }
    if (e.key === keyMap.lvl4) { setSpeed(4); return; }
    if (e.key === keyMap.lvl5) { setSpeed(5); return; }

    if (!gameActive || isPaused) return;

    if (e.key === keyMap.up && direction !== 'down') nextDirection = 'up';
    if (e.key === keyMap.down && direction !== 'up') nextDirection = 'down';
    if (e.key === keyMap.left && direction !== 'right') nextDirection = 'left';
    if (e.key === keyMap.right && direction !== 'left') nextDirection = 'right';
});

startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', requestReboot);

/**
 * Control Configuration Logic
 */
let tempKeyMap = { ...keyMap };
let currentlyBinding = null;

remapBtn.addEventListener('click', () => {
    tempKeyMap = { ...keyMap };
    updateModalUI();
    modalOverlay.classList.remove('hidden');
});

function updateModalUI() {
    const buttons = document.querySelectorAll('.key-map-btn');
    buttons.forEach(btn => {
        const dir = btn.dataset.dir;
        btn.textContent = tempKeyMap[dir];
    });
}

function updateUIWithKeys() {
    // Update hint text
    const keys = [keyMap.up, keyMap.down, keyMap.left, keyMap.right, keyMap.pause].map(k => {
        if (k === ' ') return 'Space';
        if (k.startsWith('Arrow')) return k.replace('Arrow', '');
        return k.toUpperCase();
    });
    const movementKeys = keys.slice(0, 4);
    const pauseKey = keys[4];
    controlsHintEl.textContent = `Move: ${movementKeys.join('/')} | Pause: ${pauseKey}`;
}

keyMapBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentlyBinding = btn.dataset.dir;
        bindingDirEl.textContent = currentlyBinding.toUpperCase();
        keyListenerOverlay.classList.remove('hidden');
    });
});

saveKeysBtn.addEventListener('click', () => {
    keyMap = { ...tempKeyMap };
    localStorage.setItem('snake-keys', JSON.stringify(keyMap));
    updateUIWithKeys();
    modalOverlay.classList.add('hidden');
});

cancelKeysBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const setMode = () => {
            difficultyMode = btn.dataset.mode;
            localStorage.setItem('snake-mode', difficultyMode);
            initCanvas();
            startGame();
        };

        if (gameActive && document.getElementById('game-over-screen').classList.contains('hidden')) {
            requestConfirmation(setMode);
        } else {
            difficultyMode = btn.dataset.mode;
            localStorage.setItem('snake-mode', difficultyMode);
            initCanvas();
            initGame();
            draw();
            showScreen('start-screen');
        }
    });
});

helpBtn.addEventListener('click', () => {
    helpModalOverlay.classList.remove('hidden');
});

closeHelpBtn.addEventListener('click', () => {
    helpModalOverlay.classList.add('hidden');
});

// Initial draw and load state
draw();
updateUIWithKeys();
loadState();

