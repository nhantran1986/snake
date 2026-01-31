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
const speedBtns = document.querySelectorAll('.speed-btn');

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
let gameLoop = null;
let isPaused = false;
let gameActive = false;
let speedLevel = 1;

// Default Controls
let keyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    pause: 'p'
};

// Load saved controls if any
const savedKeys = localStorage.getItem('snake-keys');
if (savedKeys) {
    try {
        keyMap = JSON.parse(savedKeys);
        updateUIWithKeys();
    } catch (e) {
        console.error("Failed to load keys", e);
    }
}

highScoreEl.textContent = String(highScore).padStart(4, '0');

/**
 * Initialization & Setup
 */
function initCanvas() {
    // Set internal resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = 400; // Fixed resolution for logic
    canvas.height = 400;
}

window.addEventListener('resize', initCanvas);
initCanvas();

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
    updateScore();
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
        // Visual shake or punch effect could go here
    } else {
        snake.pop();
    }

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

function startGame() {
    initGame();
    hideScreens();
    overlay.classList.add('hidden');

    // Set interval based on speed level
    // Level 1: 150ms, Level 5: 50ms
    const interval = 175 - (speedLevel * 25);
    gameLoop = setInterval(step, interval);
}

function gameOver() {
    gameActive = false;
    clearInterval(gameLoop);
    finalScoreEl.textContent = score;
    showScreen('game-over-screen');
    overlay.classList.remove('hidden');
}

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    if (isPaused) {
        showScreen('pause-screen');
        overlay.classList.remove('hidden');
    } else {
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

    if (e.key === 'Escape' || e.key === keyMap.pause) {
        togglePause();
        return;
    }

    if (!gameActive || isPaused) return;

    if (e.key === keyMap.up && direction !== 'down') nextDirection = 'up';
    if (e.key === keyMap.down && direction !== 'up') nextDirection = 'down';
    if (e.key === keyMap.left && direction !== 'right') nextDirection = 'left';
    if (e.key === keyMap.right && direction !== 'left') nextDirection = 'right';
});

startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', startGame);

speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        speedLevel = parseInt(btn.dataset.level);
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // If game is running, restart loop with new speed
        if (gameActive && !isPaused) {
            clearInterval(gameLoop);
            const interval = 175 - (speedLevel * 25);
            gameLoop = setInterval(step, interval);
        }
    });
});

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

window.addEventListener('keydown', (e) => {
    if (currentlyBinding) {
        e.preventDefault();
        tempKeyMap[currentlyBinding] = e.key;
        updateModalUI();
        currentlyBinding = null;
        keyListenerOverlay.classList.add('hidden');
    }
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

// Initial draw to show something
draw();
updateUIWithKeys();
