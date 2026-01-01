// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isPlaying = false;
let isPaused = false;
let gameSpeed = 100;

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const difficultySelect = document.getElementById('difficulty');

// Initialize
highScoreElement.textContent = highScore;

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
difficultySelect.addEventListener('change', changeDifficulty);

document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(e) {
    if (!isPlaying || isPaused) return;

    switch (e.key) {
        case 'ArrowUp':
            if (dy === 0) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy === 0) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx === 0) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx === 0) {
                dx = 1;
                dy = 0;
            }
            break;
    }
}

function startGame() {
    if (isPlaying && !isPaused) return;

    isPlaying = true;
    isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    if (!gameLoop) {
        gameLoop = setInterval(update, gameSpeed);
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Tiếp Tục' : 'Tạm Dừng';

    if (isPaused) {
        clearInterval(gameLoop);
        gameLoop = null;
    } else {
        gameLoop = setInterval(update, gameSpeed);
    }
}

function resetGame() {
    clearInterval(gameLoop);
    gameLoop = null;

    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    dx = 0;
    dy = 0;
    score = 0;
    isPlaying = false;
    isPaused = false;

    scoreElement.textContent = score;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Tạm Dừng';

    draw();
}

function changeDifficulty() {
    const difficulty = difficultySelect.value;

    switch (difficulty) {
        case 'easy':
            gameSpeed = 150;
            break;
        case 'medium':
            gameSpeed = 100;
            break;
        case 'hard':
            gameSpeed = 50;
            break;
    }

    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
    }
}

function update() {
    if (isPaused) return;

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Check collision with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Check collision with self
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        food = generateFood();
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4caf50' : '#66bb6a';
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );

        // Draw eyes on head
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + 6, segment.y * gridSize + 6, 2, 0, Math.PI * 2);
            ctx.arc(segment.x * gridSize + 14, segment.y * gridSize + 6, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw food
    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Add apple stem
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(food.x * gridSize + gridSize / 2, food.y * gridSize + 2);
    ctx.lineTo(food.x * gridSize + gridSize / 2, food.y * gridSize + 6);
    ctx.stroke();
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    return newFood;
}

function gameOver() {
    clearInterval(gameLoop);
    gameLoop = null;
    isPlaying = false;
    isPaused = false;

    startBtn.disabled = false;
    pauseBtn.disabled = true;

    // Show game over message
    alert(`Game Over! 🐍\n\nĐiểm của bạn: ${score}\nĐiểm cao nhất: ${highScore}\n\nNhấn "Chơi Lại" để thử lại!`);
}

// Initial draw
draw();

console.log('🐍 Snake Game loaded successfully!');
